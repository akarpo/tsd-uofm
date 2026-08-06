#!/usr/bin/env python3
"""Annual-average CPI-U, used to put every dollar figure in constant 2025 terms.

FRED series CPIAUCNS is the BLS CPI-U for all urban consumers, US city average,
all items, not seasonally adjusted -- the series you deflate annual figures with.
Fetched as CSV because it needs no API key.

One wrinkle worth knowing about: BLS never published an October 2025 index
(collection was suspended during the autumn 2025 federal shutdown), so 2025 is
the average of its eleven published months. That is recorded in the output
rather than silently patched, and the year is only accepted with >= 11 months.
"""
import csv
import json
import urllib.request
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCNS"


def main():
    raw = DATA / "cpi_raw.csv"
    urllib.request.urlretrieve(URL, raw)

    by_year = defaultdict(list)
    with open(raw) as fh:
        for row in csv.DictReader(fh):
            year = int(row["observation_date"][:4])
            val = row["CPIAUCNS"]
            if val not in ("", "."):
                by_year[year].append(float(val))

    values, months = {}, {}
    for year, vals in by_year.items():
        if 2000 <= year <= 2025 and len(vals) >= 11:
            values[year] = round(sum(vals) / len(vals), 4)
            months[year] = len(vals)

    (DATA / "cpi_u.json").write_text(json.dumps({
        "source": "BLS CPI-U, US city average, all items, not seasonally adjusted (FRED series CPIAUCNS)",
        "method": "annual average of published monthly values",
        "caveat": "BLS never published an October 2025 CPI (collection was suspended during "
                  "the autumn 2025 federal shutdown), so 2025 is the average of its 11 "
                  "published months.",
        "months_used": months,
        "values": values,
    }, indent=2) + "\n")

    lo, hi = min(values), max(values)
    print(f"CPI-U annual averages {lo}-{hi} ({len(values)} years)")
    for y in (2004, 2010, 2015, 2020, 2025):
        if y in values:
            print(f"  {y}  {values[y]:>9.3f}  ({months[y]} months)")
    print(f"\nA {lo} dollar needs ${values[hi] / values[lo]:.2f} in {hi} to buy the same thing.")


if __name__ == "__main__":
    main()
