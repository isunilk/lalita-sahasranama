// Loads the content files once per build and adds every script version of each name.
import { getCollection } from 'astro:content';
import versesRaw from '../../content/verses.json';
import { allScripts } from './translit.mjs';

let cache = null;

function asciiTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function enrich(d) {
  return {
    ...d,
    s: allScripts(d.devanagari, d.scriptOverrides),
    a: allScripts(d.archana, d.archanaOverrides),
    w: d.words.map((w) => ({ ...w, s: allScripts(w.sa, w.scriptOverrides, { capitalize: false }) })),
    asciiName: asciiTitle(d.slug),
  };
}

export async function loadSite() {
  if (cache) return cache;
  const entries = await getCollection('names');
  const names = entries.map((e) => enrich(e.data)).sort((a, b) => a.number - b.number);
  const byNumber = new Map(names.map((n) => [n.number, n]));
  // A verse is shown only once all of its names have content files.
  const verses = versesRaw
    .map((v) => {
      const numbers = v.lines.flat();
      return { number: v.number, lines: v.lines, text: v.text || null, names: numbers.map((k) => byNumber.get(k)).filter(Boolean), complete: numbers.every((k) => byNumber.has(k)) };
    })
    .filter((v) => v.complete)
    .sort((a, b) => a.number - b.number);
  cache = { names, byNumber, verses };
  return cache;
}
