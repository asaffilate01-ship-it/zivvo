import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MfaSetupCard from "./MfaSetupCard";

interface VerifiedFactor { id: string; status: string; friendly_name?: string }

const MfaGate = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [factor, setFactor] = useState<VerifiedFactor | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    setChecking(true);
    const [levelResult, factorsResult] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    setVerified(levelResult.data?.currentLevel === "aal2");
    setFactor(((factorsResult.data?.totp || []).find((item) => item.status === "verified") as VerifiedFactor | undefined) || null);
    setChecking(false);
  }, []);

  useEffect(() => { void check(); }, [check]);

  const verify = async () => {
    if (!factor || code.length !== 6) return;
    setChecking(true);
    setError("");
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (verifyError) {
      setError(t("productionV2.mfa.invalidCode"));
      setChecking(false);
      return;
    }
    setCode("");
    await check();
  };

  if (checking) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (verified) return <>{children}</>;

  return <div className="min-h-screen bg-background px-4 py-20"><div className="mx-auto max-w-md">{factor ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />{t("productionV2.mfa.confirmTitle")}</CardTitle><p className="text-sm text-muted-foreground">{t("productionV2.mfa.confirmSubtitle")}</p></CardHeader><CardContent><Label htmlFor="mfa-gate-code">{t("productionV2.mfa.code")}</Label><div className="mt-1 flex gap-2"><Input id="mfa-gate-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus /><Button disabled={code.length !== 6} onClick={() => void verify()}>{t("productionV2.mfa.continue")}</Button></div>{error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}</CardContent></Card> : <MfaSetupCard required onChanged={() => void check()} />}</div></div>;
};

export default MfaGate;
