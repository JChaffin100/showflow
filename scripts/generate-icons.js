import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'showflow_icon_v4.svg');
const outDir = resolve(root, 'public', 'icons');

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'icon-16.png', size: 16 },
  { name: 'icon-32.png', size: 32 },
  { name: 'icon-57.png', size: 57 },
  { name: 'icon-60.png', size: 60 },
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-114.png', size: 114 },
  { name: 'icon-120.png', size: 120 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-167.png', size: 167 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'favicon.ico', size: 32 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outPath = resolve(outDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${name}`);
  }

  // Maskable icon: 512x512 with ~20% padding (safe zone)
  // Create a padded version: content at 80% scale, centered on white/transparent bg
  const contentSize = Math.round(512 * 0.8);
  const padding = Math.round((512 - contentSize) / 2);
  await sharp(svgBuffer)
    .resize(contentSize, contentSize)
    .extend({
      top: padding,
      bottom: 512 - contentSize - padding,
      left: padding,
      right: 512 - contentSize - padding,
      background: { r: 8, g: 50, b: 160, alpha: 1 }
    })
    .png()
    .toFile(resolve(outDir, 'icon-maskable-512.png'));
  console.log('Generated icon-maskable-512.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
