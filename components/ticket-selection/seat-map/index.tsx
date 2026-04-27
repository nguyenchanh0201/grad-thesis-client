"use client";

import { TheaterMap } from "./theater-map";
import { StadiumMap } from "./stadium-map";
import type { TheaterMapConfig, StadiumMapConfig, SelectedSeat } from "./types";

type Props = {
  config: TheaterMapConfig | StadiumMapConfig;
  selectedSeats: string[];
  maxSeats?: number;
  onSeatToggle: (seat: SelectedSeat) => void;
};

export type {
  SeatMapConfig,
  TheaterMapConfig,
  StadiumMapConfig,
  SelectedSeat,
} from "./types";
export { generateTheaterConfig, generateStadiumConfig } from "./mock-data";

export function SeatMap({
  config,
  selectedSeats,
  maxSeats = 8,
  onSeatToggle,
}: Props) {
  if (config.type === "theater") {
    return (
      <TheaterMap
        config={config}
        selectedSeats={selectedSeats}
        maxSeats={maxSeats}
        onSeatToggle={onSeatToggle}
      />
    );
  }
  if (config.type === "stadium") {
    return (
      <StadiumMap
        config={config}
        selectedSeats={selectedSeats}
        maxSeats={maxSeats}
        onSeatToggle={onSeatToggle}
      />
    );
  }
  return null;
}
