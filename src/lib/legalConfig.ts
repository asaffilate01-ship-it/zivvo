export type LegalIdentity = {
  companyName: string;
  legalForm: string;
  managingDirector: string;
  street: string;
  postcode: string;
  city: string;
  phone: string;
  email: string;
  registerCourt: string;
  registerNumber: string;
  vatId: string;
  contentResponsible: string;
  supervisoryAuthority: string;
};

const value = (name: string): string => String(import.meta.env[name] || "").trim();
const unavailable = "[nicht konfiguriert]";

export const legalConfig: LegalIdentity = {
  companyName: value("VITE_LEGAL_COMPANY_NAME"),
  legalForm: value("VITE_LEGAL_FORM"),
  managingDirector: value("VITE_LEGAL_MANAGING_DIRECTOR"),
  street: value("VITE_LEGAL_STREET"),
  postcode: value("VITE_LEGAL_POSTCODE"),
  city: value("VITE_LEGAL_CITY"),
  phone: value("VITE_LEGAL_PHONE"),
  email: value("VITE_LEGAL_EMAIL"),
  registerCourt: value("VITE_LEGAL_REGISTER_COURT"),
  registerNumber: value("VITE_LEGAL_REGISTER_NUMBER"),
  vatId: value("VITE_LEGAL_VAT_ID"),
  contentResponsible: value("VITE_LEGAL_CONTENT_RESPONSIBLE"),
  supervisoryAuthority: value("VITE_LEGAL_SUPERVISORY_AUTHORITY"),
};

export const publicContactConfig = {
  supportEmail: value("VITE_SUPPORT_EMAIL") || legalConfig.email,
  privacyEmail: value("VITE_PRIVACY_EMAIL") || legalConfig.email,
  complaintsEmail: value("VITE_COMPLAINTS_EMAIL") || legalConfig.email,
  accessibilityEmail: value("VITE_ACCESSIBILITY_EMAIL") || legalConfig.email,
};

export const legalIdentityConfigured = Object.values(legalConfig).every(Boolean);
export const legalVersionDate = new Date("2026-08-02T00:00:00Z");

const entityName = (identity: LegalIdentity): string => {
  const companyName = identity.companyName.trim();
  const legalForm = identity.legalForm.trim();
  if (!companyName) return unavailable;
  if (!legalForm || companyName.toLocaleLowerCase().endsWith(legalForm.toLocaleLowerCase())) return companyName;
  return `${companyName} ${legalForm}`;
};

const resolved = (input: string): string => input || unavailable;

export const withLegalIdentity = (input: string, identity: LegalIdentity = legalConfig): string => {
  const cityLine = [identity.postcode, identity.city].filter(Boolean).join(" ");
  const privacyContact = identity === legalConfig ? publicContactConfig.privacyEmail : identity.email;
  const replacements: Record<string, string> = {
    "[Firmenname]": entityName(identity),
    "[Company Name]": entityName(identity),
    "[Rechtsform, z. B. GmbH]": resolved(identity.legalForm),
    "[Legal form, e.g. GmbH]": resolved(identity.legalForm),
    "[Straße]": resolved(identity.street),
    "[Street]": resolved(identity.street),
    "[PLZ Ort]": resolved(cityLine),
    "[Postcode City]": resolved(cityLine),
    "[Geschäftsführer]": resolved(identity.managingDirector),
    "[Managing Director]": resolved(identity.managingDirector),
    "[E-Mail]": resolved(identity.email),
    "[Email]": resolved(identity.email),
    "[Telefon]": resolved(identity.phone),
    "[Phone]": resolved(identity.phone),
    "[Amtsgericht Ort]": resolved(identity.registerCourt),
    "[Local court, city]": resolved(identity.registerCourt),
    "[Handelsregister HRB xxxxx]": resolved(identity.registerNumber),
    "[Commercial Register HRB xxxxx]": resolved(identity.registerNumber),
    "[USt-IdNr. DE...]": resolved(identity.vatId),
    "[VAT ID DE...]": resolved(identity.vatId),
    "[Zuständige Aufsichtsbehörde, Anschrift]": resolved(identity.supervisoryAuthority),
    "[Competent authority, address]": resolved(identity.supervisoryAuthority),
    "[Datenschutzbeauftragter / Kontaktperson]": resolved(privacyContact),
    "[Data Protection Officer / contact person]": resolved(privacyContact),
  };

  return Object.entries(replacements).reduce(
    (text, [placeholder, replacement]) => text.split(placeholder).join(replacement),
    input,
  );
};

export const legalCompanyLine = (language = "de"): string => {
  if (!legalIdentityConfigured) {
    return language.startsWith("en")
      ? "Legal operator details are not configured in this environment."
      : "Rechtliche Unternehmensangaben sind in dieser Umgebung nicht konfiguriert.";
  }

  const register = `${legalConfig.registerCourt} · ${legalConfig.registerNumber}`;
  const address = `${legalConfig.street}, ${legalConfig.postcode} ${legalConfig.city}`;
  const vatLabel = language.startsWith("en") ? "VAT ID" : "USt-IdNr.";
  return `${entityName(legalConfig)} · ${register}\n${address}\n${vatLabel}: ${legalConfig.vatId}`;
};
