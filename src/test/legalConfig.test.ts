import { describe, expect, it } from "vitest";
import { type LegalIdentity, withLegalIdentity } from "@/lib/legalConfig";

const identity: LegalIdentity = {
  companyName: "Zivvo",
  legalForm: "GmbH",
  managingDirector: "Alex Beispiel",
  street: "Releaseweg 1",
  postcode: "10115",
  city: "Berlin",
  phone: "+49 30 1234567",
  email: "legal@zivvo.de",
  registerCourt: "Amtsgericht Berlin",
  registerNumber: "HRB 12345 B",
  vatId: "DE123456789",
  contentResponsible: "Alex Beispiel, Releaseweg 1, 10115 Berlin",
  supervisoryAuthority: "Gewerbeamt Berlin, Behördenweg 2, 10115 Berlin",
};

describe("legal identity rendering", () => {
  it("replaces German operator placeholders", () => {
    const rendered = withLegalIdentity(
      "[Firmenname], [Straße], [PLZ Ort], [Geschäftsführer], [Handelsregister HRB xxxxx], [USt-IdNr. DE...], [Zuständige Aufsichtsbehörde, Anschrift]",
      identity,
    );
    expect(rendered).toBe("Zivvo GmbH, Releaseweg 1, 10115 Berlin, Alex Beispiel, HRB 12345 B, DE123456789, Gewerbeamt Berlin, Behördenweg 2, 10115 Berlin");
  });

  it("does not duplicate a legal form already present in the company name", () => {
    expect(withLegalIdentity("[Company Name]", { ...identity, companyName: "Zivvo GmbH" })).toBe("Zivvo GmbH");
  });
});
