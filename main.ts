import {
  COLS,
  DISTRICT_COUNT,
  ELECTORATE,
  PRESETS,
  ROWS,
  tally,
  type DistrictMap,
} from "./electorate";

// Party identity is never color alone: every cell also carries an A/B
// letter, and every district is also a numeral. Colors reinforce; labels
// carry the meaning (see dataviz skill's "never color alone" rule).
const PARTY_COLOR: Record<"A" | "B", string> = { A: "#2a78d6", B: "#e34948" };
const DISTRICT_COLOR = ["#eb6834", "#1baf7a", "#eda100", "#008300", "#4a3aa7"];

let districts: DistrictMap = [...PRESETS.compact.districts];
let activeDistrict = 0;

const palette = document.querySelector<HTMLElement>(".palette");
const grid = document.querySelector<HTMLElement>("#grid");
const presetsEl = document.querySelector<HTMLElement>(".presets");
const tallyBody = document.querySelector<HTMLElement>("#tally-table tbody");
const seatsSummary = document.querySelector<HTMLElement>(
  '[data-testid="seats-summary"]',
);

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
    });
    palette.append(button);
  }
}

function renderGrid(): void {
  if (!grid) return;
  grid.innerHTML = "";
  grid.style.setProperty("--cols", String(COLS));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const party = ELECTORATE[i];
      const d = districts[i];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.style.setProperty("--party-color", PARTY_COLOR[party]);
      cell.style.setProperty("--district-color", DISTRICT_COLOR[d]);
      cell.setAttribute(
        "aria-label",
        `Row ${r + 1}, column ${c + 1}: Party ${party} voter, currently district ${d + 1}. Activate to move it into district ${activeDistrict + 1}.`,
      );
      cell.innerHTML = `<span aria-hidden="true">${party}</span><span class="district-badge" aria-hidden="true">${d + 1}</span>`;
      cell.addEventListener("click", () => {
        districts[i] = activeDistrict;
        renderGrid();
        renderTally();
      });
      grid.append(cell);
    }
  }
}

function renderTally(): void {
  if (!tallyBody || !seatsSummary) return;
  const t = tally(districts);
  tallyBody.innerHTML = "";
  for (const row of t.districts) {
    const tr = document.createElement("tr");
    const winnerText =
      row.winner === "tie" ? "tie" : `Party ${row.winner}`;
    tr.innerHTML = `
      <th scope="row">District ${row.district + 1}</th>
      <td>${row.a + row.b}</td>
      <td>${row.a}</td>
      <td>${row.b}</td>
      <td>${winnerText}</td>
    `;
    tallyBody.append(tr);
  }
  seatsSummary.textContent = `With these lines: Party A wins ${t.seatsA} of 5 seats, Party B wins ${t.seatsB}${t.seatsTie ? `, ${t.seatsTie} tied` : ""} — from a vote that never left 60% A / 40% B.`;
}

function renderPresets(): void {
  if (!presetsEl) return;
  presetsEl.innerHTML = "";
  for (const preset of Object.values(PRESETS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset";
    button.textContent = `Load: ${preset.label}`;
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
