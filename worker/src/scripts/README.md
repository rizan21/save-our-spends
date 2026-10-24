# Worker Scripts

## Overview
CLI utility scripts for Cloudflare Worker administration and VAPID key generation.

## Interface
- `bun run src/scripts/generateKeys.ts`: CLI script generating a fresh VAPID P-256 Web Push keypair.
- `bun run generate-keys`: Package script alias to execute the key generation routine.

## Invariants
- Generates valid uncompressed P-256 public keys and Base64URL-encoded private key JWKs.
- Does not persist keys to disk; outputs keys to stdout for manual secret storage.

## Side Effects
- Emits generated public key, private key, and setup instructions to standard output.

## Verification
- Run: `bun test`
