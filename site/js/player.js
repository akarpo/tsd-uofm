/* ============================================================================
   Marching-band player + spectrum visualiser.

   The AudioContext is created on the first user gesture (browsers refuse to
   start one otherwise) and the analyser is wired once, then reused for every
   track so switching songs never re-creates the graph.
   ========================================================================== */
(function () {
  'use strict';

  const TRACKS = [
    { file: 'audio/1-lets-go-blue.mp3', title: "Let's Go Blue", note: 'Michigan Marching Band' },
    { file: 'audio/2-temptation.mp3', title: 'Temptation', note: 'Michigan Marching Band' },
    { file: 'audio/3-m-fanfare.mp3', title: 'M Fanfare', note: 'Michigan Marching Band' },
    { file: 'audio/4-the-victors.mp3', title: 'The Victors', note: 'Michigan Marching Band' },
    { file: 'audio/5-bond-opener-goldfinger-dr-no.mp3', title: 'Bond Opener: Goldfinger / Dr. No', note: 'Michigan Marching Band' },
    { file: 'audio/6-tangled-up-in-blue.mp3', title: 'Tangled up in Blue', note: 'Bob Dylan · Wembley Stadium, July 1984' }
  ];

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.crossOrigin = 'anonymous';

  let idx = 0, ctx = null, analyser = null, data = null, rafId = null, wired = false;

  const $ = s => document.querySelector(s);
  const elTitle = $('#p-title'), elTrack = $('#p-track'), elFill = $('#p-fill');
  const elCur = $('#p-cur'), elDur = $('#p-dur'), elBar = $('#p-bar');
  const btnPlay = $('#p-play'), btnPrev = $('#p-prev'), btnNext = $('#p-next'), btnList = $('#p-listbtn');
  const list = $('#p-list'), canvas = $('#p-viz');
  const cctx = canvas.getContext('2d');

  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

  const mmss = s =>
    (!isFinite(s) || s < 0) ? '0:00'
      : Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  function buildList() {
    TRACKS.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="idx">${i + 1}</span><span>${t.title}</span>`;
      b.addEventListener('click', () => { load(i); play(); list.hidden = true; });
      list.appendChild(b);
    });
  }

  function syncList() {
    [...list.children].forEach((b, i) =>
      b.setAttribute('aria-current', String(i === idx)));
  }

  function load(i, autoplay) {
    idx = (i + TRACKS.length) % TRACKS.length;
    const t = TRACKS[idx];
    audio.src = t.file;
    elTitle.textContent = t.title;
    elTrack.textContent = `Track ${idx + 1} of ${TRACKS.length} · ${t.note}`;
    syncList();
    if (autoplay) play();
  }

  function ensureGraph() {
    if (wired) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const src = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    data = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    analyser.connect(ctx.destination);
    wired = true;
  }

  function play() {
    ensureGraph();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    audio.play().then(draw).catch(() => {/* gesture required; ignore */ });
  }

  function toggle() { audio.paused ? play() : audio.pause(); }

  audio.addEventListener('play', () => {
    btnPlay.innerHTML = ICON_PAUSE;
    btnPlay.setAttribute('aria-label', 'Pause');
    draw();
  });
  audio.addEventListener('pause', () => {
    btnPlay.innerHTML = ICON_PLAY;
    btnPlay.setAttribute('aria-label', 'Play');
  });
  audio.addEventListener('ended', () => load(idx + 1, true));
  audio.addEventListener('loadedmetadata', () => { elDur.textContent = mmss(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    elCur.textContent = mmss(audio.currentTime);
    const p = audio.duration ? audio.currentTime / audio.duration : 0;
    elFill.style.width = (p * 100) + '%';
    elBar.setAttribute('aria-valuenow', Math.round(p * 100));
  });

  btnPlay.addEventListener('click', toggle);
  btnPrev.addEventListener('click', () => load(idx - 1, !audio.paused));
  btnNext.addEventListener('click', () => load(idx + 1, !audio.paused));
  btnList.addEventListener('click', () => {
    list.hidden = !list.hidden;
    btnList.setAttribute('aria-expanded', String(!list.hidden));
  });
  document.addEventListener('click', e => {
    if (!list.hidden && !list.contains(e.target) && e.target !== btnList && !btnList.contains(e.target)) {
      list.hidden = true;
      btnList.setAttribute('aria-expanded', 'false');
    }
  });

  function seekFrom(e) {
    const r = elBar.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    if (audio.duration) audio.currentTime = p * audio.duration;
  }
  elBar.addEventListener('pointerdown', e => {
    seekFrom(e);
    const mv = ev => seekFrom(ev);
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv);
    addEventListener('pointerup', up);
  });
  elBar.addEventListener('keydown', e => {
    if (!audio.duration) return;
    if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
  });

  // space bar toggles playback unless the user is typing or on a control
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const t = e.target;
    if (t.closest('button, input, textarea, select, a, [contenteditable]')) return;
    e.preventDefault();
    toggle();
  });

  /* --------------------------------------------------------- visualiser -- */
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, r.width * dpr);
    canvas.height = Math.max(1, r.height * dpr);
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', sizeCanvas);

  function draw() {
    cancelAnimationFrame(rafId);
    const r = canvas.getBoundingClientRect();
    const w = r.width, h = r.height;

    function frame() {
      rafId = requestAnimationFrame(frame);
      cctx.clearRect(0, 0, w, h);
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      const n = data.length;
      const bw = w / n;
      for (let i = 0; i < n; i++) {
        const v = data[i] / 255;
        const bh = Math.pow(v, 1.35) * h * 0.92;
        // maize at the base fading to blue at the peak
        const g = cctx.createLinearGradient(0, h, 0, h - bh);
        g.addColorStop(0, 'rgba(255,203,5,0.85)');
        g.addColorStop(1, 'rgba(57,135,229,0.35)');
        cctx.fillStyle = g;
        cctx.fillRect(i * bw + 0.5, h - bh, Math.max(1, bw - 1.5), bh);
      }
      if (audio.paused) {
        // let the bars fall away, then stop burning frames
        let sum = 0;
        for (let i = 0; i < n; i++) sum += data[i];
        if (sum < 2) { cancelAnimationFrame(rafId); cctx.clearRect(0, 0, w, h); }
      }
    }
    frame();
  }

  buildList();
  load(0);
  sizeCanvas();

  // First interaction anywhere on the page unlocks audio, so the "play"
  // press itself doesn't get eaten by the autoplay policy.
  const unlock = () => { ensureGraph(); document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock, { once: true });
})();
