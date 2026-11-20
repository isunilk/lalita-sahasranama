// Browser behaviour: language buttons, audio buttons and the names search.

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

// ---- Language buttons -------------------------------------------------------
function applyLang(code, { save = true } = {}) {
  if (!pageData || !pageData.strings) return;
  let fellBack = false;
  document.querySelectorAll('[data-t]').forEach((el) => {
    const entry = pageData.strings[el.dataset.t]?.[code];
    if (!entry) return;
    el.textContent = entry[0];
    el.setAttribute('lang', entry[1]);
    if (entry[2]) fellBack = true;
  });
  document.querySelectorAll('[data-en-line]').forEach((el) => {
    const entry = pageData.strings[el.dataset.enLine]?.[code];
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
let current = null;
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
if (synth) synth.getVoices();

function hindiVoice() {
  const voices = synth ? synth.getVoices() : [];
  return voices.find((v) => /^hi/i.test(v.lang)) || voices.find((v) => /^(mr|ne|sa)/i.test(v.lang)) || null;
}

function setPlaying(btn, on) {
  btn.setAttribute('aria-pressed', String(on));
  const label = btn.querySelector('[data-label]');
  if (label && btn.dataset.labelPlay) label.textContent = on ? btn.dataset.labelPause || btn.dataset.labelPlay : btn.dataset.labelPlay;
}

function stopAudio() {
  if (!current) return;
  const c = current;
  current = null;
  if (c.audio) c.audio.pause();
  if (c.speech && synth && (synth.speaking || synth.pending)) synth.cancel();
  setPlaying(c.btn, false);
}

function play(btn) {
  const same = current && current.btn === btn;
  stopAudio();
  if (same) return;

  if (btn.dataset.src) {
    const audio = new Audio(btn.dataset.src);
    current = { btn, audio };
    setPlaying(btn, true);
    audio.addEventListener('ended', () => current && current.btn === btn && stopAudio());
    audio.play().catch(() => stopAudio());
    return;
  }

  const voice = synth ? hindiVoice() : null;
  if (!voice) {
    const status = document.querySelector('[data-audio-status]');
    if (status && status.dataset.noVoice) status.textContent = status.dataset.noVoice;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(btn.dataset.tts || '');
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = Number(btn.dataset.rate) || 0.8;
  const done = () => current && current.btn === btn && stopAudio();
  utterance.onend = done;
  utterance.onerror = done;
  current = { btn, speech: true };
  setPlaying(btn, true);
  synth.speak(utterance);
}

// ---- Clicks ------------------------------------------------------------------
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
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
