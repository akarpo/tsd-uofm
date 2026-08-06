#!/usr/bin/env python3
"""Pull U-M Ann Arbor first-time freshman admissions from IPEDS.

Source: Urban Institute Education Data Portal (a mirror of the federal IPEDS
surveys), unitid 170976 = University of Michigan-Ann Arbor.
  admissions-enrollment  -> applications / admits / enrolled (sex=99 is total)
  admissions-requirements -> SAT/ACT percentiles, % submitting

IPEDS `year` is the fall of the entering class, matching the FOIA file's terms.
"""
import json
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "umich_ipeds.json"
UNITID = 170976
BASE = "https://educationdata.urban.org/api/v1/college-university/ipeds"


def get(path, year):
    url = f"{BASE}/{path}/{year}/?unitid={UNITID}"
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return json.load(r).get("results", [])
    except Exception as e:  # noqa: BLE001 - a missing year is expected, not fatal
        print(f"  ! {path} {year}: {e}")
        return []


def main():
    out = {}
    for year in range(2001, 2026):
        rec = {"year": year}
        for row in get("admissions-enrollment", year):
            if row.get("sex") == 99:
                rec["applied"] = row.get("number_applied")
                rec["admitted"] = row.get("number_admitted")
                rec["enrolled"] = row.get("number_enrolled_total")
        req = get("admissions-requirements", year)
        if req:
            r = req[0]
            for k in ("sat_crit_read_25_pctl", "sat_crit_read_75_pctl",
                      "sat_math_25_pctl", "sat_math_75_pctl",
                      "act_composite_25_pctl", "act_composite_75_pctl",
                      "sat_percent_submitting", "act_percent_submitting"):
                v = r.get(k)
                if v is not None and v >= 0:
                    rec[k] = v
        if rec.get("applied") and rec.get("admitted"):
            rec["rate"] = round(rec["admitted"] / rec["applied"], 5)
            out[year] = rec
            print(f"{year}: {rec['applied']:>7,} applied  {rec['admitted']:>6,} admitted  "
                  f"{rec['rate']*100:>5.1f}%  ACT {rec.get('act_composite_25_pctl','-')}-"
                  f"{rec.get('act_composite_75_pctl','-')}")
        else:
            print(f"{year}: no data")

    OUT.write_text(json.dumps({
        "source": "IPEDS (via Urban Institute Education Data Portal), UNITID 170976",
        "institution": "University of Michigan-Ann Arbor",
        "note": "year = fall term of the entering first-year class",
        "years": out,
    }, indent=2) + "\n")
    print(f"\nwrote {OUT} ({len(out)} years)")


if __name__ == "__main__":
    main()
