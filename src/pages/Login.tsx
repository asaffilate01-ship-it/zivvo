import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, ArrowRight, Eye, EyeOff, FlaskConical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const DEV_ACCOUNTS = [
  { label: "Buyer", email: "buyer@zivvo.test", password: "Test1234!", color: "bg-secondary text-secondary-foreground" },
  { label: "Seller", email: "seller@zivvo.test", password: "Test1234!", color: "bg-primary/10 text-primary" },
  { label: "Dealer", email: "dealer@zivvo.test", password: "Test1234!", color: "bg-accent text-accent-foreground" },
  { label: "Agent", email: "agent@zivvo.test", password: "Test1234!", color: "bg-warning/10 text-warning" },
  { label: "Admin", email: "admin@zivvo.test", password: "Test1234!", color: "bg-destructive/10 text-destructive" },
];

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: t("auth.login.failed"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.login.welcome") });
      navigate("/");
    }
  };

  const handleDevLogin = async (devEmail: string, devPassword: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword });
    setLoading(false);

    if (error) {
      toast({ title: "Dev login failed", description: "Run 'Seed Test Users' first.", variant: "destructive" });
    } else {
      toast({ title: `Logged in as ${devEmail}` });
      navigate("/");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("dev-seed");
      if (error) throw error;
      toast({
        title: "Test users seeded!",
        description: `${data.users?.filter((u: any) => u.status === "created").length || 0} new users created.`,
      });
    } catch (err: any) {
      toast({ title: "Seed failed", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-6">
            <div className="text-center">
              <div className="gradient-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                <Car className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold text-foreground">{t("auth.login.title")}</h1>
              <p className="mt-2 text-muted-foreground">{t("auth.login.subtitle")}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.login.password")}</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t("auth.login.forgot")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="gradient-primary w-full border-0" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? t("auth.login.submitting") : t("auth.login.submit")}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.login.noAccount")}{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                {t("auth.login.signupLink")}
              </Link>
            </p>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {showDevPanel ? "Hide" : "Show"} Dev Login Panel
              </button>

              {showDevPanel && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Quick Login (Test Accounts)</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSeed}
                      disabled={seeding}
                      className="h-7 text-xs"
                    >
                      {seeding ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      {seeding ? "Seeding..." : "Seed Test Users"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {DEV_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => handleDevLogin(acc.email, acc.password)}
                        disabled={loading}
                        className={`rounded-lg ${acc.color} px-2 py-2 text-center text-xs font-medium transition-all hover:scale-105 hover:shadow-md disabled:opacity-50`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Password for all: <code className="bg-muted px-1 rounded">Test1234!</code>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
