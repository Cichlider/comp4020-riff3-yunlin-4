// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The brief's core-interaction test: "the visitor does something that
// changes what they see". Here, clicking a voter cell moves it into the
// currently selected district, and the seat tally on screen updates to
// match — without a page reload or any change to the underlying votes.
describe("the districting mechanic", () => {
  beforeEach(async () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch![1].replace(
      /<script[\s\S]*?<\/script>/,
      "",
    );
    document.title = "test";
    // main.ts renders immediately on import, against the DOM set up above.
    vi.resetModules();
    await import("../main");
  });

  it("renders a 50-cell grid and a five-row tally", () => {
    expect(document.querySelectorAll("#grid .cell")).toHaveLength(50);
    expect(document.querySelectorAll("#tally-table tbody tr")).toHaveLength(
      5,
    );
  });

  it("starts on the compact preset: a 3-2 split, 60/40 vote share unchanged", () => {
    const summary = document.querySelector(
      '[data-testid="seats-summary"]',
    )!.textContent;
    expect(summary).toContain("Party A wins 3 of 5 seats");
    expect(summary).toContain("Party B wins 2");
    expect(
      document.querySelector('[data-testid="votes-recap"]')!.textContent,
    ).toContain("60%");
  });

  it("clicking a cell moves it to the selected district and the tally updates", () => {
    const rows = () =>
      [...document.querySelectorAll("#tally-table tbody tr")].map(
        (tr) => tr.textContent,
      );
    const before = rows();

    // Select district 5, then reassign the very first cell (district 1
    // under the compact preset, a 10-B/0-A seat) into it.
    const swatches = document.querySelectorAll<HTMLButtonElement>(
      ".palette .swatch",
    );
    swatches[4].click();
    const firstCell = document.querySelector<HTMLButtonElement>(
      "#grid .cell",
    )!;
    expect(firstCell.getAttribute("aria-label")).toContain("district 5");
    firstCell.click();

    // renderGrid() rebuilds the cells on click, so re-query rather than
    // reuse the (now detached) old node.
    const firstCellAfter = document.querySelector<HTMLButtonElement>(
      "#grid .cell",
    )!;
    expect(firstCellAfter.getAttribute("aria-label")).toContain(
      "currently district 5",
    );
    const after = rows();
    expect(after).not.toEqual(before);
    // District 1 (10 B, 0 A) lost a voter to district 5 (10 A, 0 B), which
    // is now an 11-voter district with its first B voter.
    expect(after[0]).toContain("9");
    expect(after[4]).toContain("11");
  });

  it("loading the cracked preset shuts B out despite its fixed 40% vote share", () => {
    const presetButtons = document.querySelectorAll<HTMLButtonElement>(
      ".presets .preset",
    );
    const cracked = [...presetButtons].find((b) =>
      b.textContent?.includes("Cracked"),
    )!;
    cracked.click();

    const summary = document.querySelector(
      '[data-testid="seats-summary"]',
    )!.textContent;
    expect(summary).toContain("Party A wins 5 of 5 seats");
    expect(summary).toContain("Party B wins 0");
    expect(
      document.querySelector('[data-testid="votes-recap"]')!.textContent,
    ).toContain("40%");
  });
});
