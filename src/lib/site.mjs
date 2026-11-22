// Site-wide settings. Plain JavaScript so both Astro and the Node scripts can import it.

export const SITE = {
  name: 'Lalitā Sahasranāma',
  domain: 'lalitasahasranama.com',
  origin: 'https://www.lalitasahasranama.com',
  totalNames: 1000,
  totalVerses: 183,
};

// `pages: true` means the language gets its own URLs (/hi/name/…) and is indexed by Google.
// `pages: false` languages are still readable on every page through the language buttons.
// To launch a language: write its content, add its UI strings in src/i18n/ui.mjs, then set pages: true.
export const LANGS = [
  { code: 'en', label: 'English', english: 'English', script: 'dev', pages: true },
  { code: 'hi', label: 'हिन्दी', english: 'Hindi', script: 'dev', pages: true },
  { code: 'te', label: 'తెలుగు', english: 'Telugu', script: 'te', pages: false },
  { code: 'ta', label: 'தமிழ்', english: 'Tamil', script: 'ta', pages: false },
  { code: 'kn', label: 'ಕನ್ನಡ', english: 'Kannada', script: 'kn', pages: false },
  { code: 'ml', label: 'മലയാളം', english: 'Malayalam', script: 'ml', pages: false },
  { code: 'mr', label: 'मराठी', english: 'Marathi', script: 'dev', pages: false },
  { code: 'bn', label: 'বাংলা', english: 'Bengali', script: 'bn', pages: false },
  { code: 'gu', label: 'ગુજરાતી', english: 'Gujarati', script: 'gu', pages: false },
  { code: 'or', label: 'ଓଡ଼ିଆ', english: 'Odia', script: 'or', pages: false },
];

export const LANG_CODES = LANGS.map((l) => l.code);
export const PAGE_LANGS = LANGS.filter((l) => l.pages);
export const OTHER_PAGE_LANGS = PAGE_LANGS.filter((l) => l.code !== 'en');

export const SCRIPT_TAG = {
  dev: 'sa-Deva',
  iast: 'sa-Latn',
  te: 'sa-Telu',
  ta: 'sa-Taml',
  kn: 'sa-Knda',
  ml: 'sa-Mlym',
  bn: 'sa-Beng',
  gu: 'sa-Gujr',
  or: 'sa-Orya',
};

export function getLang(code) {
  return LANGS.find((l) => l.code === code) || LANGS[0];
}

export function prefix(code) {
  return code === 'en' ? '' : `/${code}`;
}

export function homeUrl(code) {
  return `${prefix(code)}/`;
}

export function nameSlug(name) {
  return `${name.number}-${name.slug}`;
}

export function nameUrl(name, code) {
  return `${prefix(code)}/name/${nameSlug(name)}/`;
}

export function verseUrl(verseNumber, code) {
  return `${prefix(code)}/verse/${verseNumber}/`;
}

export function namesUrl(code) {
  return `${prefix(code)}/names/`;
}

// A name gets a page in a non-English language only when every layer is written in that language.
// This keeps thin, half-translated pages out of Google.
export function hasFullContent(name, code) {
  if (code === 'en') return true;
  return Boolean(
    name.meaning[code] &&
      name.explanation[code] &&
      name.inner[code] &&
      name.story[code] &&
      name.words.every((w) => w.meaning[code])
  );
}

// A verse page exists in a language when every name in it has at least its one-line meaning there.
export function verseHasLanguage(verseNames, code) {
  if (code === 'en') return true;
  return verseNames.length > 0 && verseNames.every((n) => Boolean(n.meaning[code]));
}
