import { describe, expect, it } from "vitest";

import { TicketTypeSchema } from "./ticket-type.schema";

const backendTicketType = {
  id: "1",
  eventId: "10",
  typeName: "VIP Floor",
  desc: "Best view",
  price: "2500000",
  currency: "VND",
  totalQuantity: 12,
};

describe("TicketTypeSchema", () => {
  it("parses the public backend shape without availability", () => {
    expect(TicketTypeSchema.parse(backendTicketType)).toEqual({
      id: "1",
      eventId: "10",
      name: "VIP Floor",
      description: "Best view",
      price: 2500000,
      currency: "VND",
      quantity: 12,
      soldCount: undefined,
    });
  });

  it("derives sold count when the backend includes availability", () => {
    expect(
      TicketTypeSchema.parse({
        ...backendTicketType,
        availableQuantity: 7,
      }),
    ).toMatchObject({
      quantity: 12,
      soldCount: 5,
    });
  });

  it("normalizes a string backend price to a number", () => {
    expect(TicketTypeSchema.parse(backendTicketType).price).toBe(2500000);
  });

  it("preserves the normalized frontend shape", () => {
    expect(
      TicketTypeSchema.parse({
        id: "2",
        eventId: "10",
        name: "Balcony",
        description: null,
        price: 1200000,
        currency: "VND",
        quantity: 16,
        soldCount: 2,
      }),
    ).toEqual({
      id: "2",
      eventId: "10",
      name: "Balcony",
      description: undefined,
      price: 1200000,
      currency: "VND",
      quantity: 16,
      soldCount: 2,
    });
  });

  it("rejects a ticket type without either backend or frontend naming", () => {
    expect(() =>
      TicketTypeSchema.parse({
        ...backendTicketType,
        typeName: undefined,
      }),
    ).toThrow();
  });

  it("never derives a negative sold count", () => {
    expect(
      TicketTypeSchema.parse({
        ...backendTicketType,
        availableQuantity: 20,
      }).soldCount,
    ).toBe(0);
  });
});
