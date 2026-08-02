const configuredUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();

export const SITE_URL = (configuredUrl || "https://zivvo.de").replace(/\/+$/, "");

export const absoluteUrl = (path = "/") => new URL(path, `${SITE_URL}/`).toString();
