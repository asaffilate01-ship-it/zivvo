import { describe, expect, it } from "vitest";
import {
  assertPaidCheckout,
  AUCTION_DEPOSIT_CENTS,
  boostCatalog,
  checkoutMetadata,
  CURRENCY,
  inspectionCatalog,
  subscriptionCatalog,
} from "../../supabase/functions/_shared/payments";

describe("production payment contracts", () => {
  it("keeps launch prices server-owned and EUR-only", () => {
    expect(CURRENCY).toBe("eur");
    expect(AUCTION_DEPOSIT_CENTS).toBe(50_000);
    expect(boostCatalog()[7].amountCents).toBe(1_000);
    expect(inspectionCatalog().standard_200.amountCents).toBe(24_900);
    expect(subscriptionCatalog().price_de_dealer_pro).toMatchObject({ amountCents: 4_999, trialDays: 60 });
  });

  it("writes webhook verification metadata", () => {
    expect(checkoutMetadata("boost", 1_000, { listing_id: "listing" })).toEqual({
      listing_id: "listing",
      type: "boost",
      expected_amount: "1000",
      currency: "eur",
    });
    expect(() => checkoutMetadata("boost", 0, {})).toThrow("Invalid checkout amount");
  });

  it("rejects unpaid, altered, or non-EUR sessions", () => {
    const valid = {
      id: "cs_valid",
      payment_status: "paid",
      amount_total: 1_000,
      currency: "eur",
      metadata: { expected_amount: "1000", currency: "eur" },
    };
    expect(() => assertPaidCheckout(valid)).not.toThrow();
    expect(() => assertPaidCheckout({ ...valid, amount_total: 999 })).toThrow("Checkout verification failed");
    expect(() => assertPaidCheckout({ ...valid, payment_status: "unpaid" })).toThrow("Checkout verification failed");
    expect(() => assertPaidCheckout({ ...valid, currency: "gbp" })).toThrow("Checkout verification failed");
  });
});
