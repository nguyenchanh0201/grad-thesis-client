import assert from "node:assert/strict";
import { toSeatSelectionId } from "../lib/booking/seat-selection-id.ts";

function run() {
  const vipSeat0 = toSeatSelectionId("vip", 0);
  const balconySeat0 = toSeatSelectionId("balcony", 0);
  const vipSeat1 = toSeatSelectionId("vip", 1);

  assert.notEqual(
    vipSeat0,
    balconySeat0,
    "Different ticket types with same seatIndex must not collide",
  );
  assert.notEqual(vipSeat0, vipSeat1, "Same ticket type must differ by seatIndex");
  assert.equal(vipSeat0, "vip:0");
  assert.equal(balconySeat0, "balcony:0");

  console.log("PASS: seat selection IDs are collision-safe across ticket types.");
}

run();
