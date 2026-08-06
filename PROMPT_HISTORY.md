# Prompt History

The complete sequence of user requests for this project (Claude Code session,
2026-08-05 → 2026-08-06), each with a summary of what was done. Verbatim user
messages are quoted; see the other `.md` files for detail.

The whole site — data pipeline, research, design and deployment — was built in
this one session. Several requests arrived *mid-turn*, which is why the site
picked up its title, its colour system and two of its three campus drawings
after the first build was already standing.

---

### 1. Build the site
> "Please build a site (tsd-uofm.karpowitsch.org) that takes and publishes the data within
> 'FOIA 261656 data.pdf' on the Desktop. Also do some cool visualizations for Troy High, Athens,
> UofM campus as you scroll through the site. Also research and highlight average UofM admission
> standards changing over time, how much the median price of a home in TSD precincts has changed
> over time, admission % change over time, etc. Please create a github repo for this and upload to
> cloudflare pages. If this takes multiple runs to collect and build so be it. Also download
> [five YouTube URLs] (in that order) with an .mp3 player and visualizer. Have fun with this, make it fun!"

- Read the FOIA PDF: U-M applications and admissions from **Troy High** and **Athens**,
  entering terms **2004–2025**, itemised for ENG / LSA / ROSS.
- Wrote `parse_foia.py`; 44 school-year rows, 6,473 applications, 3,443 admits.
- Downloaded the five Michigan Marching Band tracks with `yt-dlp` (*Let's Go Blue*,
  *Temptation*, *M Fanfare*, *The Victors*, the Bond opener).
- Pulled 28 U-M Common Data Sets, IPEDS admissions, IPEDS tuition, Zillow ZHVI, CPI-U.

### 2. Break the campuses out
> "Yes, also tie into distinct visualizations for Ross / College of Engineering / LS&A (central campus)"

Became **Act III — Three campuses**, one panel each with its own drawing, its own
official U-M colour, and its own admit-rate line.

### 3. Precincts for the housing figures
> "You may for Troy Home prices identify TSD voting precincts, along with zip codes, and there may be
> some overlap with other districts but do the best you can"

Troy's **2025 precinct map (37 → 27 precincts, adopted 21 April 2025)** documented, with
the honest caveat that **seven school districts** reach into the City of Troy, so
ZIP-level values approximate TSD rather than matching it. See `METHODOLOGY.md §5`.

### 4. State funding
> "Also include state of michigan funding to UofM over the same period as well, that would be good to include"

Added the Michigan appropriation to the Ann Arbor campus from IPEDS finance form F1A —
the causal thread the rest of the story hangs on (**−31% in real terms**).

### 5. The thesis
> "Im just riffing here, if you have any suggestions as well - please let me know, trying to tie together,
> from a taxpayer's perspective - are we getting more admits, the same admits, or fewer admits to the
> state's premier higher ed institution relative to rising housing prices and higher education costs
> (costs would be another great thing to report on with this)"

This set the spine of the site. Suggestions offered and then built:

1. **"You pay three times"** — property values, tuition, state taxes — as the structure.
2. The **counterfactual**: at 2004's odds the district would have produced **1,208 more admits**
   across 2005–2025.
3. The sleeper finding: Troy homes are **+56% nominal but −8% real** since 2004.
4. The mechanism, stated fairly: state support fell, so U-M recruited students who pay **3.5×**.
   U-M Ann Arbor now has **the lowest in-state share of any Michigan public university — 49%**.
5. The honest counterweight: U-M's own scholarship spending is **up 129% in real terms**.

### 6. Endowment and scholarships
> "Also include UofM's endowment size over the same period and how much they've provided in scholarships"

Added `endowment_end` (F1H02) and institutional grants (F1E05 + F1E06) from IPEDS finance,
extended to FY2024–25 from U-M's published Endowment Fund Profiles.

### 7. Fill in the table
> "Please compile as much year by year numbers for the table you've shared above. I realize you may not
> have all the data, but fill in what you can"

Built `make_table.py` → a **22-year × ~30-column** table, published on the site and as CSV.
Chasing the gaps found three real parser bugs (see `METHODOLOGY.md §3`) and closed
SAT (all 22 years), GPA (2007–2025) and out-of-state tuition (all 22 years).

### 8. Official U-M colours
> "UofM shares specific swatch code values on their visual design, its online somewhere.
> Use that for UofM's colors section of the site"

`brand.umich.edu` 403s ordinary fetches, so the palette was read out of a live browser
session: 16 official values including **Ross Orange `#D86018`**, **Taubman Teal `#00B2A9`**,
**Arboretum Blue `#2F65A7`**, **Wave Field Green `#A5A508`**, **Rackham Green `#75988D`**.
See `DESIGN.md §1`.

### 9. School colours
> "Please also download Troy High and Athens logos and identify the hex values for the colors to be
> make it accurate"

Logos downloaded from each school's own athletics site and sampled pixel-wise:
**Troy High `#CFD0D2` / `#000000`**, **Athens `#C20F2F` / `#B4A169` / `#000000`**.
The logo files were used to *sample colour only* — the site draws its own marks rather
than republishing anyone's trademark.

### 10. Rename, and a sixth track
> "Instead of the 'The price of blue' can we go with 'Tangled up in Blue'? (URL) and add it the playlist,
> at the end? Please include forward / backward controls on the player to advance or go back to the previous song"

Retitled throughout. Bob Dylan, *Tangled up in Blue* (Wembley Stadium, July 1984) added as
**track 6**. The skip controls already existed but were dim and easy to miss — promoted to
full maize buttons flanking play.

### 11. Official logo, and naming
> "Please use the official UofM logo at the top, and the first sentence reads - 'In 2004, a Troy or Athens
> senior' - Troy is always called 'Troy High' and Athens is always just Athens. Please review additional
> references and make any potential corrections"

- Replaced the hand-approximated block M with **U-M's own block M outline**, lifted from the
  university's published logo file and filled with brand maize `#FFCB05`.
- Audited every school reference across HTML, JS, the JSON payload, table headers and the README:
  the schools are **"Troy High"** and **"Athens"**; bare *Troy* now only ever means the city or district.
  22 replacements in the page, plus chart series, table headers and `build_site_data.py`.

### 12. GitHub access
> "How are you not able to get into github? You should have access"

Clarified: GitHub was never blocked — `akarpo/tsd-uofm` had already been created and pushed.
What failed was **clicking through the Cloudflare dashboard SPA**. Routed around it by calling
the Cloudflare API directly and replicating the `source` block from an existing Git-connected
project, so this project deploys from git like the others rather than by Direct Upload.

### 13. Make "Blue" blue
> "I think the Tangled up in 'Blue' would impact more if the 'Blue' were blue instead of maize, and
> shimmering, with dollar signs. footballs, and college campus objects floating through it"

Built `Art.blueWord()`: the word is an **SVG clip path** over a blue gradient, with dollar
signs, footballs, mortarboards, columns, pennants, books and block Ms drifting up through the
letterforms while a maize sheen sweeps across. See `DESIGN.md §4`.

> Note: the animation is suppressed under `prefers-reduced-motion`, which is **on** on the
> requester's machine — verified working by forcing the flag off.

### 14. Kicker copy
> "Get rid of the text 'FOIA 261656' at the top, and change 'Twenty-two years of admissions' to
> 'Twenty-two years of Troy School District admissions to UofM'"

Done. The FOIA number still appears in the sources section and the README, where it belongs.

### 15. DNS
> "Use my cloudflare api key [REDACTED] / karpowitsch.org is already provisioned as a domain"

Token verified, zone confirmed, existing records checked for conflicts, then the CNAME created
to match the pattern the other six Pages sites use (`tsd-uofm` → `tsd-uofm.pages.dev`, proxied,
TTL auto). Custom domain and certificate went **active**. See `DEPLOYMENT.md`.

> The token is deliberately **not** recorded here. It was used only via a shell environment
> variable and never written to a file.

### 16. Central Campus, again
> "Can you maybe take another pass for the Central Campus visualization? Maybe go with the Lurie Bell
> Tower and Rackham?"

Flagged that **Lurie Tower is on North Campus** — it was already carrying the Engineering panel,
so using it for Central Campus would have been both geographically wrong and a duplicate. The
Central Campus carillon is **Burton Memorial Tower**, which faces Rackham across Fletcher Street.
Redrew the panel as **Burton + Rackham**, with Rackham in U-M's own *Rackham Green*.

### 17. Ross, again
> "Maybe take another pass at the Business School visualization as well"

The old drawing was a flat window grid that could have been any office block. Redrawn as the
thing you actually recognise: six storeys of floor plates read through the curtain wall,
stopping short of a lit full-height **Winter Garden** void, with people-scale marks on the
balcony fronts, limestone piers, Blau Hall stepping down to the right, and one small lit door.

### 18. Documentation
> "Great job! Please do a documentation, tooling, MD file (should be multiple MD files with full prompt
> history) for this project and push and commit this to github"

This file, plus `METHODOLOGY.md`, `DATA_SOURCES.md`, `SCRIPTS.md`, `DESIGN.md`,
`DEPLOYMENT.md` and `CHANGELOG.md`.

---

## Corrections made during the session

Recorded because each one changed a number or a claim on the published page.

| # | What was wrong | How it surfaced | Fix |
|---|---|---|---|
| 1 | Men's and women's application totals silently swapped in some CDS years | The workbook's own `sum = N` annotation didn't match the computed total | Strip `sum =` before reading a value, then re-use it as a check |
| 2 | "Unknown sex" applicants dropped (off by 2 in 2022/2023) | Same stated-total check | Add the unknown column to the total |
| 3 | `800 to 1600` "Possible Scores" column read as the SAT 75th percentile | 75th percentile showed as a flat 1600 for five years | Strip hyphen- *and* word-form score ranges |
| 4 | Instruction prose read as a data row (`…in fall 2007` → applications = 2007) | 2007 flagged as a mismatch | Require C1 data rows to begin "Total" |
| 5 | `sum =` annotations from unrelated CDS sections triggering false mismatches | 2007 still flagged after fix #4 | Scope the sum collection to the C1/C2 block |
| 6 | Endowment missing for 16 of 20 years | Column present but never matched | CSV headers carry trailing spaces (`"F1H02   "`) — strip and upper-case every header |
| 7 | A dual-axis chart (people + rate on one figure) | Caught during design review | Replaced with a stacked bar; the shrinking admitted block *is* the rate |
| 8 | Ledger colour meant "the number went up" | Read as "+103% more applications = bad" | Recoloured to mean *impact on a Troy household*, with a key |
| 9 | Chart caption described a line that no longer existed | Visual review after the chart type changed | Rewritten |
| 10 | Local DNS showed the new domain as dead | A `dig` fired before the record propagated cached the negative | Confirmed live from three public resolvers; local cache flushes on its own |
