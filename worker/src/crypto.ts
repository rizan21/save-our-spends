/**
 * Standard Web Crypto API implementation of VAPID (RFC 8292) and
 * Web Push Payload Encryption (RFC 8291 aes128gcm).
 * Zero external dependencies — runs directly in Cloudflare Workers and standard browsers.
 */

export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a fresh VAPID P-256 keypair in Base64URL format.
 */
export async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;

  const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const jwkPrivateKey = (await crypto.subtle.exportKey('jwk', keyPair.privateKey)) as JsonWebKey;

  return {
    publicKey: base64UrlEncode(rawPublicKey),
    privateKey: jwkPrivateKey.d || '',
  };
}

/**
 * Creates a signed VAPID Authorization JWT for push service request.
 */
export async function createVapidAuthHeader(
  endpoint: string,
  vapidSubject: string,
  vapidPublicKey: string,
  vapidPrivateKeyJwkD: string
): Promise<{ authorization: string }> {
  const audience = new URL(endpoint).origin;
  const header = { typ: 'JWT', alg: 'ES256' };
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600; // 12 hours
  const payload = { aud: audience, exp, sub: vapidSubject };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Derive x and y coordinates from the uncompressed P-256 public key (65 bytes: 0x04 + 32-byte X + 32-byte Y)
  const pubBytes = base64UrlDecode(vapidPublicKey.trim());
  const x = base64UrlEncode(pubBytes.slice(1, 33));
  const y = base64UrlEncode(pubBytes.slice(33, 65));

  // Import private key from JWK
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: vapidPrivateKeyJwkD.trim(),
      x,
      y,
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signedJwt = `${unsignedToken}.${base64UrlEncode(signature)}`;
  return {
    authorization: `vapid t=${signedJwt}, k=${vapidPublicKey}`,
  };
}

/**
 * Encrypts a string/JSON payload using RFC 8291 (aes128gcm).
 */
export async function encryptWebPushPayload(
  payloadText: string,
  userP256dhBase64Url: string,
  userAuthBase64Url: string
): Promise<{ body: ArrayBuffer; headers: Record<string, string> }> {
  const userPublicKeyBytes = base64UrlDecode(userP256dhBase64Url);
  const userAuthBytes = base64UrlDecode(userAuthBase64Url);

  // Generate local ephemeral ECDH keypair
  const localKeyPair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )) as CryptoKeyPair;

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // Import recipient's public key for ECDH
  const userKey = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBytes as unknown as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userKey },
    localKeyPair.privateKey,
    256
  );

  // Generate 16-byte random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF Helper
  async function hkdfExtract(saltBytes: Uint8Array, ikmBytes: ArrayBuffer): Promise<CryptoKey> {
    const saltKey = await crypto.subtle.importKey('raw', saltBytes as unknown as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const prk = await crypto.subtle.sign('HMAC', saltKey, ikmBytes);
    return await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  }

  async function hkdfExpand(prkKey: CryptoKey, infoStr: Uint8Array, len: number): Promise<ArrayBuffer> {
    const infoWithCounter = new Uint8Array(infoStr.length + 1);
    infoWithCounter.set(infoStr, 0);
    infoWithCounter[infoStr.length] = 1;
    const okm = await crypto.subtle.sign('HMAC', prkKey, infoWithCounter);
    return okm.slice(0, len);
  }

  // Key derivation (RFC 8291 Section 3.2)
  const authInfo = new Uint8Array(19 + 65 + 65);
  authInfo.set(new TextEncoder().encode('WebPush: info\0'), 0);
  authInfo.set(userPublicKeyBytes, 14);
  authInfo.set(localPublicKeyRaw, 14 + userPublicKeyBytes.length);

  const ikmKey = await hkdfExtract(userAuthBytes, sharedSecret);
  const prkSecret = await hkdfExpand(ikmKey, authInfo, 32);

  const prkKey = await crypto.subtle.importKey('raw', prkSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');

  const cekBytes = await hkdfExpand(prkKey, cekInfo, 16);
  const nonceBytes = await hkdfExpand(prkKey, nonceInfo, 12);

  // Encrypt payload with AES-GCM
  const aesKey = await crypto.subtle.importKey('raw', cekBytes, { name: 'AES-GCM' }, false, ['encrypt']);

  // Format plaintext with delimiter padding: payload + 0x02
  const plaintext = new TextEncoder().encode(payloadText);
  const paddedPlaintext = new Uint8Array(plaintext.length + 1);
  paddedPlaintext.set(plaintext, 0);
  paddedPlaintext[plaintext.length] = 2; // record delimiter

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBytes, tagLength: 128 },
    aesKey,
    paddedPlaintext
  );

  // Build aes128gcm binary header:
  // Salt (16) + Record Size (4) + KeyID Length (1) + Ephemeral Key (65) + Ciphertext
  const recordSize = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;
  header[20] = 65; // localPublicKey length
  header.set(localPublicKeyRaw, 21);

  const fullBody = new Uint8Array(header.length + ciphertext.byteLength);
  fullBody.set(header, 0);
  fullBody.set(new Uint8Array(ciphertext), header.length);

  return {
    body: fullBody.buffer,
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
    },
  };
}
