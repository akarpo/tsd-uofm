# Data Sources

Every source behind the site: what it is, how it is fetched, and what bites.

All bulk sources are gitignored — they total ~300 MB and every one of them is
re-fetchable by a script in `scripts/`. What is committed is the FOIA PDF (27 KB,
the one irreplaceable input) and the derived JSON.

---

## 1. U-M FOIA response #261656 — the admissions data

| | |
|---|---|
| **File** | `data/FOIA_261656_source.pdf` (committed) |
| **What** | First-year applications and admissions to U-M Ann Arbor from **Troy High** and **Athens**, entering terms 2004–2025, itemised for ENG / LSA / ROSS |
| **Extract** | `pdftotext -layout` → `data/foia_261656_raw.txt` |
| **Parser** | `scripts/parse_foia.py` |

The only input that cannot be re-downloaded, which is why the PDF itself is in the
repo. 44 school-year rows; 6,473 applications; 3,443 admits.

---

## 2. U-M Common Data Sets — the university's own figures

| | |
|---|---|
| **Index** | <https://obp.umich.edu/campus-statistics/common-data-set/> |
| **Files** | `https://obp.umich.edu/wp-content/uploads/pubdata/cds/{stem}.pdf` |
| **Coverage** | 1998–99 … 2025–26 (28 workbooks) |
| **Parser** | `scripts/parse_cds.py` |

File-name stems are **not** uniform:

```
cds_1998-1999_umaa  …  cds_2022-2023_umaa
CDS_2023-24_UMAA_10-25-24
CDS_2024-25_UMAA
cds_2025-26_umaa
```

### Gotchas

- **The HTML index 403s** ordinary fetches (both `WebFetch` and `curl`), but the
  **PDFs themselves serve fine** with a browser User-Agent. The stem list was
  recovered from a Wayback snapshot of the index page.
- Sections used: **C1** (applied/admitted/enrolled), **C2** (waitlist),
  **C9** (SAT/ACT percentiles), **C11/C12** (HS GPA), **G** (tuition, 2024-25 onward).
- Format drift across 28 years is severe — see `METHODOLOGY.md §3` for the full trap list.

---

## 3. IPEDS — finance

| | |
|---|---|
| **Files** | `https://nces.ed.gov/ipeds/datacenter/data/F{AB}{CD}_F1A.zip` |
| **Form** | F1A (public institutions, GASB) |
| **UNITID** | 170976 (University of Michigan-Ann Arbor) |
| **Coverage** | FY2004 (`F0304`) … FY2023 (`F2223`) |
| **Builder** | `scripts/build_finance.py` |

### Gotchas

- **The naming is the fiscal-year *pair*, not a single year.** `F2223_F1A.zip` is
  fiscal 2022-23. `F2324_F1A.zip` **404s** — FY2024 finance is not released yet.
- **Column headers carry trailing spaces** — the endowment column is literally
  `"F1H02   "`. An exact-match lookup silently drops it, which is how the endowment
  series went missing for 16 of 20 years before the fix. Every header is now
  stripped and upper-cased on read.
- `*_rv.csv` (revised) files ship alongside the originals; the builder prefers the
  revised one for a year when both exist.
- The **Urban Institute mirror** (`educationdata.urban.org`) is convenient and
  well-labelled, but its finance endpoint **stops at 2017** for this unitid. It was
  used to *identify* the raw column names by reverse-matching values, then dropped
  in favour of the NCES files.

---

## 4. IPEDS — admissions and tuition (via Urban Institute)

| | |
|---|---|
| **API** | `https://educationdata.urban.org/api/v1/college-university/ipeds/{endpoint}/{year}/?unitid=170976` |
| **Endpoints** | `admissions-enrollment`, `admissions-requirements`, `academic-year-tuition` |
| **Key** | none required |
| **Scripts** | `scripts/fetch_ipeds.py` |

- `admissions-enrollment`: `sex=99` is the total row.
- `academic-year-tuition`: `level_of_study=1` is undergraduate; `tuition_type` **2** is
  in-state, **4** is out-of-state. Coverage runs to AY2023-24.
- The admissions series is used as an **independent cross-check** on the CDS parse,
  not as the published figure. The two agree exactly for 2001–2014.

---

## 5. Zillow — housing

| | |
|---|---|
| **File** | `https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` |
| **Size** | ~129 MB (gitignored) |
| **ZIPs** | 48083, 48084, 48085, 48098 |
| **Builder** | `scripts/build_housing.py` |

- Column layout: `RegionID, SizeRank, RegionName, RegionType, StateName, State, City,
  Metro, CountyName,` then one column per month from 2000-01. **`RegionName` is the
  ZIP and it is column 3**, not column 2.
- **ZHVI is a typical-value index, not a median sale price.** Zillow's ZIP-level
  median-sale-price file (`Zip_median_sale_price_uc_sfrcondo_sm_month.csv`) was
  downloaded and rejected: for Troy's ZIPs it only begins in 2026.

---

## 6. BLS CPI-U — constant dollars

| | |
|---|---|
| **File** | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCNS` |
| **Series** | CPI-U, US city average, all items, **not** seasonally adjusted |
| **Script** | `scripts/fetch_cpi.py` |

- FRED's CSV endpoint needs **no API key**; the BLS public API v1 caps at 10 years
  per request and was dropped for that reason.
- **October 2025 is blank.** BLS never published it — collection was suspended
  during the autumn 2025 federal shutdown. 2025 is therefore the average of its 11
  published months, recorded in `data/cpi_u.json`.

---

## 7. Michigan House Fiscal Agency — context

| | |
|---|---|
| **Doc** | `https://www.house.mi.gov/HFA/PDF/Briefings/HigherEd_BudgetBriefing_fy25-26.pdf` |

Source of the single most explanatory figure on the site: **U-M Ann Arbor has the
lowest in-state share of any Michigan public university — 49%, against an 80%
statewide average.** The document's tables are images, so figures were read from
its narrative text, not scraped.

---

## 8. City of Troy — precincts

| | |
|---|---|
| **Page** | <https://troymi.gov/departments/city_clerk/precinct_locations.php> |

Troy's precinct map was **revised 21 April 2025, reducing 37 precincts to 27**.
Used for the geographic caveat only — no precinct-level price is published. See
`METHODOLOGY.md §5`.

---

## 9. Brand and identity

| Source | Used for |
|---|---|
| <https://brand.umich.edu/design-resources/colors/> | 16 official U-M colour values |
| <https://brand.umich.edu/design-resources/logos/> | the official block M outline |
| <https://www.troyathletics.org/> | Troy High colours, sampled from the mark |
| <https://www.redhawkathletics.org/> | Athens colours, sampled from the mark |

- `brand.umich.edu` **403s** `curl` and `WebFetch` on HTML pages but serves static
  assets (SVG, PNG) fine with a browser User-Agent and a `Referer`. The colour
  table was read from a live browser session.
- Both athletics sites are JS-rendered with **zero `<img>` elements**; their marks
  are served from `/icon`.
- The logo files were used to **sample colour only**. The site draws its own marks.
  Exact values in `DESIGN.md §1`.

---

## 10. Music

Six tracks, fetched with `yt-dlp -x --audio-format mp3` into `site/audio/` (~21 MB
committed, all files well under Cloudflare Pages' 25 MB per-file limit):

| # | Track | Artist |
|---|---|---|
| 1 | Let's Go Blue | Michigan Marching Band |
| 2 | Temptation | Michigan Marching Band |
| 3 | M Fanfare | Michigan Marching Band |
| 4 | The Victors | Michigan Marching Band |
| 5 | Bond Opener: Goldfinger / Dr. No | Michigan Marching Band |
| 6 | Tangled up in Blue (Wembley Stadium, July 1984) | Bob Dylan |

Track 6 is what the site is named for.
