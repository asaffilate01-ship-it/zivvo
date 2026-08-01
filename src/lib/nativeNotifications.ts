import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "@/integrations/supabase/client";
import { navigateInternal } from "@/lib/safeNavigation";

/**
 * Initialize native push + local notifications on iOS/Android.
 * Web permission must be requested from an explicit user action, not at page load.
 */
export async function initNativeNotifications(userId?: string) {
  if (!Capacitor.isNativePlatform()) {
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
    const registration = await PushNotifications.addListener("registration", async (token) => {
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

    const registrationError = await PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error", err);
    });

    const received = await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
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

    const actionPerformed = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = action.notification.data?.link;
      if (typeof link === "string" && typeof window !== "undefined") {
        navigateInternal(link);
      }
    });
    await PushNotifications.register();
    return () => {
      void registration.remove();
      void registrationError.remove();
      void received.remove();
      void actionPerformed.remove();
    };
  } catch (err) {
    console.error("initNativeNotifications failed", err);
  }
}

export async function sendLocalNotification(title: string, body: string, link?: string) {
  if (!Capacitor.isNativePlatform()) {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const n = new Notification(title, { body, icon: "/icon-192.png" });
      if (link) n.onclick = () => { navigateInternal(link); };
    }
    return;
  }
  await LocalNotifications.schedule({
    notifications: [{ id: Date.now(), title, body, extra: { link } }],
  });
}
