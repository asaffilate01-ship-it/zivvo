import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * Initialize native push + local notifications on iOS/Android.
 * Safe no-op on web (falls back to browser Notification API via PWA).
 */
export async function initNativeNotifications(userId?: string) {
  if (!Capacitor.isNativePlatform()) {
    // Web: request browser notification permission for PWA
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
      } catch (e) {
        console.warn("Web notification permission error", e);
      }
    }
    return;
  }

  try {
    // Local notifications permission
    const local = await LocalNotifications.requestPermissions();
    if (local.display !== "granted") {
      console.warn("Local notifications denied");
    }

    // Push notifications permission
    const push = await PushNotifications.requestPermissions();
    if (push.receive !== "granted") {
      console.warn("Push notifications denied");
      return;
    }
    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      console.log("Push token:", token.value);
      if (userId) {
        try {
          await (supabase as any).from("device_tokens").upsert(
            {
              user_id: userId,
              token: token.value,
              platform: Capacitor.getPlatform(),
            },
            { onConflict: "token" },
          );
        } catch (err) {
          console.warn("Failed to persist device token", err);
        }
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error", err);
    });

    PushNotifications.addListener("pushNotificationReceived", async (notification) => {
      // Foreground: show as local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: notification.title ?? "Zivvo",
            body: notification.body ?? "",
            extra: notification.data,
          },
        ],
      });
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = action.notification.data?.link;
      if (link && typeof window !== "undefined") {
        window.location.href = link;
      }
    });
  } catch (err) {
    console.error("initNativeNotifications failed", err);
  }
}

export async function sendLocalNotification(title: string, body: string, link?: string) {
  if (!Capacitor.isNativePlatform()) {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const n = new Notification(title, { body, icon: "/icon-192.png" });
      if (link) n.onclick = () => (window.location.href = link);
    }
    return;
  }
  await LocalNotifications.schedule({
    notifications: [{ id: Date.now(), title, body, extra: { link } }],
  });
}
