# Methodology

How every number on the site is derived, what is checked against what, and where
the record has holes.

End-to-end: **FOIA PDF → 28 Common Data Sets → IPEDS finance → Zillow → CPI → one
JSON payload → the page.**

---

## 1. The admissions data (the FOIA)

`data/FOIA_261656_source.pdf` is the University of Michigan's response to FOIA
request **#261656**. It is a four-page table, one block per school-year:

```
2019 Troy High School Total     205   103
 ENG                             50    28
 LSA                            120    59
 ROSS                            25    10
```

`parse_foia.py` reads the `pdftotext -layout` output and produces 44 school-year
rows (2 schools × 22 years).

**What the columns mean.** The school **Total** row is all-university. ENG, LSA
and ROSS are the only colleges the university itemised. Their sum is always less
than the total, so the remainder is emitted as a derived **`OTHER`** bucket — every
other U-M school and college (Nursing, Kinesiology, Music/Theatre & Dance, Art &
Design, Architecture, Information, Public Policy, and so on). `OTHER` is a
residual, not a reported figure, and is labelled that way on the site.

**ROSS appears only from 2017**, when the university began itemising preferred
admission separately. Before that its applicants are inside `OTHER`.

**Validation.** The parser refuses to finish if any of these fail:

- all 22 years present for both schools, no duplicate blocks
- admitted ≤ applied, at school level and per college
- itemised ENG+LSA+ROSS ≤ the school total
- ROSS present iff year ≥ 2017
- every line in the file parses (an unrecognised line is fatal, not skipped)

## 2. What the FOIA is *not*

Three limits that constrain every claim built on it:

- It covers applications **from these two high schools**, which is not the same as
  applications from residents of the district. A TSD resident attending a private
  school or one of the other six districts that reach into Troy is not here.
- Admits are **offers**, not enrolments. Some admitted students go elsewhere.
- It is applications, so a student who applied to two colleges may appear twice in
  the itemised rows but once in the school total.

## 3. The university's own figures (Common Data Sets)

Applications, admits, test-score percentiles and GPA distributions come from
**U-M's Common Data Sets, 1998–99 through 2025–26** — 28 workbooks, parsed by
`parse_cds.py`.

Twenty-eight years of CDS do not share a format. The same figure is variously
"Total first-time, first-year (freshman) men who applied", "Total applications by
men", "Total men who applied for first-time, first-year admission", "Total offers
to men", and "Total first-time, first-year males who applied". So the parser
matches on *families of substrings* rather than fixed line shapes.

### The self-check that makes this trustworthy

The workbooks are exported spreadsheets, and several carry their own visible
formula annotations:

```
Total first-time, first-year (freshman) women who applied     23,994   sum = 51,761
```

That `sum = 51,761` is **the source stating its own column total**. The parser
strips it before reading the value, then keeps it and asserts the computed total
against it. **All eleven years that publish a stated total reconcile exactly**, and
the pre-2015 years independently match IPEDS.

That check is not decoration. It caught four real bugs that internal consistency
alone would never have flagged — see `PROMPT_HISTORY.md` "Corrections". The
general lesson: *a parser can be perfectly self-consistent and still silently
wrong; reconcile against a total the source prints for itself.*

### Traps specific to these workbooks

| Trap | Effect if missed |
|---|---|
| `sum = N` annotations | Read as the row's value (women's applications become the column total) |
| "women"/"female" contain "men"/"male" | Women's row lands in the men's bucket |
| "Possible Scores" column, written both `800-1600` and `800 to 1600` | SAT 75th percentile reads as a flat 1600 |
| 50th-percentile column added in later years | Taking "the last two numbers" grabs 50th+75th |
| Instruction prose above the table | `…enrolled in Fall 2007.` parses as applications = 2007 |
| C11 GPA split into "4.0" + "3.75 and 3.99" from 2019, and "**between** 3.75 and 3.99" from 2023 | The 3.75+ series just stops |
| 2024-25 puts men / women / total on one row | Row ignored entirely |

## 4. The money

### State appropriation, endowment, scholarships

From the **NCES IPEDS finance survey, form F1A** (public/GASB institutions),
UNITID 170976, fiscal years 2004–2023:

| Field | Column |
|---|---|
| State appropriation | `F1B11` |
| Endowment, end of fiscal year | `F1H02` |
| Institutional grants, restricted | `F1E05` |
| Institutional grants, unrestricted | `F1E06` |
| Total student aid | `F1E07` |
| Tuition & fees, net | `F1B01` |
| Tuition discounts & allowances | `F1E08` |

Institutional scholarships = `F1E05 + F1E06`. Gross tuition = `F1B01 + F1E08`.
Column identities were confirmed by reverse-matching against the Urban Institute's
labelled mirror of the same rows.

**Year convention.** File `F{AB}{CD}_F1A` is fiscal year 20AB–20CD. U-M's fiscal
year ends 30 June, so `f1516` is the year ending 30 Jun 2016 and is keyed **FY2016**.
Anchored against U-M's published June-30 endowment values: IPEDS `f1516` gives
$9.60B against U-M's reported $9.74B for 6/30/2016; `f2223` gives $17.63B against
$17.9B for 6/30/2023. IPEDS uses a slightly narrower endowment definition but
tracks the same year.

**FY2024–25** are not yet released by IPEDS. Endowment for those years comes from
U-M's own University Endowment Fund Profiles ($19.2B and $21.2B); appropriations
from the state budget. Institutional scholarships **stop at FY2023** and are shown
as a gap rather than carried forward.

### Tuition

IPEDS academic-year tuition and required fees, full-time undergraduate, 2004–2023.
AY2024–25 and AY2025–26 are read from the CDS 2025–26 workbook. Resident and
non-resident are taken off **the same two columns of the same table**, so the pair
stays on one basis — a detail that matters, because the CDS reports lower- and
upper-division rates separately and mixing them would fabricate a jump.

### Constant dollars

BLS **CPI-U**, US city average, all items, not seasonally adjusted (FRED
`CPIAUCNS`), annual average of monthly values, rebased to 2025.

**2025 is the average of eleven months.** BLS never published an October 2025
index — collection was suspended during the autumn 2025 federal shutdown. That is
recorded in `data/cpi_u.json` rather than silently patched, and the loader only
accepts a year with ≥ 11 months.

A 2004 dollar needs **$1.70** in 2025 to buy the same thing.

## 5. Housing

**Zillow Home Value Index (ZHVI)**, all homes, smoothed and seasonally adjusted, at
ZIP level for **48083, 48084, 48085, 48098**, averaged to annual figures (a year is
kept only with ≥ 6 monthly observations).

**ZHVI is not a median sale price.** It is the typical value of a home in the
33rd–67th percentile range. It is used because Zillow's ZIP-level median-sale-price
series does not reach back to 2004 — for Troy's ZIPs it begins in 2026. The site
labels it "typical home value" throughout, never "median sale price".

**The precinct question, answered honestly.** The request was for values by TSD
voting precinct. That cannot be done cleanly from public data:

- Troy adopted a **new precinct map on 21 April 2025**, cutting **37 precincts to 27**.
- Precinct boundaries do not follow ZIP boundaries.
- Neither follows school-district boundaries: **seven school districts** reach into
  the City of Troy. TSD covers most of the city but not all of it, and some Troy
  addresses are zoned to Avondale, Birmingham, Bloomfield Hills, Royal Oak,
  Lamphere or Warren Consolidated.

So the site reports **ZIP-level values as the closest defensible stand-in**, states
that the 27 precincts nest inside these four ZIP areas without matching them, and
does not present a precinct-level price. Getting a true precinct figure would need
parcel-level sales joined to precinct polygons — a different project.

## 6. Derived measures

### Indexing

Where two series have different units — a house price and a tuition bill — both are
indexed to **2004 = 100** and share one axis. **No chart on this site has two
y-axes.** A dual axis can be tuned to show almost any relationship, so it is
excluded by rule; see `DESIGN.md §2`.

### The counterfactual

Hold the district's 2004 admit rate (71.9%) fixed and run every later applicant
pool through it:

```
would_have_been(y) = applications(y) × 0.71877
gap(y)             = would_have_been(y) − actual_admits(y)
cumulative         = Σ gap(y), 2005…2025  =  1,208
```

**This is a counterfactual, not a forecast.** Had Michigan admitted at 2004 rates it
would have admitted differently *everywhere*, not only in Troy — the admitted class
would have been far larger, which is precisely what did not happen. The number
measures the size of the change, not a debt owed.

### The verdict

Deliberately stated as **"fewer"** — not fewer in raw count (admits rose 9%) but
fewer *per applicant, per dollar of house, per dollar of tuition, and per
taxpayer*. Both halves are shown so a reader can disagree with the framing while
still having the numbers.

## 7. Fairness

The site carries the counterweight in the same section as the accusation:

- U-M's institutional scholarship spending is **up 129% in real terms**
  ($289M → $661M in 2025 dollars).
- From autumn 2025 the **Go Blue Guarantee** covers full tuition for in-state
  families earning under $125,000.
- So an admitted Troy student today may well pay less than one admitted in 2004.

The problem the data documents is **admission**, not affordability, and the page
says so explicitly.

## 8. Known gaps

Left blank on the site rather than interpolated, so a hole in the record stays
visible as a hole:

| Series | Missing | Why |
|---|---|---|
| % of class with HS GPA ≥ 3.75 | 2004–2006 | U-M did not publish it in those CDS years |
| Average HS GPA | 2004–2018 | Reported only from CDS 2019-20 |
| Institutional scholarships | FY2024–25 | IPEDS has not released FY2024 finance |
| SAT percentiles | none | complete for all 22 years after the parser fixes |
| Test scores 2021–2023 | — | present, but reflect **only submitters** during the test-optional period |
