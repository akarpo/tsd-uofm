#!/usr/bin/env python3
"""Emit the full year-by-year table: console view, CSV, and Markdown.

Every column is sourced; blanks are left blank rather than interpolated, so a
gap in the record stays visible as a gap.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "site" / "data" / "tsd-uofm.json").read_text())
S = D["series"]
SHORT = {r["year"]: r for r in D["shortfall"]}

COLS = [
    ("year",                     "Year",                    "{:d}",       None),
    ("troy_applied",             "Troy High applied",            "{:,.0f}",    None),
    ("troy_admitted",            "Troy High admitted",           "{:,.0f}",    None),
    ("troy_rate",                "Troy High rate",               "{:.1%}",     None),
    ("athens_applied",           "Athens applied",          "{:,.0f}",    None),
    ("athens_admitted",          "Athens admitted",         "{:,.0f}",    None),
    ("athens_rate",              "Athens rate",             "{:.1%}",     None),
    ("tsd_applied",              "TSD applied",             "{:,.0f}",    None),
    ("tsd_admitted",             "TSD admitted",            "{:,.0f}",    None),
    ("tsd_rate",                 "TSD rate",                "{:.1%}",     None),
    ("um_applied",               "U-M applied",             "{:,.0f}",    None),
    ("um_admitted",              "U-M admitted",            "{:,.0f}",    None),
    ("um_rate",                  "U-M rate",                "{:.1%}",     None),
    ("um_act_25",                "ACT 25th",                "{:.0f}",     None),
    ("um_act_75",                "ACT 75th",                "{:.0f}",     None),
    ("um_sat_25",                "SAT 25th",                "{:.0f}",     None),
    ("um_sat_75",                "SAT 75th",                "{:.0f}",     None),
    ("um_gpa_375_plus",          "% GPA 3.75+",             "{:.1f}",     None),
    ("um_avg_gpa",               "Avg HS GPA",              "{:.2f}",     None),
    ("tuition_in_state",         "In-state tuition+fees",   "${:,.0f}",   None),
    ("tuition_in_state_real",    "  ...2025$",              "${:,.0f}",   None),
    ("tuition_out_state",        "Out-of-state tuition",    "${:,.0f}",   None),
    ("home_value_troy",          "Troy home value",         "${:,.0f}",   None),
    ("home_value_troy_real",     "  ...2025$",              "${:,.0f}",   None),
    ("state_appropriation",      "State appropriation",     "${:,.0f}",   None),
    ("state_appropriation_real", "  ...2025$",              "${:,.0f}",   None),
    ("endowment",                "Endowment",               "${:,.0f}",   None),
    ("endowment_real",           "  ...2025$",              "${:,.0f}",   None),
    ("institutional_scholarships", "Inst. scholarships",    "${:,.0f}",   None),
    ("institutional_scholarships_real", "  ...2025$",       "${:,.0f}",   None),
    ("cpi",                      "CPI-U",                   "{:.1f}",     None),
]
ZIPS = ["48083", "48084", "48085", "48098"]


def fmt(v, f):
    return "" if v is None else f.format(v)


def main():
    # ---- console: transposed so 22 years fit as columns ---------------------
    years = [r["year"] for r in S]
    print("YEAR-BY-YEAR RECORD, 2004-2025".center(len(years) * 9 + 26))
    print()
    for key, label, f, _ in COLS[1:]:
        cells = "".join(f"{fmt(r.get(key), f):>9}" for r in S)
        print(f"{label:<25}{cells}")
    for z in ZIPS:
        cells = "".join(f"{fmt(r['home_value_by_zip'].get(z), '${:,.0f}'):>9}" for r in S)
        print(f"{'Home value ' + z:<25}{cells}")
    cells = "".join(f"{fmt(SHORT[r['year']]['gap'], '{:.0f}'):>9}" for r in S)
    print(f"{'Admits lost vs 2004 odds':<25}{cells}")
    cells = "".join(f"{fmt(SHORT[r['year']]['cumulative_gap'], '{:.0f}'):>9}" for r in S)
    print(f"{'  ...cumulative':<25}{cells}")
    print()
    print("Header row = " + "  ".join(str(y) for y in years))

    # ---- CSV ----------------------------------------------------------------
    out = ROOT / "site" / "data" / "year_by_year.csv"
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh)
        head = [label.strip() for _, label, _, _ in COLS]
        head += [f"Home value {z}" for z in ZIPS]
        head += ["Admits at 2004 odds", "Admits lost vs 2004 odds", "Cumulative admits lost"]
        w.writerow(head)
        for r in S:
            row = [r.get(k) for k, _, _, _ in COLS]
            row += [r["home_value_by_zip"].get(z) for z in ZIPS]
            sh = SHORT[r["year"]]
            row += [sh["at_2004_odds"], sh["gap"], sh["cumulative_gap"]]
            w.writerow(row)
    print(f"\nwrote {out}")

    # ---- Markdown (for the repo README) -------------------------------------
    md = ROOT / "data" / "year_by_year.md"
    keep = ["year", "tsd_applied", "tsd_admitted", "tsd_rate", "um_applied", "um_rate",
            "um_act_25", "tuition_in_state", "home_value_troy",
            "state_appropriation_real", "endowment", "institutional_scholarships"]
    lookup = {k: (lbl, f) for k, lbl, f, _ in COLS}
    lines = ["| " + " | ".join(lookup[k][0].strip() for k in keep) + " |",
             "|" + "---|" * len(keep)]
    for r in S:
        lines.append("| " + " | ".join(fmt(r.get(k), lookup[k][1]) or "—" for k in keep) + " |")
    md.write_text("\n".join(lines) + "\n")
    print(f"wrote {md}")


if __name__ == "__main__":
    main()
