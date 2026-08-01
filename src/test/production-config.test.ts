import { describe, expect, it, vi } from "vitest";
import { allCountries, countryConfigs, formatDistance, formatPrice, getCountryFromCode } from "@/lib/countryConfig";
import { idempotencyHeaders } from "@/lib/idempotency";

describe("German production market", () => {
  it("exposes Germany as the only selectable market", () => {
    expect(allCountries).toEqual(["DE"]);
    expect(getCountryFromCode("GB")).toBe("DE");
    expect(countryConfigs.DE.currency.code).toBe("EUR");
  });

  it("formats prices and distances for Germany", () => {
    expect(formatPrice(19950, countryConfigs.DE)).toContain("19.950");
    expect(formatPrice(19950, countryConfigs.DE)).toContain("€");
    expect(formatDistance(42, countryConfigs.DE)).toBe("42 km");
  });

  it("keeps the public plans aligned with the server-owned production catalogue", () => {
    expect(countryConfigs.DE.individualPlan).toMatchObject({ price: 0, freePerMonth: 2, maxPhotos: 10 });
    expect(countryConfigs.DE.dealerPlans).toHaveLength(1);
    expect(countryConfigs.DE.dealerPlans[0]).toMatchObject({
      priceId: "dealer_de",
      price: 49.99,
      maxListings: 30,
      maxPhotos: 15,
      maxVideos: 2,
      trialMonths: 2,
    });
  });
});

describe("payment request protection", () => {
  it("creates a fresh idempotency key for every action", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("11111111-1111-4111-8111-111111111111").mockReturnValueOnce("22222222-2222-4222-8222-222222222222");
    expect(idempotencyHeaders()["Idempotency-Key"]).not.toBe(idempotencyHeaders()["Idempotency-Key"]);
  });
});
