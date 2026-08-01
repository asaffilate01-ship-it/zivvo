import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { initNativeNotifications } from "@/lib/nativeNotifications";

const NotificationInitializer = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void initNativeNotifications(user.id).then((removeListeners) => {
      if (disposed) removeListeners?.();
      else cleanup = removeListeners;
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [user?.id]);
  return null;
};

export default NotificationInitializer;
