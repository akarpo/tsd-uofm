# Changelog

All work to date was completed in a single session, **2026-08-05 → 2026-08-06**.
Versions map to the git history.

---

## v1.0 — 2026-08-06

### Data

- Parsed **U-M FOIA #261656** — Troy High and Athens applications and admissions to
  U-M Ann Arbor by college, entering terms 2004–2025. 44 school-year rows, 6,473
  applications, 3,443 admits.
- Parsed **28 U-M Common Data Sets** (1998–99 … 2025–26) for applications, admits,
  SAT/ACT percentiles and HS GPA. Parser validates itself against each workbook's
  own printed column totals; **all 11 years that publish one reconcile exactly**,
  and the pre-2015 years independently match IPEDS.
- Built the money series from **NCES IPEDS finance form F1A** (UNITID 170976),
  FY2004–FY2023: state appropriation, endowment, institutional scholarships,
  tuition. Extended endowment and appropriations to FY2024–25 from U-M's published
  Endowment Fund Profiles and the state budget.
- Built **Troy housing** from Zillow ZHVI at ZIP level (48083/84/85/98), 2000–2026.
- Built **CPI-U** from FRED `CPIAUCNS` for constant-2025-dollar conversion.
- Fused everything into `site/data/tsd-uofm.json` plus a **22-year × ~30-column**
  year-by-year table published as CSV.

### Findings

| | 2004 | 2025 | change |
|---|---|---|---|
| TSD applications to U-M | 199 | 404 | +103% |
| TSD admits | 143 | 156 | +9% |
| TSD admit rate | 71.9% | 38.6% | −46% |
| U-M applications | 21,293 | 109,112 | +412% |
| U-M admit rate | 62.5% | 16.4% | −74% |
| U-M ACT 25th percentile | 26 | 32 | +6 pts |
| Class with HS GPA ≥ 3.75 | 64% (2007) | 93.9% | +30 pts |
| In-state tuition & fees | $8,201 | $20,082 | +145% (+44% real) |
| Typical Troy home | $304,270 | $475,748 | +56% (**−8% real**) |
| State appropriation (2025 $) | $531M | $366M | **−31%** |
| U-M endowment | $4.3B | $21.2B | +393% |
| Institutional scholarships (2025 $) | $289M | $661M (FY23) | +129% |

Counterfactual: at 2004's odds the district would have produced **1,208 more
admits** across 2005–2025.

### Site

- Seven-act scrollytelling page: headline, the two schools, the door, three
  campuses, what Troy pays, who pays for Michigan, the ledger — plus the full table
  and a sources section.
- Dependency-free SVG chart engine (line, stacked bar, dot matrix, slope) with
  crosshair tooltips, direct labels, draw-on-scroll and a table view per chart.
- Original SVG scenery: the two high schools; **Burton Tower & Rackham** (Central);
  **Lurie Tower & the Wave Field** (North); the **Ross Winter Garden**.
- Hero: U-M's official block M, a perspective football-field canvas, and "Blue" as
  a shimmering clip-path filled with drifting campus objects.
- Six-track player with a Web Audio spectrum visualiser.
- Two-palette colour system — validated marks for data, official U-M and school
  values for identity. See `DESIGN.md §1`.

### Tooling

- Eight standard-library-only Python scripts; the pipeline is deterministic and
  reproduces the payload byte-for-byte.
- Bulk sources (~300 MB) gitignored and re-fetchable; the FOIA PDF is committed.

### Deployment

- Public repo `akarpo/tsd-uofm`; Git-connected Cloudflare Pages project `tsd-uofm`
  created via the API after the dashboard flow proved unautomatable.
- Custom domain `tsd-uofm.karpowitsch.org` attached, CNAME created, certificate active.

### Documentation

`README`, `PROMPT_HISTORY`, `METHODOLOGY`, `DATA_SOURCES`, `SCRIPTS`, `DESIGN`,
`DEPLOYMENT`, `CHANGELOG`.

---

## Bugs found and fixed during the build

Ten corrections, each of which changed a number or a claim on the page. Full detail
in `PROMPT_HISTORY.md`; the four caught by the stated-total check are the ones worth
remembering, because internal consistency would never have surfaced them:

1. Men's/women's application totals swapped in some CDS years.
2. "Unknown sex" applicants dropped (off by 2 in 2022/2023).
3. `800 to 1600` "Possible Scores" column read as the SAT 75th percentile.
4. Instruction prose read as a data row (`…in fall 2007` → applications = 2007).
5. Unrelated `sum =` annotations triggering false mismatches.
6. Endowment missing 16 of 20 years — CSV headers carry trailing spaces.
7. A dual-axis chart, replaced with a stacked bar.
8. Ledger colour meaning "the number went up" rather than "worse for a household".
9. A caption describing a chart element that no longer existed.
10. A premature `dig` caching NXDOMAIN and making a live site look dead.

---

## Open items

- **Admits per graduating class.** Everything is currently per *applicant*.
  Normalising by TSD senior-class size would convert the story to a per-capita rate
  — the more honest denominator for a taxpayer argument. MiSchoolData enrolment data
  is available and this is a small addition.
- **Institutional scholarships FY2024–25** — fill when IPEDS releases FY2024 finance
  (`F2324_F1A.zip` currently 404s).
- **HS GPA 2004–2006** — not published in those CDS years; would need another source.
- **True precinct-level home values** — needs parcel-level sales joined to the 2025
  precinct polygons. The ZIP stand-in is documented as such in `METHODOLOGY.md §5`.
- **Enrolment vs. admits.** The FOIA gives offers. Yield would sharpen the "what did
  Troy actually get" question and would require a separate request.
- **Peer-district comparison.** Troy against Northville, Novi, Rochester, Ann Arbor
  would show whether this is a Troy story or a Michigan story. Probably the latter,
  which is worth demonstrating rather than asserting.

## Reproducibility notes

- No nondeterminism in the pipeline: no timestamps, no randomness, no network
  ordering effects. Re-running end to end reproduces `site/data/tsd-uofm.json`
  byte-for-byte (verified by md5).
- Figures that come from sources not yet published (FY2024–25 endowment and
  appropriations, AY2024–25 and AY2025–26 tuition) are declared as named constants
  at the top of `build_site_data.py`, each with a comment naming its source, so they
  are easy to find and replace when the public series catch up.
