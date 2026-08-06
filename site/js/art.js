/* ============================================================================
   Hand-built SVG scenery.

   These are original stylised drawings, not reproductions of anyone's logo or
   photograph: the two high schools are drawn as generic buildings wearing the
   colours sampled from their own athletics marks, and the three campus panels
   are geometric impressions of Angell Hall's colonnade, the Lurie Tower with
   Maya Lin's Wave Field, and the Ross atrium.
   ========================================================================== */
(function (global) {
  'use strict';

  const UM = {
    maize: '#FFCB05', blue: '#00274C',
    arboretum: '#2F65A7', taubman: '#00B2A9', wavefield: '#A5A508',
    rossOrange: '#D86018', ash: '#989C97', stone: '#655A52', tan: '#CFC096'
  };
  const SCHOOL = {
    troy: { silver: '#CFD0D2', black: '#000000' },
    athens: { red: '#C20F2F', gold: '#B4A169', black: '#000000' }
  };

  const svg = (vb, inner, extra) =>
    `<svg viewBox="${vb}" ${extra || ''} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  /* ------------------------------------------------- dot matrix fragment -- */
  function dots(total, filled, opts) {
    const o = Object.assign({ cols: 20, r: 3.1, gap: 3.4, x: 0, y: 0, on: UM.maize, off: 'rgba(169,189,212,0.38)' }, opts);
    const step = o.r * 2 + o.gap;
    let s = '';
    for (let i = 0; i < total; i++) {
      const cx = o.x + (i % o.cols) * step + o.r;
      const cy = o.y + Math.floor(i / o.cols) * step + o.r;
      s += i < filled
        ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${o.r}" fill="${o.on}"/>`
        : `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${o.r}" fill="none" stroke="${o.off}" stroke-width="1"/>`;
    }
    return s;
  }

  /* =================================================== the two high schools */
  function schoolPanel(rec) {
    const t = rec.troy, a = rec.athens;
    // Aspect is deliberately tallish: the panel sits in a full-height sticky
    // column, and a wide-and-short drawing left most of that column empty.
    const W = 720, H = 580;

    const building = (x, y, w, h, body, trim, roofTrim) => `
      <rect x="${x}" y="${y + h * 0.18}" width="${w}" height="${h * 0.82}" fill="${body}" opacity="0.16"/>
      <rect x="${x}" y="${y + h * 0.18}" width="${w}" height="${h * 0.82}" fill="none" stroke="${body}" stroke-width="1.5"/>
      <rect x="${x}" y="${y + h * 0.11}" width="${w}" height="${h * 0.08}" fill="${roofTrim}"/>
      <rect x="${x + w * 0.42}" y="${y}" width="${w * 0.16}" height="${h * 0.14}" fill="${trim}" opacity="0.9"/>
      ${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c =>
        `<rect x="${x + w * (0.08 + c * 0.18)}" y="${y + h * (0.3 + r * 0.16)}"
               width="${w * 0.1}" height="${h * 0.09}" fill="${trim}" opacity="${0.25 + 0.12 * ((r + c) % 3)}"/>`
      ).join('')).join('')}
      <rect x="${x + w * 0.42}" y="${y + h * 0.82}" width="${w * 0.16}" height="${h * 0.18}" fill="${trim}" opacity="0.55"/>`;

    const FONT = '-apple-system,Segoe UI,Roboto,sans-serif';
    const COLS = 18, R = 3.5, GAP = 3.7;

    const panel = (cx, label, sub, rec2, colors, accentOn) => `
      <g>
        <text x="${cx}" y="26" text-anchor="middle" fill="#f4f7fb" font-size="20" font-weight="800"
              font-family="${FONT}">${label}</text>
        <text x="${cx}" y="48" text-anchor="middle" fill="#6f8aa8" font-size="12.5"
              font-family="${FONT}">${sub}</text>
        ${building(cx - 138, 68, 276, 172, colors.a, colors.b, colors.c)}
        <text x="${cx}" y="286" text-anchor="middle" fill="#a9bdd4" font-size="12.5"
              letter-spacing="1.7" font-family="${FONT}">
          ${rec2.applied} APPLIED · ${rec2.admitted} ADMITTED</text>
        ${dots(rec2.applied, rec2.admitted, {
            x: cx - (COLS * (R * 2 + GAP)) / 2, y: 302, cols: COLS, r: R, gap: GAP, on: accentOn })}
        <!-- rate sits at a fixed baseline so the two schools' figures line up
             even though their dot grids are different heights -->
        <text x="${cx}" y="522" text-anchor="middle"
              fill="${accentOn}" font-size="50" font-weight="800"
              font-family="${FONT}">${(rec2.rate * 100).toFixed(1)}%</text>
        <text x="${cx}" y="544" text-anchor="middle"
              fill="#6f8aa8" font-size="11.5" letter-spacing="1.5"
              font-family="${FONT}">ADMIT RATE</text>
      </g>`;

    const inner = `
      <text x="${W / 2}" y="${H - 6}" text-anchor="middle" fill="#6f8aa8" font-size="12.5"
            letter-spacing="3" font-family="${FONT}">ENTERING CLASS OF ${rec.year}</text>
      ${panel(178, 'TROY HIGH', 'Colts · silver &amp; black',
              { applied: t.applied, admitted: t.admitted, rate: t.rate },
              { a: SCHOOL.troy.silver, b: SCHOOL.troy.silver, c: SCHOOL.troy.black }, '#3987e5')}
      <line x1="${W / 2}" y1="62" x2="${W / 2}" y2="${H - 34}" stroke="rgba(169,189,212,0.18)"/>
      ${panel(542, 'ATHENS', 'Red Hawks · red &amp; gold',
              { applied: a.applied, admitted: a.admitted, rate: a.rate },
              { a: SCHOOL.athens.red, b: SCHOOL.athens.gold, c: SCHOOL.athens.black }, '#d95926')}
    `;
    return svg(`0 0 ${W} ${H}`, inner, 'role="img" aria-label="Troy High and Athens applications and admissions in ' + rec.year + '"');
  }

  /* ============================================= LSA — Angell Hall / Diag = */
  function lsa() {
    const cols = [];
    for (let i = 0; i < 8; i++) {
      const x = 96 + i * 44;
      cols.push(`
        <rect x="${x}" y="96" width="26" height="118" fill="${UM.tan}" opacity="0.20"/>
        <rect x="${x}" y="96" width="26" height="118" fill="none" stroke="${UM.arboretum}" stroke-width="1.2"/>
        <rect x="${x - 4}" y="90" width="34" height="8" fill="${UM.arboretum}" opacity="0.55"/>
        <rect x="${x - 4}" y="214" width="34" height="8" fill="${UM.arboretum}" opacity="0.55"/>
        ${[0, 1, 2, 3, 4].map(f => `<line x1="${x + 6 + f * 4}" y1="100" x2="${x + 6 + f * 4}" y2="210"
             stroke="${UM.arboretum}" stroke-width="0.7" opacity="0.4"/>`).join('')}`);
    }
    const inner = `
      <rect width="800" height="330" fill="none"/>
      <!-- sky wash -->
      <rect width="800" height="330" fill="${UM.arboretum}" opacity="0.05"/>
      <!-- pediment -->
      <path d="M72 90 L400 26 L728 90 Z" fill="${UM.tan}" opacity="0.16"/>
      <path d="M72 90 L400 26 L728 90 Z" fill="none" stroke="${UM.arboretum}" stroke-width="1.6"/>
      <circle cx="400" cy="70" r="12" fill="none" stroke="${UM.maize}" stroke-width="1.6"/>
      ${cols.join('')}
      <rect x="60" y="222" width="680" height="12" fill="${UM.arboretum}" opacity="0.4"/>
      <rect x="40" y="234" width="720" height="8" fill="${UM.arboretum}" opacity="0.22"/>
      <!-- the Diag: diagonal paths meeting at the block M -->
      <g opacity="0.6">
        <line x1="0" y1="330" x2="360" y2="250" stroke="${UM.ash}" stroke-width="8" opacity="0.28"/>
        <line x1="800" y1="330" x2="440" y2="250" stroke="${UM.ash}" stroke-width="8" opacity="0.28"/>
        <line x1="400" y1="330" x2="400" y2="250" stroke="${UM.ash}" stroke-width="8" opacity="0.28"/>
      </g>
      <g transform="translate(372,282) scale(0.30)">
        <path d="M4 6h34l22 46 22-46h34v88H92V38L66 94h-12L28 38v56H4z" fill="${UM.maize}" opacity="0.9"/>
      </g>
      <text x="30" y="316" fill="${UM.arboretum}" font-size="12" letter-spacing="2.6" font-weight="700"
            font-family="-apple-system,Segoe UI,Roboto,sans-serif">CENTRAL CAMPUS · THE DIAG</text>`;
    return svg('0 0 800 330', inner, 'role="img" aria-label="Stylised Angell Hall colonnade above the Diag, with the block M set in the pavement"');
  }

  /* ================================ Engineering — Lurie Tower + Wave Field */
  function eng() {
    // Maya Lin's Wave Field: rolling sine berms
    let waves = '';
    for (let r = 0; r < 5; r++) {
      const y = 232 + r * 20, amp = 9 + r * 1.6, op = 0.5 - r * 0.07;
      let d = `M0 ${y}`;
      for (let x = 0; x <= 800; x += 8) d += ` L${x} ${(y - Math.sin((x / 800) * Math.PI * 6) * amp).toFixed(1)}`;
      waves += `<path d="${d}" fill="none" stroke="${UM.wavefield}" stroke-width="2.2" opacity="${op}"/>`;
    }
    const inner = `
      <rect width="800" height="330" fill="${UM.taubman}" opacity="0.045"/>
      <!-- lab blocks -->
      <g>
        <rect x="60" y="150" width="150" height="88" fill="${UM.taubman}" opacity="0.12"/>
        <rect x="60" y="150" width="150" height="88" fill="none" stroke="${UM.taubman}" stroke-width="1.3"/>
        <rect x="560" y="128" width="180" height="110" fill="${UM.taubman}" opacity="0.12"/>
        <rect x="560" y="128" width="180" height="110" fill="none" stroke="${UM.taubman}" stroke-width="1.3"/>
        ${[0, 1, 2, 3, 4, 5].map(c => [0, 1, 2].map(r =>
          `<rect x="${72 + c * 23}" y="${162 + r * 25}" width="14" height="15" fill="${UM.taubman}" opacity="0.3"/>`).join('')).join('')}
        ${[0, 1, 2, 3, 4, 5, 6].map(c => [0, 1, 2, 3].map(r =>
          `<rect x="${572 + c * 24}" y="${140 + r * 25}" width="15" height="15" fill="${UM.taubman}" opacity="0.3"/>`).join('')).join('')}
      </g>
      <!-- Lurie Tower -->
      <g>
        <rect x="368" y="60" width="64" height="178" fill="${UM.tan}" opacity="0.15"/>
        <rect x="368" y="60" width="64" height="178" fill="none" stroke="${UM.wavefield}" stroke-width="1.6"/>
        <rect x="360" y="48" width="80" height="14" fill="${UM.wavefield}" opacity="0.55"/>
        <path d="M360 48 L400 18 L440 48 Z" fill="${UM.maize}" opacity="0.75"/>
        ${[0, 1, 2].map(i => `<rect x="${380 + i * 14}" y="82" width="8" height="42" fill="${UM.wavefield}" opacity="0.45"/>`).join('')}
        <circle cx="400" cy="152" r="17" fill="none" stroke="${UM.maize}" stroke-width="1.8"/>
        <line x1="400" y1="152" x2="400" y2="140" stroke="${UM.maize}" stroke-width="1.8"/>
        <line x1="400" y1="152" x2="409" y2="157" stroke="${UM.maize}" stroke-width="1.8"/>
      </g>
      <rect x="0" y="236" width="800" height="4" fill="${UM.wavefield}" opacity="0.3"/>
      ${waves}
      <text x="30" y="316" fill="${UM.taubman}" font-size="12" letter-spacing="2.6" font-weight="700"
            font-family="-apple-system,Segoe UI,Roboto,sans-serif">NORTH CAMPUS · LURIE TOWER &amp; THE WAVE FIELD</text>`;
    return svg('0 0 800 330', inner, 'role="img" aria-label="Stylised Lurie Tower on North Campus above the undulating berms of the Wave Field"');
  }

  /* ======================================================= Ross — the cube */
  function ross() {
    let grid = '';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 12; c++) {
        const lit = (r * 7 + c * 3) % 5 === 0;
        grid += `<rect x="${250 + c * 26}" y="${86 + r * 24}" width="22" height="20"
                   fill="${UM.rossOrange}" opacity="${lit ? 0.55 : 0.13}"/>`;
      }
    }
    const inner = `
      <rect width="800" height="330" fill="${UM.rossOrange}" opacity="0.045"/>
      <!-- stone flanks -->
      <rect x="120" y="110" width="122" height="128" fill="${UM.stone}" opacity="0.3"/>
      <rect x="120" y="110" width="122" height="128" fill="none" stroke="${UM.rossOrange}" stroke-width="1.2"/>
      <rect x="566" y="110" width="122" height="128" fill="${UM.stone}" opacity="0.3"/>
      <rect x="566" y="110" width="122" height="128" fill="none" stroke="${UM.rossOrange}" stroke-width="1.2"/>
      <!-- glass atrium -->
      <rect x="246" y="82" width="316" height="156" fill="#02182c" opacity="0.75"/>
      ${grid}
      <rect x="246" y="82" width="316" height="156" fill="none" stroke="${UM.rossOrange}" stroke-width="1.8"/>
      <line x1="404" y1="82" x2="404" y2="238" stroke="${UM.rossOrange}" stroke-width="1.2" opacity="0.6"/>
      <rect x="236" y="70" width="336" height="14" fill="${UM.rossOrange}" opacity="0.5"/>
      <!-- plaza -->
      <rect x="60" y="238" width="680" height="7" fill="${UM.rossOrange}" opacity="0.35"/>
      <g opacity="0.5">
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${180 + i * 90}" y="252" width="54" height="3" fill="${UM.ash}"/>`).join('')}
      </g>
      <!-- the narrow door -->
      <rect x="386" y="200" width="36" height="38" fill="${UM.maize}" opacity="0.85"/>
      <text x="30" y="316" fill="${UM.rossOrange}" font-size="12" letter-spacing="2.6" font-weight="700"
            font-family="-apple-system,Segoe UI,Roboto,sans-serif">ROSS SCHOOL OF BUSINESS · PREFERRED ADMISSION</text>`;
    return svg('0 0 800 330', inner, 'role="img" aria-label="Stylised glass atrium of the Ross School of Business with a single narrow lit doorway"');
  }

  /* ================================================== hero field animation */
  function heroCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, dpr, t = 0, raf;

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // yard lines receding toward a vanishing point — a football field in perspective
    function frame() {
      ctx.clearRect(0, 0, w, h);
      const vy = h * 0.42;
      ctx.lineWidth = 1;
      for (let i = 0; i < 26; i++) {
        const p = ((i / 26) + (reduce ? 0 : t * 0.00004)) % 1;
        const y = vy + Math.pow(p, 2.6) * (h - vy) * 1.15;
        if (y > h) continue;
        const spread = (y - vy) / (h - vy);
        ctx.strokeStyle = `rgba(255,203,5,${0.05 + spread * 0.14})`;
        ctx.beginPath();
        ctx.moveTo(w / 2 - spread * w * 0.95, y);
        ctx.lineTo(w / 2 + spread * w * 0.95, y);
        ctx.stroke();
      }
      for (let i = -7; i <= 7; i++) {
        ctx.strokeStyle = `rgba(57,135,229,0.13)`;
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * 4, vy);
        ctx.lineTo(w / 2 + i * (w * 0.16), h);
        ctx.stroke();
      }
      t += 16;
      raf = requestAnimationFrame(frame);
    }
    size();
    addEventListener('resize', size);
    frame();
    // stop burning frames once the hero has scrolled away
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!raf) frame(); }
      else { cancelAnimationFrame(raf); raf = null; }
    }), { threshold: 0.02 });
    io.observe(canvas);
  }

  /* ================================================ the word "Blue" ======= */
  /* The word is cut out of a shimmering blue field, and campus objects --
     dollar signs, footballs, mortarboards, columns, pennants, block Ms --
     drift up through the letterforms. The visible text is an SVG clip path,
     so a screen-reader copy of the word is kept alongside it in the DOM. */

  const ICONS = [
    // dollar sign
    () => `<path d="M0,-9 v18 M-4.6,-4.6 a4.6,3.6 0 1 1 4.6,3.6 a4.6,3.6 0 1 0 4.6,3.6"
             fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>`,
    // football
    () => `<g><ellipse rx="9.5" ry="5.6" fill="none" stroke="currentColor" stroke-width="1.9"/>
             <line x1="-4.6" y1="0" x2="4.6" y2="0" stroke="currentColor" stroke-width="1.6"/>
             ${[-2.6, 0, 2.6].map(x => `<line x1="${x}" y1="-1.9" x2="${x}" y2="1.9"
                stroke="currentColor" stroke-width="1.4"/>`).join('')}</g>`,
    // mortarboard
    () => `<g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round">
             <path d="M-10,-2.4 L0,-7 L10,-2.4 L0,2.2 Z"/>
             <path d="M-5.6,-0.3 v5.2 a5.6,2.6 0 0 0 11.2,0 v-5.2"/>
             <path d="M9,-1.6 v6.4"/></g>`,
    // column (Angell Hall)
    () => `<g fill="none" stroke="currentColor" stroke-width="1.8">
             <rect x="-6.4" y="-8.6" width="12.8" height="2.6"/>
             <rect x="-4.2" y="-6" width="8.4" height="12"/>
             <rect x="-6.4" y="6" width="12.8" height="2.6"/>
             <line x1="-1.4" y1="-4.4" x2="-1.4" y2="4.4"/>
             <line x1="1.4" y1="-4.4" x2="1.4" y2="4.4"/></g>`,
    // pennant
    () => `<g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round">
             <path d="M-8,-6 L9,0 L-8,6 Z"/><line x1="-8" y1="-7.6" x2="-8" y2="8.6"/></g>`,
    // book
    () => `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
             <path d="M-8.4,-6.2 h6.6 a1.8,1.8 0 0 1 1.8,1.8 v10.6 a1.8,1.8 0 0 0 -1.8,-1.8 h-6.6 Z"/>
             <path d="M8.4,-6.2 h-6.6 a1.8,1.8 0 0 0 -1.8,1.8 v10.6 a1.8,1.8 0 0 1 1.8,-1.8 h6.6 Z"/></g>`,
    // block M
    () => `<g transform="translate(-9,-6.6) scale(0.166)"><path
             d="M395.82,310.76l-22-30.23v22h8.8v21.71H342V302.52h8.24V268.71H342V247H373.9l22,30.5L418,247H450v21.71h-8.24v33.81H450v21.71H409.28V302.52h8.79v-22Z"
             transform="translate(-319.73 -224.78)" fill="currentColor"/></g>`,
  ];

  function blueWord(host) {
    if (!host) return;
    const h1 = host.closest('h1');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = null, floaters = [], t0 = 0;

    function render() {
      cancelAnimationFrame(raf);
      raf = null;
      const cs = getComputedStyle(h1);
      const fs = parseFloat(cs.fontSize);
      const FONT = cs.fontFamily;
      const WEIGHT = cs.fontWeight;
      // letter-spacing computes to px; h1 uses a negative em value
      const LS = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);

      const uid = 'bw' + Math.round(fs * 100);
      const textAttrs = `font-family="${FONT.replace(/"/g, '&quot;')}" font-weight="${WEIGHT}"` +
                        ` font-size="${fs}" letter-spacing="${LS}"`;

      // measure first, in a throwaway SVG, so the viewBox can hug the word
      const probe = document.createElementNS(NS_SVG, 'svg');
      probe.setAttribute('style', 'position:absolute;visibility:hidden;width:2000px;height:600px');
      probe.innerHTML = `<text x="0" y="400" ${textAttrs}>Blue</text>`;
      document.body.appendChild(probe);
      const bb = probe.querySelector('text').getBBox();
      probe.remove();

      const PAD = fs * 0.06;
      const W = bb.width + PAD * 2, H = bb.height + PAD * 2;
      const vx = bb.x - PAD, vy = bb.y - PAD;

      host.style.width = W + 'px';
      host.style.height = H + 'px';

      host.innerHTML =
        `<span class="sr-only">Blue</span>` +
        `<svg viewBox="${vx} ${vy} ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
          <defs>
            <clipPath id="${uid}-clip"><text x="0" y="400" ${textAttrs}>Blue</text></clipPath>
            <linearGradient id="${uid}-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0"   stop-color="#8fc4ff"/>
              <stop offset="0.45" stop-color="#4d9bf0"/>
              <stop offset="1"   stop-color="#1f5fb0"/>
            </linearGradient>
            <linearGradient id="${uid}-sheen" x1="0" y1="0" x2="1" y2="0.35">
              <stop offset="0"    stop-color="#ffffff" stop-opacity="0"/>
              <stop offset="0.38" stop-color="#ffffff" stop-opacity="0.42"/>
              <stop offset="0.47" stop-color="#ffcb05" stop-opacity="0.68"/>
              <stop offset="0.53" stop-color="#ffffff" stop-opacity="0.85"/>
              <stop offset="0.62" stop-color="#ffcb05" stop-opacity="0.50"/>
              <stop offset="1"    stop-color="#ffffff" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <g clip-path="url(#${uid}-clip)">
            <rect x="${vx}" y="${vy}" width="${W}" height="${H}" fill="url(#${uid}-fill)"/>
            <g class="bw-floaters"></g>
            <rect class="bw-sheen" x="${vx}" y="${vy}" width="${(W * 0.55).toFixed(1)}"
                  height="${H}" fill="url(#${uid}-sheen)"/>
          </g>
        </svg>`;

      const gF = host.querySelector('.bw-floaters');
      const sheen = host.querySelector('.bw-sheen');
      // fewer, larger objects read better inside the counters than many small
      // ones, which just look like noise at hero size
      const n = Math.max(8, Math.round(W / (fs * 0.62)));
      const scale = fs / 150;
      // dollar signs and footballs lead the mix
      const ORDER = [0, 1, 0, 6, 2, 1, 3, 0, 4, 1, 5, 2];
      floaters = [];
      let markup = '';
      for (let i = 0; i < n; i++) {
        // deterministic-ish spread; no Math.random dependence on reload order
        const fx = vx + ((i * 137.5) % 100) / 100 * W;
        const fy = vy + ((i * 71.3) % 100) / 100 * H;
        const kind = ORDER[i % ORDER.length];
        const sc = (0.8 + ((i * 29) % 45) / 100) * scale * 3.1;
        const rot = ((i * 53) % 60) - 30;
        const op = 0.46 + ((i * 17) % 32) / 100;
        const col = i % 3 === 0 ? '#ffcb05' : '#eaf4ff';
        markup += `<g class="bw-f" style="color:${col}" opacity="${op.toFixed(2)}"
                      transform="translate(${fx.toFixed(1)},${fy.toFixed(1)}) rotate(${rot}) scale(${sc.toFixed(3)})"
                   >${ICONS[kind]()}</g>`;
        floaters.push({ x: fx, y: fy, sc, rot, spd: 7 + ((i * 13) % 20) });
      }
      gF.innerHTML = markup;
      const nodes = [...gF.children];

      if (reduce) return;   // static field: gradient + objects, no motion

      t0 = performance.now();
      const loop = now => {
        const dt = (now - t0) / 1000;
        nodes.forEach((el, i) => {
          const f = floaters[i];
          let y = f.y - ((dt * f.spd) % (H + 40));
          if (y < vy - 20) y += H + 40;
          const wob = Math.sin(dt * 0.9 + i) * fs * 0.012;
          el.setAttribute('transform',
            `translate(${(f.x + wob).toFixed(1)},${y.toFixed(1)}) rotate(${(f.rot + Math.sin(dt * 0.5 + i) * 8).toFixed(1)}) scale(${f.sc.toFixed(3)})`);
        });
        // sheen crosses left-to-right, then waits offscreen before the next pass
        const cycle = (dt * 0.30) % 1;
        const travel = Math.min(cycle / 0.55, 1);
        sheen.setAttribute('x', (vx - W * 0.55 + travel * (W + W * 0.55)).toFixed(1));
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    render();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 180); });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!raf && !reduce) render(); }
      else { cancelAnimationFrame(raf); raf = null; }
    }), { threshold: 0.02 });
    io.observe(host);
  }

  const NS_SVG = 'http://www.w3.org/2000/svg';

  global.Art = { schoolPanel, lsa, eng, ross, heroCanvas, blueWord, dots, UM, SCHOOL };
})(window);
