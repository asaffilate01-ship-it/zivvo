import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Plus, MessageSquare, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Native-app style bottom tab bar. Mobile only (hidden md+).
 * Sits above safe-area, respects iOS notches.
 */
const MobileBottomNav = () => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let cancelled = false;
    const load = async () => {
      const [m, e] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("read", false),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "unread"),
      ]);
      if (!cancelled) setUnread((m.count || 0) + (e.count || 0));
    };
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  // Hide on certain routes where a bottom bar gets in the way
  const hiddenOn = ["/login", "/signup", "/forgot-password", "/reset-password", "/pitch"];
  if (hiddenOn.some((p) => location.pathname.startsWith(p))) return null;
  // Hide on listing detail pages — MobileListingBar takes the bottom slot there
  if (location.pathname.startsWith("/car/")) return null;
  // Hide inside admin/dealer dashboards to avoid overlap with their own nav
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/agent") || location.pathname.startsWith("/inspector")) return null;

  const sellTo = user ? (hasRole("dealer") ? "/dashboard/listings/new" : "/sell") : "/sell-my-car";
  const accountTo = user ? (hasRole("admin") ? "/admin" : hasRole("agent") ? "/agent" : hasRole("dealer") ? "/dashboard" : "/profile") : "/login";
  const inboxTo = user ? "/inbox" : "/login";

  const tabs = [
    { to: "/", icon: Home, label: t("nav.home", "Start") },
    { to: "/browse", icon: Search, label: t("nav.browse", "Suchen") },
    { to: sellTo, icon: Plus, label: t("nav.sell", "Verkaufen"), primary: true },
    { to: inboxTo, icon: MessageSquare, label: t("nav.inbox", "Nachrichten"), badge: unread },
    { to: accountTo, icon: User, label: t("nav.account", "Konto") },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, icon: Icon, label, primary, badge }) => {
          const active = isActive(to);
          return (
            <li key={label} className="flex">
              <NavLink
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition-all",
                    primary
                      ? "h-10 w-10 -mt-4 shadow-lg gradient-primary text-primary-foreground border-4 border-background"
                      : "h-6 w-6"
                  )}
                >
                  <Icon className={cn(primary ? "h-5 w-5" : "h-5 w-5")} />
                  {badge && badge > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
                <span className={cn("truncate max-w-full", primary && "mt-0.5")}>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
