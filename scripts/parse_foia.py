#!/usr/bin/env python3
"""Parse FOIA 261656 (U-M admissions by Troy School District high school, 2004-2025).

Source: pdftotext -layout of "FOIA 261656 data.pdf".
Structure is a repeating block:
    <YEAR> <School> High School Total   <applied>  <admitted>
      ENG   <applied> <admitted>
      LSA   <applied> <admitted>
      ROSS  <applied> <admitted>     (2017+ only)

The school Total row is the authoritative figure; ENG+LSA+ROSS < Total because
the FOIA response only itemized those three colleges. The remainder is emitted
as an "OTHER" bucket (Nursing, Kinesiology, Music/Theatre/Dance, Art & Design,
Architecture, Information, Public Policy, etc.).
"""
import json
import re
import sys
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "data" / "foia_261656_raw.txt"
OUT = Path(__file__).resolve().parent.parent / "data" / "uofm_admissions.json"

HEADER_RE = re.compile(
    r"^\s*(?P<year>\d{4})\s+(?P<school>Troy|Athens)\s+High School Total\s+"
    r"(?P<applied>\d+)\s+(?P<admitted>\d+)\s*$"
)
COLLEGE_RE = re.compile(r"^\s+(?P<college>ENG|LSA|ROSS)\s+(?P<applied>\d+)\s+(?P<admitted>\d+)\s*$")


def parse(text):
    records = {}
    current = None
    for line in text.splitlines():
        if not line.strip() or "Applied" in line:
            continue
        m = HEADER_RE.match(line)
        if m:
            year = int(m.group("year"))
            school = m.group("school")
            current = {
                "year": year,
                "school": school,
                "applied": int(m.group("applied")),
                "admitted": int(m.group("admitted")),
                "colleges": {},
            }
            key = (year, school)
            if key in records:
                sys.exit(f"FATAL: duplicate block for {key}")
            records[key] = current
            continue
        m = COLLEGE_RE.match(line)
        if m:
            if current is None:
                sys.exit(f"FATAL: college row before any school header: {line!r}")
            college = m.group("college")
            if college in current["colleges"]:
                sys.exit(f"FATAL: duplicate {college} in {current['year']} {current['school']}")
            current["colleges"][college] = {
                "applied": int(m.group("applied")),
                "admitted": int(m.group("admitted")),
            }
            continue
        sys.exit(f"FATAL: unparsed line: {line!r}")
    return records


def main():
    text = RAW.read_text()
    records = parse(text)

    # ---- validation against what the source document states about itself ----
    years = sorted({y for y, _ in records})
    expected_years = list(range(2004, 2026))
    assert years == expected_years, f"year gap: got {years}"
    for y in years:
        for s in ("Troy", "Athens"):
            assert (y, s) in records, f"missing {y} {s}"

    problems = []
    for (year, school), r in sorted(records.items()):
        itemized_app = sum(c["applied"] for c in r["colleges"].values())
        itemized_adm = sum(c["admitted"] for c in r["colleges"].values())
        if itemized_app > r["applied"]:
            problems.append(f"{year} {school}: itemized applied {itemized_app} > total {r['applied']}")
        if itemized_adm > r["admitted"]:
            problems.append(f"{year} {school}: itemized admitted {itemized_adm} > total {r['admitted']}")
        for name, c in r["colleges"].items():
            if c["admitted"] > c["applied"]:
                problems.append(f"{year} {school} {name}: admitted > applied")
        if r["admitted"] > r["applied"]:
            problems.append(f"{year} {school}: admitted > applied")
        # ROSS should only exist 2017+
        if "ROSS" in r["colleges"] and year < 2017:
            problems.append(f"{year} {school}: unexpected ROSS")
        if year >= 2017 and "ROSS" not in r["colleges"]:
            problems.append(f"{year} {school}: missing ROSS")
    if problems:
        sys.exit("VALIDATION FAILED:\n  " + "\n  ".join(problems))

    rows = []
    for (year, school), r in sorted(records.items()):
        itemized_app = sum(c["applied"] for c in r["colleges"].values())
        itemized_adm = sum(c["admitted"] for c in r["colleges"].values())
        colleges = dict(r["colleges"])
        colleges["OTHER"] = {
            "applied": r["applied"] - itemized_app,
            "admitted": r["admitted"] - itemized_adm,
        }
        rows.append({
            "year": year,
            "school": school,
            "applied": r["applied"],
            "admitted": r["admitted"],
            "rate": round(r["admitted"] / r["applied"], 5),
            "colleges": {
                k: {**v, "rate": round(v["admitted"] / v["applied"], 5) if v["applied"] else None}
                for k, v in colleges.items()
            },
        })

    combined = []
    for y in years:
        t = next(r for r in rows if r["year"] == y and r["school"] == "Troy")
        a = next(r for r in rows if r["year"] == y and r["school"] == "Athens")
        app = t["applied"] + a["applied"]
        adm = t["admitted"] + a["admitted"]
        combined.append({"year": y, "applied": app, "admitted": adm, "rate": round(adm / app, 5)})

    payload = {
        "source": "University of Michigan FOIA response #261656",
        "description": (
            "First-year applications and admissions to the University of Michigan-Ann Arbor "
            "from Troy High School and Athens High School (Troy School District, Oakland County, MI), "
            "entering terms 2004-2025. Totals are all-university; ENG/LSA/ROSS are itemized colleges "
            "and OTHER is the derived remainder."
        ),
        "colleges": {
            "ENG": "College of Engineering",
            "LSA": "College of Literature, Science, and the Arts",
            "ROSS": "Stephen M. Ross School of Business (preferred admission; itemized 2017+)",
            "OTHER": "All other U-M schools and colleges (derived: total minus itemized)",
        },
        "years": years,
        "rows": rows,
        "district_combined": combined,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")

    print(f"parsed {len(rows)} school-year rows, {years[0]}-{years[-1]}")
    print(f"grand total applied  = {sum(r['applied'] for r in rows):,}")
    print(f"grand total admitted = {sum(r['admitted'] for r in rows):,}")
    print()
    print(f"{'yr':>4} {'TROY app':>8} {'adm':>5} {'rate':>6}   {'ATH app':>8} {'adm':>5} {'rate':>6}")
    for y in years:
        t = next(r for r in rows if r["year"] == y and r["school"] == "Troy")
        a = next(r for r in rows if r["year"] == y and r["school"] == "Athens")
        print(f"{y:>4} {t['applied']:>8} {t['admitted']:>5} {t['rate']*100:>5.1f}%   "
              f"{a['applied']:>8} {a['admitted']:>5} {a['rate']*100:>5.1f}%")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
