// Draws the share picture (og-image.jpg) and the app icons in public/ with headless Chrome.
// Run it again only when the design changes: node scripts/make-images.mjs
// Set CHROME to the Chrome or Chromium program if it is not in the usual macOS place.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lsn-images-'));

const font = (pkg, file) => pathToFileURL(path.join(root, 'node_modules/@fontsource', pkg, 'files', file)).href;
const face = (family, pkg, file, weight = 400) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url('${font(pkg, file)}') format('woff2');}`;

const FONTS = [
  face('Tiro Devanagari Sanskrit', 'tiro-devanagari-sanskrit', 'tiro-devanagari-sanskrit-devanagari-400-normal.woff2'),
  face('Cormorant Garamond', 'cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff2', 600),
  face('Cormorant Garamond', 'cormorant-garamond', 'cormorant-garamond-latin-ext-600-normal.woff2', 600),
  face('EB Garamond', 'eb-garamond', 'eb-garamond-latin-400-normal.woff2'),
  face('EB Garamond', 'eb-garamond', 'eb-garamond-latin-ext-400-normal.woff2'),
  face('Tiro Telugu', 'tiro-telugu', 'tiro-telugu-telugu-400-normal.woff2'),
  face('Tiro Tamil', 'tiro-tamil', 'tiro-tamil-tamil-400-normal.woff2'),
  face('Tiro Kannada', 'tiro-kannada', 'tiro-kannada-kannada-400-normal.woff2'),
  face('Tiro Bangla', 'tiro-bangla', 'tiro-bangla-bengali-400-normal.woff2'),
  face('Noto Serif Malayalam', 'noto-serif-malayalam', 'noto-serif-malayalam-malayalam-400-normal.woff2'),
  face('Noto Serif Gujarati', 'noto-serif-gujarati', 'noto-serif-gujarati-gujarati-400-normal.woff2'),
  face('Noto Serif Oriya', 'noto-serif-oriya', 'noto-serif-oriya-oriya-400-normal.woff2'),
].join('\n');

// The same lotus mandala as src/components/Mandala.astro.
const outer = [11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75, 191.25, 213.75, 236.25, 258.75, 281.25, 303.75, 326.25, 348.75];
const inner = [0, 45, 90, 135, 180, 225, 270, 315];
const mandala = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#E9BE5C" stroke-width="1.4">
    <path d="M30 30H170V12H230V30H370V170H388V230H370V370H230V388H170V370H30V230H12V170H30Z"/>
    <path d="M38 38H178V20H222V38H362V178H380V222H362V362H222V380H178V362H38V222H20V178H38Z" opacity="0.7"/>
    <path d="M46 46H186V28H214V46H354V186H372V214H354V354H214V372H186V354H46V214H28V186H46Z" opacity="0.45"/>
    <circle cx="200" cy="200" r="152"/><circle cx="200" cy="200" r="146" opacity="0.55"/>
    <circle cx="200" cy="200" r="106"/><circle cx="200" cy="200" r="70"/>
  </g>
  <g fill="#E9BE5C" fill-opacity="0.12" stroke="#E9BE5C" stroke-width="1.4" stroke-linejoin="round">
    ${outer.map((a) => `<path d="M179.3 96Q177 72 200 62Q223 72 220.7 96Z" transform="rotate(${a} 200 200)"/>`).join('')}
  </g>
  <g fill="#E9BE5C" fill-opacity="0.2" stroke="#E9BE5C" stroke-width="1.4" stroke-linejoin="round">
    ${inner.map((a) => `<path d="M173.2 135.3Q169 110 200 96Q231 110 226.8 135.3Z" transform="rotate(${a} 200 200)"/>`).join('')}
  </g>
  <path d="M162 178H238L200 244Z" fill="none" stroke="#E9BE5C" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="200" cy="200" r="5" fill="#E9BE5C"/>
</svg>`;

const langs = [
  ['English', 'EB Garamond'], ['हिन्दी', 'Tiro Devanagari Sanskrit'], ['తెలుగు', 'Tiro Telugu'], ['தமிழ்', 'Tiro Tamil'],
  ['ಕನ್ನಡ', 'Tiro Kannada'], ['മലയാളം', 'Noto Serif Malayalam'], ['मराठी', 'Tiro Devanagari Sanskrit'],
  ['বাংলা', 'Tiro Bangla'], ['ગુજરાતી', 'Noto Serif Gujarati'], ['ଓଡ଼ିଆ', 'Noto Serif Oriya'],
];

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:radial-gradient(circle at 78% 50%,#8c1d16 0,#7a1712 38%,#5e100c 100%);color:#fff6e2;font-family:'EB Garamond',serif;position:relative}
.frame{position:absolute;inset:22px;border:2px solid #c9973a;border-radius:6px}
.frame::after{content:'';position:absolute;inset:8px;border:1px solid rgba(233,190,92,.45);border-radius:3px}
.mandala{position:absolute;right:92px;top:62px;width:430px;height:430px;opacity:.95}
.text{position:absolute;left:84px;top:78px;width:600px}
.kicker{font-family:'Cormorant Garamond';font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#e9be5c;font-size:22px;margin:0 0 18px}
.sa{font-family:'Tiro Devanagari Sanskrit';font-size:86px;line-height:1.15;color:#f6d98f;margin:0}
.en{font-family:'Cormorant Garamond';font-weight:600;font-size:64px;line-height:1.05;margin:6px 0 22px}
.tag{font-size:29px;line-height:1.35;color:#f1d9c6;margin:0;max-width:560px}
.langs{position:absolute;left:84px;right:84px;bottom:66px;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:21px;color:#e9c98a}
.langs span+span::before{content:'·';margin-right:18px;color:#c9973a}
.domain{margin:30px 0 0;font-family:'Cormorant Garamond';font-weight:600;font-size:27px;letter-spacing:.04em;color:#e9be5c}
</style></head><body>
<div class="frame"></div>
<div class="mandala">${mandala}</div>
<div class="text">
  <p class="kicker">The thousand names</p>
  <p class="sa">ललितासहस्रनाम</p>
  <p class="en">Lalitā Sahasranāma</p>
  <p class="tag">Every name of the Divine Mother with its meaning, inner meaning and story</p>
  <p class="domain">lalitasahasranama.com</p>
</div>
<div class="langs">${langs.map(([l, f]) => `<span style="font-family:'${f}'">${l}</span>`).join('')}</div>
</body></html>`;

// The emblem from public/favicon.svg on a full square, for home screens that round the corners themselves.
const emblem = `<path d="M20 8.5c3.2 4 3.2 9.5 0 13.5c-3.2-4-3.2-9.5 0-13.5z" fill="none" stroke="#E9BE5C" stroke-width="1.8"/>
  <path d="M20 22.5c-2.2-4-6-6.2-10.5-6.2c0 5 4.4 8.2 10.5 8.2s10.5-3.2 10.5-8.2c-4.5 0-8.3 2.2-10.5 6.2z" fill="none" stroke="#E9BE5C" stroke-width="1.8"/>
  <path d="M12 29h16" stroke="#E9BE5C" stroke-width="1.8" stroke-linecap="round"/>`;
const squareIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#7A1712"/><g transform="translate(4 4) scale(.8)">${emblem}</g></svg>`;

const page = (svg, size) =>
  `<!doctype html><html><head><style>html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`;

function shoot(html, width, height, out) {
  const file = path.join(tmp, `${path.basename(out)}.html`);
  fs.writeFileSync(file, html);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--default-background-color=00000000', '--allow-file-access-from-files', '--virtual-time-budget=3000',
    `--window-size=${width},${height}`, `--screenshot=${out}`, pathToFileURL(file).href,
  ], { stdio: 'ignore' });
  console.log('wrote', path.relative(root, out));
}

// An .ico file that holds PNG images (every current browser reads these).
function writeIco(pngs, out) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e);
    head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(data.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  fs.writeFileSync(out, Buffer.concat([head, ...pngs.map((p) => p.data)]));
  console.log('wrote', path.relative(root, out));
}

const roundIcon = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
shoot(ogHtml, 1200, 630, path.join(tmp, 'og-image.png'));
// JPEG keeps the share picture small enough for WhatsApp, which skips large images.
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', path.join(tmp, 'og-image.png'), '--out', path.join(pub, 'og-image.jpg')], { stdio: 'ignore' });
console.log('wrote public/og-image.jpg');
shoot(page(squareIcon, 180), 180, 180, path.join(pub, 'apple-touch-icon.png'));
shoot(page(squareIcon, 192), 192, 192, path.join(pub, 'icon-192.png'));
shoot(page(squareIcon, 512), 512, 512, path.join(pub, 'icon-512.png'));
shoot(page(roundIcon, 48), 48, 48, path.join(pub, 'favicon-48.png'));
shoot(page(roundIcon, 32), 32, 32, path.join(tmp, 'favicon-32.png'));
writeIco(
  [
    { size: 32, data: fs.readFileSync(path.join(tmp, 'favicon-32.png')) },
    { size: 48, data: fs.readFileSync(path.join(pub, 'favicon-48.png')) },
  ],
  path.join(pub, 'favicon.ico')
);
fs.rmSync(tmp, { recursive: true, force: true });
