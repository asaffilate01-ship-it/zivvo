import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.71e05ea0398f4b989ca6b7d3a863e158',
  appName: 'Zivvo',
  webDir: 'dist',
  server: {
    url: 'https://71e05ea0-398f-4b98-9ca6-b7d3a863e158.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
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
