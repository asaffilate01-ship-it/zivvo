import { HttpError, env } from "./security.ts";

export const CURRENCY = "eur";
export const AUCTION_DEPOSIT_CENTS = 50_000;

export const BOOST_PACKAGES: Record<number, { cents: number; label: string }> = {
  3: { cents: 500, label: "3-Tage-Boost" },
  7: { cents: 1_000, label: "7-Tage-Boost" },
  14: { cents: 1_800, label: "14-Tage-Boost" },
};

export const INSPECTION_PACKAGES: Record<string, { cents: number; label: string }> = {
  standard_200: { cents: 24_900, label: "200-Punkte-Fahrzeugprüfung" },
  premium_300: { cents: 34_900, label: "Premium 300-Punkte-Fahrzeugprüfung" },
};

export type DealerTier = "starter" | "professional" | "enterprise";

export function subscriptionCatalog(): Record<string, { tier: DealerTier; maxListings: number }> {
  return { [env("STRIPE_PRICE_DEALER")]: { tier: "professional", maxListings: 30 } };
}

export function requireSubscriptionPrice(priceId: unknown): { priceId: string; tier: DealerTier; maxListings: number } {
  if (priceId !== "dealer_de") throw new HttpError(400, "Unknown subscription plan");
  return { priceId: env("STRIPE_PRICE_DEALER"), tier: "professional", maxListings: 30 };
}

export function requireBoost(days: unknown): { days: number; cents: number; label: string } {
  const normalized = Number(days);
  const selected = BOOST_PACKAGES[normalized];
  if (!selected) throw new HttpError(400, "Unknown boost package");
  return { days: normalized, ...selected };
}

export function requireInspection(type: unknown): { type: string; cents: number; label: string } {
  if (typeof type !== "string" || !INSPECTION_PACKAGES[type]) throw new HttpError(400, "Unknown inspection package");
  return { type, ...INSPECTION_PACKAGES[type] };
}
