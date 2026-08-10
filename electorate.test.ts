import { describe, expect, it } from "vitest";
import { ELECTORATE, PRESETS, tally } from "./electorate";

describe("electorate", () => {
  it("is fixed at 30 A voters and 20 B voters, whatever the districts do", () => {
    expect(ELECTORATE.filter((p) => p === "A").length).toBe(30);
    expect(ELECTORATE.filter((p) => p === "B").length).toBe(20);
  });
});

describe("presets", () => {
  it("each covers all 50 cells in five equal-population districts", () => {
    for (const preset of Object.values(PRESETS)) {
      expect(preset.districts).toHaveLength(50);
      const sizes = new Map<number, number>();
      for (const d of preset.districts) sizes.set(d, (sizes.get(d) ?? 0) + 1);
      expect(sizes.size).toBe(5);
      for (const size of sizes.values()) expect(size).toBe(10);
    }
  });

  it("compact districts split seats roughly proportionally: 3 A, 2 B", () => {
    const t = tally(PRESETS.compact.districts);
    expect([t.seatsA, t.seatsB]).toEqual([3, 2]);
  });

  it("cracking B across every district shuts B out entirely: 5 A, 0 B", () => {
    const t = tally(PRESETS.cracked.districts);
    expect([t.seatsA, t.seatsB]).toEqual([5, 0]);
  });

  it("packing B into one landslide seat still costs B seats overall: 4 A, 1 B", () => {
    const t = tally(PRESETS.packed.districts);
    expect([t.seatsA, t.seatsB]).toEqual([4, 1]);
  });

  it("the same fixed vote share produces three different seat counts", () => {
    const outcomes = Object.values(PRESETS).map((p) => {
      const t = tally(p.districts);
      return `${t.seatsA}-${t.seatsB}`;
    });
    expect(new Set(outcomes).size).toBe(3);
  });
});
