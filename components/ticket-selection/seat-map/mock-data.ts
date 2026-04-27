import type {
  Seat,
  SeatRow,
  SeatStatus,
  StadiumMapConfig,
  TheaterMapConfig,
} from "./types";

function makeSeat(
  rowLabel: string,
  num: number,
  zoneId: string,
  soldSet: Set<string>,
  reservedSet: Set<string>,
): Seat {
  const id = `${rowLabel}-${num}`;
  let status: SeatStatus = "available";
  if (soldSet.has(id)) status = "sold";
  else if (reservedSet.has(id)) status = "reserved";
  return {
    id,
    label: `${rowLabel}${num}`,
    rowLabel,
    number: num,
    status,
    zoneId,
  };
}

function makeRow(
  label: string,
  count: number,
  zoneId: string,
  sold: Set<string>,
  reserved: Set<string>,
): SeatRow {
  return {
    id: label,
    label,
    seats: Array.from({ length: count }, (_, i) =>
      makeSeat(label, i + 1, zoneId, sold, reserved),
    ),
  };
}

// ─── Theater ─────────────────────────────────────────────────────────────────

const THEATER_SOLD = new Set([
  "A-2",
  "A-3",
  "B-7",
  "B-8",
  "C-12",
  "C-13",
  "D-4",
  "D-5",
  "E-10",
  "E-11",
  "F-1",
  "F-2",
  "G-6",
  "G-7",
  "H-9",
  "H-10",
  "I-3",
  "J-11",
  "K-14",
  "L-8",
]);
const THEATER_RESERVED = new Set([
  "A-7",
  "B-2",
  "C-5",
  "D-12",
  "E-7",
  "F-14",
  "G-10",
  "H-4",
  "I-7",
  "J-6",
  "K-2",
  "L-13",
]);

const THEATER_ZONE: Record<string, string> = {
  A: "vip",
  B: "vip",
  C: "vip",
  D: "standard",
  E: "standard",
  F: "standard",
  G: "standard",
  H: "standard",
  I: "economy",
  J: "economy",
  K: "economy",
  L: "economy",
};

export function generateTheaterConfig(): TheaterMapConfig {
  const labels = "ABCDEFGHIJKL".split("");
  return {
    type: "theater",
    rows: labels.map((l) =>
      makeRow(l, 14, THEATER_ZONE[l], THEATER_SOLD, THEATER_RESERVED),
    ),
  };
}

// ─── Stadium ──────────────────────────────────────────────────────────────────

function makeStadiumRows(
  prefix: string,
  rowCount: number,
  seatCount: number,
  zoneId: string,
): SeatRow[] {
  const rowLabels = "ABCDE".split("").slice(0, rowCount);
  // ~15% sold, ~8% reserved, deterministic by position
  const sold = new Set(
    rowLabels.flatMap((r) =>
      Array.from(
        { length: seatCount },
        (_, i) => `${prefix}-${r}-${i + 1}`,
      ).filter((_, i) => (i + prefix.charCodeAt(0)) % 7 === 0),
    ),
  );
  const reserved = new Set(
    rowLabels.flatMap((r) =>
      Array.from(
        { length: seatCount },
        (_, i) => `${prefix}-${r}-${i + 1}`,
      ).filter((_, i) => (i + prefix.charCodeAt(0)) % 11 === 0),
    ),
  );

  return rowLabels.map((r) => ({
    id: `${prefix}-${r}`,
    label: r,
    seats: Array.from({ length: seatCount }, (_, i) => {
      const id = `${prefix}-${r}-${i + 1}`;
      let status: SeatStatus = "available";
      if (sold.has(id)) status = "sold";
      else if (reserved.has(id)) status = "reserved";
      return {
        id,
        label: `${r}${i + 1}`,
        rowLabel: r,
        number: i + 1,
        status,
        zoneId,
      };
    }),
  }));
}

export function generateStadiumConfig(): StadiumMapConfig {
  return {
    type: "stadium",
    sections: [
      {
        id: "svip",
        label: "SVIP",
        zoneId: "s-vip-front",
        rows: makeStadiumRows("svip", 4, 10, "s-vip-front"),
        svgX: 90,
        svgY: 56,
        svgW: 140,
        svgH: 36,
      },
      {
        id: "vip-l",
        label: "VIP Left",
        zoneId: "s-vip-side",
        rows: makeStadiumRows("vip-l", 5, 12, "s-vip-side"),
        svgX: 10,
        svgY: 56,
        svgW: 72,
        svgH: 80,
      },
      {
        id: "vip-r",
        label: "VIP Right",
        zoneId: "s-vip-side",
        rows: makeStadiumRows("vip-r", 5, 12, "s-vip-side"),
        svgX: 238,
        svgY: 56,
        svgW: 72,
        svgH: 80,
      },
      {
        id: "std-l",
        label: "Std Left",
        zoneId: "s-standard",
        rows: makeStadiumRows("std-l", 5, 14, "s-standard"),
        svgX: 10,
        svgY: 148,
        svgW: 145,
        svgH: 46,
      },
      {
        id: "std-r",
        label: "Std Right",
        zoneId: "s-standard",
        rows: makeStadiumRows("std-r", 5, 14, "s-standard"),
        svgX: 165,
        svgY: 148,
        svgW: 145,
        svgH: 46,
      },
      {
        id: "eco",
        label: "Economy",
        zoneId: "s-economy",
        rows: makeStadiumRows("eco", 5, 16, "s-economy"),
        svgX: 10,
        svgY: 204,
        svgW: 300,
        svgH: 46,
      },
    ],
  };
}
