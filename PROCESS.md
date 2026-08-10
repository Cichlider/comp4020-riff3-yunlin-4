# Process overview

## What I built

A one-idea explainer of gerrymandering: a fixed town of 50 voters (30 for
Party A, 20 for Party B — 60/40, forever) rendered as a 5×10 grid, five
district buttons, and a live seat tally. The only thing a visitor can change
is which district each cell belongs to; three presets (compact, cracked,
packed) show the same 60/40 electorate landing on a roughly proportional 3–2
split, a 5–0 shutout, and a 4–1 split, and the sandbox lets a visitor draw
their own lines and watch the tally react cell by cell. The idea is that
"gerrymandering" stops being an abstract word once you can hold the vote
share fixed with your own hands and watch the seat count move anyway.

## The moments that mattered

1. **Verifying the seat outcomes before writing them into the site.** Rather
   than hand-computing which preset produces which split and trusting it,
   the three district maps and the tally logic live in a pure, DOM-free
   module (`electorate.ts`) with unit tests that lock in the exact numbers
   the copy claims (3-2, 5-0, 4-1) — the kind of checkable, self-referential
   claim worth verifying rather than asserting
   ([`fe68b3f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-yunlin/commit/fe68b3f)).

2. **Writing an end-to-end interaction test caught a real accessibility bug,
   not just a logic bug.** `spec/interaction.test.ts` renders `index.html`
   against jsdom and drives the actual click handlers
   ([`607cf38`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-yunlin/commit/607cf38)).
   Its aria-label assertion failed: selecting a new district only
   re-rendered the palette, so every cell's aria-label — which names the
   district a click would move it into — stayed stale until the grid
   re-rendered for an unrelated reason. A screen-reader user would be told
   the wrong target district. I could have loosened the assertion; instead
   I fixed the render order
   ([`e1ea83f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-yunlin/commit/e1ea83f)).

3. **A manual keyboard pass with `agent-browser` found a second bug the test
   suite couldn't have caught.** jsdom doesn't model focus loss the way a
   real browser does, so I drove the live page with `press Tab` / `press
   Enter` and checked `document.activeElement` directly. Both
   `renderPalette()` and `renderGrid()` rebuild their buttons from scratch
   on every click, which silently drops keyboard focus onto `<body>` — a
   keyboard-only user pressing Enter repeatedly (the normal way to build a
   gerrymander here) was bounced back to the top of the document after
   every single action. Fixed in the same commit as the aria-label bug
   ([`e1ea83f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-yunlin/commit/e1ea83f))
   by re-focusing the equivalent new button after each rebuild. This is the
   moment that mattered most: it's the kind of bug that never shows up in a
   mouse-driven click-through and never shows up in a jsdom test either —
   only an actual keyboard walk through the live page surfaces it.

4. **Choosing five distinguishable district colors over a "safe" three.**
   The project's validated categorical palette only guarantees all-pairs
   colorblind-safety for its first three slots, but the mechanic needs five
   districts. Rather than force the mechanic down to three districts to fit
   the palette, I kept color as a secondary, reinforcing channel and made
   the numeral badge on every cell and the district number on every button
   the primary identity channel — "never color alone," applied to a case
   the reference palette itself doesn't fully cover
   ([`8406302`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-yunlin/commit/8406302)).

## Verification

`pnpm check` (typecheck, build, oxlint, stylelint, 25 vitest tests) is green.
`pnpm dlx linkinator ./dist --silent` against a fresh build found 0 broken
links. The live interaction — selecting a district, clicking a cell, and
watching the tally and vote-share recap update — was walked through with
`agent-browser` at both 1920×1080 and 390×844, including a keyboard-only
pass (Tab/Enter/Space) confirming focus is retained after every action, with
zero console errors at either viewport.
