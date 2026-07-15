import assert from "node:assert/strict";
import {
  decrementZoneTickets,
  incrementZoneTickets,
} from "../lib/booking/ticket-quantity.ts";

const MAX_PER_ORDER = 6;
const TICKET_TYPES = [
  { id: "vip", quantity: 16, soldCount: 0 },
  { id: "balcony", quantity: 16, soldCount: 0 },
];

function getQty(tickets, id) {
  return tickets.find((ticket) => ticket.ticketTypeId === id)?.quantity ?? 0;
}

function plus(tickets, ticketTypeId) {
  return incrementZoneTickets({
    tickets,
    ticketTypes: TICKET_TYPES,
    ticketTypeId,
    maxPerOrder: MAX_PER_ORDER,
  });
}

function minus(tickets, ticketTypeId) {
  return decrementZoneTickets({ tickets, ticketTypeId });
}

function assertDelta(before, after, ticketTypeId, expectedDelta) {
  const beforeQty = getQty(before, ticketTypeId);
  const afterQty = getQty(after, ticketTypeId);
  assert.equal(
    afterQty - beforeQty,
    expectedDelta,
    `${ticketTypeId} expected delta ${expectedDelta}, got ${afterQty - beforeQty}`,
  );
}

function run() {
  let tickets = [];

  // VIP x6 should work one step at a time.
  for (let i = 1; i <= 6; i += 1) {
    const before = tickets;
    tickets = plus(tickets, "vip");
    assertDelta(before, tickets, "vip", 1);
    assert.equal(getQty(tickets, "vip"), i);
  }
  {
    const before = tickets;
    tickets = plus(tickets, "vip");
    assertDelta(before, tickets, "vip", 0);
    assert.equal(getQty(tickets, "vip"), 6);
  }

  // Reset and Balcony x6 should work one step at a time.
  tickets = [];
  for (let i = 1; i <= 6; i += 1) {
    const before = tickets;
    tickets = plus(tickets, "balcony");
    assertDelta(before, tickets, "balcony", 1);
    assert.equal(getQty(tickets, "balcony"), i);
  }
  {
    const before = tickets;
    tickets = plus(tickets, "balcony");
    assertDelta(before, tickets, "balcony", 0);
    assert.equal(getQty(tickets, "balcony"), 6);
  }

  // Mixed VIP x3 + Balcony x3 should succeed and total = 6.
  tickets = [];
  for (let i = 1; i <= 3; i += 1) {
    const before = tickets;
    tickets = plus(tickets, "vip");
    assertDelta(before, tickets, "vip", 1);
    assert.equal(getQty(tickets, "vip"), i);
  }
  for (let i = 1; i <= 3; i += 1) {
    const before = tickets;
    tickets = plus(tickets, "balcony");
    assertDelta(before, tickets, "balcony", 1);
    assert.equal(getQty(tickets, "balcony"), i);
  }
  assert.equal(getQty(tickets, "vip"), 3);
  assert.equal(getQty(tickets, "balcony"), 3);
  assert.equal(
    tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
    6,
  );

  // Decrease checks should always be -1 until removed.
  {
    const before = tickets;
    tickets = minus(tickets, "vip");
    assertDelta(before, tickets, "vip", -1);
    assert.equal(getQty(tickets, "vip"), 2);
  }
  {
    const before = tickets;
    tickets = minus(tickets, "balcony");
    assertDelta(before, tickets, "balcony", -1);
    assert.equal(getQty(tickets, "balcony"), 2);
  }
  {
    const before = tickets;
    tickets = minus(tickets, "vip");
    assertDelta(before, tickets, "vip", -1);
    tickets = minus(tickets, "vip");
    assert.equal(getQty(tickets, "vip"), 0);
  }

  console.log("PASS: ticket quantity +/- behavior is correct.");
}

run();
