/* ============================================================================
   Minimal SVG chart engine for "Tangled up in Blue".

   Palette note: these are the validated categorical steps for the navy chart
   surface (#06203f) — checked with the data-viz validator for the lightness
   band, chroma floor, protan/deutan/tritan separation, normal-vision floor and
   3:1 contrast. The University of Michigan's official brand hues carry the
   site's identity (headings, campus panels, illustrations) but are deliberately
   NOT used as chart marks: Wave Field Green sits outside the dark lightness
   band and is indistinguishable from Ross Orange under deuteranopia, and the
   schools' silver is achromatic. Identity and encoding are kept separate.
   ========================================================================== */
(function (global) {
  'use strict';

  const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9'];
  const INK = '#f4f7fb', INK2 = '#a9bdd4', INK3 = '#6f8aa8';
  const GRID = 'rgba(169,189,212,0.15)', AXIS = 'rgba(169,189,212,0.40)';
  const SURFACE = '#06203f';
  const NS = 'http://www.w3.org/2000/svg';

  const el = (n, a) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]);
    return e;
  };
  const reduceMotion = () =>
    global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ tooltip --- */
  let tip;
  function tipEl() {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'viz-tip';
      tip.setAttribute('role', 'status');
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(html, x, y) {
    const t = tipEl();
    t.innerHTML = html;
    t.classList.add('on');
    const r = t.getBoundingClientRect();
    let left = x + 16, top = y - r.height / 2;
    if (left + r.width > innerWidth - 8) left = x - r.width - 16;
    top = Math.max(8, Math.min(top, innerHeight - r.height - 8));
    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }
  const hideTip = () => tip && tip.classList.remove('on');

  /* ------------------------------------------------------- number format -- */
  const F = {
    int: v => Math.round(v).toLocaleString('en-US'),
    pct: v => (v * 100).toFixed(1) + '%',
    pct0: v => Math.round(v * 100) + '%',
    usd: v => '$' + Math.round(v).toLocaleString('en-US'),
    usdK: v => '$' + Math.round(v / 1000) + 'k',
    usdM: v => '$' + (v / 1e6).toFixed(0) + 'M',
    usdB: v => '$' + (v / 1e9).toFixed(1) + 'B',
    idx: v => Math.round(v),
    plain: v => String(v)
  };

  function niceTicks(min, max, count) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    const raw = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) {
      out.push(+v.toFixed(10));
    }
    return out;
  }

  /* ------------------------------------------------------ table fallback -- */
  function buildTable(host, cfg) {
    if (!cfg.table) return;
    const wrapEl = document.createElement('div');
    wrapEl.className = 'datatable';
    wrapEl.hidden = true;
    const t = document.createElement('table');
    const head = document.createElement('thead');
    const hr = document.createElement('tr');
    cfg.table.head.forEach(h => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = h;
      hr.appendChild(th);
    });
    head.appendChild(hr);
    const body = document.createElement('tbody');
    cfg.table.rows.forEach(r => {
      const tr = document.createElement('tr');
      r.forEach((c, i) => {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.scope = 'row';
        cell.textContent = c == null ? '—' : c;
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
    t.append(head, body);
    wrapEl.appendChild(t);

    const btn = document.createElement('button');
    btn.className = 'tablebtn';
    btn.type = 'button';
    btn.textContent = 'Show data table';
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      wrapEl.hidden = !wrapEl.hidden;
      btn.setAttribute('aria-expanded', String(!wrapEl.hidden));
      btn.textContent = wrapEl.hidden ? 'Show data table' : 'Hide data table';
    });
    const head2 = host.closest('figure') && host.closest('figure').querySelector('.figure-head');
    (head2 || host.parentNode).appendChild(btn);
    host.parentNode.appendChild(wrapEl);
  }

  function buildLegend(host, series, kind) {
    if (series.length < 2) return;
    const ul = document.createElement('ul');
    ul.className = 'legend';
    series.forEach((s, i) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = 'swatch' + (kind === 'line' ? ' line' : '');
      sw.style.background = s.color || PALETTE[i % PALETTE.length];
      li.append(sw, document.createTextNode(s.name));
      ul.appendChild(li);
    });
    host.parentNode.insertBefore(ul, host.nextSibling);
  }

  /* ================================================================ LINE == */
  function line(host, cfg) {
    const W = 800, H = cfg.height || 420;
    const m = Object.assign({ t: 26, r: cfg.directLabels === false ? 22 : 116, b: 40, l: 62 }, cfg.margin);
    const xs = cfg.x, series = cfg.series;
    const fmtY = cfg.formatY || F.int;
    const fmtT = cfg.formatTip || fmtY;

    let lo = cfg.min, hi = cfg.max;
    const all = series.flatMap(s => s.values.filter(v => v != null));
    if (lo == null) lo = Math.min(...all);
    if (hi == null) hi = Math.max(...all);
    if (cfg.zero) lo = Math.min(0, lo);
    const pad = (hi - lo) * 0.08 || 1;
    if (cfg.min == null) lo -= pad;
    if (cfg.max == null) hi += pad;

    const px = i => m.l + (i / (xs.length - 1)) * (W - m.l - m.r);
    const py = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`, role: 'img',
      'aria-label': cfg.ariaLabel || cfg.title || 'line chart'
    });

    // grid + y axis
    niceTicks(lo, hi, cfg.yTicks || 5).forEach(v => {
      if (v < lo || v > hi) return;
      svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: py(v), y2: py(v), stroke: GRID, 'stroke-width': 1 }));
      const t = el('text', { x: m.l - 10, y: py(v) + 4, fill: INK3, 'font-size': 12, 'text-anchor': 'end' });
      t.textContent = fmtY(v);
      svg.appendChild(t);
    });

    // x axis labels — thin them out so they never collide
    const every = Math.ceil(xs.length / (cfg.xTicks || 8));
    xs.forEach((x, i) => {
      if (i % every && i !== xs.length - 1) return;
      const t = el('text', { x: px(i), y: H - m.b + 20, fill: INK3, 'font-size': 12, 'text-anchor': 'middle' });
      t.textContent = x;
      svg.appendChild(t);
    });
    svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: py(Math.max(lo, Math.min(hi, cfg.baseline != null ? cfg.baseline : lo))), y2: py(Math.max(lo, Math.min(hi, cfg.baseline != null ? cfg.baseline : lo))), stroke: AXIS, 'stroke-width': 1 }));

    // annotation bands (e.g. the housing crash)
    (cfg.bands || []).forEach(b => {
      const i0 = xs.indexOf(b.from), i1 = xs.indexOf(b.to);
      if (i0 < 0 || i1 < 0) return;
      svg.appendChild(el('rect', {
        x: px(i0), y: m.t, width: px(i1) - px(i0), height: H - m.t - m.b,
        fill: b.fill || 'rgba(255,203,5,0.07)'
      }));
      if (b.label) {
        const t = el('text', { x: (px(i0) + px(i1)) / 2, y: m.t + 14, fill: INK3, 'font-size': 11, 'text-anchor': 'middle' });
        t.textContent = b.label;
        svg.appendChild(t);
      }
    });

    const paths = [];
    series.forEach((s, si) => {
      const color = s.color || PALETTE[si % PALETTE.length];
      let d = '', open = false;
      s.values.forEach((v, i) => {
        if (v == null) { open = false; return; }
        d += (open ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(v).toFixed(1) + ' ';
        open = true;
      });
      const p = el('path', {
        d, fill: 'none', stroke: color, 'stroke-width': s.width || 2.5,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'stroke-dasharray': s.dashed ? '5 5' : null
      });
      svg.appendChild(p);
      paths.push(p);

      // direct label at the last real point — identity without relying on color
      if (cfg.directLabels !== false) {
        let li = -1;
        s.values.forEach((v, i) => { if (v != null) li = i; });
        if (li >= 0) {
          const t = el('text', {
            x: px(li) + 9, y: py(s.values[li]) + 4, fill: color,
            'font-size': 12, 'font-weight': 700
          });
          t.textContent = s.name;
          svg.appendChild(t);
        }
      }
      // endpoint dots
      [0, s.values.length - 1].forEach(i => {
        if (s.values[i] == null) return;
        svg.appendChild(el('circle', {
          cx: px(i), cy: py(s.values[i]), r: 4, fill: color,
          stroke: SURFACE, 'stroke-width': 2
        }));
      });
    });

    // hover layer: crosshair + shared tooltip
    const cross = el('line', { y1: m.t, y2: H - m.b, stroke: AXIS, 'stroke-width': 1, opacity: 0 });
    svg.appendChild(cross);
    const dots = series.map((s, si) => {
      const c = el('circle', {
        r: 5, fill: s.color || PALETTE[si % PALETTE.length],
        stroke: SURFACE, 'stroke-width': 2, opacity: 0
      });
      svg.appendChild(c);
      return c;
    });
    const hit = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
    svg.appendChild(hit);

    function move(ev) {
      const box = svg.getBoundingClientRect();
      const rel = (ev.clientX - box.left) / box.width * W;
      let i = Math.round((rel - m.l) / (W - m.l - m.r) * (xs.length - 1));
      i = Math.max(0, Math.min(xs.length - 1, i));
      cross.setAttribute('x1', px(i)); cross.setAttribute('x2', px(i));
      cross.setAttribute('opacity', 1);
      let html = `<div class="t-title">${cfg.tipTitle ? cfg.tipTitle(xs[i]) : xs[i]}</div>`;
      series.forEach((s, si) => {
        const v = s.values[i], c = s.color || PALETTE[si % PALETTE.length];
        if (v == null) { dots[si].setAttribute('opacity', 0); return; }
        dots[si].setAttribute('cx', px(i));
        dots[si].setAttribute('cy', py(v));
        dots[si].setAttribute('opacity', 1);
        html += `<div class="t-row"><span class="sw" style="background:${c}"></span>${s.name}<span class="v">${fmtT(v, s)}</span></div>`;
      });
      showTip(html, ev.clientX, ev.clientY);
    }
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => {
      cross.setAttribute('opacity', 0);
      dots.forEach(d => d.setAttribute('opacity', 0));
      hideTip();
    });

    host.innerHTML = '';
    host.appendChild(svg);
    buildLegend(host, series, 'line');
    buildTable(host, cfg);

    if (!reduceMotion()) {
      paths.forEach(p => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,.61,.36,1)';
      });
      const io = new IntersectionObserver((es) => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          paths.forEach((p, i) => setTimeout(() => { p.style.strokeDashoffset = 0; }, i * 140));
          io.disconnect();
        });
      }, { threshold: 0.25 });
      io.observe(host);
    }
    return svg;
  }

  /* ================================================================ BARS == */
  function bars(host, cfg) {
    const W = 800, H = cfg.height || 380;
    const m = Object.assign({ t: 22, r: 18, b: 40, l: 62 }, cfg.margin);
    const xs = cfg.x, series = cfg.series, stacked = !!cfg.stacked;
    const fmtY = cfg.formatY || F.int;

    const totals = xs.map((_, i) =>
      stacked ? series.reduce((a, s) => a + (s.values[i] || 0), 0)
              : Math.max(...series.map(s => s.values[i] || 0)));
    const hi = cfg.max != null ? cfg.max : Math.max(...totals) * 1.08;
    const lo = 0;

    const bandW = (W - m.l - m.r) / xs.length;
    const gap = 2;                       // 2px surface gap between fills
    const inner = Math.min(bandW * 0.72, 34);
    const py = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`, role: 'img',
      'aria-label': cfg.ariaLabel || cfg.title || 'bar chart'
    });
    niceTicks(lo, hi, 5).forEach(v => {
      if (v > hi) return;
      svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: py(v), y2: py(v), stroke: GRID }));
      const t = el('text', { x: m.l - 10, y: py(v) + 4, fill: INK3, 'font-size': 12, 'text-anchor': 'end' });
      t.textContent = fmtY(v);
      svg.appendChild(t);
    });

    const every = Math.ceil(xs.length / (cfg.xTicks || 8));
    const rects = [];
    xs.forEach((x, i) => {
      const cx = m.l + bandW * (i + 0.5);
      if (!(i % every) || i === xs.length - 1) {
        const t = el('text', { x: cx, y: H - m.b + 20, fill: INK3, 'font-size': 12, 'text-anchor': 'middle' });
        t.textContent = x;
        svg.appendChild(t);
      }
      let acc = 0;
      series.forEach((s, si) => {
        const v = s.values[i];
        if (v == null) return;
        const color = s.color || PALETTE[si % PALETTE.length];
        let bx, bw, by, bh;
        if (stacked) {
          bw = inner; bx = cx - bw / 2;
          by = py(acc + v); bh = Math.max(0, py(acc) - py(acc + v) - gap);
          acc += v;
        } else {
          bw = (inner - gap * (series.length - 1)) / series.length;
          bx = cx - inner / 2 + si * (bw + gap);
          by = py(v); bh = Math.max(0, py(0) - py(v));
        }
        const r = el('rect', {
          x: bx.toFixed(1), y: by.toFixed(1), width: Math.max(1, bw).toFixed(1),
          height: bh.toFixed(1), fill: color, rx: Math.min(4, bw / 2)
        });
        r._meta = { i, si, v };
        svg.appendChild(r);
        rects.push(r);
      });
    });
    svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: py(0), y2: py(0), stroke: AXIS }));

    const hit = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
    svg.appendChild(hit);
    function move(ev) {
      const box = svg.getBoundingClientRect();
      const rel = (ev.clientX - box.left) / box.width * W;
      let i = Math.floor((rel - m.l) / bandW);
      i = Math.max(0, Math.min(xs.length - 1, i));
      rects.forEach(r => r.setAttribute('opacity', r._meta.i === i ? 1 : 0.35));
      let html = `<div class="t-title">${cfg.tipTitle ? cfg.tipTitle(xs[i]) : xs[i]}</div>`;
      series.forEach((s, si) => {
        const v = s.values[i];
        if (v == null) return;
        const c = s.color || PALETTE[si % PALETTE.length];
        html += `<div class="t-row"><span class="sw" style="background:${c}"></span>${s.name}<span class="v">${(cfg.formatTip || fmtY)(v, s)}</span></div>`;
      });
      showTip(html, ev.clientX, ev.clientY);
    }
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => {
      rects.forEach(r => r.setAttribute('opacity', 1));
      hideTip();
    });

    host.innerHTML = '';
    host.appendChild(svg);
    buildLegend(host, series, 'bar');
    buildTable(host, cfg);
    return svg;
  }

  /* ============================================== DOT MATRIX (admits) ===== */
  function dotMatrix(host, cfg) {
    const cols = cfg.cols || 20;
    const total = cfg.total, filled = cfg.filled;
    const rows = Math.ceil(total / cols);
    const r = cfg.r || 5, gap = cfg.gap || 5;
    const step = r * 2 + gap;
    const W = cols * step, H = rows * step;
    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`, role: 'img',
      'aria-label': `${filled} of ${total} ${cfg.noun || 'applicants'} admitted`
    });
    for (let i = 0; i < total; i++) {
      const cx = (i % cols) * step + r + gap / 2;
      const cy = Math.floor(i / cols) * step + r + gap / 2;
      const on = i < filled;
      const c = el('circle', {
        cx, cy, r, fill: on ? (cfg.onColor || '#ffcb05') : 'none',
        stroke: on ? 'none' : (cfg.offColor || 'rgba(169,189,212,0.4)'),
        'stroke-width': 1.25
      });
      if (!reduceMotion()) {
        c.style.opacity = 0;
        c.style.transition = 'opacity .5s ease';
        c.style.transitionDelay = (i * 4) + 'ms';
      }
      svg.appendChild(c);
    }
    host.innerHTML = '';
    host.appendChild(svg);
    if (!reduceMotion()) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) {
          svg.querySelectorAll('circle').forEach(c => { c.style.opacity = 1; });
          io.disconnect();
        }
      }), { threshold: 0.2 });
      io.observe(host);
    }
    return svg;
  }

  /* ========================================= SLOPE (two-point comparison) = */
  function slope(host, cfg) {
    const W = 800, H = cfg.height || 400;
    const m = { t: 34, r: 150, b: 34, l: 150 };
    const rows = cfg.rows;
    const vals = rows.flatMap(r => [r.a, r.b]);
    const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.06;
    const py = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
    const xA = m.l, xB = W - m.r;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.ariaLabel || 'slope chart' });

    [[xA, cfg.labelA], [xB, cfg.labelB]].forEach(([x, lbl]) => {
      svg.appendChild(el('line', { x1: x, x2: x, y1: m.t - 10, y2: H - m.b + 6, stroke: AXIS }));
      const t = el('text', { x, y: m.t - 18, fill: INK, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' });
      t.textContent = lbl;
      svg.appendChild(t);
    });

    rows.forEach((r, i) => {
      const color = r.color || PALETTE[i % PALETTE.length];
      svg.appendChild(el('line', {
        x1: xA, y1: py(r.a), x2: xB, y2: py(r.b),
        stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round'
      }));
      [[xA, r.a, 'end', -12], [xB, r.b, 'start', 12]].forEach(([x, v, anchor, dx]) => {
        svg.appendChild(el('circle', { cx: x, cy: py(v), r: 5, fill: color, stroke: SURFACE, 'stroke-width': 2 }));
        const t = el('text', { x: x + dx, y: py(v) + 4, fill: INK2, 'font-size': 12, 'text-anchor': anchor });
        t.textContent = (anchor === 'end' ? r.name + '  ' : '') + (cfg.format || F.int)(v);
        if (anchor === 'end') { t.textContent = r.name + ' · ' + (cfg.format || F.int)(v); }
        svg.appendChild(t);
      });
    });
    host.innerHTML = '';
    host.appendChild(svg);
    buildTable(host, cfg);
    return svg;
  }

  global.Viz = { line, bars, dotMatrix, slope, F, PALETTE, niceTicks };
})(window);
