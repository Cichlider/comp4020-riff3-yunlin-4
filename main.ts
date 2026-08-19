import {
  COLS,
  DISTRICT_COUNT,
  ELECTORATE,
  PRESETS,
  ROWS,
  tally,
  type DistrictMap,
  type Tally,
} from "./electorate";

// Party identity is never color alone: every cell also carries an A/B
// letter, and every district is also a numeral. Colors reinforce; labels
// carry the meaning (see dataviz skill's "never color alone" rule).
const PARTY_COLOR: Record<"A" | "B", string> = { A: "#2466b6", B: "#c13e3d" };
const DISTRICT_COLOR = ["#eb6834", "#1baf7a", "#eda100", "#008300", "#4a3aa7"];
const TIE_COLOR = "#767671";

let districts: DistrictMap = [...PRESETS.compact.districts];
let activeDistrict = 0;
let painting = false;

const palette = document.querySelector<HTMLElement>(".palette");
const grid = document.querySelector<HTMLElement>("#grid");
const presetsEl = document.querySelector<HTMLElement>(".presets");
const tallyBody = document.querySelector<HTMLElement>("#tally-table tbody");
const seatBar = document.querySelector<HTMLElement>("#seat-bar");
const seatsSummary = document.querySelector<HTMLElement>(
  '[data-testid="seats-summary"]',
);

let cellEls: HTMLButtonElement[] = [];

function renderPalette(): void {
  if (!palette) return;
  palette.innerHTML = "";
  for (let d = 0; d < DISTRICT_COUNT; d++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.setAttribute("aria-pressed", String(d === activeDistrict));
    button.style.setProperty("--swatch-color", DISTRICT_COLOR[d]);
    button.innerHTML = `<span class="swatch-chip" aria-hidden="true">${d + 1}</span> District ${d + 1}`;
    button.addEventListener("click", () => {
      activeDistrict = d;
      renderPalette();
      // Every cell's label names the district a click would move it into,
      // so it goes stale the moment the active district changes.
      renderGrid();
      // Both renders rebuild their buttons from scratch, which drops
      // keyboard focus onto <body> — restore it to the new equivalent
      // button so a keyboard user isn't bounced to the top of the page.
      focusPaletteButton(d);
    });
    palette.append(button);
  }
}

function focusPaletteButton(d: number): void {
  palette?.querySelectorAll<HTMLButtonElement>(".swatch")[d]?.focus();
}

// A cell's district border only appears on the sides that actually face a
// different district (or the edge of the town), the way a real map draws
// one boundary line rather than outlining every precinct on its own. This
// replaces per-cell district-colored borders with a single accent (the
// corner badge), so each box carries one fill color and one boundary style,
// not three competing colors.
function neighborDiffers(i: number, dr: number, dc: number): boolean {
  const r = Math.floor(i / COLS) + dr;
  const c = (i % COLS) + dc;
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  return districts[r * COLS + c] !== districts[i];
}

function applyBoundary(i: number): void {
  const cell = cellEls[i];
  if (!cell) return;
  const top = neighborDiffers(i, -1, 0);
  const right = neighborDiffers(i, 0, 1);
  const bottom = neighborDiffers(i, 1, 0);
  const left = neighborDiffers(i, 0, -1);
  cell.style.borderTopWidth = top ? "3px" : "1px";
  cell.style.borderRightWidth = right ? "3px" : "1px";
  cell.style.borderBottomWidth = bottom ? "3px" : "1px";
  cell.style.borderLeftWidth = left ? "3px" : "1px";
  cell.style.borderTopColor = top ? "var(--ink)" : "var(--grid-line)";
  cell.style.borderRightColor = right ? "var(--ink)" : "var(--grid-line)";
  cell.style.borderBottomColor = bottom ? "var(--ink)" : "var(--grid-line)";
  cell.style.borderLeftColor = left ? "var(--ink)" : "var(--grid-line)";
}

function cellLabel(i: number): string {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const party = ELECTORATE[i];
  const d = districts[i];
  return `Row ${r + 1}, column ${c + 1}, Party ${party} voter, currently district ${d + 1}. Activate to move it into district ${activeDistrict + 1}.`;
}

function renderGrid(): void {
  if (!grid) return;
  grid.innerHTML = "";
  grid.style.setProperty("--cols", String(COLS));
  cellEls = Array.from({ length: ROWS * COLS });
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const party = ELECTORATE[i];
      const d = districts[i];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(i);
      cell.dataset.party = party;
      cell.dataset.district = String(d + 1);
      cell.style.setProperty("--party-color", PARTY_COLOR[party]);
      cell.style.setProperty("--district-color", DISTRICT_COLOR[d]);
      cell.setAttribute("aria-label", cellLabel(i));
      cell.addEventListener("click", () => paintCell(i));
      grid.append(cell);
      cellEls[i] = cell;
    }
  }
  for (let i = 0; i < cellEls.length; i++) applyBoundary(i);
}

// Painting updates only the affected cell and its up-to-four neighbors
// (whose boundary lines may now need to appear or disappear) instead of
// rebuilding the whole 50-cell grid, so dragging across the town stays
// smooth and keyboard focus is never dropped.
function paintCell(i: number): void {
  if (districts[i] === activeDistrict) return;
  districts[i] = activeDistrict;
  const cell = cellEls[i];
  cell.dataset.district = String(activeDistrict + 1);
  cell.style.setProperty("--district-color", DISTRICT_COLOR[activeDistrict]);
  cell.setAttribute("aria-label", cellLabel(i));
  applyBoundary(i);
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const neighbors: Array<[number, number]> = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];
  for (const [nr, nc] of neighbors) {
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      applyBoundary(nr * COLS + nc);
    }
  }
  renderTally();
}

function cellIndexAt(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  const cell = el instanceof Element ? el.closest<HTMLElement>(".cell") : null;
  if (!cell?.dataset.index) return null;
  return Number(cell.dataset.index);
}

function setUpPainting(): void {
  if (!grid) return;
  grid.addEventListener("pointerdown", (e) => {
    painting = true;
    const i = cellIndexAt(e.clientX, e.clientY);
    if (i !== null) paintCell(i);
  });
  grid.addEventListener("pointermove", (e) => {
    if (!painting) return;
    const i = cellIndexAt(e.clientX, e.clientY);
    if (i !== null) paintCell(i);
  });
  window.addEventListener("pointerup", () => {
    painting = false;
  });
  window.addEventListener("pointercancel", () => {
    painting = false;
  });
}

function renderSeatBar(t: Tally): void {
  if (!seatBar) return;
  seatBar.innerHTML = "";
  for (const row of t.districts) {
    const seat = document.createElement("div");
    seat.className = "seat";
    const color =
      row.winner === "A"
        ? PARTY_COLOR.A
        : row.winner === "B"
          ? PARTY_COLOR.B
          : TIE_COLOR;
    seat.style.setProperty("--seat-color", color);
    seat.innerHTML = `<span class="seat-district">District ${row.district + 1}</span><span class="seat-winner">${row.winner === "tie" ? "Tie" : `Party ${row.winner}`}</span>`;
    seatBar.append(seat);
  }
}

function renderTally(): void {
  if (!tallyBody || !seatsSummary) return;
  const t = tally(districts);
  tallyBody.innerHTML = "";
  for (const row of t.districts) {
    const tr = document.createElement("tr");
    const winnerText = row.winner === "tie" ? "tie" : `Party ${row.winner}`;
    tr.innerHTML = `
      <th scope="row">District ${row.district + 1}</th>
      <td>${row.a + row.b}</td>
      <td>${row.a}</td>
      <td>${row.b}</td>
      <td>${winnerText}</td>
    `;
    tallyBody.append(tr);
  }
  renderSeatBar(t);
  seatsSummary.textContent = `With these lines, Party A wins ${t.seatsA} of 5 seats, Party B wins ${t.seatsB}${t.seatsTie ? `, ${t.seatsTie} tied` : ""}, from a vote that never left 60% A and 40% B.`;
}

function renderPresets(): void {
  if (!presetsEl) return;
  presetsEl.innerHTML = "";
  for (const preset of Object.values(PRESETS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset";
    button.textContent = `Load ${preset.label}`;
    button.title = preset.description;
    button.addEventListener("click", () => {
      districts = [...preset.districts];
      renderGrid();
      renderTally();
    });
    presetsEl.append(button);
  }
}

renderPalette();
renderGrid();
renderTally();
renderPresets();
setUpPainting();
