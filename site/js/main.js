/* ============================================================================
   Page assembly: load the payload, draw everything, wire the scrollytelling.

   Every chart here is single-axis on purpose. Where two measures have
   different units (a house price and a tuition bill), they are indexed to
   2004 = 100 and share one scale rather than being hung off two y-axes.
   ========================================================================== */
(function () {
  'use strict';

  const F = Viz.F;
  const P = Viz.PALETTE;
  const $ = s => document.querySelector(s);
  const pick = (S, k) => S.map(r => (r[k] == null ? null : r[k]));

  function statTile(n, label, sub, tone) {
    return `<div class="stat">
      <div class="n ${tone || ''}">${n}</div>
      <div class="l">${label}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    </div>`;
  }
  const chg = (a, b) => {
    const p = (b / a - 1) * 100;
    return (p >= 0 ? '+' : '') + p.toFixed(p > -10 && p < 10 ? 1 : 0) + '%';
  };

  fetch('data/tsd-uofm.json')
    .then(r => r.json())
    .then(build)
    .catch(e => {
      const h = $('#headline-stats');
      if (h) h.innerHTML = '<div class="stat"><div class="l">Could not load the dataset: ' + e + '</div></div>';
    });

  function build(D) {
    const S = D.series;
    const years = S.map(r => r.year);
    const first = S[0], last = S[S.length - 1];
    const SH = D.shortfall;

    /* ───────────────────────────────────────────────── headline stats ─── */
    $('#headline-stats').innerHTML =
      statTile('+103%', 'More applications from Troy &amp; Athens', '199 → 404 per year') +
      statTile('+9%', 'More admits', '143 → 156 per year', 'flat') +
      statTile('−46%', 'Worse odds of admission', '71.9% → 38.6%', 'down') +
      statTile('1,208', 'Admits lost against 2004 odds', 'cumulative, 2005–2025', 'down');

    /* ───────────────────────────────────── headline: admitted vs denied ─ */
    Viz.bars($('#c-headline'), {
      x: years, stacked: true, height: 400,
      series: [
        { name: 'Admitted', values: S.map(r => r.tsd_admitted), color: P[0] },
        { name: 'Not admitted', values: S.map(r => r.tsd_applied - r.tsd_admitted), color: 'rgba(169,189,212,0.28)' }
      ],
      formatY: F.int,
      tipTitle: y => 'Entering class of ' + y,
      formatTip: (v, s) => F.int(v),
      table: {
        head: ['Year', 'Applied', 'Admitted', 'Admit rate'],
        rows: S.map(r => [r.year, F.int(r.tsd_applied), F.int(r.tsd_admitted), F.pct(r.tsd_rate)])
      }
    });

    /* ───────────────────────────────────────────── act I — the schools ── */
    Viz.line($('#c-schools'), {
      x: years, height: 400, formatY: F.pct0, formatTip: F.pct,
      min: 0.25, max: 0.82,
      series: [
        { name: 'Troy High', values: pick(S, 'troy_rate'), color: P[0] },
        { name: 'Athens', values: pick(S, 'athens_rate'), color: P[1] }
      ],
      tipTitle: y => 'Class of ' + y,
      table: {
        head: ['Year', 'Troy applied', 'Troy admitted', 'Troy rate', 'Athens applied', 'Athens admitted', 'Athens rate'],
        rows: S.map(r => [r.year, r.troy_applied, r.troy_admitted, F.pct(r.troy_rate),
                          r.athens_applied, r.athens_admitted, F.pct(r.athens_rate)])
      }
    });

    Viz.line($('#c-apps'), {
      x: years, height: 340, formatY: F.int, zero: true,
      series: [
        { name: 'Troy High', values: pick(S, 'troy_applied'), color: P[0] },
        { name: 'Athens', values: pick(S, 'athens_applied'), color: P[1] }
      ],
      tipTitle: y => 'Class of ' + y
    });

    /* ─────────────────────────────────────────────── act II — the door ── */
    $('#door-stats').innerHTML =
      statTile('109,112', 'U-M first-year applications in 2025', 'from 21,293 in 2004') +
      statTile('16.4%', 'U-M admit rate in 2025', 'from 62.5% in 2004', 'down') +
      statTile('32', 'ACT 25th percentile', 'was 30 at the 75th percentile in 2004') +
      statTile('93.9%', 'of the class has a 3.75+ GPA', 'was 64% in 2007');

    Viz.line($('#c-um-volume'), {
      x: years, height: 400, formatY: v => (v / 1000) + 'k', formatTip: F.int, zero: true,
      series: [
        { name: 'Applied', values: pick(S, 'um_applied'), color: P[0] },
        { name: 'Admitted', values: pick(S, 'um_admitted'), color: P[1] }
      ],
      tipTitle: y => 'Fall ' + y,
      table: {
        head: ['Year', 'Applied', 'Admitted', 'Admit rate'],
        rows: S.map(r => [r.year, r.um_applied && F.int(r.um_applied),
                          r.um_admitted && F.int(r.um_admitted), r.um_rate && F.pct(r.um_rate)])
      }
    });

    Viz.line($('#c-act'), {
      x: years, height: 340, formatY: F.plain, formatTip: v => v + ' ACT',
      min: 24, max: 36,
      series: [
        { name: '75th percentile', values: pick(S, 'um_act_75'), color: P[0] },
        { name: '25th percentile', values: pick(S, 'um_act_25'), color: P[1] }
      ],
      tipTitle: y => 'Fall ' + y,
      table: {
        head: ['Year', 'ACT 25th', 'ACT 75th', 'SAT 25th', 'SAT 75th'],
        rows: S.map(r => [r.year, r.um_act_25, r.um_act_75, r.um_sat_25, r.um_sat_75])
      }
    });

    Viz.line($('#c-gpa'), {
      x: years, height: 300, formatY: v => v + '%', formatTip: v => v.toFixed(1) + '%',
      min: 55, max: 100, directLabels: false,
      series: [{ name: 'GPA 3.75 or above', values: pick(S, 'um_gpa_375_plus'), color: P[3] }],
      tipTitle: y => 'Fall ' + y
    });

    /* ────────────────────────────────────────── act III — the colleges ── */
    const colRate = (school, code) => S.map(r => {
      const c = r.colleges[school][code];
      return c && c.applied ? c.admitted / c.applied : null;
    });
    const colApp = (school, code) => S.map(r => {
      const c = r.colleges[school][code];
      return c ? c.applied : 0;
    });

    const sumCol = (code, key) => S.reduce((a, r) =>
      a + (r.colleges.Troy[code] ? r.colleges.Troy[code][key] : 0)
        + (r.colleges.Athens[code] ? r.colleges.Athens[code][key] : 0), 0);

    const cstat = (n, l) => `<div class="cstat"><div class="n">${n}</div><div class="l">${l}</div></div>`;
    $('#cstats-lsa').innerHTML =
      cstat('36.0%', 'Troy High LSA rate, 2025') +
      cstat('70.5%', 'the same figure in 2004') +
      cstat(F.int(sumCol('LSA', 'applied')), 'LSA applications from the district since 2004');
    $('#cstats-eng').innerHTML =
      cstat('53.2%', 'Troy High Engineering rate, 2025') +
      cstat('79', 'CoE applicants from Troy High, a record') +
      cstat(F.int(sumCol('ENG', 'applied')), 'CoE applications since 2004');
    $('#cstats-ross').innerHTML =
      cstat('30.1%', 'district Ross rate, 2017–2025') +
      cstat('246', 'Ross applicants from the district') +
      cstat('74', 'Ross offers');

    Viz.line($('#c-colleges'), {
      x: years, height: 400, formatY: F.pct0, formatTip: F.pct, min: 0.1, max: 1.0,
      series: [
        { name: 'Engineering', values: colRate('Troy', 'ENG'), color: P[2] },
        { name: 'LSA', values: colRate('Troy', 'LSA'), color: P[0] },
        { name: 'Ross', values: colRate('Troy', 'ROSS'), color: P[1] },
        { name: 'Other', values: colRate('Troy', 'OTHER'), color: P[3] }
      ],
      tipTitle: y => 'Troy High, class of ' + y,
      table: {
        head: ['Year', 'ENG applied', 'ENG admitted', 'LSA applied', 'LSA admitted', 'Ross applied', 'Ross admitted'],
        rows: S.map(r => {
          const c = r.colleges.Troy;
          return [r.year, c.ENG.applied, c.ENG.admitted, c.LSA.applied, c.LSA.admitted,
                  c.ROSS ? c.ROSS.applied : null, c.ROSS ? c.ROSS.admitted : null];
        })
      }
    });

    Viz.bars($('#c-college-mix'), {
      x: years, stacked: true, height: 360, formatY: F.int,
      series: [
        { name: 'LSA', values: colApp('Troy', 'LSA'), color: P[0] },
        { name: 'Engineering', values: colApp('Troy', 'ENG'), color: P[2] },
        { name: 'Ross', values: colApp('Troy', 'ROSS'), color: P[1] },
        { name: 'Other', values: colApp('Troy', 'OTHER'), color: P[3] }
      ],
      tipTitle: y => 'Troy High applications, ' + y
    });

    /* ─────────────────────────────────────────── act IV — what Troy pays ─ */
    $('#pays-stats').innerHTML =
      statTile('$475,748', 'Typical Troy home, 2025', 'Zillow ZHVI, four-ZIP average') +
      statTile('+56%', 'Nominal change since 2004', 'from $304,270') +
      statTile('−8%', 'Real change since 2004', 'in constant 2025 dollars', 'down') +
      statTile('+44%', 'Real change in in-state tuition', '$13,978 → $20,082 in 2025 dollars');

    const zips = Object.keys(D.housing_by_zip).sort();
    Viz.line($('#c-homes'), {
      x: years, height: 420, formatY: F.usdK, formatTip: F.usd,
      series: zips.map((z, i) => ({
        name: z + ' · ' + D.housing_by_zip[z].area.replace(' Troy', ''),
        values: S.map(r => r.home_value_by_zip[z]),
        color: P[i]
      })),
      bands: [{ from: 2007, to: 2012, label: 'housing crash', fill: 'rgba(217,89,38,0.08)' }],
      tipTitle: y => y + ' typical home value',
      margin: { r: 190 },
      table: {
        head: ['Year'].concat(zips),
        rows: S.map(r => [r.year].concat(zips.map(z => F.usd(r.home_value_by_zip[z]))))
      }
    });

    Viz.line($('#c-real'), {
      x: years, height: 360, formatY: F.idx, formatTip: v => v.toFixed(1),
      series: [
        { name: 'Troy home value (real)', values: S.map(r => r.idx.home_value_real), color: P[0] },
        { name: 'In-state tuition (real)', values: S.map(r => r.idx.tuition_real), color: P[1] }
      ],
      baseline: 100,
      tipTitle: y => y + ' (2004 = 100)'
    });

    /* precinct / ZIP crosswalk */
    $('#precinct-table').innerHTML = `
      <div class="datatable" style="margin-top:1.5rem">
        <table>
          <thead><tr>
            <th scope="col">ZIP</th><th scope="col">Area of Troy</th>
            <th scope="col">Typical home 2004</th><th scope="col">Typical home 2025</th>
            <th scope="col">Nominal change</th><th scope="col">Real change</th>
          </tr></thead>
          <tbody>${zips.map(z => {
            const a = first.home_value_by_zip[z], b = last.home_value_by_zip[z];
            const real = (b / a) / (last.cpi / first.cpi) - 1;
            return `<tr>
              <th scope="row">${z}</th>
              <td style="text-align:left">${D.housing_by_zip[z].area}</td>
              <td>${F.usd(a)}</td><td>${F.usd(b)}</td>
              <td>${chg(a, b)}</td>
              <td style="color:${real < 0 ? '#ff8a80' : '#7ee0b8'}">${(real >= 0 ? '+' : '') + (real * 100).toFixed(1)}%</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <p style="font-size:.82rem;color:var(--text-muted);margin-top:.75rem">
        Troy's 27 voting precincts (map adopted 21 April 2025) nest inside these four ZIP
        areas, but neither precinct nor ZIP lines match school-district lines exactly.
      </p>`;

    /* ────────────────────────────────────── act V — who pays for Michigan */
    $('#whopays-stats').innerHTML =
      statTile('−31%', 'Real state appropriation since 2004', '$531M → $366M in 2025 dollars', 'down') +
      statTile('49%', 'of U-M students are Michigan residents', 'lowest of any Michigan public university', 'down') +
      statTile('3.5×', 'What a non-resident pays', '$69,447 vs $20,082') +
      statTile('$21.2B', 'Endowment, 30 June 2025', 'from $4.3B in 2004');

    Viz.line($('#c-approp'), {
      x: years, height: 360, formatY: F.usdM, formatTip: F.usdM, directLabels: false,
      series: [{ name: 'State appropriation (2025 $)', values: pick(S, 'state_appropriation_real'), color: P[1] }],
      tipTitle: y => 'FY' + y,
      table: {
        head: ['Fiscal year', 'Nominal', 'Constant 2025 $'],
        rows: S.map(r => [r.year, r.state_appropriation && F.usd(r.state_appropriation),
                          r.state_appropriation_real && F.usd(r.state_appropriation_real)])
      }
    });

    Viz.line($('#c-tuition'), {
      x: years, height: 380, formatY: F.usdK, formatTip: F.usd, zero: true,
      series: [
        { name: 'Out-of-state', values: pick(S, 'tuition_out_state'), color: P[1] },
        { name: 'In-state', values: pick(S, 'tuition_in_state'), color: P[0] }
      ],
      tipTitle: y => 'Academic year ' + y + '–' + String(y + 1).slice(2),
      table: {
        head: ['Year', 'In-state', 'In-state (2025 $)', 'Out-of-state'],
        rows: S.map(r => [r.year, r.tuition_in_state && F.usd(r.tuition_in_state),
                          r.tuition_in_state_real && F.usd(r.tuition_in_state_real),
                          r.tuition_out_state && F.usd(r.tuition_out_state)])
      }
    });

    Viz.line($('#c-endow'), {
      x: years, height: 380, formatY: F.idx, formatTip: v => v.toFixed(0) + ' (2004 = 100)',
      series: [
        { name: 'Endowment (real)', values: S.map(r => r.idx.endowment_real), color: P[2] },
        { name: 'Scholarships (real)', values: S.map(r => r.idx.scholarships_real), color: P[3] },
        { name: 'State appropriation (real)', values: S.map(r => r.idx.state_appropriation_real), color: P[1] }
      ],
      baseline: 100,
      tipTitle: y => 'FY' + y,
      margin: { r: 180 },
      table: {
        head: ['Fiscal year', 'Endowment', 'Institutional scholarships', 'State appropriation'],
        rows: S.map(r => [r.year, r.endowment && F.usdB(r.endowment),
                          r.institutional_scholarships && F.usdM(r.institutional_scholarships),
                          r.state_appropriation && F.usdM(r.state_appropriation)])
      }
    });

    /* ───────────────────────────────────────────── act VI — the ledger ── */
    const lastWith = k => {
      for (let i = S.length - 1; i >= 0; i--) if (S[i][k] != null) return S[i][k];
      return null;
    };
    // Tone is deliberately NOT "did the number rise" — it is "is this better or
    // worse for a Troy household". A rise in applications is neither.
    const LED = [
      ['Applications from Troy &amp; Athens', F.int(first.tsd_applied), F.int(last.tsd_applied), 'n'],
      ['Admits from Troy &amp; Athens', F.int(first.tsd_admitted), F.int(last.tsd_admitted), 'n'],
      ['Admit rate', F.pct(first.tsd_rate), F.pct(last.tsd_rate), 'bad'],
      ['U-M applications', F.int(first.um_applied), F.int(last.um_applied), 'n'],
      ['U-M admit rate', F.pct(first.um_rate), F.pct(last.um_rate), 'bad'],
      ['ACT 25th percentile', first.um_act_25, last.um_act_25, 'bad'],
      ['Typical Troy home', F.usd(first.home_value_troy), F.usd(last.home_value_troy), 'n'],
      ['&nbsp;&nbsp;…in constant 2025 $', F.usd(first.home_value_troy_real), F.usd(last.home_value_troy_real), 'bad'],
      ['In-state tuition &amp; fees', F.usd(first.tuition_in_state), F.usd(last.tuition_in_state), 'bad'],
      ['&nbsp;&nbsp;…in constant 2025 $', F.usd(first.tuition_in_state_real), F.usd(last.tuition_in_state_real), 'bad'],
      ['Out-of-state tuition &amp; fees', F.usd(first.tuition_out_state), F.usd(last.tuition_out_state), 'n'],
      ['State appropriation (2025 $)', F.usdM(first.state_appropriation_real), F.usdM(last.state_appropriation_real), 'bad'],
      ['U-M endowment', F.usdB(first.endowment), F.usdB(last.endowment), 'n'],
      // IPEDS has not released FY2024 finance yet, so this row ends at the last
      // year the source actually publishes rather than being carried forward.
      ['Institutional scholarships (2025 $)', F.usdM(first.institutional_scholarships_real),
       F.usdM(lastWith('institutional_scholarships_real')), 'good']
    ];
    const numOf = s => parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
    $('#the-ledger').innerHTML =
      `<div class="row head"><div>Measure</div><div class="v">2004</div><div class="v">2025</div><div class="chg">Change</div></div>` +
      LED.map(([l, a, b, tone]) => {
        const p = (numOf(b) / numOf(a) - 1) * 100;
        const cls = tone === 'bad' ? 'up' : tone === 'good' ? 'down' : 'n';
        return `<div class="row">
          <div class="lbl">${l}</div><div class="v">${a}</div><div class="v">${b}</div>
          <div class="chg ${cls}">${(p >= 0 ? '+' : '') + p.toFixed(0)}%</div></div>`;
      }).join('') +
      `<div class="row total"><div class="lbl">Admits forgone vs 2004 odds, 2005–2025</div>
        <div class="v"></div><div class="v"></div><div class="chg up">1,208</div></div>` +
      `<div class="row" style="grid-template-columns:1fr;font-size:.78rem;color:var(--text-muted)">
        <div>Colour marks direction of impact on a Troy household, not direction of the number:
        <span style="color:#ff8a80;font-weight:700">worse</span> ·
        <span style="color:#7ee0b8;font-weight:700">better</span> ·
        <span style="color:var(--text-secondary);font-weight:700">context</span>.</div></div>`;

    Viz.line($('#c-index'), {
      x: years, height: 460, formatY: F.idx, formatTip: v => v.toFixed(0),
      baseline: 100, margin: { r: 200 },
      series: [
        { name: 'U-M endowment (real)', values: S.map(r => r.idx.endowment_real), color: P[2] },
        { name: 'Tuition (real)', values: S.map(r => r.idx.tuition_real), color: P[1] },
        { name: 'Troy home (real)', values: S.map(r => r.idx.home_value_real), color: P[0] },
        { name: 'TSD admits', values: S.map(r => r.idx.tsd_admitted), color: P[4] },
        { name: 'Admit rate', values: S.map(r => r.idx.tsd_rate), color: P[3] },
        { name: 'State approp. (real)', values: S.map(r => r.idx.state_appropriation_real), color: P[5] }
      ],
      tipTitle: y => y + ' (2004 = 100)'
    });

    Viz.line($('#c-shortfall'), {
      x: years, height: 380, formatY: F.int, formatTip: v => v.toFixed(0) + ' admits',
      zero: true,
      series: [
        { name: 'At 2004 odds', values: SH.map(r => r.at_2004_odds), color: P[3], dashed: true },
        { name: 'Actual admits', values: SH.map(r => r.actual), color: P[0] }
      ],
      tipTitle: y => 'Class of ' + y,
      table: {
        head: ['Year', 'At 2004 odds', 'Actual', 'Gap', 'Cumulative gap'],
        rows: SH.map(r => [r.year, r.at_2004_odds.toFixed(0), r.actual, r.gap.toFixed(0), r.cumulative_gap.toFixed(0)])
      }
    });

    /* ──────────────────────────────────────────────── full data table ─── */
    const COLS = [
      ['Year', r => r.year],
      ['Troy applied', r => r.troy_applied], ['Troy admitted', r => r.troy_admitted],
      ['Troy rate', r => F.pct(r.troy_rate)],
      ['Athens applied', r => r.athens_applied], ['Athens admitted', r => r.athens_admitted],
      ['Athens rate', r => F.pct(r.athens_rate)],
      ['TSD applied', r => r.tsd_applied], ['TSD admitted', r => r.tsd_admitted],
      ['TSD rate', r => F.pct(r.tsd_rate)],
      ['U-M applied', r => r.um_applied && F.int(r.um_applied)],
      ['U-M admitted', r => r.um_admitted && F.int(r.um_admitted)],
      ['U-M rate', r => r.um_rate && F.pct(r.um_rate)],
      ['ACT 25th', r => r.um_act_25], ['ACT 75th', r => r.um_act_75],
      ['SAT 25th', r => r.um_sat_25], ['SAT 75th', r => r.um_sat_75],
      ['GPA 3.75+', r => r.um_gpa_375_plus && r.um_gpa_375_plus + '%'],
      ['In-state tuition', r => r.tuition_in_state && F.usd(r.tuition_in_state)],
      ['…2025 $', r => r.tuition_in_state_real && F.usd(r.tuition_in_state_real)],
      ['Out-of-state', r => r.tuition_out_state && F.usd(r.tuition_out_state)],
      ['Troy home', r => r.home_value_troy && F.usd(r.home_value_troy)],
      ['…2025 $', r => r.home_value_troy_real && F.usd(r.home_value_troy_real)],
      ['48083', r => F.usd(r.home_value_by_zip['48083'])],
      ['48084', r => F.usd(r.home_value_by_zip['48084'])],
      ['48085', r => F.usd(r.home_value_by_zip['48085'])],
      ['48098', r => F.usd(r.home_value_by_zip['48098'])],
      ['State approp.', r => r.state_appropriation && F.usdM(r.state_appropriation)],
      ['…2025 $', r => r.state_appropriation_real && F.usdM(r.state_appropriation_real)],
      ['Endowment', r => r.endowment && F.usdB(r.endowment)],
      ['Scholarships', r => r.institutional_scholarships && F.usdM(r.institutional_scholarships)],
      ['Cum. admits lost', (r, i) => SH[i].cumulative_gap.toFixed(0)]
    ];
    $('#full-table').innerHTML =
      '<table><thead><tr>' + COLS.map(c => `<th scope="col">${c[0]}</th>`).join('') +
      '</tr></thead><tbody>' +
      S.map((r, i) => '<tr>' + COLS.map((c, ci) => {
        const v = c[1](r, i);
        return ci === 0 ? `<th scope="row">${v}</th>` : `<td>${v == null ? '—' : v}</td>`;
      }).join('') + '</tr>').join('') +
      '</tbody></table>';
    $('#full-table').hidden = false;

    /* ────────────────────────────────────────────────────── the artwork ─ */
    $('#art-lsa').innerHTML = Art.lsa();
    $('#art-eng').innerHTML = Art.eng();
    $('#art-ross').innerHTML = Art.ross();
    Art.heroCanvas($('#hero-canvas'));

    /* scrollytelling: swap the school panel as each step comes into view */
    const STEP_YEARS = [2004, 2010, 2016, 2025];
    const art = $('#school-art');
    const recFor = y => {
      const r = S.find(x => x.year === y);
      return {
        year: y,
        troy: { applied: r.troy_applied, admitted: r.troy_admitted, rate: r.troy_rate },
        athens: { applied: r.athens_applied, admitted: r.athens_admitted, rate: r.athens_rate }
      };
    };
    let current = -1;
    const render = i => {
      if (i === current) return;
      current = i;
      art.innerHTML = Art.schoolPanel(recFor(STEP_YEARS[i]));
    };
    render(0);

    const steps = [...document.querySelectorAll('#school-scrolly .step')];
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        steps.forEach(s => s.classList.toggle('active', s === e.target));
        render(+e.target.dataset.step);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => io.observe(s));
  }
})();
