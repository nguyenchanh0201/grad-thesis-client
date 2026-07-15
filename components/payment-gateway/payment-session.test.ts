import { describe, expect, it } from "vitest";

import {
  hasActiveInitiatedPaymentForMethod,
  shouldPreparePayment,
} from "./payment-session";

describe("payment-session", () => {
  it("detects an initiated payment for the current method", () => {
    expect(
      hasActiveInitiatedPaymentForMethod(
        {
          status: "INITIATED",
          methodId: "vnpay",
          paymentUrl: "https://pay.example/checkout",
        },
        "vnpay",
      ),
    ).toBe(true);
  });

  it("does not prepare payment when confirmation has an active initiated payment", () => {
    expect(
      shouldPreparePayment({
        reservationId: "42",
        methodId: "vnpay",
        reservationStatus: "PAYMENT_LOCKED",
        payment: {
          status: "INITIATED",
          methodId: "vnpay",
          paymentUrl: "https://pay.example/checkout",
        },
        isPreparing: false,
        prepareFailed: false,
      }),
    ).toBe(false);
  });

  it("prepares payment once when no active initiated payment exists", () => {
    expect(
      shouldPreparePayment({
        reservationId: "42",
        methodId: "vnpay",
        reservationStatus: "PENDING",
        payment: null,
        isPreparing: false,
        prepareFailed: false,
      }),
    ).toBe(true);
  });

  it("does not auto-prepare a payment-locked reservation without a reusable URL", () => {
    expect(
      shouldPreparePayment({
        reservationId: "42",
        methodId: "vnpay",
        reservationStatus: "PAYMENT_LOCKED",
        payment: {
          status: "INITIATED",
          methodId: "vnpay",
          paymentUrl: null,
        },
        isPreparing: false,
        prepareFailed: false,
      }),
    ).toBe(false);
  });

  it("does not prepare again after the same method has been prepared", () => {
    expect(
      shouldPreparePayment({
        reservationId: "42",
        methodId: "vnpay",
        reservationStatus: "PENDING",
        payment: null,
        preparedMethodId: "vnpay",
        isPreparing: false,
        prepareFailed: false,
      }),
    ).toBe(false);
  });

  it("does not let a failed prepare mask an active payment from confirmation", () => {
    expect(
      shouldPreparePayment({
        reservationId: "42",
        methodId: "vnpay",
        reservationStatus: "PAYMENT_LOCKED",
        payment: {
          status: "INITIATED",
          methodId: "vnpay",
          paymentUrl: "https://pay.example/checkout",
        },
        isPreparing: false,
        prepareFailed: true,
      }),
    ).toBe(false);
  });

  it("does not prepare payment for terminal reservations", () => {
    expect(
      shouldPreparePayment({
        reservationId: "42",
        methodId: "vnpay",
        reservationStatus: "EXPIRED",
        payment: null,
        isPreparing: false,
        prepareFailed: false,
      }),
    ).toBe(false);
  });
});
