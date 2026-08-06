# Scripts

Plain Python 3 — **no third-party dependencies**. Everything uses the standard
library (`csv`, `json`, `urllib`, `re`, `pathlib`, `statistics`). Run from the repo
root; all paths resolve relative to the script's own location, so there are no
hard-coded user paths.

External tools used once each: `pdftotext` (poppler) to extract the FOIA table, and
`yt-dlp` + `ffmpeg` to fetch the audio.

---

## Pipeline (run order)

| # | Script | Reads | Writes |
|---|---|---|---|
| 1 | `parse_foia.py` | `data/foia_261656_raw.txt` | `data/uofm_admissions.json` |
| 2 | `parse_cds.py` | `data/cds/*.txt` (28 workbooks) | `data/umich_cds.json` |
| 3 | `fetch_ipeds.py` | Urban Institute API | `data/umich_ipeds.json`, `data/umich_tuition.json` |
| 4 | `build_finance.py` | `data/ipeds_fin/f*_f1a*.csv` | `data/umich_finance.json` |
| 5 | `fetch_cpi.py` | FRED | `data/cpi_u.json` |
| 6 | `build_housing.py` | Zillow ZHVI CSV | `data/troy_housing.json` |
| 7 | `build_site_data.py` | all of the above | **`site/data/tsd-uofm.json`** |
| 8 | `make_table.py` | `site/data/tsd-uofm.json` | `site/data/year_by_year.csv`, `data/year_by_year.md` |

```bash
pdftotext -layout data/FOIA_261656_source.pdf data/foia_261656_raw.txt
python3 scripts/parse_foia.py
python3 scripts/parse_cds.py
python3 scripts/fetch_ipeds.py
python3 scripts/build_finance.py
python3 scripts/fetch_cpi.py
python3 scripts/build_housing.py      # downloads ~129 MB on first run
python3 scripts/build_site_data.py
python3 scripts/make_table.py
```

The pipeline is **deterministic** — re-running it end to end reproduces
`site/data/tsd-uofm.json` byte-for-byte.

---

## Fetching the bulk inputs

`fetch_cpi.py` and `build_housing.py` download what they need. Two sets of files
must be fetched with `curl` first; both loops are recorded in the relevant script's
docstring and reproduced here.

**Common Data Sets** → `data/cds/`

```bash
mkdir -p data/cds && cd data/cds
for f in cds_1998-1999_umaa cds_1999-2000_umaa cds_2000-2001_umaa cds_2001-2002_umaa \
         cds_2002-2003_umaa cds_2003-2004_umaa cds_2004-2005_umaa cds_2005-2006_umaa \
         cds_2006-2007_umaa cds_2007-2008_umaa cds_2008-2009_umaa cds_2009-2010_umaa \
         cds_2010-2011_umaa cds_2011-2012_umaa cds_2012-2013_umaa cds_2013-2014_umaa \
         cds_2014-2015_umaa cds_2015-2016_umaa cds_2016-2017_umaa cds_2017-2018_umaa \
         cds_2018-2019_umaa cds_2019-2020_umaa cds_2020-2021_umaa cds_2021-2022_umaa \
         cds_2022-2023_umaa CDS_2023-24_UMAA_10-25-24 CDS_2024-25_UMAA cds_2025-26_umaa; do
  curl -s -A "Mozilla/5.0" -o "$f.pdf" \
    "https://obp.umich.edu/wp-content/uploads/pubdata/cds/$f.pdf"
done
for f in *.pdf; do pdftotext -layout "$f" "${f%.pdf}.txt"; done
```

**IPEDS finance** → `data/ipeds_fin/`

```bash
mkdir -p data/ipeds_fin && cd data/ipeds_fin
for y in 0304 0405 0506 0607 0708 0809 0910 1011 1112 1213 1314 \
         1415 1516 1617 1718 1819 1920 2021 2122 2223; do
  curl -s -A "Mozilla/5.0" -o "F${y}_F1A.zip" \
    "https://nces.ed.gov/ipeds/datacenter/data/F${y}_F1A.zip"
done
for z in *.zip; do unzip -o -q "$z"; done
```

*(`F2324_F1A.zip` 404s — FY2024 finance is not released yet.)*

**Audio** → `site/audio/`

```bash
yt-dlp -x --audio-format mp3 --audio-quality 192K --embed-thumbnail --add-metadata \
  -o "audio_raw/%(title)s.%(ext)s" "<url>"
```

---

## What each script does

### `parse_foia.py`
Reads the layout text of the FOIA table into 44 school-year rows. Emits a derived
`OTHER` college bucket (school total − itemised ENG/LSA/ROSS). **Exits non-zero** on
any unparsed line, duplicate block, missing year, `admitted > applied`, itemised sum
exceeding the total, or ROSS appearing before 2017.

### `parse_cds.py`
The hardest script in the repo — 28 years of a format that never held still. Matches
on families of substrings, strips the workbooks' visible `sum = N` formula
annotations and the `800 to 1600` "Possible Scores" column before reading values,
then **re-uses those stated sums to validate its own output**. Prints a per-year
validation column; all eleven years that publish a stated total reconcile exactly.
See `METHODOLOGY.md §3`.

### `fetch_ipeds.py`
Pulls the IPEDS admissions series (applications, admits, enrolled, SAT/ACT
percentiles) and academic-year tuition from the Urban Institute mirror. The
admissions half exists to **cross-check** the CDS parse, not to feed the site.

### `build_finance.py`
Reads the raw NCES F1A CSVs for UNITID 170976 → state appropriation, endowment,
institutional scholarships, tuition. Prefers `*_rv.csv` when present. **Strips and
upper-cases every CSV header** — several years ship them with trailing spaces
(`"F1H02   "`), which otherwise drops the endowment column silently. Converts to
constant 2025 dollars.

### `fetch_cpi.py`
FRED `CPIAUCNS` → annual averages. Requires ≥ 11 monthly values for a year to count,
and records how many were used — because **October 2025 does not exist**.

### `build_housing.py`
Downloads Zillow's ZIP-level ZHVI file on first run, filters to Troy's four ZIPs,
averages to annual figures (≥ 6 months required), and emits a four-ZIP mean as the
"Troy overall" series. **Exits non-zero** if any of the four ZIPs is missing from
the file.

### `build_site_data.py`
The fuse point. Joins all sources on year, converts every money figure to constant
2025 dollars, indexes everything to 2004 = 100, computes the counterfactual
(1,208 admits forgone) and the degree-as-share-of-a-house measure, and writes the
single payload the page reads. Tail constants for years the public sources have not
yet released are declared at the top of the file, each with a comment saying where
it came from.

### `make_table.py`
Emits the full year-by-year record three ways: a transposed console view (22 years
fit as columns), `site/data/year_by_year.csv` for download, and a Markdown extract
for the repo. **Blanks stay blank** — a gap in the source is never interpolated.

---

## Front-end modules

Not part of the pipeline, but the other half of the repo. No build step, no
bundler, no framework.

| File | Purpose |
|---|---|
| `site/js/charts.js` | SVG chart engine — line (crosshair + shared tooltip, direct labels, draw-on-scroll), stacked/grouped bar, dot matrix, slope. Builds the accessible table view for any chart given one. |
| `site/js/art.js` | All scenery: the two school panels, the three campus drawings, the hero field canvas, and the shimmering "Blue" clip-path effect. |
| `site/js/main.js` | Loads the payload, configures every chart, builds the stat tiles, ledger and full table, wires the scrollytelling observer. |
| `site/js/player.js` | Six-track player with a Web Audio `AnalyserNode` spectrum visualiser. |

Design rules those files follow are in `DESIGN.md`.
