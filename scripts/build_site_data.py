#!/usr/bin/env python3
"""Fuse every source into one payload the site can read, plus derived metrics.

The through-line: a Troy household pays for the University of Michigan three
times -- in property values, in tuition, and in state taxes. This asks what
that household got back, per year, from 2004 to 2025.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "site" / "data" / "tsd-uofm.json"

# 2024-25 and 2025-26 lower-division tuition + required fees, taken from the
# CDS 2025-26 workbook because the IPEDS tuition series stops at AY2023-24.
# Both residencies are read off the same two columns of the same table so the
# in-state/out-of-state pair stays on one basis.
TUITION_TAIL = {2024: 18402 + 494, 2025: 19588 + 494}
TUITION_OUT_TAIL = {2024: 66602 + 494, 2025: 68953 + 494}

# U-M's own published endowment market value at June 30, from the University
# Endowment Fund Profiles; IPEDS finance has not released FY2024/FY2025 yet.
ENDOWMENT_TAIL = {2024: 19_200_000_000, 2025: 21_200_000_000}

# Michigan state operating appropriation to the Ann Arbor campus.
APPROP_TAIL = {2024: 356_600_000, 2025: 365_500_000}


def main():
    foia = json.loads((DATA / "uofm_admissions.json").read_text())
    cds = json.loads((DATA / "umich_cds.json").read_text())["years"]
    fin = json.loads((DATA / "umich_finance.json").read_text())["years"]
    tui = json.loads((DATA / "umich_tuition.json").read_text())["years"]
    hou = json.loads((DATA / "troy_housing.json").read_text())
    cpi = {int(k): v for k, v in json.loads((DATA / "cpi_u.json").read_text())["values"].items()}

    years = list(range(2004, 2026))
    rows = {r["year"]: r for r in foia["rows"] if True}
    troy = {r["year"]: r for r in foia["rows"] if r["school"] == "Troy"}
    athens = {r["year"]: r for r in foia["rows"] if r["school"] == "Athens"}
    combined = {r["year"]: r for r in foia["district_combined"]}

    series = []
    for y in years:
        c = cds.get(str(y), {})
        f = fin.get(str(y), {})
        t = tui.get(str(y), {})
        rec = {
            "year": y,
            # --- what Troy sent, and got back -------------------------------
            "troy_applied": troy[y]["applied"],
            "troy_admitted": troy[y]["admitted"],
            "troy_rate": troy[y]["rate"],
            "athens_applied": athens[y]["applied"],
            "athens_admitted": athens[y]["admitted"],
            "athens_rate": athens[y]["rate"],
            "tsd_applied": combined[y]["applied"],
            "tsd_admitted": combined[y]["admitted"],
            "tsd_rate": combined[y]["rate"],
            "colleges": {
                "Troy": troy[y]["colleges"],
                "Athens": athens[y]["colleges"],
            },
            # --- how hard the door got --------------------------------------
            "um_applied": c.get("applied"),
            "um_admitted": c.get("admitted"),
            "um_rate": c.get("rate"),
            "um_act_25": c.get("act_25"),
            "um_act_75": c.get("act_75"),
            "um_sat_25": c.get("sat_total_25"),
            "um_sat_75": c.get("sat_total_75"),
            "um_gpa_375_plus": c.get("pct_gpa_375_plus"),
            "um_avg_gpa": c.get("avg_hs_gpa"),
            # --- what it cost ------------------------------------------------
            "tuition_in_state": t.get("in_state") or TUITION_TAIL.get(y),
            "tuition_out_state": t.get("out_state") or TUITION_OUT_TAIL.get(y),
            "home_value_troy": hou["troy_combined"].get(str(y)),
            "home_value_by_zip": {z: hou["zips"][z]["annual"].get(str(y)) for z in hou["zips"]},
            # --- who paid -----------------------------------------------------
            "state_appropriation": f.get("state_appropriation") or APPROP_TAIL.get(y),
            "endowment": f.get("endowment_end") or ENDOWMENT_TAIL.get(y),
            "institutional_scholarships": f.get("institutional_scholarships"),
            "cpi": cpi.get(y),
        }
        # real (2025-dollar) versions of every money figure
        if rec["cpi"]:
            k = cpi[2025] / rec["cpi"]
            rec["cpi_factor_to_2025"] = round(k, 5)
            for src, dst in (("state_appropriation", "state_appropriation_real"),
                             ("institutional_scholarships", "institutional_scholarships_real"),
                             ("tuition_in_state", "tuition_in_state_real"),
                             ("home_value_troy", "home_value_troy_real"),
                             ("endowment", "endowment_real")):
                if rec.get(src):
                    rec[dst] = round(rec[src] * k)
        series.append(rec)

    base = series[0]

    def index(rec, key, bkey=None):
        b = base.get(bkey or key)
        v = rec.get(key)
        return round(v / b * 100, 1) if b and v else None

    for rec in series:
        rec["idx"] = {
            "home_value": index(rec, "home_value_troy"),
            "home_value_real": index(rec, "home_value_troy_real"),
            "tuition": index(rec, "tuition_in_state"),
            "tuition_real": index(rec, "tuition_in_state_real"),
            "state_appropriation_real": index(rec, "state_appropriation_real"),
            "endowment_real": index(rec, "endowment_real"),
            "scholarships_real": index(rec, "institutional_scholarships_real"),
            "tsd_admitted": index(rec, "tsd_admitted"),
            "tsd_applied": index(rec, "tsd_applied"),
            "tsd_rate": index(rec, "tsd_rate"),
            "um_applied": index(rec, "um_applied"),
        }

    # ---- the counterfactual: 2004's odds, applied to every later class ------
    base_rate = combined[2004]["rate"]
    shortfall, cum = [], 0
    for rec in series:
        would = rec["tsd_applied"] * base_rate
        gap = would - rec["tsd_admitted"]
        cum += gap
        shortfall.append({
            "year": rec["year"],
            "at_2004_odds": round(would, 1),
            "actual": rec["tsd_admitted"],
            "gap": round(gap, 1),
            "cumulative_gap": round(cum, 1),
        })

    # ---- cost of a degree measured in Troy houses ---------------------------
    for rec in series:
        if rec.get("tuition_in_state") and rec.get("home_value_troy"):
            rec["four_year_tuition"] = rec["tuition_in_state"] * 4
            rec["degree_as_pct_of_home"] = round(
                rec["four_year_tuition"] / rec["home_value_troy"] * 100, 1)

    payload = {
        "meta": {
            "title": "Troy School District -> University of Michigan, 2004-2025",
            "built_from": {
                "admissions": "U-M FOIA response #261656 (Troy High + Athens, by college)",
                "university": "U-M Common Data Sets 1998-99..2025-26 (obp.umich.edu)",
                "finance": "NCES IPEDS Finance F1A, UNITID 170976",
                "tuition": "IPEDS academic-year tuition; AY2024-25 and AY2025-26 from CDS 2025-26",
                "housing": "Zillow ZHVI, ZIP level, annual mean of monthly values",
                "prices": "BLS CPI-U (FRED CPIAUCNS), annual average",
            },
            "base_year": 2004,
            "resident_share_note": (
                "U-M Ann Arbor has the lowest in-state share of any Michigan public "
                "university: 49%, against an 80% statewide average "
                "(House Fiscal Agency, Higher Education Budget Briefing, FY2025-26)."
            ),
        },
        "series": series,
        "shortfall": shortfall,
        "housing_by_zip": hou["zips"],
        "college_key": foia["colleges"],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=1) + "\n")

    a, z = series[0], series[-1]
    print("TROY SCHOOL DISTRICT -> U-M       2004            2025          change")
    print("-" * 70)

    def line(label, k, fmt="{:,.0f}", pct=False):
        va, vz = a.get(k), z.get(k)
        if va is None or vz is None:
            print(f"{label:<28} {'-':>14} {'-':>15}")
            return
        ch = (vz / va - 1) * 100
        fa = f"{va*100:.1f}%" if pct else fmt.format(va)
        fz = f"{vz*100:.1f}%" if pct else fmt.format(vz)
        print(f"{label:<28} {fa:>14} {fz:>15} {ch:>+10.1f}%")

    line("TSD applications", "tsd_applied")
    line("TSD admits", "tsd_admitted")
    line("TSD admit rate", "tsd_rate", pct=True)
    line("U-M applications", "um_applied")
    line("U-M admit rate", "um_rate", pct=True)
    line("U-M ACT 25th pctile", "um_act_25", "{:.0f}")
    line("Troy typical home value", "home_value_troy", "${:,.0f}")
    line("  ...in 2025 dollars", "home_value_troy_real", "${:,.0f}")
    line("In-state tuition+fees", "tuition_in_state", "${:,.0f}")
    line("  ...in 2025 dollars", "tuition_in_state_real", "${:,.0f}")
    line("State approp (2025 $)", "state_appropriation_real", "${:,.0f}")
    line("Endowment (2025 $)", "endowment_real", "${:,.0f}")
    line("Inst. scholarships (2025$)", "institutional_scholarships_real", "${:,.0f}")
    print()
    print(f"Cumulative admits lost vs 2004 odds, 2005-2025: {cum:,.0f}")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
