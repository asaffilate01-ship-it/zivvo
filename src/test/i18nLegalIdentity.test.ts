import { afterAll, describe, expect, it } from "vitest";
import i18n from "@/i18n";

describe("legal identity i18n post-processing", () => {
  afterAll(async () => {
    await i18n.changeLanguage("de");
  });

  it("removes German legal placeholders from rendered translations", async () => {
    await i18n.changeLanguage("de");
    const rendered = i18n.t("footer.companyInfo");
    expect(rendered).not.toContain("[Firmenname]");
    expect(rendered).not.toContain("[Handelsregister HRB xxxxx]");
    expect(rendered).toContain("nicht konfiguriert");
  });

  it("removes English legal placeholders from rendered translations", async () => {
    await i18n.changeLanguage("en");
    const rendered = i18n.t("footer.companyInfo");
    expect(rendered).not.toContain("[Company Name]");
    expect(rendered).not.toContain("[Commercial Register HRB xxxxx]");
    expect(rendered).toContain("nicht konfiguriert");
  });
});
