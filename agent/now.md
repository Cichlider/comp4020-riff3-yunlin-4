# Hand-off

## State

comp4020-ass1-yunlin, Assignment 1 ("one strong idea/mechanic, nothing
else"). 165h to cutoff at the start of this run, which built the whole
prototype from the fresh starter repo (one commit, boilerplate only) in a
single pass and shipped it — well ahead of schedule, so this is early build
phase, not deepen or finish.

Picked gerrymandering ("packing" and "cracking") as the one idea: a fixed
50-voter town (30 A / 20 B, 60/40, never changes) rendered as a 5×10 grid,
with three presets (compact → 3-2, cracked → 5-0, packed → 4-1) and a free
sandbox where clicking a district button then a cell redraws that cell's
district. The mechanic argues its own point directly — same votes, no voter
ever changes their mind, but the seat count moves with the lines alone.

Built:
- `electorate.ts` / `electorate.test.ts` — pure, DOM-free electorate + tally
  logic, unit-tested to lock in the exact seat outcomes the copy claims
  (never trust hand arithmetic for a checkable claim, per the standing
  content-practices habit).
- `main.ts` / `index.html` / `styles.css` — the interactive widget. Carried
  the aesthetic throughline (system serif / paper tone / classic blue) for
  page chrome, switched the widget itself to system sans + tabular-nums per
  the dataviz skill's chart-chrome convention. Used the dataviz skill's
  "never color alone" rule deliberately: the palette's all-pairs
  colorblind-safety guarantee only covers ~3 categorical slots, but the
  mechanic needs 5 districts, so color is secondary and every cell/button
  also carries a numeral/letter as the real identity channel.
- `spec/interaction.test.ts` — jsdom end-to-end test of the actual
  click-through (select district, click cell, tally updates). This caught a
  real bug: selecting a new district only re-rendered the palette, so every
  cell's aria-label (naming the destination district) went stale until an
  unrelated re-render. Fixed by re-rendering the grid on district selection
  too.
- A second, more interesting bug that jsdom's test suite could NOT catch:
  both render functions rebuild their buttons from scratch on every click,
  which drops keyboard focus onto `<body>` in a real browser (jsdom doesn't
  model this focus-loss-on-node-removal behaviour the same way). Only found
  by manually driving the live dev server with `agent-browser`'s `press
  Tab`/`press Enter` and reading `document.activeElement`. Fixed by
  re-focusing the equivalent new button after each rebuild. This is the
  strongest "moment" in `PROCESS.md` and the reflection — worth remembering
  as a durable lesson (added to this repo's `CLAUDE.md` and worth folding
  into `MEMORY.md` too: **any future widget that rebuilds its own DOM on
  click needs a manual keyboard pass with agent-browser, not just an
  automated interaction test — jsdom's focus model has a real fidelity gap
  here that a green test suite will not surface.**

Also learned (and documented in this repo's CLAUDE.md): `agent-browser find
text "X" click` can silently click the wrong element when the visible text
appears more than once on the page (matched a `<strong>B</strong>` in prose
instead of a grid cell). `snapshot` (get `[ref=eN]` ids from the
accessibility tree) then `click "ref=eN"` is the reliable pattern — re-run
`snapshot` after any render that could have replaced the DOM, since refs
from a stale snapshot silently fail to resolve. Worth adding to the durable
agent-browser notes in MEMORY.md's Working environment section next time
this bites again.

Verified before shipping:
- `pnpm check` green: typecheck, build, oxlint, stylelint, 25 vitest tests.
- `pnpm dlx linkinator ./dist --silent` — 0 broken links (3 links scanned).
- `agent-browser` at both 1920×1080 and 390×844: visual screenshots,
  zero console errors, live click-through confirmed the tally/aria-labels
  update correctly at both sizes, and a keyboard-only pass (Tab/Enter/Space)
  confirmed focus is retained through the whole interaction after the fix.
- `pnpm check:evidence` green (PROCESS.md's four cited commits resolve,
  `reflections/assignment-1.md` matches the current deliverable).

`PROCESS.md` (replaced the template) cites four moments: verifying preset
seat outcomes before writing them into copy, the interaction test catching
the aria-label bug, the keyboard pass catching the focus-loss bug, and the
five-districts-over-palette-safe-three color decision.
`reflections/assignment-1.md` (272 words) frames the jsdom-vs-real-browser
focus gap as the breakthrough. Repo is clean and pushed to `origin/main` at
`5a5f262`. Still private (window doesn't close for ~160h from run start) ---
`/ship` and CI are the harness's to trigger later, not mine to force.

## Next action

Nothing left to build for a first pass; this is very early in the week
(165h → ~160h remaining after this run), so the next run should genuinely
look for gaps rather than reassurance-pass:

1. Re-read `index.html`'s explanatory copy fresh against the actual widget
   behaviour for a self-referential claim that's gone stale — the same
   discipline that already caught two real bugs this run. In particular the
   "why this is legal, and why it works" section's claims about exact
   numbers (e.g. "cracking takes B from 40% to zero seats") should be
   re-checked against `electorate.test.ts`'s locked-in outcomes if either
   file changes.
2. Consider whether the sandbox needs any affordance for "reset to a
   preset" beyond the three preset buttons already there, or whether a
   visitor who free-draws into a weird state and wants to start over is
   already well served (the three preset buttons double as a reset).
3. Accessibility pass 2: run an actual axe-core or Lighthouse check (per
   this course's stated gap — accessibility/performance sensors aren't
   wired by the starter and are the student's job to add), now that the
   manual keyboard-focus bug is fixed. This assignment's spec may ask for
   this explicitly — check the brief again before building it blind.
4. Once those are exhausted with nothing found, don't manufacture further
   passes — say so plainly in this file and move toward `PROCESS.md`/word-
   count polish or genuinely new deepen-phase work only if the site's own
   thesis supports it (this site's argument is "one mechanic is enough" —
   resist adding pages/features just because there's time left).
