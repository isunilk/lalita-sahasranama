#!/usr/bin/env node
// Generate the human recording brief and transcripts directly from the name files.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const namesDir = path.join(root, 'content/names');
const output = path.resolve(process.argv[2] || path.join(root, 'audio-recording-pack'));
const files = (await fs.readdir(namesDir)).filter((file) => /^\d{4}\.json$/.test(file)).sort();
const names = await Promise.all(files.map(async (file) => JSON.parse(await fs.readFile(path.join(namesDir, file), 'utf8'))));
if (names.length !== 1000) throw new Error('The complete recording pack requires all 1000 names.');

const recordings = names.map((name) => {
  const id = String(name.number).padStart(4, '0');
  return {
    number: name.number,
    verse: name.verse,
    source: `content/names/${id}.json`,
    name: name.devanagari,
    iastSplit: name.iastSplit,
    archana: name.archana,
    files: {
      chant: { path: `/audio/chant/${id}.mp3`, text: name.devanagari },
      slow: { path: `/audio/slow/${id}.mp3`, text: name.devanagari },
      archana: { path: `/audio/archana/${id}.mp3`, text: name.archana },
    },
    pronunciationReview: 'pending',
  };
});

const brief = `LALITA SAHASRANAMA — HUMAN RECORDING BRIEF

Destination: https://www.lalitasahasranama.com/
Scope: 1000 names, with normal, slow and archana recordings for each name.

Start with a pilot of names 0001–0010. Have a Sanskrit teacher or experienced chanter
check the pilot before recording the remaining names. The supplied text is the current
website draft; it is a reference for review, not a pronunciation certification.

Record three separate files per name:
1. chant/0001.mp3 — the name alone, spoken or chanted clearly at a natural pace.
2. slow/0001.mp3 — the same name at a slower, clear pace, preserving vowel lengths.
3. archana/0001.mp3 — the complete archana text supplied for that name.
Continue the four-digit numbering through 1000 in each folder.

Use a quiet room and one consistent voice. Leave a little silence at each end.
Keep the original WAV masters and export MP3 copies for the website. Avoid background
music, added effects, clipped syllables and automatic cuts inside words.

The reviewer should check long and short vowels, aspirates, sibilants, anusvara,
visarga, compound boundaries and the dative form in each archana recording.
Recordings may follow the chanter's established tradition; document variant readings
for review before making corrections in the source name files.

Use original recordings or recordings whose owner has granted permission for website
publication and editing. Keep the speaker credit and permission with the audio masters.

Nothing in this pack is published automatically. After human review, place the web
files under public/audio/ and connect the chant, slow and archana paths in each name's
audio object. Existing content-review status must remain draft until a human reviews it.

The transcript and manifest are generated from content/names/. Regenerate the pack
after approved source-text corrections instead of maintaining a separate name list.
`;

const transcriptEntries = recordings.map((item) => {
  const id = String(item.number).padStart(4, '0');
  return `${id} · VERSE ${item.verse}\nNormal / slow: ${item.name}\nIAST guide: ${item.iastSplit}\nArchana: ${item.archana}\nFiles: ${Object.values(item.files).map((file) => file.path).join(', ')}\nReviewer: ____________________  Status: pending\n`;
});

await fs.mkdir(output, { recursive: true });
await fs.writeFile(path.join(output, 'recording-brief.txt'), brief);
await fs.writeFile(path.join(output, 'recording-script.txt'), `Generated from the website's current name files. Human pronunciation review required.\n\n${transcriptEntries.join('\n')}`);
await fs.writeFile(path.join(output, 'pilot-first-10.txt'), `Pilot recording session: names 0001–0010. Human pronunciation review required.\n\n${transcriptEntries.slice(0, 10).join('\n')}`);
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ language: 'Sanskrit', source: 'content/names/', recordings }, null, 2) + '\n');
console.log(`Prepared ${recordings.length} names and ${recordings.length * 3} recording slots in ${output}`);
