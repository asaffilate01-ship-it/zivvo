import { useState } from "react";
import { Bug, LogIn, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DEV_ACCOUNTS = [
  { label: "Buyer", email: "buyer@autovault.test", password: "Test1234!", color: "bg-secondary text-secondary-foreground" },
  { label: "Seller", email: "seller@autovault.test", password: "Test1234!", color: "bg-primary/10 text-primary" },
  { label: "Dealer", email: "dealer@autovault.test", password: "Test1234!", color: "bg-accent text-accent-foreground" },
  { label: "Agent", email: "agent@autovault.test", password: "Test1234!", color: "bg-warning/10 text-warning" },
  { label: "Admin", email: "admin@autovault.test", password: "Test1234!", color: "bg-destructive/10 text-destructive" },
];

const BugReportButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDevLogin = async (email: string, password: string) => {
    setLoading(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);
    if (error) {
      toast({ title: "Login failed", description: "Seed test users first.", variant: "destructive" });
    } else {
      toast({ title: `Logged in as ${email.split("@")[0]}` });
      setOpen(false);
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out" });
    setOpen(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("dev-seed");
      if (error) throw error;
      toast({ title: "Test users seeded!", description: `${data.users?.filter((u: any) => u.status === "created").length || 0} new users created.` });
    } catch (err: any) {
      toast({ title: "Seed failed", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        aria-label="Quick dev login"
      >
        <Bug className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-72 rounded-xl border border-border bg-card p-4 shadow-elevated"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-card-foreground text-sm">Dev Quick Login</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {user && (
              <div className="mb-3 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.email}</span>
                <Button variant="ghost" size="sm" className="mt-1 h-6 w-full text-xs" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {DEV_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleDevLogin(acc.email, acc.password)}
                  disabled={!!loading}
                  className={`rounded-lg ${acc.color} px-1 py-2 text-center text-[10px] font-medium transition-all hover:scale-105 hover:shadow-md disabled:opacity-50`}
                >
                  {loading === acc.email ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : acc.label}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding} className="w-full h-7 text-xs">
              {seeding ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              {seeding ? "Seeding..." : "Seed Test Users"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BugReportButton;
