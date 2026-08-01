const value = (name: string): string => String(import.meta.env[name] || "").trim();

export const legalConfig = {
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
};

export const legalIdentityConfigured = Object.values(legalConfig).every(Boolean);

export const legalVersionDate = new Date("2026-08-01T00:00:00Z");

export const withLegalIdentity = (input: string): string => {
  const replacements: Record<string, string> = {
    "[Firmenname]": `${legalConfig.companyName} ${legalConfig.legalForm}`.trim(),
    "[Company Name]": `${legalConfig.companyName} ${legalConfig.legalForm}`.trim(),
    "[Straße]": legalConfig.street,
    "[Street]": legalConfig.street,
    "[PLZ Ort]": `${legalConfig.postcode} ${legalConfig.city}`.trim(),
    "[Postcode City]": `${legalConfig.postcode} ${legalConfig.city}`.trim(),
    "[Geschäftsführer]": legalConfig.managingDirector,
    "[Managing Director]": legalConfig.managingDirector,
    "[E-Mail]": legalConfig.email,
    "[Email]": legalConfig.email,
    "[Telefon]": legalConfig.phone,
    "[Phone]": legalConfig.phone,
    "[Datenschutzbeauftragter / Kontaktperson]": legalConfig.managingDirector,
    "[Data Protection Officer / contact person]": legalConfig.managingDirector,
  };
  return Object.entries(replacements).reduce(
    (text, [placeholder, replacement]) => text.split(placeholder).join(replacement || "[nicht konfiguriert]"),
    input,
  );
};

export const legalCompanyLine = legalIdentityConfigured
  ? `${legalConfig.companyName} ${legalConfig.legalForm} · ${legalConfig.registerNumber}\n${legalConfig.street}, ${legalConfig.postcode} ${legalConfig.city}\nUSt-IdNr.: ${legalConfig.vatId}`
  : "Rechtliche Unternehmensangaben sind in dieser Umgebung nicht konfiguriert.";
