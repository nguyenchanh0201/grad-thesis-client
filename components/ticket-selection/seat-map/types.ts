export type SeatStatus = "available" | "reserved" | "sold";

export type Seat = {
  id: string;
  label: string; // "A1" — shown in ARIA label
  rowLabel: string; // "A"
  number: number;
  status: SeatStatus;
  zoneId: string;
};

export type SeatRow = {
  id: string;
  label: string;
  seats: Seat[];
};

export type TheaterMapConfig = {
  type: "theater";
  rows: SeatRow[];
};

export type StadiumSection = {
  id: string;
  label: string;
  zoneId: string;
  rows: SeatRow[];
  // position in the 320×270 overview SVG
  svgX: number;
  svgY: number;
  svgW: number;
  svgH: number;
};

export type StadiumMapConfig = {
  type: "stadium";
  sections: StadiumSection[];
};

export type ZoneMapConfig = { type: "zone" };

export type SeatMapConfig = ZoneMapConfig | TheaterMapConfig | StadiumMapConfig;

export type SelectedSeat = {
  id: string;
  label: string;
  zoneId: string;
};
