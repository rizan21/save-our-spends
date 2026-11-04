import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'public', 'logo.svg');
const out120Path = path.join(root, 'public', 'logo-120x120.png');
const outOauthPath = path.join(root, 'public', 'oauth-logo-120x120.png');

console.log('Generating 120x120 PNG logos from public/logo.svg...');

if (!fs.existsSync(svgPath)) {
  console.error(`SVG file not found at ${svgPath}`);
  process.exit(1);
}

const result = spawnSync('rsvg-convert', ['-w', '120', '-h', '120', svgPath, '-o', out120Path]);
if (result.error || result.status !== 0) {
  console.error('Failed to run rsvg-convert:', result.stderr?.toString() || result.error);
  process.exit(1);
}

fs.copyFileSync(out120Path, outOauthPath);

const stat = fs.statSync(out120Path);
console.log(`Successfully generated:`);
console.log(`- ${out120Path} (${stat.size} bytes)`);
console.log(`- ${outOauthPath} (${stat.size} bytes)`);
