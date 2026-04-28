import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "buyer" | "seller" | "dealer" | "agent" | "admin" | "inspector";

interface SubscriptionInfo {
  subscribed: boolean;
  tier: string | null;
  subscriptionEnd: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  subscription: SubscriptionInfo;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  subscription: { subscribed: false, tier: null, subscriptionEnd: null },
  hasRole: () => false,
  signOut: async () => {},
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    tier: null,
    subscriptionEnd: null,
  });

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data) {
      setRoles(data.map((r) => r.role as AppRole));
    }
  };

  const refreshSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setSubscription({
          subscribed: data.subscribed || false,
          tier: data.tier || null,
          subscriptionEnd: data.subscription_end || null,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
          setTimeout(() => refreshSubscription(), 100);
        } else {
          setRoles([]);
          setSubscription({ subscribed: false, tier: null, subscriptionEnd: null });
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
        refreshSubscription();
      }
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, [refreshSubscription]);

  // Auto-refresh subscription every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const hasRole = (role: AppRole) => roles.includes(role);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setSubscription({ subscribed: false, tier: null, subscriptionEnd: null });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, subscription, hasRole, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};
