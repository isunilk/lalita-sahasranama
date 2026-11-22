// Playback lifecycle shared by recordings and the temporary device-voice preview.
export function previewVoice(voices) {
  for (const language of ['sa', 'hi', 'mr', 'ne']) {
    const voice = voices.find((v) => new RegExp(`^${language}(?:[-_]|$)`, 'i').test(v.lang));
    if (voice) return voice;
  }
  return null;
}

export function waitForPreviewVoice(synth, timeoutMs = 2000) {
  const read = () => {
    try { return previewVoice(synth.getVoices()); }
    catch { return null; }
  };
  const ready = read();
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve) => {
    let timer;
    const finish = (voice) => {
      clearTimeout(timer);
      synth.removeEventListener('voiceschanged', changed);
      resolve(voice);
    };
    const changed = () => {
      const voice = read();
      if (voice) finish(voice);
    };
    synth.addEventListener('voiceschanged', changed);
    timer = setTimeout(() => finish(read()), timeoutMs);
    changed();
  });
}

export function createAudioPlayer({ synth, AudioClass, UtteranceClass, onState, voiceTimeoutMs = 2000, startTimeoutMs = 8000 }) {
  let current = null;
  const emit = (item, state, error = '') => onState(item.target, state, { recorded: Boolean(item.src), error });

  function stop() {
    if (!current) return;
    const item = current;
    current = null;
    clearTimeout(item.timer);
    if (item.audio) item.audio.pause();
    if (item.speech && synth) synth.cancel();
    emit(item, 'stopped');
  }

  function finish(item, state, error = '') {
    if (current !== item) return;
    current = null;
    clearTimeout(item.timer);
    if (state === 'error') {
      if (item.audio) item.audio.pause();
      if (item.speech && synth) synth.cancel();
    }
    emit(item, state, error);
  }

  function started(item) {
    if (current !== item) return;
    item.started = true;
    clearTimeout(item.timer);
    emit(item, 'playing');
  }

  async function play(target, { src, text, rate = 0.8 }) {
    const same = current?.target === target;
    stop();
    if (same) return;
    const item = { target, src };
    current = item;
    emit(item, 'loading');
    try {
      if (src) {
        item.audio = new AudioClass(src);
        item.audio.addEventListener('playing', () => started(item));
        item.audio.addEventListener('ended', () => finish(item, 'finished'));
        item.audio.addEventListener('error', () => finish(item, 'error', 'recording-unavailable'));
        item.timer = setTimeout(() => finish(item, 'error', 'start-timeout'), startTimeoutMs);
        await item.audio.play();
        return;
      }
      if (!synth || !UtteranceClass) {
        finish(item, 'unsupported');
        return;
      }
      const voice = await waitForPreviewVoice(synth, voiceTimeoutMs);
      if (current !== item) return;
      if (!voice) {
        finish(item, 'no-voice');
        return;
      }
      const utterance = new UtteranceClass(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      utterance.onstart = () => started(item);
      utterance.onend = () => finish(item, item.started ? 'finished' : 'error', item.started ? '' : 'synthesis-unavailable');
      utterance.onerror = (event) => finish(item, 'error', event.error);
      item.speech = utterance;
      item.timer = setTimeout(() => finish(item, 'error', 'start-timeout'), startTimeoutMs);
      // A previously paused synthesis queue otherwise stays silent after a new click.
      if (synth.paused) synth.resume();
      synth.speak(utterance);
    } catch {
      finish(item, 'error', src ? 'recording-unavailable' : 'synthesis-unavailable');
    }
  }

  return { play, stop, get currentTarget() { return current?.target || null; } };
}
