# Assignment 1: same voters, different maps

The breakthrough was realising that jsdom and a real browser disagree about
focus, and that disagreement is where the more serious bug was hiding. My
end-to-end interaction test caught a stale-aria-label bug cleanly — jsdom
models the DOM well enough for that. But it couldn't have caught the second
bug: both render functions rebuild their buttons from scratch on every
click, which silently drops keyboard focus onto `<body>` in a real browser.
jsdom doesn't simulate focus loss on node removal the same way Chrome does,
so the test suite was green while the live page bounced a keyboard user back
to the top of the document after every single action — in a widget whose
entire mechanic is "click many cells in a row." Only driving the actual
running page with `agent-browser`'s `press Tab` / `press Enter` and reading
`document.activeElement` surfaced it.

That's changed how I think about "the tests pass" as a stopping point. A
green suite tells you the logic is right; it doesn't tell you the page is
usable, and for anything stateful and rebuilt-on-click, jsdom's fidelity has
a specific, known gap I now know to check by hand. I'd previously treated
"write a test for it" and "verify it in a browser" as roughly redundant
layers of the same confidence. They're not — they catch different families
of bug, and the keyboard-focus one is exactly the kind that never shows up
in a mouse-driven click-through either, so it needed the specific discipline
of walking the page as a keyboard-only user would, not just clicking through
it faster than a person could.
