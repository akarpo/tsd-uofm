# Design

The visual system, and why each rule exists. The short version: **brand colours
carry identity, a separately validated palette carries data, and the two never
swap jobs.**

---

## 1. Colour

### Official University of Michigan values

Read from <https://brand.umich.edu/design-resources/colors/> — the university's own
published swatches, not approximations.

| Name | Hex | PMS | Used for |
|---|---|---|---|
| Maize | `#FFCB05` | 7406 | the block M, accents, act labels, the sheen |
| Blue | `#00274C` | 282 | the site's ground note |
| Ross Orange | `#D86018` | 1595 | the Ross panel |
| Taubman Teal | `#00B2A9` | 326 | the North Campus panel |
| Wave Field Green | `#A5A508` | 398 | the Wave Field berms |
| Arboretum Blue | `#2F65A7` | 660 | the Central Campus panel |
| Rackham Green | `#75988D` | 5565 | the Rackham Building |
| UMMA Tan | `#CFC096` | 7502 | limestone |
| Law Quad Stone | `#655A52` | — | stone flanks |
| Angell Hall Ash | `#989C97` | — | paving |

The palette turned out to contain colours literally named for the buildings the
site draws. **Rackham Green** on Rackham and **Wave Field Green** on the Wave Field
are not coincidences worth passing up.

### School colours, sampled from their own marks

Each school's athletics mark was downloaded and its pixels counted:

| School | Colours | Share of opaque pixels |
|---|---|---|
| **Troy High** (Colts) | `#CFD0D2` silver, `#000000` black | 26.1% / 39.8% |
| **Athens** (Red Hawks) | `#C20F2F` red, `#B4A169` gold, `#000000` black | 36.1% / 3.7% / 27.6% |

The logo files were used to **sample colour only**. The site draws its own school
marks rather than republishing anyone's trademark.

### Why the brand colours are not chart colours

This is the one design decision most worth defending, because it looks like a
missed opportunity until you run the numbers.

A categorical palette has to clear five checks: a lightness band, a chroma floor,
colour-vision separation (protan/deutan/tritan), a normal-vision separation floor,
and ≥ 3:1 contrast against the chart surface. Run against the site's navy chart
surface `#06203f`, the obvious brand mapping **fails**:

```
LSA / ENG / ROSS as #2F65A7, #A5A508, #D86018
  [FAIL] Lightness band     #A5A508 at L 0.699, outside 0.48–0.67
  [WARN] CVD separation     #D86018 ↔ #A5A508  ΔE 6.3 (deutan)
  [WARN] Contrast           #2F65A7 at 2.75:1
```

Wave Field Green and Ross Orange are **6.3 apart under deuteranopia** — for a
red-green colour-blind reader they are the same colour. Stepping them does not
rescue it: olive and orange converge under deutan no matter how you light them
(three re-stepped candidates were tested; the best got ΔE 4.0). And the schools'
silver has a chroma of **0.003** — it is achromatic. Grey cannot carry meaning in a
chart; it reads as "disabled" or "other".

So the site runs two palettes:

**Data marks** — validated, all checks pass on `#06203f` at up to six slots:

```
#3987e5  #d95926  #199e70  #c98500  #d55181  #9085e9
  [PASS] Lightness band     all inside L 0.48–0.67
  [PASS] Chroma floor       all ≥ 0.1
  [PASS] CVD separation     worst adjacent ΔE 8.4 (protan)
  [PASS] Normal-vision      worst adjacent ΔE 19.3
  [PASS] Contrast           all ≥ 3:1
```

**Identity** — the official U-M and school values, on headings, panel tags,
illustrations and swatch chips.

Where a panel names a colour, a chip filled with that exact hex sits next to the
label, so the official value is *shown* rather than asked to carry small text at
2.75:1.

---

## 2. Charts

Rules the chart engine enforces:

- **One axis. Never two.** Where two measures have different units they are indexed
  to 2004 = 100 and share a scale. A dual axis can be slid until it shows almost
  any relationship; excluding it is cheaper than defending it.
- **A legend whenever there are ≥ 2 series**, plus direct labels at the end of each
  line, so identity never rests on colour alone.
- **Every chart carries a table view** behind a "Show data table" toggle.
- **Hover by default** — crosshair and shared tooltip on lines, per-band tooltip on
  bars. A chart in a browser is an interactive object; making it inert is a choice,
  and the wrong one.
- **2px surface gaps** between stacked segments and adjacent bars; 4px rounded
  data-ends; recessive grid and axes.
- Money is labelled *nominal* or *constant 2025 dollars*, always. Most of the
  interesting findings only exist in one of the two.

The headline chart was originally bars-plus-a-rate-line — a dual axis. It is now a
**stacked bar of admitted vs. not admitted**, which shows the rate *as geometry*:
the solid block barely grows while the faded one climbs. No second scale needed.

The ledger's colour means **impact on a Troy household**, not the direction of the
number, with a key saying so. "+103% more applications" is context, not a loss.

---

## 3. The illustrations

Original geometric drawings, not traced photographs or logos.

**Troy High and Athens** — generic school buildings wearing each school's sampled
colours, above a dot matrix where filled dots are admits and hollow dots are
applicants who were not admitted. The rate sits at a **fixed baseline** in both
panels so the two figures line up even though the dot grids are different heights.
The panel swaps between 2004 / 2010 / 2016 / 2025 as you scroll.

**Central Campus — Burton Memorial Tower & Rackham.** Burton (Albert Kahn, 1936)
and Rackham face each other across Fletcher Street, and the composition is the
contrast: a very tall, very narrow shaft with a louvred belfry, clock face and
vertical fluting, against a long, low, symmetrical block with tall narrow windows
and a bronze entrance.

> The first version of this panel was an Angell Hall colonnade over the Diag. A
> later request asked for "the Lurie Bell Tower and Rackham" — but **Lurie Tower is
> on North Campus**, and it was already carrying the Engineering panel. Burton is
> the Central Campus carillon, and it is the one that actually stands beside
> Rackham.

**North Campus — Lurie Tower & the Wave Field.** The carillon above Maya Lin's
Wave Field, drawn as five rolling sine berms in Wave Field Green, with lab blocks
in Taubman Teal.

**Ross — the Winter Garden.** The recognisable thing about Ross is not a box: it is
that you can read the stacked floor plates and their balcony fronts straight
through the curtain wall, and that they stop short of a full-height atrium void.
Six storeys of plates, a lit void down the centre, people-scale marks so the height
registers, limestone piers, Blau Hall stepping down to the right — and one small
lit door under a deep canopy, which does double duty for the section it illustrates.

---

## 4. The hero

**The block M** is the university's own outline, lifted from its published logo
file and filled with brand maize `#FFCB05`. It identifies the institution the page
is about; the footer states plainly that the site is unaffiliated.

**"Blue"** is an SVG **clip path**, not text. Inside the letterforms: a blue
gradient (`#8fc4ff → #4d9bf0 → #1f5fb0`), dollar signs, footballs, mortarboards,
columns, pennants, books and block Ms drifting upward, and a maize sheen sweeping
across on a slow cycle.

Because the visible glyphs are a clip path rather than characters, a screen-reader
copy of the word rides alongside inside the span and the SVG is `aria-hidden`. The
clip text is **measured at runtime against the `<h1>`'s computed font**, so it
tracks the `clamp()`-based hero size through resizes.

**Behind it**, a canvas draws yard lines receding to a vanishing point — a football
field in perspective.

---

## 5. Motion and accessibility

- Everything that moves is behind `prefers-reduced-motion`. Under reduce-motion the
  hero keeps its gradient and its object field but stops drifting; chart lines
  appear drawn rather than drawing; the scrollytelling steps are all at full opacity.
- All animation loops are parked by `IntersectionObserver` when their section leaves
  the viewport, so nothing burns frames offscreen.
- Every chart has a table view. Every series has a direct label. Colour is never the
  only channel.
- The player is keyboard-operable: space toggles playback (unless focus is in a
  control), arrows seek, and the seek bar is a real `role="slider"`.
- Wide content scrolls inside its own container; the page body never scrolls
  horizontally.

---

## 6. Type and layout

- System font stack — no webfont, no network round-trip, no layout shift.
- Hero at `clamp(3.2rem, 13vw, 9.5rem)`; body at 17px/1.65; measure capped at 42rem.
- Sections alternate between three navy grounds so acts separate without rules.
- Scrollytelling is a two-column grid (`0.85fr / 1.3fr`) that collapses to stacked
  blocks below 900px, where the sticky panel becomes a shorter fixed header.
- Deep navy ground (`#001426`) with the chart surface a step lighter (`#06203f`) —
  the surface the data palette was validated against.
