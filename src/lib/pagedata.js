// Helpers that turn content into page text, language-switch data and links.
import { LANGS, PAGE_LANGS, SCRIPT_TAG, homeUrl, nameUrl, verseUrl, namesUrl, hasFullContent, verseHasLanguage } from './site.mjs';
import { toScript } from './translit.mjs';

export const LABELS = Object.fromEntries(LANGS.map((l) => [l.code, l.label]));

// Section headings are Sanskrit terms, written in the reader's script (IAST for English).
export const HEADS = {
  pada: { dev: 'पदार्थ', iast: 'Padārtha', te: 'పదార్థం', ta: 'பதார்த்தம்', kn: 'ಪದಾರ್ಥ', ml: 'പദാർത്ഥം', bn: 'পদার্থ', gu: 'પદાર્થ', or: 'ପଦାର୍ଥ' },
  bhava: { dev: 'भावार्थ', iast: 'Bhāvārtha', te: 'భావార్థం', ta: 'பாவார்த்தம்', kn: 'ಭಾವಾರ್ಥ', ml: 'ഭാവാർത്ഥം', bn: 'ভাবার্থ', gu: 'ભાવાર્થ', or: 'ଭାବାର୍ଥ' },
  rahasya: { dev: 'रहस्यार्थ', iast: 'Rahasyārtha', te: 'రహస్యార్థం', ta: 'ரஹஸ்யார்த்தம்', kn: 'ರಹಸ್ಯಾರ್ಥ', ml: 'രഹസ്യാർത്ഥം', bn: 'রহস্যার্থ', gu: 'રહસ્યાર્થ', or: 'ରହସ୍ୟାର୍ଥ' },
  katha: { dev: 'कथा', iast: 'Kathā', te: 'కథ', ta: 'கதை', kn: 'ಕಥೆ', ml: 'കഥ', bn: 'কাহিনি', gu: 'કથા', or: 'କାହାଣୀ' },
  shravana: { dev: 'श्रवण', iast: 'Śravaṇa', te: 'శ్రవణం', ta: 'ஶ்ரவணம்', kn: 'ಶ್ರವಣ', ml: 'ശ്രവണം', bn: 'শ্রবণ', gu: 'શ્રવણ', or: 'ଶ୍ରବଣ' },
};

// Language-switch data: [text, lang attribute, 1 if it fell back to English].
// The home-page name also carries its text-size class as an optional fourth value.
export function perLang(fn) {
  const out = {};
  for (const l of LANGS) out[l.code] = fn(l);
  return out;
}

export function scr(scripts, { enIast = false } = {}) {
  return perLang((l) => {
    const sc = enIast && l.code === 'en' ? 'iast' : l.script;
    return [scripts[sc], SCRIPT_TAG[sc], 0];
  });
}

export function txt(multi) {
  return perLang((l) => (multi && multi[l.code] ? [multi[l.code], l.code, 0] : [multi.en, 'en', 1]));
}

export function heads(table) {
  return perLang((l) => {
    const sc = l.code === 'en' ? 'iast' : l.script;
    return [table[sc], SCRIPT_TAG[sc], 0];
  });
}

export function displayScript(lang) {
  const l = LANGS.find((x) => x.code === lang) || LANGS[0];
  return lang === 'en' ? 'iast' : l.script;
}

// The verse as it is chanted: names joined, with daṇḍas. `text` in verses.json overrides this.
export function verseLines(verse, script) {
  if (verse.text) return verse.text.map((line) => toScript(line, script));
  const byNum = new Map(verse.names.map((n) => [n.number, n]));
  return verse.lines.map(
    (nums, i) => nums.map((k) => byNum.get(k).s[script]).join(' ') + (i === verse.lines.length - 1 ? ` ॥ ${verse.number} ॥` : ' ।')
  );
}

// Language-switch data for a verse card: its lines and each name with its meaning.
export function verseStrings(verse) {
  const out = {};
  const lines = perLang((l) => verseLines(verse, l.script));
  verse.lines.forEach((_, i) => {
    out[`verse${verse.number}.l${i}`] = perLang((l) => [lines[l.code][i], SCRIPT_TAG[l.script], 0]);
  });
  for (const n of verse.names) {
    out[`n${n.number}.name`] = scr(n.s);
    out[`n${n.number}.meaning`] = txt(n.meaning);
  }
  return out;
}

export function nameSizeClass(text) {
  const len = Array.from(text).length;
  if (len > 30) return 'size-xl';
  if (len > 20) return 'size-l';
  if (len > 12) return 'size-m';
  return '';
}

// Alternate language versions of each kind of page (used for hreflang, the sitemap and the language buttons).
export const homeAlternates = () => PAGE_LANGS.map((l) => ({ lang: l.code, href: homeUrl(l.code) }));
export const namesAlternates = () => PAGE_LANGS.map((l) => ({ lang: l.code, href: namesUrl(l.code) }));
export const verseAlternates = (v) => PAGE_LANGS.filter((l) => verseHasLanguage(v.names, l.code)).map((l) => ({ lang: l.code, href: verseUrl(v.number, l.code) }));
export const nameAlternates = (n) => PAGE_LANGS.filter((l) => hasFullContent(n, l.code)).map((l) => ({ lang: l.code, href: nameUrl(n, l.code) }));

export const bestNameUrl = (n, lang) => (PAGE_LANGS.some((l) => l.code === lang) && hasFullContent(n, lang) ? nameUrl(n, lang) : nameUrl(n, 'en'));
export const bestVerseUrl = (v, lang) => (PAGE_LANGS.some((l) => l.code === lang) && verseHasLanguage(v.names, lang) ? verseUrl(v.number, lang) : verseUrl(v.number, 'en'));

// The small amount of name content needed to refresh the home-page feature.
export function homeNameData(n) {
  const name = scr(n.s);
  for (const entry of Object.values(name)) entry.push(nameSizeClass(entry[0]));
  return {
    number: n.number,
    iastSplit: n.iastSplit,
    tts: n.devanagari,
    audio: n.audio.chant,
    hrefs: Object.fromEntries(PAGE_LANGS.map((l) => [l.code, bestNameUrl(n, l.code)])),
    strings: {
      'hero.name': name,
      'hero.meaning': txt(n.meaning),
      'hero.archana': scr(n.a, { enIast: true }),
    },
  };
}

// Language buttons: other page languages are real links (Google can follow them);
// the rest switch the text in place.
export function chipModel(lang, alternates, { onlyPageLangs = false } = {}) {
  const alt = Object.fromEntries(alternates.map((a) => [a.lang, a.href]));
  const list = onlyPageLangs ? LANGS.filter((l) => l.pages) : LANGS;
  const chips = list.map((l) => ({
    code: l.code,
    label: l.label,
    current: l.code === lang,
    href: l.code !== lang && l.pages && alt[l.code] ? alt[l.code] : null,
  }));
  return { chips, inPage: chips.filter((c) => !c.href).map((c) => c.code) };
}

export function searchText(n) {
  // The slug also goes in without hyphens, so "shrimata" finds shri-mata.
  const parts = [n.number, n.asciiName, n.slug, n.slug.replace(/-/g, ''), ...Object.values(n.s), ...Object.values(n.meaning)];
  return parts.join(' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
