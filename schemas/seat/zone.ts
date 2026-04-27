export type ZoneColorKey = "a" | "b" | "c" | "d" | "stage";
export type ZoneMode = "zone" | "seat";
export type Zone = {
  id: string;
  label: string;
  price: number;
  colorKey: ZoneColorKey;
  available: number;
};
