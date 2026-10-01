import { generateVapidKeys } from '../crypto';

async function main() {
  console.log('Generating fresh VAPID P-256 Web Push keypair...');
  const keys = await generateVapidKeys();
  console.log('\n=============================================');
  console.log('VAPID PUBLIC KEY (Copy to frontend .env):');
  console.log(keys.publicKey);
  console.log('\nVAPID PRIVATE KEY (Store as Cloudflare Secret):');
  console.log(keys.privateKey);
  console.log('=============================================\n');
  console.log('Commands:');
  console.log('1. Set Worker secret:');
  console.log(`   wrangler secret put VAPID_PRIVATE_KEY`);
  console.log('2. Set Worker var in wrangler.jsonc or env:');
  console.log(`   VAPID_PUBLIC_KEY = "${keys.publicKey}"`);
  console.log('3. Set Frontend .env:');
  console.log(`   VITE_VAPID_PUBLIC_KEY="${keys.publicKey}"\n`);
}

main().catch(console.error);
