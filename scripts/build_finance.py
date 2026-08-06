#!/usr/bin/env python3
"""Build the U-M Ann Arbor money series from raw IPEDS finance files.

Files are F{AB}{CD}_F1A.csv = the GASB finance form for fiscal year 20AB-20CD.
U-M's fiscal year ends June 30, so f1516 is the year ending 30 Jun 2016 and is
keyed here as FY2016. That was confirmed against U-M's published June-30
endowment values (IPEDS f1516 F1H02 = $9.60B vs U-M's reported $9.74B for
6/30/2016; f2223 = $17.63B vs $17.9B for 6/30/2023) -- IPEDS uses a slightly
narrower endowment definition but tracks the same year.

Column map (verified by reverse-matching against the Urban Institute's labelled
mirror of the same rows):
  F1B11  state appropriations
  F1B01  tuition & fees, net of discounts
  F1E08  discounts & allowances applied to tuition  (gross = F1B01 + F1E08)
  F1E05  institutional grants, restricted     }  sum = institutional
  F1E06  institutional grants, unrestricted   }  scholarships & fellowships
  F1E07  total student aid passing through the institution
  F1E01  Pell grants
  F1H02  endowment market value, end of fiscal year
Prefers the *_rv.csv (revised) file for a year when one exists.
"""
import csv
import json
import re
from pathlib import Path

FIN = Path(__file__).resolve().parent.parent / "data" / "ipeds_fin"
DATA = Path(__file__).resolve().parent.parent / "data"
UNITID = "170976"

COLS = {
    "state_appropriation": "F1B11",
    "tuition_fees_net": "F1B01",
    "tuition_discounts": "F1E08",
    "inst_grants_restricted": "F1E05",
    "inst_grants_unrestricted": "F1E06",
    "student_aid_total": "F1E07",
    "pell": "F1E01",
    "endowment_end": "F1H02",
    "endowment_begin": "F1H01",
}


def num(v):
    if v is None or v == "":
        return None
    v = v.strip().replace(",", "")
    try:
        return int(float(v))
    except ValueError:
        return None


def main():
    # revised file wins over the original for the same year
    by_year = {}
    for path in sorted(FIN.glob("f*_f1a*.csv")):
        m = re.match(r"f(\d{2})(\d{2})_f1a(_rv)?\.csv", path.name)
        if not m:
            continue
        fy = 2000 + int(m.group(2))
        revised = bool(m.group(3))
        if fy in by_year and by_year[fy][1] and not revised:
            continue  # keep the revised one
        by_year[fy] = (path, revised)

    out = {}
    for fy, (path, revised) in sorted(by_year.items()):
        with open(path, newline="", encoding="latin-1") as f:
            for raw in csv.DictReader(f):
                # Several years ship headers with trailing spaces ("F1H02   "),
                # which silently drops the endowment column on an exact lookup.
                row = {(k or "").strip().upper(): v for k, v in raw.items()}
                if row.get("UNITID") != UNITID:
                    continue
                rec = {}
                for name, col in COLS.items():
                    v = num(row.get(col))
                    if v is not None:
                        rec[name] = v
                if "inst_grants_restricted" in rec and "inst_grants_unrestricted" in rec:
                    rec["institutional_scholarships"] = (
                        rec["inst_grants_restricted"] + rec["inst_grants_unrestricted"])
                if "tuition_fees_net" in rec and "tuition_discounts" in rec:
                    rec["tuition_fees_gross"] = rec["tuition_fees_net"] + rec["tuition_discounts"]
                rec["_file"] = path.name
                rec["_revised"] = revised
                out[fy] = rec
                break

    cpi = {int(k): v for k, v in json.loads((DATA / "cpi_u.json").read_text())["values"].items()}
    base = 2025

    print(f"{'FY':>5} {'state approp':>13} {'in ' + str(base) + '$':>13} "
          f"{'endowment':>11} {'inst. scholarships':>19} {'in ' + str(base) + '$':>13}")
    print("-" * 80)
    for fy in sorted(out):
        r = out[fy]
        sa, en, sc = (r.get("state_appropriation"), r.get("endowment_end"),
                      r.get("institutional_scholarships"))
        f = cpi[base] / cpi[fy] if fy in cpi else None
        r["cpi_factor_to_2025"] = round(f, 5) if f else None
        if sa and f:
            r["state_appropriation_real2025"] = round(sa * f)
        if sc and f:
            r["institutional_scholarships_real2025"] = round(sc * f)
        print(f"{fy:>5} {('$%.1fM' % (sa/1e6)) if sa else '-':>13} "
              f"{('$%.1fM' % (sa*f/1e6)) if sa and f else '-':>13} "
              f"{('$%.2fB' % (en/1e9)) if en else '-':>11} "
              f"{('$%.1fM' % (sc/1e6)) if sc else '-':>19} "
              f"{('$%.1fM' % (sc*f/1e6)) if sc and f else '-':>13}")

    (DATA / "umich_finance.json").write_text(json.dumps({
        "source": "NCES IPEDS Finance survey, form F1A (public/GASB institutions), UNITID 170976",
        "files": "https://nces.ed.gov/ipeds/datacenter/data/F{AB}{CD}_F1A.zip",
        "year_convention": "Keyed by the fiscal year ending June 30 (file f1516 -> FY2016).",
        "real_dollars": "Constant 2025 dollars using annual-average CPI-U (see cpi_u.json).",
        "columns": COLS,
        "years": out,
    }, indent=2) + "\n")
    print(f"\nwrote {DATA/'umich_finance.json'} ({len(out)} fiscal years)")


if __name__ == "__main__":
    main()
