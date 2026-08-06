#!/usr/bin/env python3
"""Parse U-M Ann Arbor Common Data Sets (1998-99 .. 2025-26) into one JSON series.

These are U-M's own published figures, so they beat the IPEDS mirror wherever
both exist. The wording drifts a lot across 28 years -- "men who applied",
"Total applications by men", "Total offers to men", "Total men offered",
"Total first-time, first-year males who applied" -- so each field is matched on
a family of substrings rather than a fixed line format.

Two traps the layout text sets:
  * "women"/"female" contain "men"/"male", so the longer token is always tested
    first or the women's row lands in the men's bucket.
  * The spreadsheets carry visible "sum = 59,886" formula annotations and a
    "Possible Scores" column ("800-1600"). Both are stripped before reading a
    value -- and the sums are then re-used as the source's own stated totals to
    validate the parse against.
"""
import json
import re
import sys
from pathlib import Path

CDS_DIR = Path(__file__).resolve().parent.parent / "data" / "cds"
OUT = Path(__file__).resolve().parent.parent / "data" / "umich_cds.json"

SUM_RE = re.compile(r"sum\s*=\s*([\d,]+)", re.I)
# The "Possible Scores" column is written both ways across years: "800-1600"
# and "800 to 1600". Both must go or they become the 75th percentile.
RANGE_RE = re.compile(r"\b\d{1,4}\s*(?:-|to)\s*\d{1,4}\b", re.I)
PCT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%")


def clean(line):
    """Drop formula annotations, percent parentheticals and score-scale ranges."""
    s = SUM_RE.sub(" ", line)
    s = RANGE_RE.sub(" ", s)
    s = re.sub(r"\(\s*\d+(?:\.\d+)?\s*%[^)]*\)?", " ", s)
    s = PCT_RE.sub(" ", s)
    return s


def nums(line):
    return [int(n.replace(",", "")) for n in re.findall(r"\b\d[\d,]*\b", clean(line))]


def sex_of(low):
    """Which column a C1 row belongs to. Order matters: female/women first."""
    if "unknown" in low:
        return None
    if "women" in low or "female" in low:
        return "women"
    if "men" in low or "male" in low:
        return "men"
    return "total"


def fall_year(stem):
    """cds_2015-2016_umaa -> 2015 ; CDS_2023-24_UMAA_10-25-24 -> 2023"""
    m = re.search(r"(\d{4})-(\d{2,4})", stem)
    return int(m.group(1)) if m else None


APPLIED = ("who applied", "applications by")
ADMITTED = ("were admitted", "offers to", "offered first-time", "offered admission")


def parse_file(path):
    text = path.read_text(errors="replace")
    rec = {}
    stated_sums = []
    seen_pctile_50 = False

    in_c1 = False
    for line in text.splitlines():
        low = line.lower()

        # Only trust "sum = N" annotations found inside the C1/C2 block. Other
        # sections carry their own ("sum of questions B7, B8 and B9"), and
        # matching against those flagged good years as mismatches.
        if re.match(r"\s*C1\b", line) or ("who applied" in low and "first" in low):
            in_c1 = True
        elif re.match(r"\s*(C3|D1|D2)\b", line):
            in_c1 = False
        if in_c1:
            for m in SUM_RE.finditer(line):
                stated_sums.append(int(m.group(1).replace(",", "")))
        if "50th percentile" in low:
            seen_pctile_50 = True

        # ---------------- C1: applied / admitted / enrolled ------------------
        # Every real C1 data row begins "Total ..." once the "C1" gutter label
        # is stripped. Requiring that keeps the instruction prose above the
        # table ("...enrolled in fall 2007. Include early decision...") from
        # being read as a data row with 2007 as its value.
        body = re.sub(r"^\s*C1\b\s*", "", line).strip()
        is_c1_row = body.lower().startswith("total") and (
            "first-time" in low or "first year" in low or "freshman" in low)
        if is_c1_row and "enrolled" not in low and "waiting list" not in low:
            n = nums(line)
            field = ("applied" if any(k in low for k in APPLIED)
                     else "admitted" if any(k in low for k in ADMITTED) else None)
            if field:
                sex = sex_of(low)
                if len(n) == 3 and sex == "total":
                    # 2024-25 layout puts men / women / total on one row.
                    rec.setdefault(f"{field}_men", n[0])
                    rec.setdefault(f"{field}_women", n[1])
                    rec.setdefault(f"{field}_stated_total", n[2])
                elif len(n) == 1:
                    if sex in ("men", "women"):
                        rec.setdefault(f"{field}_{sex}", n[0])
                    elif sex == "total":
                        rec.setdefault(f"{field}_stated_total", n[0])
                    elif "unknown" in low:
                        rec.setdefault(f"{field}_unknown", n[0])

        # full-time + part-time enrolled, totals row only
        if "who enrolled" in low and sex_of(low) == "total":
            n = nums(line)
            if len(n) == 1:
                key = "enrolled_pt" if "part-time" in low else "enrolled_ft"
                rec.setdefault(key, n[0])

        # ---------------- C2: waitlist ---------------------------------------
        if "offered a place on" in low and "wait" in low:
            n = nums(line)
            if len(n) == 1:
                rec.setdefault("wl_offered", n[0])
        if "accepting a place on the wait" in low:
            n = nums(line)
            if len(n) == 1:
                rec.setdefault("wl_accepted", n[0])
        if re.search(r"wait[- ]?listed students admitted", low):
            n = nums(line)
            if len(n) == 1:
                rec.setdefault("wl_admitted", n[0])

        # ---------------- C9: test scores ------------------------------------
        if "submitting sat" in low:
            m = PCT_RE.search(line)
            if m:
                rec.setdefault("pct_submitting_sat", float(m.group(1)))
        if "submitting act" in low:
            m = PCT_RE.search(line)
            if m:
                rec.setdefault("pct_submitting_act", float(m.group(1)))

        def pctile(lo, hi):
            """25th/75th from a percentile row: first and last surviving number."""
            n = nums(line)
            if len(n) < 2:
                return None
            a, b = n[0], n[-1]
            if lo <= a <= hi and lo <= b <= hi and a <= b:
                return a, b
            return None

        if re.search(r"\bACT Composite\b", line):
            got = pctile(1, 36)
            if got:
                rec.setdefault("act_25", got[0])
                rec.setdefault("act_75", got[1])
        if re.search(r"SAT Composite|SAT Total", line):
            got = pctile(400, 1600)
            if got:
                rec.setdefault("sat_total_25", got[0])
                rec.setdefault("sat_total_75", got[1])
        # The verbal half is variously "SAT Critical Reading", "SAT I Verbal"
        # and "SAT Evidence-based Reading and Writing" -- note the lowercase
        # "based", which a case-sensitive match silently misses.
        if re.search(r"SAT Critical Reading|SAT Evidence-based Reading|SAT I? ?Verbal",
                     line, re.I):
            got = pctile(200, 800)
            if got:
                rec.setdefault("sat_ebrw_25", got[0])
                rec.setdefault("sat_ebrw_75", got[1])
        if re.search(r"\bSAT I? ?Math\b", line, re.I):
            got = pctile(200, 800)
            if got:
                rec.setdefault("sat_math_25", got[0])
                rec.setdefault("sat_math_75", got[1])

        # ---------------- C11/C12: high-school GPA ---------------------------
        # Through 2018 this is one row ("GPA of 3.75 and higher"); from 2019 the
        # CDS splits it into "GPA of 4.0" plus "GPA of 3.75 and 3.99", so the
        # two halves are banked and summed below.
        if re.search(r"gpa of 3\.75 (and|or) higher", low):
            m = PCT_RE.search(line)
            if m:
                rec.setdefault("pct_gpa_375_plus", float(m.group(1)))
        if re.search(r"gpa of 4\.0\b", low):
            m = PCT_RE.search(line)
            if m:
                rec.setdefault("_gpa_40", float(m.group(1)))
        if re.search(r"gpa (of|between) 3\.75 and 3\.99", low):
            m = PCT_RE.search(line)
            if m:
                rec.setdefault("_gpa_375_399", float(m.group(1)))
        if "average high school gpa" in low:
            n = re.findall(r"\b([0-4]\.\d{1,2})\b", line)
            if n:
                rec.setdefault("avg_hs_gpa", float(n[0]))

    rec["_pctile_has_50th"] = seen_pctile_50
    if "pct_gpa_375_plus" not in rec and "_gpa_40" in rec and "_gpa_375_399" in rec:
        rec["pct_gpa_375_plus"] = round(rec["_gpa_40"] + rec["_gpa_375_399"], 1)

    # ---- derived + validation against the sheet's own stated totals ---------
    # Some years carry a handful of "unknown sex" applicants; leaving them out
    # is what made the men+women sum miss the sheet's stated total by 2.
    for field in ("applied", "admitted"):
        if f"{field}_men" in rec and f"{field}_women" in rec:
            rec[field] = (rec[f"{field}_men"] + rec[f"{field}_women"]
                          + rec.get(f"{field}_unknown", 0))
        elif f"{field}_stated_total" in rec:
            rec[field] = rec[f"{field}_stated_total"]
    if rec.get("applied") and rec.get("admitted"):
        rec["rate"] = round(rec["admitted"] / rec["applied"], 5)

    checks = []
    for field in ("applied", "admitted"):
        if field not in rec:
            continue
        targets = list(stated_sums)
        if f"{field}_stated_total" in rec:
            targets.append(rec[f"{field}_stated_total"])
        if not targets:
            checks.append(f"{field}:no-stated-total-in-file")
        elif rec[field] in targets:
            checks.append(f"{field}:OK")
        else:
            checks.append(f"{field}:MISMATCH(computed {rec[field]})")
    rec["_validation"] = checks

    if "sat_ebrw_25" in rec and "sat_math_25" in rec and "sat_total_25" not in rec:
        rec["sat_total_25"] = rec["sat_ebrw_25"] + rec["sat_math_25"]
        rec["sat_total_75"] = rec["sat_ebrw_75"] + rec["sat_math_75"]
        rec["sat_total_derived"] = True
    return rec


def main():
    out = {}
    for path in sorted(CDS_DIR.glob("*.txt")):
        y = fall_year(path.stem)
        if y is None:
            print(f"  ! skipping {path.name}: no year in filename")
            continue
        if y in out:
            sys.exit(f"FATAL: two CDS files map to fall {y}")
        rec = parse_file(path)
        rec["cds_file"] = path.stem
        out[y] = rec

    hdr = f"{'fall':>5} {'applied':>8} {'admit':>7} {'rate':>6} {'ACT':>7} {'SAT':>10} {'3.75+':>6} {'avgGPA':>6}  validation"
    print(hdr)
    print("-" * len(hdr))
    for y in sorted(out):
        r = out[y]
        act = f"{r.get('act_25','-')}-{r.get('act_75','-')}"
        sat = f"{r.get('sat_total_25','-')}-{r.get('sat_total_75','-')}"
        rate = f"{r['rate']*100:.1f}%" if "rate" in r else "-"
        flags = ",".join(r["_validation"]) or "no-sums-in-file"
        print(f"{y:>5} {r.get('applied','-'):>8} {r.get('admitted','-'):>7} {rate:>6} "
              f"{act:>7} {sat:>10} {str(r.get('pct_gpa_375_plus','-')):>6} "
              f"{str(r.get('avg_hs_gpa','-')):>6}  {flags}")

    OUT.write_text(json.dumps({
        "source": "University of Michigan Office of Budget & Planning, Common Data Set (obp.umich.edu)",
        "note": "Keyed by the fall term of the entering first-year class (CDS 2015-2016 -> fall 2015).",
        "years": out,
    }, indent=2) + "\n")
    print(f"\nwrote {OUT} ({len(out)} CDS years)")


if __name__ == "__main__":
    main()
