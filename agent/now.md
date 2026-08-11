# Hand-off

## State

comp4020-ass1-yunlin ("Same voters, different maps", a gerrymandering
explainer), 141h to cutoff at the start of this run, dropping to ~137h by
the end. Repo arrived clean at `60f1b1e` with the build, tests, PROCESS.md,
and reflection already done from earlier runs (per the prior now.md: "fully
built and multiple deepen-passes clean"). This run was still deepen-phase
(>24h out), so rather than re-run the same manual verification passes that
had already come back clean repeatedly, it did the one thing genuinely new:
wired the accessibility sensor the starter's CLAUDE.md names but doesn't
provide, following the exact `chrome-launcher`+Lighthouse pattern already
proven in `comp4020-crit1-yunlin/scripts/audit.ts` (see MEMORY.md's Working
environment section).

That sensor (`pnpm check:audit`, wired in `af46269`) found two real,
previously invisible defects on its first run against the built site, both
fixed in `acca710`:

1. `--party-a`/`--party-b` text on the paper background scored 4.18:1 and
   3.74:1 against the page background --- both under WCAG AA's 4.5:1 floor
   for bold body text. Darkened both colours to the same hue
   (`#2466b6`/`#c13e3d`, contrast 5.46/4.95) and kept `favicon.svg` and
   `main.ts`'s `PARTY_COLOR` constant in sync, since all three duplicate the
   same hex.
2. All 50 grid cells failed axe's `label-content-name-mismatch`: the
   per-cell party letter and district-number badge were `aria-hidden` DOM
   text nodes, and axe still counts `aria-hidden` text as a "visible label"
   that must be echoed in the accessible name, even though it's excluded
   from computing that name. Moved both from DOM text into CSS generated
   content (`content: attr(data-party)` / `attr(data-district)`) --- see
   MEMORY.md's Working environment section for the general lesson.

Re-verified after both fixes: `pnpm check` (25 vitest tests), `pnpm
check:audit` (100/100 accessibility, 100/100 performance), and a fresh
`agent-browser` keyboard pass (Tab through palette + grid, Enter, checked
`document.activeElement` stayed on a real button, not `<body>`) all came
back clean, since the fix touched the same render functions the
focus-retention bug (an earlier run's moment 3) had lived in. Also
spot-checked both viewports visually (1920×1080 and 390×844) --- letters and
badges render identically to before, just via CSS instead of DOM text.

`PROCESS.md` was rewritten to replace moment 4 (the "five district colours"
story) with this accessibility-audit moment, since it's a cleaner fit for
the assignment spec's own description of what the strongest moments look
like ("a check wired up" is literally the example given) --- word count
checked at 599, inside the 400--600 band. `CLAUDE.md` gained the harness
lesson (aria-hidden text still counts for `label-content-name-mismatch`).
`pnpm check:evidence` confirmed all 5 cited commits resolve. Reflection
(`reflections/assignment-1.md`, the jsdom-vs-real-browser focus-loss
breakthrough) was left unchanged --- still the strongest single breakthrough
to lead the week-4 retro with, and swapping it wasn't necessary just because
a new moment was added to PROCESS.md.

Six commits this run: `af46269` (audit script), `acca710` (the two fixes),
`6f126f9` (PROCESS.md + CLAUDE.md). Tree is clean, nothing pushed to remote
yet this run (doctrine says push as part of finishing steps; this run
wasn't a finishing-steps run since it's still >24h out — confirm with the
user or push next time finishing steps actually run, whichever comes first).

## Next action

ass1 is in good shape with real headroom used well this run --- not busywork.
At 141h out it's still comfortably outside the 24h finishing window, so a
future run doesn't need to touch this repo again until either (a) something
new is found broken, or (b) the clock crosses into the 24h finishing-steps
window, at which point: final `pnpm check`/`check:audit`/`check:evidence`
sweep, a browser pass at both viewports, confirm `git status` is clean, and
push (this repo has never been pushed with this session's git remote state
confirmed --- check `git status` for "ahead of origin" before assuming it's
already up to date).

Don't manufacture another deepen-phase pass here without a genuine new angle
to check --- content, rendering, interaction, keyboard access, and now
static accessibility/contrast have all been checked and are clean. If a
future run picks this repo up again before 24h and finds nothing new,
that's the sign to stop, not to invent a fifth verification method.

comp4020-crit2-yunlin remains fully shipped from a prior run (see git log
`62f421d`) with nothing new to check per that run's own hand-off --- don't
re-verify it unless something changes.
