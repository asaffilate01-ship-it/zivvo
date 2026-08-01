import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trackEvent } from "@/hooks/useAnalytics";

const Signup = () => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: t("auth.signup.acceptRequired"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: t("auth.signup.failed"), description: error.message, variant: "destructive" });
    } else {
      void trackEvent("signup_submitted");
      toast({
        title: t("auth.signup.checkEmail"),
        description: t("auth.signup.checkEmailDesc"),
      });
      navigate("/login");
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
              <h1 className="mt-4 font-display text-3xl font-bold text-foreground">{t("auth.signup.title")}</h1>
              <p className="mt-2 text-muted-foreground">{t("auth.signup.subtitle")}</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.signup.fullName")}</Label>
                <Input id="fullName" type="text" placeholder={t("auth.signup.namePlaceholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <Input id="email" type="email" placeholder={t("auth.signup.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder={t("auth.signup.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} autoComplete="new-password" required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  {t("auth.signup.agree")}{" "}
                  <Link to="/terms" className="text-primary underline">{t("auth.signup.terms")}</Link>{" "}
                  {t("auth.signup.and")}{" "}
                  <Link to="/privacy" className="text-primary underline">{t("auth.signup.privacy")}</Link>
                </label>
              </div>

              <Button type="submit" className="gradient-primary w-full border-0" disabled={loading || !agreed}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? t("auth.signup.submitting") : t("auth.signup.submit")}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.signup.haveAccount")}{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">{t("auth.signup.loginLink")}</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
