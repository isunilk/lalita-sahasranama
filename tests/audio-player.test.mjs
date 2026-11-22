import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioPlayer } from '../src/lib/audio-player.mjs';

const hindi = { name: 'Hindi voice', lang: 'hi-IN' };
class Speech extends EventTarget {
  constructor(voices = []) { super(); this.voices = voices; this.spoken = []; this.paused = false; }
  getVoices() { return this.voices; }
  speak(utterance) { this.spoken.push(utterance); }
  cancel() {}
  resume() { this.paused = false; }
}
class Utterance { constructor(text) { this.text = text; } }
class Recording extends EventTarget {
  constructor(src) { super(); this.src = src; Recording.last = this; }
  play() { this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
  pause() {}
}
function setup(options = {}) {
  const states = [];
  const player = createAudioPlayer({
    synth: null, AudioClass: Recording, UtteranceClass: Utterance,
    voiceTimeoutMs: 10, startTimeoutMs: 1000,
    onState: (target, state, details) => states.push({ target, state, ...details }),
    ...options,
  });
  return { player, states };
}

test('unsupported speech produces an explicit result instead of a silent click', async () => {
  const { player, states } = setup();
  await player.play({}, { text: 'preview' });
  assert.deepEqual(states.map(s => s.state), ['loading', 'unsupported']);
  assert.equal(player.currentTarget, null);
});

test('a click waits for asynchronously loaded Hindi voices and reports playback', async () => {
  const synth = new Speech();
  const { player, states } = setup({ synth });
  const playing = player.play({}, { text: 'preview', rate: 0.45 });
  synth.voices = [hindi];
  synth.dispatchEvent(new Event('voiceschanged'));
  await playing;
  assert.equal(synth.spoken.length, 1);
  assert.equal(synth.spoken[0].voice, hindi);
  assert.equal(synth.spoken[0].rate, 0.45);
  synth.spoken[0].onstart();
  synth.spoken[0].onend();
  assert.deepEqual(states.map(s => s.state), ['loading', 'playing', 'finished']);
});

test('an English-only device reports that the required voice is unavailable', async () => {
  const synth = new Speech([{ name: 'English voice', lang: 'en-US' }]);
  const { player, states } = setup({ synth });
  await player.play({}, { text: 'preview' });
  assert.equal(states.at(-1).state, 'no-voice');
  assert.equal(synth.spoken.length, 0);
});

test('synthesis failures are reported and reset the playing state', async () => {
  const synth = new Speech([hindi]);
  const { player, states } = setup({ synth });
  await player.play({}, { text: 'preview' });
  synth.spoken[0].onerror({ error: 'synthesis-unavailable' });
  assert.equal(states.at(-1).state, 'error');
  assert.equal(states.at(-1).error, 'synthesis-unavailable');
  assert.equal(player.currentTarget, null);
});

test('an immediate end without starting speech is reported as a failure', async () => {
  const synth = new Speech([hindi]);
  const { player, states } = setup({ synth });
  await player.play({}, { text: 'preview' });
  synth.spoken[0].onend();
  assert.equal(states.at(-1).state, 'error');
  assert.equal(states.at(-1).error, 'synthesis-unavailable');
});

test('a paused speech queue is resumed before the new preview is queued', async () => {
  const synth = new Speech([hindi]);
  synth.paused = true;
  const { player } = setup({ synth });
  await player.play({}, { text: 'preview' });
  assert.equal(synth.paused, false);
  assert.equal(synth.spoken.length, 1);
  player.stop();
});

test('a speech engine that never starts cannot leave the button waiting forever', async () => {
  const synth = new Speech([hindi]);
  const { player, states } = setup({ synth, startTimeoutMs: 10 });
  await player.play({}, { text: 'preview' });
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(states.at(-1).error, 'start-timeout');
  assert.equal(player.currentTarget, null);
});

test('recorded human audio plays without any device speech service', async () => {
  const { player, states } = setup();
  await player.play({}, { src: '/audio/chant/0001.mp3' });
  assert.equal(Recording.last.src, '/audio/chant/0001.mp3');
  assert.equal(states.at(-1).state, 'playing');
  Recording.last.dispatchEvent(new Event('ended'));
  assert.equal(states.at(-1).state, 'finished');
});

test('a failed recording reports the failure instead of silently resetting', async () => {
  class BrokenRecording extends Recording { play() { return Promise.reject(new Error('unavailable')); } }
  const { player, states } = setup({ AudioClass: BrokenRecording });
  await player.play({}, { src: '/audio/chant/0001.mp3' });
  assert.equal(states.at(-1).error, 'recording-unavailable');
  assert.equal(player.currentTarget, null);
});

test('late voices cannot start an old preview after the listener chooses a recording', async () => {
  const synth = new Speech();
  const { player, states } = setup({ synth });
  const first = {};
  const second = {};
  const waiting = player.play(first, { text: 'preview' });
  await player.play(second, { src: '/audio/chant/0001.mp3' });
  synth.voices = [hindi];
  synth.dispatchEvent(new Event('voiceschanged'));
  await waiting;
  assert.equal(synth.spoken.length, 0);
  assert.equal(player.currentTarget, second);
  assert.equal(states.at(-1).state, 'playing');
  player.stop();
});
