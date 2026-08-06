#!/usr/bin/env python3
"""Troy home values by ZIP, from Zillow's public ZIP-level research files.

ZHVI is the typical value of a home in the 33rd-67th percentile range -- not a
median sale price. It is used here because Zillow's ZIP-level *median sale
price* series does not reach back to 2004 (for Troy's ZIPs it starts in 2026),
while ZHVI runs monthly from 2000.

Troy's four ZIPs are the practical stand-in for Troy School District geography.
They are not the district: seven school districts reach into the City of Troy,
and TSD covers most of the city but not all of it.

The source CSV is ~129 MB and gitignored; this script downloads it on demand.
"""
import csv
import json
import statistics
import urllib.request
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
ZHVI_URL = ("https://files.zillowstatic.com/research/public_csvs/zhvi/"
            "Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv")

ZIP_AREA = {
    "48098": "North Troy (NW)",
    "48085": "North Troy (NE)",
    "48084": "West/Central Troy",
    "48083": "Southeast Troy",
}
# Minimum months before a year is treated as observed rather than partial.
MIN_MONTHS = 6


def main():
    src = DATA / "zhvi_zip.csv"
    if not src.exists():
        print(f"downloading {ZHVI_URL} ...")
        urllib.request.urlretrieve(ZHVI_URL, src)

    rows = {}
    with open(src, newline="") as fh:
        reader = csv.reader(fh)
        header = next(reader)
        date_cols = [(i, h) for i, h in enumerate(header) if h[:2] == "20" and "-" in h]
        for row in reader:
            zipcode = row[2]
            if zipcode in ZIP_AREA:
                rows[zipcode] = {
                    "city": row[6], "county": row[8],
                    "series": {h: (float(row[i]) if row[i] else None) for i, h in date_cols},
                }

    missing = set(ZIP_AREA) - set(rows)
    if missing:
        raise SystemExit(f"FATAL: Zillow file has no rows for {sorted(missing)}")

    out = {}
    for zipcode, rec in rows.items():
        annual = defaultdict(list)
        for date, val in rec["series"].items():
            if val is not None:
                annual[int(date[:4])].append(val)
        out[zipcode] = {
            "area": ZIP_AREA[zipcode],
            "city": rec["city"],
            "county": rec["county"],
            "annual": {y: round(statistics.mean(v))
                       for y, v in sorted(annual.items()) if len(v) >= MIN_MONTHS},
        }

    years = sorted(set().union(*[set(v["annual"]) for v in out.values()]))
    combined = {y: round(statistics.mean([out[z]["annual"][y] for z in out if y in out[z]["annual"]]))
                for y in years}

    (DATA / "troy_housing.json").write_text(json.dumps({
        "source": "Zillow Home Value Index (ZHVI), all homes, smoothed & seasonally adjusted, "
                  "ZIP level; annual mean of monthly values",
        "note": "ZHVI is the typical value of a home in the 33rd-67th percentile range, not a "
                "sale-price median. Troy's four ZIPs approximate Troy School District geography "
                "but do not match it: seven school districts reach into the City of Troy.",
        "zips": out,
        "troy_combined": combined,
    }, indent=2) + "\n")

    b, e = 2004, 2025
    print(f"{'zip':>6} {'area':<20} {b:>10} {e:>10}   change")
    for z in sorted(out):
        a = out[z]["annual"]
        print(f"{z:>6} {ZIP_AREA[z]:<20} ${a[b]:>9,} ${a[e]:>9,}  {(a[e]/a[b]-1)*100:+6.1f}%")
    print(f"{'':>6} {'Troy overall':<20} ${combined[b]:>9,} ${combined[e]:>9,}  "
          f"{(combined[e]/combined[b]-1)*100:+6.1f}%")
    print(f"\nwrote {DATA / 'troy_housing.json'}")


if __name__ == "__main__":
    main()
