# Tangled up in Blue

**Troy School District → University of Michigan, 2004–2025.**
A scrollytelling site built on a FOIA release of U-M admissions data for Troy High
and Athens, set against Troy home values, tuition, Michigan's
state appropriation and the U-M endowment.

Live: <https://tsd-uofm.karpowitsch.org>

---

## The finding

Between 2004 and 2025 the two Troy School District high schools **doubled** the
number of applications they sent to Ann Arbor and got back **9% more admits**. The
admit rate fell from 71.9% to 38.6%.

| | 2004 | 2025 | change |
|---|---|---|---|
| TSD applications to U-M | 199 | 404 | +103% |
| TSD admits | 143 | 156 | +9% |
| TSD admit rate | 71.9% | 38.6% | −46% |
| U-M applications | 21,293 | 109,112 | +412% |
| U-M admit rate | 62.5% | 16.4% | −74% |
| U-M ACT 25th percentile | 26 | 32 | +6 pts |
| In-state tuition & fees | $8,201 | $20,082 | +145% (+44% real) |
| Typical Troy home | $304,270 | $475,748 | +56% (**−8% real**) |
| State appropriation to U-M | $531M | $366M | **−31%** (constant 2025 $) |
| U-M endowment | $4.3B | $21.2B | +393% |

Held at 2004's odds, the district would have produced **1,208 more admits** across
2005–2025 than it actually did.

Two things cut against the simple reading, and the site says both: U-M's own
institutional scholarship spending is up **129% in real terms**, and from autumn
2025 the Go Blue Guarantee covers full tuition for in-state families under
$125,000. The problem the data documents is admission, not affordability.

Full year-by-year record: [`data/year_by_year.md`](data/year_by_year.md),
[`site/data/year_by_year.csv`](site/data/year_by_year.csv).

## Sources

| What | Where |
|---|---|
| Admissions by school and college, 2004–2025 | U-M **FOIA response #261656** (`data/FOIA_261656_source.pdf`) |
| U-M applications, admits, test scores, GPA | [U-M Common Data Sets](https://obp.umich.edu/campus-statistics/common-data-set/), 1998–99 … 2025–26 (28 workbooks) |
| State appropriation, endowment, scholarships | [NCES IPEDS](https://nces.ed.gov/ipeds/datacenter/) finance form F1A, UNITID 170976 |
| Tuition | IPEDS academic-year tuition; AY2024–25 and AY2025–26 from CDS 2025–26 |
| Home values | [Zillow ZHVI](https://www.zillow.com/research/data/), ZIP level (48083/48084/48085/48098) |
| Inflation | BLS CPI-U (FRED `CPIAUCNS`), annual average |
| Precincts | City of Troy Clerk — 2025 map, 37 → 27 precincts |
| U-M colours | [U-M Brand & Visual Identity](https://brand.umich.edu/design-resources/colors/) |

## Building the data

Bulk sources are gitignored; every script re-fetches what it needs.

```bash
pdftotext -layout data/FOIA_261656_source.pdf data/foia_261656_raw.txt
python3 scripts/parse_foia.py       # -> data/uofm_admissions.json
python3 scripts/parse_cds.py        # 28 Common Data Sets -> data/umich_cds.json
python3 scripts/fetch_ipeds.py      # IPEDS admissions series (independent cross-check)
python3 scripts/build_finance.py    # IPEDS F1A -> appropriation / endowment / scholarships
python3 scripts/fetch_cpi.py        # FRED CPIAUCNS -> data/cpi_u.json
python3 scripts/build_housing.py    # Zillow ZHVI -> data/troy_housing.json (downloads 129 MB)
python3 scripts/build_site_data.py  # fuse everything -> site/data/tsd-uofm.json
python3 scripts/make_table.py       # year-by-year CSV + Markdown
```

`fetch_cpi.py` and `build_housing.py` download what they need. `parse_cds.py`
needs the 28 CDS PDFs and `build_finance.py` needs the IPEDS F1A files; the
`curl` loops that fetch both are recorded in those scripts' docstrings.

### On trusting the parse

Twenty-eight years of Common Data Sets do not share a format. The parser matches
on families of substrings rather than fixed lines, and — where a workbook prints
its own column total as a `sum = N` annotation — **checks the parse against that
stated total**. All eleven years that publish one reconcile exactly, and the
pre-2015 years independently match IPEDS. That check is what caught the
"unknown sex" applicant rows, the `800 to 1600` possible-score column being read
as a 75th percentile, and prose above the table being read as a data row.

## Site

Static; no build step. `site/` deploys as-is to Cloudflare Pages.

```
site/
  index.html
  css/style.css
  js/charts.js   SVG chart engine (line, stacked bar, dot matrix, slope)
  js/art.js      hand-drawn SVG scenery + hero canvas
  js/main.js     data loading, chart config, scrollytelling
  js/player.js   marching-band player + Web Audio spectrum visualiser
  data/          the JSON payload and the CSV
  audio/         six tracks
```

### Colour

U-M's official brand hues carry the site's *identity* — Maize `#FFCB05`, Blue
`#00274C`, Ross Orange `#D86018`, Taubman Teal `#00B2A9`, Arboretum Blue
`#2F65A7`, Wave Field Green `#A5A508`. School colours were sampled from each
school's own athletics mark: Troy High `#CFD0D2` / `#000000`, Athens `#C20F2F` /
`#B4A169` / `#000000`.

Chart marks use a **separate, validated categorical palette**. Several of the
brand colours cannot encode data honestly: Wave Field Green sits outside the dark
lightness band and is indistinguishable from Ross Orange under deuteranopia
(ΔE 6.3), Arboretum Blue lands at 2.75:1 against the navy chart surface, and the
schools' silver is achromatic. Identity and encoding are kept separate on
purpose.

## Music

Michigan Marching Band — *Let's Go Blue*, *Temptation*, *M Fanfare*, *The
Victors*, the Bond opener (*Goldfinger / Dr. No*) — and Bob Dylan, *Tangled up in
Blue*, live at Wembley Stadium, July 1984, which the site is named for.

## Caveats

The FOIA covers applications *from these two high schools*, which is not the same
as applications from district residents. Admit counts are offers, not enrolments.
Test-score percentiles for 2021–2023 cover only submitters during the
test-optional period. Seven school districts reach into the City of Troy, so
ZIP-level home values approximate Troy School District rather than matching it.
And 1,208 is a counterfactual, not a forecast.

---

Built from public records. Not affiliated with, endorsed by, or speaking for the
University of Michigan, Troy School District, Troy High or Athens. All trademarks belong to their owners.
