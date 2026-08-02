// Shared payment constants for Zivvo (German market, EUR).
export const CURRENCY = "eur";

export type SubscriptionPlan = { tier: string; maxListings: number };

/**
 * Subscription plans keyed by the human-readable Stripe price lookup key.
 * Lookup keys are stable across sandbox and live, unlike `price_xxx` ids.
 */
export function subscriptionCatalog(): Record<string, SubscriptionPlan> {
  return {
    price_de_dealer_pro: { tier: "dealer_pro", maxListings: 30 },
  };
}
