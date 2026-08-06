/* ============================================================================
   Hand-built SVG scenery.

   These are original stylised drawings, not reproductions of anyone's logo or
   photograph: the two high schools are drawn as generic buildings wearing the
   colours sampled from their own athletics marks, and the three campus panels
   are geometric impressions of Burton Memorial Tower beside Rackham on
   Central Campus, the Lurie Tower with Maya Lin's Wave Field on North
   Campus, and the Ross atrium.
   ========================================================================== */
(function (global) {
  'use strict';

  const UM = {
    maize: '#FFCB05', blue: '#00274C',
    arboretum: '#2F65A7', taubman: '#00B2A9', wavefield: '#A5A508',
    rossOrange: '#D86018', rackhamGreen: '#75988D',
    ash: '#989C97', stone: '#655A52', tan: '#CFC096'
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

  /* ================================ LSA — Burton Tower & Rackham (Central) = */
  /* Burton Memorial Tower (Albert Kahn, 1936) and the Rackham Building face
     each other across Fletcher Street: a very tall, very narrow limestone
     shaft against a long, low, horizontal block. That contrast is the whole
     composition. Rackham is drawn in U-M's own "Rackham Green".
     (The other carillon, Lurie Tower, is on North Campus and appears in the
     Engineering panel.) */
  function lsa() {
    const TAN = UM.tan, BLUE = UM.arboretum, GREEN = UM.rackhamGreen;
    const GROUND = 262;

    // ---- Burton Memorial Tower: slender shaft, clock, louvred belfry ------
    const TX = 214, TW = 62, TTOP = 26;           // tower centre-left, in the sky
    const tower = `
      <g>
        <!-- stepped crown -->
        <rect x="${TX - TW / 2 - 7}" y="${TTOP}" width="${TW + 14}" height="9" fill="${TAN}" opacity="0.30"/>
        <rect x="${TX - TW / 2 - 7}" y="${TTOP}" width="${TW + 14}" height="9" fill="none" stroke="${BLUE}" stroke-width="1.3"/>
        <rect x="${TX - TW / 2 - 3}" y="${TTOP + 9}" width="${TW + 6}" height="7" fill="${BLUE}" opacity="0.45"/>
        <!-- shaft -->
        <rect x="${TX - TW / 2}" y="${TTOP + 16}" width="${TW}" height="${GROUND - TTOP - 16}" fill="${TAN}" opacity="0.20"/>
        <rect x="${TX - TW / 2}" y="${TTOP + 16}" width="${TW}" height="${GROUND - TTOP - 16}" fill="none" stroke="${BLUE}" stroke-width="1.5"/>
        <!-- belfry louvres -->
        ${[0, 1, 2].map(i => `
          <rect x="${TX - 21 + i * 15}" y="${TTOP + 24}" width="10" height="34" fill="${BLUE}" opacity="0.42"/>
          ${[0, 1, 2, 3, 4].map(j => `<line x1="${TX - 21 + i * 15}" y1="${TTOP + 29 + j * 7}"
                x2="${TX - 11 + i * 15}" y2="${TTOP + 29 + j * 7}" stroke="${TAN}" stroke-width="1" opacity="0.55"/>`).join('')}`).join('')}
        <!-- clock face -->
        <circle cx="${TX}" cy="${TTOP + 84}" r="17" fill="#02182c" opacity="0.55"/>
        <circle cx="${TX}" cy="${TTOP + 84}" r="17" fill="none" stroke="${UM.maize}" stroke-width="2"/>
        ${[0, 3, 6, 9].map(h => {
          const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
          return `<line x1="${(TX + Math.cos(a) * 12).toFixed(1)}" y1="${(TTOP + 84 + Math.sin(a) * 12).toFixed(1)}"
                        x2="${(TX + Math.cos(a) * 15.5).toFixed(1)}" y2="${(TTOP + 84 + Math.sin(a) * 15.5).toFixed(1)}"
                        stroke="${UM.maize}" stroke-width="1.6" opacity="0.85"/>`;
        }).join('')}
        <line x1="${TX}" y1="${TTOP + 84}" x2="${TX}" y2="${TTOP + 73}" stroke="${UM.maize}" stroke-width="2.2"/>
        <line x1="${TX}" y1="${TTOP + 84}" x2="${TX + 8}" y2="${TTOP + 89}" stroke="${UM.maize}" stroke-width="2.2"/>
        <!-- vertical fluting down the shaft -->
        ${[-20, -10, 0, 10, 20].map(o => `<line x1="${TX + o}" y1="${TTOP + 112}" x2="${TX + o}" y2="${GROUND - 4}"
             stroke="${BLUE}" stroke-width="0.9" opacity="0.42"/>`).join('')}
        <!-- base -->
        <rect x="${TX - TW / 2 - 5}" y="${GROUND - 16}" width="${TW + 10}" height="16" fill="${TAN}" opacity="0.24"/>
        <rect x="${TX - TW / 2 - 5}" y="${GROUND - 16}" width="${TW + 10}" height="16" fill="none" stroke="${BLUE}" stroke-width="1.2"/>
      </g>`;

    // ---- Rackham: long, low, symmetrical, green roofline -------------------
    const RX = 330, RW = 424, RTOP = 150;
    const bay = (x, w, top) => `
      <rect x="${x}" y="${top}" width="${w}" height="${GROUND - top}" fill="${TAN}" opacity="0.17"/>
      <rect x="${x}" y="${top}" width="${w}" height="${GROUND - top}" fill="none" stroke="${GREEN}" stroke-width="1.3"/>`;
    const windows = (x0, n, top, h) => Array.from({ length: n }, (_, i) =>
      `<rect x="${x0 + i * 17}" y="${top}" width="9" height="${h}" fill="${GREEN}" opacity="0.42"/>`).join('');

    const rackham = `
      <g>
        ${bay(RX, RW, RTOP + 22)}
        <!-- taller centre block -->
        ${bay(RX + RW / 2 - 84, 168, RTOP)}
        <!-- green parapet bands -->
        <rect x="${RX - 6}" y="${RTOP + 14}" width="${RW + 12}" height="9" fill="${GREEN}" opacity="0.62"/>
        <rect x="${RX + RW / 2 - 92}" y="${RTOP - 8}" width="184" height="9" fill="${GREEN}" opacity="0.72"/>
        <!-- tall narrow windows, the building's signature rhythm -->
        ${windows(RX + 16, 7, RTOP + 40, 64)}
        ${windows(RX + RW / 2 - 68, 8, RTOP + 18, 88)}
        ${windows(RX + RW - 134, 7, RTOP + 40, 64)}
        <!-- bronze entrance -->
        <rect x="${RX + RW / 2 - 24}" y="${GROUND - 46}" width="48" height="46" fill="${UM.maize}" opacity="0.55"/>
        <rect x="${RX + RW / 2 - 24}" y="${GROUND - 46}" width="48" height="46" fill="none" stroke="${GREEN}" stroke-width="1.3"/>
        <line x1="${RX + RW / 2}" y1="${GROUND - 46}" x2="${RX + RW / 2}" y2="${GROUND}" stroke="${GREEN}" stroke-width="1.2" opacity="0.7"/>
        <!-- entrance steps -->
        ${[0, 1, 2].map(i => `<rect x="${RX + RW / 2 - 38 - i * 7}" y="${GROUND + i * 4}" width="${76 + i * 14}" height="4"
             fill="${TAN}" opacity="${0.3 - i * 0.06}"/>`).join('')}
      </g>`;

    const inner = `
      <rect width="800" height="330" fill="${BLUE}" opacity="0.05"/>
      ${rackham}
      ${tower}
      <!-- Fletcher Street between them, and the ground plane -->
      <rect x="0" y="${GROUND}" width="800" height="7" fill="${BLUE}" opacity="0.38"/>
      <rect x="0" y="${GROUND + 7}" width="800" height="5" fill="${BLUE}" opacity="0.18"/>
      <g opacity="0.5">
        ${[40, 120, 700, 770].map(x => `
          <line x1="${x}" y1="${GROUND}" x2="${x}" y2="${GROUND - 30}" stroke="${GREEN}" stroke-width="2"/>
          <circle cx="${x}" cy="${GROUND - 42}" r="15" fill="${GREEN}" opacity="0.30"/>`).join('')}
      </g>
      <text x="30" y="316" fill="${BLUE}" font-size="12" letter-spacing="2.6" font-weight="700"
            font-family="-apple-system,Segoe UI,Roboto,sans-serif">CENTRAL CAMPUS · BURTON TOWER &amp; RACKHAM</text>`;
    return svg('0 0 800 330', inner,
      'role="img" aria-label="Stylised Burton Memorial Tower standing beside the long, low Rackham Building on Central Campus"');
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

  /* ============================== Ross — the Winter Garden curtain wall ==== */
  /* The recognisable thing about Ross is not a box: it is the six-storey
     glazed Winter Garden, where you can read the stacked floor plates and
     their balcony fronts straight through the curtain wall, with the floors
     stopping short of a full-height void in the centre. Limestone piers hold
     each end, Blau Hall steps down to the right, and the way in is one small
     lit door under a deep canopy. */
  function ross() {
    const O = UM.rossOrange, STONE = UM.stone, GLASS = '#02182c';
    const GROUND = 268;
    const GX = 196, GW = 396, GTOP = 54;          // glazed volume
    const VOID_X = GX + GW / 2 - 52, VOID_W = 104; // the full-height atrium void

    // floor plates read through the glass, interrupted by the void
    const FLOORS = 6, fh = (GROUND - 34 - GTOP) / FLOORS;
    let plates = '';
    for (let i = 1; i <= FLOORS; i++) {
      const y = GTOP + i * fh;
      // left run, then right run — the gap is the Winter Garden
      [[GX + 6, VOID_X - GX - 6], [VOID_X + VOID_W, GX + GW - VOID_X - VOID_W - 6]]
        .forEach(([x, w]) => {
          plates += `<rect x="${x.toFixed(1)}" y="${(y - 5).toFixed(1)}" width="${w.toFixed(1)}" height="5"
                       fill="${O}" opacity="0.50"/>
                     <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(fh - 9).toFixed(1)}"
                       fill="${O}" opacity="${(0.05 + (i % 3) * 0.035).toFixed(3)}"/>`;
        });
    }

    // vertical mullions across the whole curtain wall
    const mullions = Array.from({ length: Math.round(GW / 26) - 1 }, (_, i) =>
      `<line x1="${GX + (i + 1) * 26}" y1="${GTOP}" x2="${GX + (i + 1) * 26}" y2="${GROUND - 34}"
             stroke="${O}" stroke-width="0.9" opacity="0.32"/>`).join('');

    // people-scale marks on the balcony fronts, so the height reads
    let figures = '';
    for (let i = 0; i < 16; i++) {
      const fl = 1 + (i % FLOORS);
      const y = GTOP + fl * fh - 5;
      const left = i % 2 === 0;
      const x = left ? GX + 18 + ((i * 37) % (VOID_X - GX - 40))
                     : VOID_X + VOID_W + 12 + ((i * 53) % (GX + GW - VOID_X - VOID_W - 34));
      figures += `<rect x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" width="1.8" height="6"
                    fill="#ffcb05" opacity="0.50"/>`;
    }

    const inner = `
      <rect width="800" height="330" fill="${O}" opacity="0.045"/>

      <!-- limestone pier, left -->
      <rect x="112" y="${GTOP + 26}" width="80" height="${GROUND - GTOP - 26}" fill="${STONE}" opacity="0.34"/>
      <rect x="112" y="${GTOP + 26}" width="80" height="${GROUND - GTOP - 26}" fill="none" stroke="${O}" stroke-width="1.2"/>
      ${[0, 1, 2, 3].map(i => `<rect x="128" y="${GTOP + 48 + i * 40}" width="48" height="22"
           fill="${GLASS}" opacity="0.5"/>`).join('')}

      <!-- Blau Hall, stepping down to the right -->
      <rect x="596" y="${GTOP + 62}" width="96" height="${GROUND - GTOP - 62}" fill="${STONE}" opacity="0.30"/>
      <rect x="596" y="${GTOP + 62}" width="96" height="${GROUND - GTOP - 62}" fill="none" stroke="${O}" stroke-width="1.2"/>
      ${[0, 1, 2].map(i => `<rect x="610" y="${GTOP + 82 + i * 42}" width="68" height="24"
           fill="${GLASS}" opacity="0.5"/>`).join('')}

      <!-- the glazed Winter Garden -->
      <rect x="${GX}" y="${GTOP}" width="${GW}" height="${GROUND - 34 - GTOP}" fill="${GLASS}" opacity="0.82"/>
      ${plates}
      <!-- the void: brighter, uninterrupted, full height -->
      <linearGradient id="rossvoid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${UM.maize}" stop-opacity="0.20"/>
        <stop offset="1" stop-color="${O}" stop-opacity="0.10"/>
      </linearGradient>
      <rect x="${VOID_X}" y="${GTOP + 8}" width="${VOID_W}" height="${GROUND - 42 - GTOP}"
            fill="url(#rossvoid)"/>
      <line x1="${VOID_X}" y1="${GTOP}" x2="${VOID_X}" y2="${GROUND - 34}" stroke="${O}" stroke-width="1.5" opacity="0.75"/>
      <line x1="${VOID_X + VOID_W}" y1="${GTOP}" x2="${VOID_X + VOID_W}" y2="${GROUND - 34}" stroke="${O}" stroke-width="1.5" opacity="0.75"/>
      ${mullions}
      ${figures}
      <rect x="${GX}" y="${GTOP}" width="${GW}" height="${GROUND - 34 - GTOP}" fill="none" stroke="${O}" stroke-width="1.8"/>

      <!-- cornice -->
      <rect x="${GX - 12}" y="${GTOP - 13}" width="${GW + 24}" height="13" fill="${O}" opacity="0.55"/>
      <rect x="${GX - 12}" y="${GTOP - 13}" width="${GW + 24}" height="13" fill="none" stroke="${O}" stroke-width="1"/>

      <!-- deep entrance canopy, and one small lit door -->
      <rect x="${VOID_X - 34}" y="${GROUND - 34}" width="${VOID_W + 68}" height="9" fill="${O}" opacity="0.62"/>
      <rect x="${VOID_X + VOID_W / 2 - 21}" y="${GROUND - 25}" width="42" height="25" fill="${UM.maize}" opacity="0.9"/>
      <line x1="${VOID_X + VOID_W / 2}" y1="${GROUND - 25}" x2="${VOID_X + VOID_W / 2}" y2="${GROUND}"
            stroke="${GLASS}" stroke-width="1.4" opacity="0.6"/>

      <!-- plaza -->
      <rect x="0" y="${GROUND}" width="800" height="7" fill="${O}" opacity="0.38"/>
      <rect x="0" y="${GROUND + 7}" width="800" height="5" fill="${O}" opacity="0.16"/>
      <g opacity="0.45">
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${120 + i * 130}" y="${GROUND + 16}" width="62" height="3" fill="${UM.ash}"/>`).join('')}
      </g>

      <text x="30" y="316" fill="${O}" font-size="12" letter-spacing="2.6" font-weight="700"
            font-family="-apple-system,Segoe UI,Roboto,sans-serif">ROSS SCHOOL OF BUSINESS · PREFERRED ADMISSION</text>`;
    return svg('0 0 800 330', inner,
      'role="img" aria-label="Stylised Ross School of Business: six storeys of floor plates read through a glass curtain wall around a full-height atrium void, entered by a single small lit door"');
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
