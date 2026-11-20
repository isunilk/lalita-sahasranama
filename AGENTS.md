# Guide for coding agents (Codex, Claude Code and others)

This is the source of **lalitasahasranama.com**: the 1000 names of Śrī Lalitā, each with its
meaning in layers, audio and several Indian languages. It is a static [Astro](https://astro.build) site.

## Commands

```bash
npm install          # once
npm run validate     # check every content file and print a progress report
npm test             # tests for the script converter
npm run build        # validate, then build the site into dist/
npm run dev          # local server at http://localhost:4321
```

Before you finish any task, `npm run validate` and `npm run build` must both pass.

## Where things live

| Path | What it is |
|---|---|
| `content/names/0001.json` … `1000.json` | **One file per name. All name content goes here, never in code.** |
| `content/verses.json` | Which names make up each of the 183 verses, line by line |
| `content/name-template.json` | Empty template for a new name file |
| `src/content.config.ts` | The schema every name file must follow (checked on build) |
| `src/lib/translit.mjs` | Generates Telugu, Tamil, Kannada, Malayalam, Bengali, Gujarati, Odia and IAST from Devanagari |
| `src/lib/site.mjs` | Languages, URLs and the rule for when a language gets its own page |
| `src/i18n/ui.mjs` | Interface text (buttons, headings) for languages with their own pages |
| `src/views/` | Page templates: home, verse, name, all names |
| `src/pages/names-search.json.js` | Search text for the all-names page, fetched only when someone searches |
| `scripts/make-images.mjs` | Draws the share picture and icons in `public/` |
| `vercel.json` | Trailing-slash redirect and cache headers for Vercel |

Only Devanagari is stored. Do not type names in other scripts: they are generated. If a generated
spelling is wrong for one word, add the correct spelling to that name's `scriptOverrides`
(or `archanaOverrides`, or a word's `scriptOverrides`) instead of changing the converter.

## The name file

Use `content/names/0004.json` as the model. Fields:

- `number` (1–1000) and `verse` (1–183). The file name is the number padded to four digits.
- `slug`: the common English spelling people type, lowercase, words joined by hyphens (`chidagni-kunda-sambhuta`).
  Write ś and ṣ as `sh`, c as `ch` and ch as `chh`. A prefix joins the word after it (`nirguna`, `nishkala`,
  `tripura`, `svatantra`). Two names may share a slug when only a long vowel tells them apart (Māheśvarī 208,
  Maheśvarī 750): page addresses also carry the number (`/name/208-maheshvari/`, `/name/750-maheshvari/`).
- `devanagari`: the name exactly as it appears in the stotra.
- `iastSplit`: IAST with hyphens between the parts of the compound.
- `archana`: the archana form, `ॐ <name in the dative case> नमः`.
- `syllables`: IAST syllables for the pronunciation guide.
- `words`: each Sanskrit word in the compound (`sa`, in Devanagari) with its meaning.
- `meaning`: one line. `explanation` (bhāvārtha): 2–4 plain sentences. `inner` (rahasyārtha): the
  inner or esoteric reading, 2–5 sentences. `story` (kathā): the story or context and how commentators read it.
- `commentary`: `null`, unless you have the exact Sanskrit excerpt **and** its source (book, edition, page).
- `sources`: what you actually used, as short citations.
- `audio`: leave `null`; recordings are added separately.
- `review`: always `{ "status": "draft", "notes": "…" }` when you write or change content.

Every text field is an object of language codes: `en` (required), `hi`, `te`, `ta`, `kn`, `ml`,
`mr`, `bn`, `gu`, `or`. Add a language only when its text is complete and natural.

## Rules for researching and writing the names

This is a sacred text that many people chant daily. Accuracy matters more than speed.

1. **Text**: take each name and verse from a reliable printed or public-domain edition of the
   Brahmāṇḍa Purāṇa text, and cross-check with a second edition. Record both in `sources`.
2. **Meanings**: base them on Bhāskararāya's *Saubhāgya Bhāskara* commentary and established
   translations. Write in your own words; never copy a copyrighted translation or website.
3. **Never invent** a quote, a verse number, an attribution or a story detail. If you are not
   sure, say less, and explain the doubt in `review.notes`.
4. **Mantra and Kuṇḍalinī names** (names 85–89, which encode the Pañcadaśī mantra, and the
   Kuṇḍalinī names that follow): explain what they mean, but do not publish practice
   instructions or bīja mantras for practice. Those are traditionally learned from a teacher.
5. **Status**: only a human reviewer may set `"status": "reviewed"`, and only with `reviewedBy`.
6. **Tone**: plain, warm and reverent. No hype, no emoji, no filler.
7. **Languages**: English for every field first, then Hindi. Write other languages only when
   asked, in a natural devotional register, not word-for-word machine translation.

## Workflow for adding names

1. Work one verse at a time (or a small batch of verses) so each change can be reviewed.
2. Add or check the verse in `content/verses.json`: `{ "number": 4, "lines": [[13], [14]] }`.
   If the chanted verse is not simply the names joined, add `"text": ["line 1 ।", "line 2 ॥ 4 ॥"]` in Devanagari.
3. Create one file per name from `content/name-template.json`.
4. Run `npm run validate` and `npm run build`; fix every error.
5. In your summary, list the names added and anything a reviewer should check.

## Launching another language with its own pages

1. Write that language's text in the name files (all layers).
2. Add its interface text to `src/i18n/ui.mjs`.
3. Set `pages: true` for it in `src/lib/site.mjs`.

Pages are built only for names whose every layer exists in that language, so half-translated
pages never go live.
