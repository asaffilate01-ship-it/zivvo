const asHttpsUrl = (value: string) => {
  const url = new URL(value, window.location.origin);
  if (url.protocol !== "https:") throw new Error("Only HTTPS links are allowed");
  return url;
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
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    return true;
  } catch {
    return false;
  }
};
