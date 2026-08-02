import type { CapacitorConfig } from '@capacitor/cli';

const developmentServerUrl = process.env.CAPACITOR_DEV_SERVER_URL?.trim();

const developmentServer = (() => {
  if (!developmentServerUrl) return undefined;

  const url = new URL(developmentServerUrl);
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) {
    throw new Error("CAPACITOR_DEV_SERVER_URL must use HTTPS unless it targets localhost");
  }

  return {
    url: url.toString(),
    cleartext: url.protocol === "http:",
  };
})();

const config: CapacitorConfig = {
  appId: 'de.zivvo.app',
  appName: 'Zivvo',
  webDir: 'dist',
  server: developmentServer,
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#7c3aed',
    },
  },
};

export default config;
