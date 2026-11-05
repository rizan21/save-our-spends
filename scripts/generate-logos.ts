import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');
const svgPath = path.join(publicDir, 'logo.svg');

console.log('Generating app logos and cross-browser icons from public/logo.svg...');

if (!fs.existsSync(svgPath)) {
  console.error(`SVG file not found at ${svgPath}`);
  process.exit(1);
}

function runCmd(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args);
  if (result.error || result.status !== 0) {
    console.error(`Failed to execute ${cmd} ${args.join(' ')}:`, result.stderr?.toString() || result.error);
    process.exit(1);
  }
}

// 1. Google OAuth & Branding Logos (120x120 PNG)
const out120Path = path.join(publicDir, 'logo-120x120.png');
const outOauthPath = path.join(publicDir, 'oauth-logo-120x120.png');
runCmd('rsvg-convert', ['-w', '120', '-h', '120', svgPath, '-o', out120Path]);
fs.copyFileSync(out120Path, outOauthPath);

// 2. Standard PWA Web App Icons (purpose: "any", transparent background)
const pwa192Path = path.join(publicDir, 'pwa-192x192.png');
const pwa512Path = path.join(publicDir, 'pwa-512x512.png');
runCmd('rsvg-convert', ['-w', '192', '-h', '192', svgPath, '-o', pwa192Path]);
runCmd('rsvg-convert', ['-w', '512', '-h', '512', svgPath, '-o', pwa512Path]);

// 3. PWA Maskable Icon (purpose: "maskable", 512x512 with safe-zone margin on solid brand dark background #020617)
const pwaMaskablePath = path.join(publicDir, 'pwa-maskable-512x512.png');
const tempMaskInner = path.join('/tmp', `sos-mask-inner-${Date.now()}.png`);
runCmd('rsvg-convert', ['-w', '410', '-h', '410', svgPath, '-o', tempMaskInner]);
runCmd('magick', ['-size', '512x512', 'xc:#020617', tempMaskInner, '-gravity', 'center', '-composite', pwaMaskablePath]);
if (fs.existsSync(tempMaskInner)) fs.unlinkSync(tempMaskInner);

// 4. Apple Touch Icon for iOS (180x180 on solid brand dark background #020617)
const appleTouchPath = path.join(publicDir, 'apple-touch-icon.png');
const tempAppleInner = path.join('/tmp', `sos-apple-inner-${Date.now()}.png`);
runCmd('rsvg-convert', ['-w', '154', '-h', '154', svgPath, '-o', tempAppleInner]);
runCmd('magick', ['-size', '180x180', 'xc:#020617', tempAppleInner, '-gravity', 'center', '-composite', appleTouchPath]);
if (fs.existsSync(tempAppleInner)) fs.unlinkSync(tempAppleInner);

// 5. Cross-browser Favicons (16x16, 32x32, 48x48 PNGs)
const fav16Path = path.join(publicDir, 'favicon-16x16.png');
const fav32Path = path.join(publicDir, 'favicon-32x32.png');
const fav48Path = path.join(publicDir, 'favicon-48x48.png');
runCmd('rsvg-convert', ['-w', '16', '-h', '16', svgPath, '-o', fav16Path]);
runCmd('rsvg-convert', ['-w', '32', '-h', '32', svgPath, '-o', fav32Path]);
runCmd('rsvg-convert', ['-w', '48', '-h', '48', svgPath, '-o', fav48Path]);

// 6. Multi-resolution Root favicon.ico (containing 16x16, 32x32, and 48x48 layers)
const faviconIcoPath = path.join(publicDir, 'favicon.ico');
runCmd('magick', [fav16Path, fav32Path, fav48Path, faviconIcoPath]);

// 7. Ensure favicon.svg is synchronized with logo.svg
const faviconSvgPath = path.join(publicDir, 'favicon.svg');
fs.copyFileSync(svgPath, faviconSvgPath);

// 8. If dist exists, mirror generated files into dist/ as well
if (fs.existsSync(distDir)) {
  const generatedFiles = [
    'logo-120x120.png',
    'oauth-logo-120x120.png',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-maskable-512x512.png',
    'apple-touch-icon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'favicon.ico',
    'favicon.svg',
    'logo.svg',
  ];
  for (const file of generatedFiles) {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
}

console.log('Successfully generated all web app icons and website title bar favicons:');
console.log(`- ${faviconIcoPath} (${fs.statSync(faviconIcoPath).size} bytes)`);
console.log(`- ${fav32Path} (${fs.statSync(fav32Path).size} bytes)`);
console.log(`- ${fav16Path} (${fs.statSync(fav16Path).size} bytes)`);
console.log(`- ${pwa192Path} (${fs.statSync(pwa192Path).size} bytes)`);
console.log(`- ${pwa512Path} (${fs.statSync(pwa512Path).size} bytes)`);
console.log(`- ${pwaMaskablePath} (${fs.statSync(pwaMaskablePath).size} bytes)`);
console.log(`- ${appleTouchPath} (${fs.statSync(appleTouchPath).size} bytes)`);
console.log(`- ${out120Path} (${fs.statSync(out120Path).size} bytes)`);
