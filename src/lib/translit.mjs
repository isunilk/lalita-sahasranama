// Converts Sanskrit written in Devanagari into the other Indian scripts and into IAST.
// Only Devanagari is stored in the content files; every other script is generated here.
// If a generated spelling is wrong for a particular word, put the correct one in the name's
// `scriptOverrides` field instead of changing these rules.

const VIRAMA = '्';
const ANUSVARA = 'ं';
const VISARGA = 'ः';
const OM = 'ॐ';
const DANDAS = ['।', '॥'];

const OFFSETS = { bn: 0x80, gu: 0x180, or: 0x200, te: 0x300, kn: 0x380, ml: 0x400 };
const OM_MAP = { te: 'ఓం', kn: 'ಓಂ', ml: 'ഓം', bn: 'ওঁ', gu: 'ૐ', or: 'ଓଁ', ta: 'ஓம்' };
const VARGA = { 'ङ': 'कखगघ', 'ञ': 'चछजझ', 'ण': 'टठडढ', 'न': 'तथदध', 'म': 'पफबभ' };

export const SCRIPTS = ['dev', 'iast', 'te', 'ta', 'kn', 'ml', 'bn', 'gu', 'or'];

const isDevanagari = (ch) => {
  const c = ch.codePointAt(0);
  return c >= 0x0900 && c <= 0x097f;
};

// Telugu, Kannada and Gujarati usually write a nasal before a consonant of its own class as anusvara.
function nasalToAnusvara(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (VARGA[c] && i + 2 < s.length && s[i + 1] === VIRAMA && VARGA[c].includes(s[i + 2])) {
      out += ANUSVARA;
      i += 1;
      continue;
    }
    out += c;
  }
  return out;
}

// Malayalam writes m before p, ph, b, bh as anusvara (സംഭൂത, അംബിക).
function mLabialToAnusvara(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === 'म' && i + 2 < s.length && s[i + 1] === VIRAMA && 'पफबभ'.includes(s[i + 2])) {
      out += ANUSVARA;
      i += 1;
      continue;
    }
    out += s[i];
  }
  return out;
}

function offsetScript(input, lang) {
  const off = OFFSETS[lang];
  let s = input;
  if (lang === 'te' || lang === 'kn' || lang === 'gu') s = nasalToAnusvara(s);
  if (lang === 'ml') s = mLabialToAnusvara(s);
  if (lang === 'or') s = s.split('र्य').join('र्य्य'); // Odia writes kārya as କାର୍ଯ୍ୟ
  let res = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = i > 0 ? s[i - 1] : ' ';
    const nxt = i + 1 < s.length ? s[i + 1] : ' ';
    const nxt2 = i + 2 < s.length ? s[i + 2] : ' ';
    const wordStart = prev === ' ' || prev === '-';
    if (ch === OM) {
      res += OM_MAP[lang];
    } else if (DANDAS.includes(ch)) {
      res += ch;
    } else if (isDevanagari(ch)) {
      if (lang === 'bn' && ch === 'व') res += 'ব';
      else if (lang === 'bn' && ch === 'ळ') res += 'ল';
      else if (lang === 'bn' && ch === 'य') res += prev === VIRAMA || wordStart ? 'য' : 'য়';
      else if (lang === 'bn' && ch === 'त' && nxt === VIRAMA && 'सकप '.includes(nxt2)) res += 'ৎ';
      else if (lang === 'bn' && ch === VIRAMA && prev === 'त' && 'सकप '.includes(nxt)) res += '';
      else if (lang === 'or' && ch === 'व') res += prev === VIRAMA ? 'ୱ' : 'ବ';
      else if (lang === 'or' && ch === 'य') {
        if (wordStart) res += 'ଯ';
        else if (prev === VIRAMA && i >= 2 && s[i - 2] === 'र') res += 'ଯ';
        else res += 'ୟ';
      } else if (lang === 'ml' && ch === 'र' && nxt === VIRAMA && !'य '.includes(nxt2)) res += 'ർ';
      else if (lang === 'ml' && ch === VIRAMA && prev === 'र' && !'य '.includes(nxt)) res += '';
      else res += String.fromCodePoint(ch.codePointAt(0) + off);
    } else {
      res += ch;
    }
  }
  return res;
}

const TA_CONS = {
  'क': 'க', 'ख': 'க', 'ग': 'க', 'घ': 'க', 'ङ': 'ங',
  'च': 'ச', 'छ': 'ச', 'ज': 'ஜ', 'झ': 'ஜ', 'ञ': 'ஞ',
  'ट': 'ட', 'ठ': 'ட', 'ड': 'ட', 'ढ': 'ட', 'ण': 'ண',
  'त': 'த', 'थ': 'த', 'द': 'த', 'ध': 'த', 'न': 'ந',
  'प': 'ப', 'फ': 'ப', 'ब': 'ப', 'भ': 'ப', 'म': 'ம',
  'य': 'ய', 'र': 'ர', 'ल': 'ல', 'व': 'வ', 'ळ': 'ள',
  'श': 'ஶ', 'ष': 'ஷ', 'स': 'ஸ', 'ह': 'ஹ',
};
const TA_VOW = { 'अ': 'அ', 'आ': 'ஆ', 'इ': 'இ', 'ई': 'ஈ', 'उ': 'உ', 'ऊ': 'ஊ', 'ऋ': 'ரு', 'ए': 'ஏ', 'ऐ': 'ஐ', 'ओ': 'ஓ', 'औ': 'ஔ' };
const TA_SIGN = { 'ा': 'ா', 'ि': 'ி', 'ी': 'ீ', 'ु': 'ு', 'ू': 'ூ', 'ृ': '்ரு', 'े': 'ே', 'ै': 'ை', 'ो': 'ோ', 'ौ': 'ௌ', [VIRAMA]: '்' };

function tamil(input) {
  const s = input.split('श्री').join('');
  let res = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = i > 0 ? s[i - 1] : ' ';
    if (ch === '') res += 'ஸ்ரீ';
    else if (ch === 'न') {
      const wordStart = prev === ' ' || prev === '-';
      const beforeDental = i + 2 < s.length && s[i + 1] === VIRAMA && 'तथदध'.includes(s[i + 2]);
      res += wordStart || beforeDental ? 'ந' : 'ன';
    } else if (TA_CONS[ch]) res += TA_CONS[ch];
    else if (TA_VOW[ch]) res += TA_VOW[ch];
    else if (TA_SIGN[ch]) res += TA_SIGN[ch];
    else if (ch === ANUSVARA) res += 'ம்';
    else if (ch === VISARGA) res += 'ஹ';
    else if (ch === OM) res += OM_MAP.ta;
    else res += ch;
  }
  return res;
}

const IA_CONS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ', 'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
  'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h', 'ळ': 'ḷ',
};
const IA_VOW = { 'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū', 'ऋ': 'ṛ', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au' };
const IA_SIGN = { 'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ṛ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au' };

export function toIAST(s, { capitalize = true } = {}) {
  let res = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const nxt = i + 1 < s.length ? s[i + 1] : '';
    if (IA_CONS[ch]) {
      res += IA_CONS[ch];
      if (!IA_SIGN[nxt] && nxt !== VIRAMA) res += 'a';
    } else if (IA_SIGN[ch]) res += IA_SIGN[ch];
    else if (ch === VIRAMA) res += '';
    else if (IA_VOW[ch]) res += IA_VOW[ch];
    else if (ch === ANUSVARA) res += 'ṃ';
    else if (ch === VISARGA) res += 'ḥ';
    else if (ch === OM) res += 'oṃ';
    else if (ch === '।') res += '|';
    else if (ch === '॥') res += '||';
    else res += ch;
  }
  if (!capitalize) return res;
  return res
    .split(' ')
    .map((w) => (w && /\p{L}/u.test(w[0]) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Returns the text in one script: 'dev', 'iast', 'te', 'ta', 'kn', 'ml', 'bn', 'gu' or 'or'.
export function toScript(dev, script, options) {
  if (script === 'dev') return dev;
  if (script === 'iast') return toIAST(dev, options);
  if (script === 'ta') return tamil(dev);
  return offsetScript(dev, script);
}

// All scripts at once, with optional per-script corrections from the content file.
export function allScripts(dev, overrides = {}, options) {
  const out = {};
  for (const sc of SCRIPTS) out[sc] = (overrides && overrides[sc]) || toScript(dev, sc, options);
  return out;
}
