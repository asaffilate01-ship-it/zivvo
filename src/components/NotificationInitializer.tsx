import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { initNativeNotifications } from "@/lib/nativeNotifications";

const NotificationInitializer = () => {
  const { user } = useAuth();
  useEffect(() => {
    initNativeNotifications(user?.id);
  }, [user?.id]);
  return null;
};

export default NotificationInitializer;
