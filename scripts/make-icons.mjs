// アイコン生成: `npm i --no-save sharp && npm run icons`
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const mark = readFileSync('public/mark.svg', 'utf8');
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const icon = (bg, pad) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
<rect width="512" height="512" fill="${bg}"/>
<svg x="${pad}" y="${pad}" width="${512 - pad * 2}" height="${512 - pad * 2}" viewBox="-70 -12 225 225">${inner}</svg></svg>`;

const out = [
  ['public/icons/icon-192.png', 192, icon('#ffffff', 40)],
  ['public/icons/icon-512.png', 512, icon('#ffffff', 40)],
  ['public/icons/maskable-512.png', 512, icon('#ffffff', 96)],
  ['public/apple-touch-icon.png', 180, icon('#ffffff', 40)],
  ['public/favicon-32.png', 32, icon('#ffffff', 0)],
];
for (const [file, size, svg] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
}
writeFileSync('public/favicon.svg', icon('#ffffff', 0).replace('<rect width="512" height="512" fill="#ffffff"/>', ''));
console.log('icons done');
