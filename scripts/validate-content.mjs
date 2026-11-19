#!/usr/bin/env node
// Checks every file in content/ and prints a progress report.
// Run with: npm run validate   (it also runs before every build)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, LANG_CODES, SITE, hasFullContent } from '../src/lib/site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const namesDir = path.join(root, 'content', 'names');
const errors = [];
const warnings = [];

const DEVANAGARI_TEXT = /^[ऀ-ॿ‌‍ ]+$/;
const LAYERS = ['meaning', 'explanation', 'inner', 'story'];

function err(file, msg) {
  errors.push(`${file}: ${msg}`);
}

function checkMulti(file, field, value, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) err(file, `${field} is missing`);
    return;
  }
  if (typeof value !== 'object') return err(file, `${field} must be an object of language codes`);
  if (!value.en) err(file, `${field}.en (English) is required`);
  for (const [code, v] of Object.entries(value)) {
    if (!LANG_CODES.includes(code)) err(file, `${field} has unknown language code "${code}"`);
    if (typeof v !== 'string' || !v.trim()) err(file, `${field}.${code} must be non-empty text`);
    if (/lorem|TODO|TBD/i.test(v)) err(file, `${field}.${code} still contains placeholder text`);
  }
}

const files = fs.readdirSync(namesDir).filter((f) => f.endsWith('.json')).sort();
const names = [];
const seenNumbers = new Map();
const seenSlugs = new Map();

for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(namesDir, file), 'utf8'));
  } catch (e) {
    err(file, `is not valid JSON (${e.message})`);
    continue;
  }
  const expected = `${String(data.number).padStart(4, '0')}.json`;
  if (file !== expected) err(file, `file name should be ${expected} for name number ${data.number}`);
  if (!Number.isInteger(data.number) || data.number < 1 || data.number > SITE.totalNames) err(file, 'number must be 1–1000');
  if (seenNumbers.has(data.number)) err(file, `number ${data.number} is also used by ${seenNumbers.get(data.number)}`);
  seenNumbers.set(data.number, file);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug || '')) err(file, 'slug must be lowercase ASCII words joined by hyphens');
  if (seenSlugs.has(data.slug)) err(file, `slug "${data.slug}" is also used by ${seenSlugs.get(data.slug)}`);
  seenSlugs.set(data.slug, file);
  if (!Number.isInteger(data.verse) || data.verse < 1 || data.verse > SITE.totalVerses) err(file, 'verse must be 1–183');
  if (!DEVANAGARI_TEXT.test(data.devanagari || '')) err(file, 'devanagari must contain only Devanagari letters');
  if (!/^ॐ .+ नमः$/.test(data.archana || '')) err(file, 'archana must look like "ॐ … नमः"');
  if (!data.iastSplit) err(file, 'iastSplit is missing');
  if (!Array.isArray(data.words) || data.words.length === 0) err(file, 'words must list at least one word');
  else
    data.words.forEach((w, i) => {
      if (!DEVANAGARI_TEXT.test(w.sa || '')) err(file, `words[${i}].sa must be Devanagari`);
      checkMulti(file, `words[${i}].meaning`, w.meaning);
    });
  for (const layer of LAYERS) checkMulti(file, layer, data[layer]);
  if (data.commentary) {
    if (!data.commentary.source) err(file, 'commentary needs a source (book, edition and page)');
    if (!data.commentary.sanskrit) err(file, 'commentary needs the Sanskrit excerpt');
    checkMulti(file, 'commentary.translation', data.commentary.translation);
  }
  if (!data.review || !['draft', 'reviewed'].includes(data.review.status)) err(file, 'review.status must be "draft" or "reviewed"');
  if (data.review?.status === 'reviewed' && !data.review.reviewedBy) err(file, 'a reviewed name must say who reviewed it (review.reviewedBy)');
  names.push(data);
}

// Verses
const verses = JSON.parse(fs.readFileSync(path.join(root, 'content', 'verses.json'), 'utf8'));
const verseOfName = new Map();
const seenVerse = new Set();
for (const v of verses) {
  if (seenVerse.has(v.number)) errors.push(`verses.json: verse ${v.number} appears twice`);
  seenVerse.add(v.number);
  if (!Array.isArray(v.lines) || v.lines.length < 1) errors.push(`verses.json: verse ${v.number} needs "lines"`);
  for (const n of (v.lines || []).flat()) {
    if (verseOfName.has(n)) errors.push(`verses.json: name ${n} is listed in verses ${verseOfName.get(n)} and ${v.number}`);
    verseOfName.set(n, v.number);
  }
}
for (const n of names) {
  const v = verseOfName.get(n.number);
  if (v === undefined) errors.push(`${String(n.number).padStart(4, '0')}.json: name ${n.number} is not listed in content/verses.json`);
  else if (v !== n.verse) errors.push(`${String(n.number).padStart(4, '0')}.json: verse is ${n.verse} but verses.json puts it in verse ${v}`);
}
const missingInVerses = [...verseOfName.keys()].filter((k) => !seenNumbers.has(k));
if (missingInVerses.length) warnings.push(`verses.json lists names without content files yet: ${missingInVerses.join(', ')}`);

// Report
const pad = (s, n) => String(s).padEnd(n);
console.log(`\nLalitā Sahasranāma content: ${names.length} of ${SITE.totalNames} names, ${verses.length} of ${SITE.totalVerses} verses\n`);
console.log(`${pad('Language', 12)}${pad('One-line meaning', 18)}Full page content`);
for (const l of LANGS) {
  const meaningCount = names.filter((n) => n.meaning?.[l.code]).length;
  const full = names.filter((n) => n.meaning && n.explanation && n.inner && n.story && n.words && hasFullContent(n, l.code)).length;
  console.log(`${pad(l.english, 12)}${pad(meaningCount, 18)}${full}${l.pages ? '   (has its own pages)' : ''}`);
}
const reviewed = names.filter((n) => n.review?.status === 'reviewed').length;
console.log(`\nReviewed by a scholar: ${reviewed} of ${names.length}`);

for (const w of warnings) console.log(`\nNote: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s) found:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\nAll content checks passed.\n');
