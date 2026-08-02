const DEFAULT_PATH = "/";

const asHttpsUrl = (value: string) => {
  const url = new URL(value, window.location.origin);
  if (url.protocol !== "https:") throw new Error("Only HTTPS links are allowed");
  return url;
};

/**
 * Converts stored or API-provided navigation targets into same-origin paths.
 * React Router must never receive external, protocol-relative, backslash or
 * executable URL values from notification and messaging records.
 */
export const safeInternalPath = (value: unknown, fallback = DEFAULT_PATH): string => {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;

  try {
    const base = typeof window === "undefined" ? "https://zivvo.de" : window.location.origin;
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
};

export const openExternalUrl = (value: string, features = "") => {
  const url = asHttpsUrl(value);
  const safeFeatures = [features, "noopener", "noreferrer"].filter(Boolean).join(",");
  const popup = window.open(url.toString(), "_blank", safeFeatures);
  if (popup) popup.opener = null;
};

export const redirectToStripe = (value: string) => {
  const url = asHttpsUrl(value);
  if (url.hostname !== "stripe.com" && !url.hostname.endsWith(".stripe.com")) {
    throw new Error("Unexpected payment redirect");
  }
  window.location.assign(url.toString());
};

export const navigateInternal = (value: string) => {
  const path = safeInternalPath(value, "");
  if (!path) return false;
  window.location.assign(path);
  return true;
};
