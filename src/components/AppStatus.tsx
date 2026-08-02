import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudOff, DownloadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppStatus = () => {
  const { t } = useTranslation();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const connected = () => setOnline(true);
    const disconnected = () => setOnline(false);
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    return () => { window.removeEventListener("online", connected); window.removeEventListener("offline", disconnected); };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let refreshing = false;
    const controllerChanged = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((current) => {
      setRegistration(current);
      if (current.waiting) setUpdateAvailable(true);
      current.addEventListener("updatefound", () => {
        const worker = current.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateAvailable(true);
        });
      });
    }).catch((error) => console.error("Service worker registration failed", error));
    return () => navigator.serviceWorker.removeEventListener("controllerchange", controllerChanged);
  }, []);

  const installUpdate = () => registration?.waiting?.postMessage({ type: "SKIP_WAITING" });

  if (!online) return <div className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground" role="status"><CloudOff className="h-4 w-4" />{t("productionV2.app.offline")}</div>;
  if (!updateAvailable || dismissed) return null;
  return <div className="fixed bottom-20 left-4 right-4 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-xl border bg-card p-3 shadow-elevated" role="status"><DownloadCloud className="h-5 w-5 text-primary" /><p className="flex-1 text-sm">{t("productionV2.app.updateAvailable")}</p><Button size="sm" onClick={installUpdate}>{t("productionV2.app.update")}</Button><Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label={t("common.close")}><X className="h-4 w-4" /></Button></div>;
};

export default AppStatus;
