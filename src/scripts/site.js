// Browser behaviour: language buttons, audio buttons and the names search.
import { dailyNameIndex, millisecondsUntilIndiaMidnight } from '../lib/daily-name.mjs';
import { createAudioPlayer } from '../lib/audio-player.mjs';

const STORE_KEY = 'lsn-read-in';

function readStore() {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

function writeStore(code) {
  try {
    localStorage.setItem(STORE_KEY, code);
  } catch {
    /* storage can be blocked; the choice just won't be remembered */
  }
}

const dataEl = document.getElementById('page-data');
let pageData = null;
try {
  pageData = dataEl ? JSON.parse(dataEl.textContent) : null;
} catch {
  pageData = null;
}
let currentLang = pageData?.lang || 'en';

// ---- Language buttons -------------------------------------------------------
function applyLang(code, { save = true } = {}) {
  if (!pageData || !pageData.strings) return;
  currentLang = code;
  let fellBack = false;
  document.querySelectorAll('[data-t]').forEach((el) => {
    const entry = pageData.strings[el.dataset.t]?.[code];
    if (!entry) return;
    el.textContent = entry[0];
    el.setAttribute('lang', entry[1]);
    if (entry[3] !== undefined) {
      el.classList.remove('size-m', 'size-l', 'size-xl');
      if (entry[3]) el.classList.add(entry[3]);
    }
    if (entry[2]) fellBack = true;
  });
  document.querySelectorAll('[data-en-line]').forEach((el) => {
    const translations = pageData.strings[el.dataset.enLine];
    const entry = translations?.[code];
    if (translations?.en) el.textContent = translations.en[0];
    el.hidden = code === 'en' || !entry || entry[2] === 1;
  });
  const note = document.querySelector('[data-fallback-note]');
  if (note) {
    note.hidden = !fellBack;
    const label = note.querySelector('[data-fallback-lang]');
    if (label) label.textContent = pageData.labels?.[code] || code;
  }
  document.querySelectorAll('[data-set-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.setLang === code));
  });
  document.querySelectorAll('[data-current-lang-label]').forEach((el) => {
    el.textContent = pageData.labels?.[code] || el.textContent;
    el.setAttribute('lang', code);
  });
  if (save) writeStore(code);
}

// Re-apply a remembered reading language, but never redirect to another page.
const remembered = readStore();
if (pageData && remembered && remembered !== pageData.lang && (pageData.inPage || []).includes(remembered)) {
  applyLang(remembered, { save: false });
}

// ---- Audio -------------------------------------------------------------------
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
try {
  if (synth) synth.getVoices();
} catch {
  /* A click will show an actionable message if the speech service is unavailable. */
}

const feedback = document.querySelector('[data-audio-feedback]');
const feedbackMessage = feedback?.querySelector('[data-audio-message]');
const defaultAudioNote = document.querySelector('[data-audio-status]')?.textContent || '';

function audioFeedback(message, state, error = '') {
  if (feedback && feedbackMessage) {
    feedbackMessage.textContent = message;
    feedback.hidden = !message;
    feedback.dataset.state = state;
    feedback.dataset.error = error;
  }
  const status = document.querySelector('[data-audio-status]');
  if (status) status.textContent = message || defaultAudioNote;
}

function setPlaying(btn, on) {
  btn.setAttribute('aria-pressed', String(on));
  const label = btn.querySelector('[data-label]');
  if (label && btn.dataset.labelPlay) label.textContent = on ? btn.dataset.labelPause || btn.dataset.labelPlay : btn.dataset.labelPlay;
}

const audioPlayer = createAudioPlayer({
  synth,
  AudioClass: window.Audio,
  UtteranceClass: window.SpeechSynthesisUtterance,
  onState(btn, state, { recorded, error }) {
    setPlaying(btn, state === 'loading' || state === 'playing');
    btn.setAttribute('aria-busy', String(state === 'loading'));
    if (feedback) btn.setAttribute('aria-describedby', 'audio-feedback-message');
    let key = {
      loading: 'loading',
      playing: recorded ? 'recordingPlaying' : 'previewPlaying',
      finished: recorded ? 'recordingFinished' : 'previewFinished',
      unsupported: 'unsupported',
      'no-voice': 'noVoice',
      error: recorded ? 'recordingError' : 'previewError',
    }[state];
    if (error === 'not-allowed') key = 'blocked';
    if (error === 'language-unavailable' || error === 'voice-unavailable') key = 'noVoice';
    audioFeedback(key ? feedback?.dataset[key] || '' : '', state, error);
  },
});
const stopAudio = () => audioPlayer.stop();
const play = (btn) => audioPlayer.play(btn, { src: btn.dataset.src, text: btn.dataset.tts || '', rate: Number(btn.dataset.rate) || 0.8 });

// ---- Clicks ------------------------------------------------------------------
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (target.closest('[data-audio-dismiss]')) {
    audioFeedback('', 'dismissed');
    return;
  }
  const playBtn = target.closest('[data-play]');
  if (playBtn) {
    play(playBtn);
    return;
  }
  const langBtn = target.closest('[data-set-lang]');
  if (langBtn) {
    applyLang(langBtn.dataset.setLang);
    return;
  }
  const langLink = target.closest('[data-lang-link]');
  if (langLink) writeStore(langLink.dataset.langLink);
});

window.addEventListener('pagehide', stopAudio);

// ---- Today's name ------------------------------------------------------------
const dailyHero = document.querySelector('[data-daily-name]');
if (dailyHero && pageData?.dailyName?.numbers?.length) {
  const { numbers, numberLabel } = pageData.dailyName;
  const selectedNumber = () => numbers[dailyNameIndex(numbers.length)];
  let loading = false;
  let timer;

  async function refreshDailyName() {
    if (loading) return;
    clearTimeout(timer);
    const number = selectedNumber();
    let retry = false;
    loading = true;
    try {
      if (Number(dailyHero.dataset.dailyName) !== number) {
        const response = await fetch(`/daily-name/${number}.json`);
        if (!response.ok) throw new Error(String(response.status));
        const name = await response.json();
        if (name.number !== number || !name.strings) throw new Error('Invalid daily name');
        // A request started before midnight must not replace the next day's name.
        if (number === selectedNumber()) {
          if (audioPlayer.currentTarget && dailyHero.contains(audioPlayer.currentTarget)) stopAudio();
          Object.assign(pageData.strings, name.strings);
          dailyHero.querySelector('[data-daily-number]').textContent = numberLabel.replace('{n}', String(number));
          dailyHero.querySelector('[data-daily-iast]').textContent = name.iastSplit;
          dailyHero.querySelector('[data-daily-link]').href = name.hrefs[pageData.lang] || name.hrefs.en;
          const button = dailyHero.querySelector('[data-daily-audio] [data-play]');
          button.dataset.tts = name.tts;
          if (name.audio) button.dataset.src = name.audio;
          else delete button.dataset.src;
          const playLabel = name.audio ? button.dataset.recordingLabel : button.dataset.previewLabel;
          if (playLabel) {
            button.dataset.labelPlay = playLabel;
            const label = button.querySelector('[data-label]');
            if (label) label.textContent = playLabel;
          }
          dailyHero.dataset.dailyName = String(number);
          applyLang(currentLang, { save: false });
        }
      }
    } catch {
      retry = true; // Keep the rendered name usable and retry after a connection failure.
    } finally {
      loading = false;
      const changedDuringRequest = number !== selectedNumber();
      timer = setTimeout(refreshDailyName, changedDuringRequest ? 0 : retry ? 60_000 : millisecondsUntilIndiaMidnight() + 50);
    }
  }

  refreshDailyName();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshDailyName();
  });
  window.addEventListener('pageshow', refreshDailyName);
  window.addEventListener('online', refreshDailyName);
}

// ---- Names search ------------------------------------------------------------
// Each list item's value is its name number. The full search text (every script and language)
// is fetched on first use; until it arrives, the search uses the text shown on the page.
const filter = document.querySelector('[data-filter]');
if (filter) {
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const items = Array.from(document.querySelectorAll('[data-group] li[value]'));
  const groups = Array.from(document.querySelectorAll('[data-group]'));
  const empty = document.querySelector('[data-empty]');
  let index = null;
  let loading = null;
  const shownText = new Map();

  const load = () => {
    loading ||= fetch(filter.dataset.filter)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list) => {
        index = list;
        if (filter.value.trim()) run();
      })
      .catch(() => {
        loading = null; // try again on the next keystroke
      });
    return loading;
  };

  const textOf = (item) => {
    if (index && index[item.value - 1]) return index[item.value - 1];
    if (!shownText.has(item)) shownText.set(item, norm(`${item.value} ${item.textContent}`));
    return shownText.get(item);
  };

  function run() {
    const q = norm(filter.value.trim());
    let shown = 0;
    for (const item of items) {
      const match = !q || textOf(item).includes(q);
      item.hidden = !match;
      if (match) shown++;
    }
    for (const g of groups) g.hidden = !g.querySelector('li[value]:not([hidden])');
    // While the search text is still arriving, wait before saying nothing matched.
    if (empty) empty.hidden = shown > 0 || (!index && Boolean(loading));
  }

  filter.addEventListener('focus', load, { once: true });
  filter.addEventListener('input', () => {
    if (!index) load();
    run();
  });
}
