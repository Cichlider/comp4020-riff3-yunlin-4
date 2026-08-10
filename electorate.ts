// Pure data and logic for the districting mechanic — no DOM here, so the
// numbers can be tested on their own (see electorate.test.ts) independently
// of how they're rendered.

export const ROWS = 5;
export const COLS = 10;
export const DISTRICT_COUNT = 5;
export const DISTRICT_SIZE = (ROWS * COLS) / DISTRICT_COUNT;

export type Party = "A" | "B";
export type DistrictMap = number[]; // length ROWS*COLS, values 0..DISTRICT_COUNT-1

function idx(r: number, c: number): number {
  return r * COLS + c;
}

// The electorate never changes: 30 A voters and 20 B voters (60% / 40%),
// arranged as a contiguous four-column bloc — a real, compact community,
// not noise. Every preset below redraws district lines over this same map.
export const ELECTORATE: Party[] = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, (_, c) => (c < 4 ? "B" : "A")),
).flat();

function buildCompact(): DistrictMap {
  const map: number[] = Array.from({ length: ROWS * COLS });
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) map[idx(r, c)] = Math.floor(c / 2);
  }
  return map;
}

function buildCracked(): DistrictMap {
  const map: number[] = Array.from({ length: ROWS * COLS });
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) map[idx(r, c)] = r;
  }
  return map;
}

function buildPacked(): DistrictMap {
  const map: number[] = Array.from({ length: ROWS * COLS }, () => -1);
  const set = (r: number, c: number, d: number) => {
    map[idx(r, c)] = d;
  };
  // District 4: a landslide B seat, packed with more B voters than it needs.
  for (const c of [0, 1, 2, 3]) {
    set(0, c, 4);
    set(1, c, 4);
  }
  set(2, 0, 4);
  set(2, 1, 4);
  // District 0: the rest of row 2, plus two spare A cells from row 0.
  for (const c of [2, 3, 4, 5, 6, 7, 8, 9]) set(2, c, 0);
  set(0, 4, 0);
  set(0, 5, 0);
  // Districts 1 and 2: whole rows, each with B spread too thin to win.
  for (const c of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    set(3, c, 1);
    set(4, c, 2);
  }
  // District 3: what's left of rows 0 and 1.
  for (const c of [6, 7, 8, 9]) set(0, c, 3);
  for (const c of [4, 5, 6, 7, 8, 9]) set(1, c, 3);
  return map;
}

export interface Preset {
  label: string;
  description: string;
  districts: DistrictMap;
}

export const PRESETS: Record<"compact" | "cracked" | "packed", Preset> = {
  compact: {
    label: "Compact",
    description:
      "Five column-pair districts, each a contiguous slice of the map that respects the B bloc on the left.",
    districts: buildCompact(),
  },
  cracked: {
    label: "Cracked",
    description:
      "Each district reaches across the whole map, so B is a slim minority everywhere and wins nothing.",
    districts: buildCracked(),
  },
  packed: {
    label: "Packed",
    description:
      "Most of B is crowded into one landslide district; what's left is spread too thin to win anywhere else.",
    districts: buildPacked(),
  },
};

export interface DistrictResult {
  district: number;
  a: number;
  b: number;
  winner: Party | "tie";
}

export interface Tally {
  districts: DistrictResult[];
  seatsA: number;
  seatsB: number;
  seatsTie: number;
  votesA: number;
  votesB: number;
}

export function tally(districts: DistrictMap): Tally {
  const counts = new Map<number, { a: number; b: number }>();
  for (let i = 0; i < districts.length; i++) {
    const d = districts[i];
    const bucket = counts.get(d) ?? { a: 0, b: 0 };
    if (ELECTORATE[i] === "A") bucket.a++;
    else bucket.b++;
    counts.set(d, bucket);
  }
  const results: DistrictResult[] = [...counts.entries()]
    .sort(([x], [y]) => x - y)
    .map(([district, { a, b }]) => ({
      district,
      a,
      b,
      winner: a > b ? "A" : b > a ? "B" : "tie",
    }));
  let seatsA = 0;
  let seatsB = 0;
  let seatsTie = 0;
  for (const r of results) {
    if (r.winner === "A") seatsA++;
    else if (r.winner === "B") seatsB++;
    else seatsTie++;
  }
  return {
    districts: results,
    seatsA,
    seatsB,
    seatsTie,
    votesA: ELECTORATE.filter((p) => p === "A").length,
    votesB: ELECTORATE.filter((p) => p === "B").length,
  };
}
