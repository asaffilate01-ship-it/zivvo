import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Turnstile, { captchaEnabled } from "@/components/security/Turnstile";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken || undefined,
    });
    setLoading(false);
    setCaptchaToken(null);
    setCaptchaNonce((value) => value + 1);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="gradient-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
              {sent ? <Mail className="h-7 w-7 text-primary-foreground" /> : <Car className="h-7 w-7 text-primary-foreground" />}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
              {sent ? t("auth.forgot.sentTitle") : t("auth.forgot.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {sent ? t("auth.forgot.sentSubtitle") : t("auth.forgot.subtitle")}
            </p>
          </div>

          {!sent && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.forgot.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="du@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Turnstile key={captchaNonce} action="password_reset" onTokenChange={setCaptchaToken} />
              <Button type="submit" className="gradient-primary w-full border-0" disabled={loading || (captchaEnabled && !captchaToken)}>
                {loading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
              </Button>
            </form>
          )}

          <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> {t("auth.forgot.back")}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
