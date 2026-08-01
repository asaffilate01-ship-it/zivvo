import i18n from "@/i18n";

// Central date/number formatting helpers that follow the active i18n locale.
// Use these instead of raw toLocaleDateString() / toLocaleString() so that
// switching to German renders "23.07.2026" and switching to English renders
// "23/07/2026" everywhere consistently.

const localeTag = () => (i18n.language?.startsWith("de") ? "de-DE" : "en-GB");

export const formatDate = (
  value: string | number | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
) => {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(localeTag(), opts);
};

export const formatDateTime = (
  value: string | number | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  },
) => {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(localeTag(), opts);
};

export const formatNumber = (value: number | null | undefined, opts?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined || isNaN(value as number)) return "";
  return new Intl.NumberFormat(localeTag(), opts).format(value);
};
