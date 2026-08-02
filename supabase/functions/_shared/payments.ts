// Shared, server-owned payment rules for the German launch market.
export const CURRENCY = "eur";
export const AUCTION_DEPOSIT_CENTS = 50_000;

export type SubscriptionPlan = {
  tier: string;
  maxListings: number;
  amountCents: number;
  interval: "month";
  trialDays: number;
};
export type FixedPricePlan = { amountCents: number; label: string };
export type CheckoutType =
  | "boost"
  | "inspection_booking"
  | "reservation_deposit"
  | "arbitrage_dealer_payment"
  | "auction_winner_payment";

/** Stripe lookup keys are stable across sandbox and live environments. */
export function subscriptionCatalog(): Record<string, SubscriptionPlan> {
  return {
    price_de_dealer_pro: {
      tier: "dealer_pro",
      maxListings: 30,
      amountCents: 4_999,
      interval: "month",
      trialDays: 60,
    },
  };
}

export function boostCatalog(): Record<number, FixedPricePlan> {
  return {
    3: { amountCents: 500, label: "3-Tage-Boost" },
    7: { amountCents: 1_000, label: "7-Tage-Boost" },
    14: { amountCents: 1_800, label: "14-Tage-Boost" },
  };
}

export function inspectionCatalog(): Record<string, FixedPricePlan> {
  return {
    standard_200: { amountCents: 24_900, label: "200-Punkte-Fahrzeugprüfung" },
    premium_300: { amountCents: 34_900, label: "Premium-300-Punkte-Fahrzeugprüfung" },
  };
}

export function checkoutMetadata(
  type: CheckoutType,
  expectedAmount: number,
  values: Record<string, string>,
): Record<string, string> {
  if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) {
    throw new Error("Invalid checkout amount");
  }
  return {
    ...values,
    type,
    expected_amount: String(expectedAmount),
    currency: CURRENCY,
  };
}

export type PaidCheckout = {
  id: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string> | null;
};

export function assertPaidCheckout(session: PaidCheckout): void {
  const expected = Number(session.metadata?.expected_amount || "NaN");
  const expectedCurrency = session.metadata?.currency;
  if (
    session.payment_status !== "paid" ||
    !Number.isSafeInteger(expected) ||
    expected <= 0 ||
    session.amount_total !== expected ||
    session.currency !== expectedCurrency ||
    expectedCurrency !== CURRENCY
  ) {
    throw new Error(`Checkout verification failed for ${session.id}`);
  }
}
