import { describe, expect, it } from "vitest";
import { isReservationActionable, reservationNeedsAttention, reservationRemaining } from "@/lib/reservationLifecycle";

describe("reservation lifecycle", () => {
  const now = new Date("2026-08-02T12:00:00.000Z").getTime();

  it("returns a stable countdown", () => {
    expect(reservationRemaining("2026-08-02T14:31:00.000Z", now)).toEqual({ expired: false, totalMinutes: 151, hours: 2, minutes: 31 });
  });

  it("never returns a negative remaining time", () => {
    expect(reservationRemaining("2026-08-02T11:00:00.000Z", now)).toEqual({ expired: true, totalMinutes: 0, hours: 0, minutes: 0 });
  });

  it("only permits dealer actions for verified paid reservations", () => {
    expect(isReservationActionable("paid")).toBe(true);
    expect(isReservationActionable("pending")).toBe(false);
    expect(isReservationActionable("expiry_processing")).toBe(false);
  });

  it("flags failures and reservations near expiry", () => {
    expect(reservationNeedsAttention("refund_failed", null, now)).toBe(true);
    expect(reservationNeedsAttention("paid", "2026-08-02T16:00:00.000Z", now)).toBe(true);
    expect(reservationNeedsAttention("paid", "2026-08-03T12:00:00.000Z", now)).toBe(false);
  });
});
