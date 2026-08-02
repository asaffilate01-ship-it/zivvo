import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Loader2, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TotpFactor {
  id: string;
  friendly_name?: string;
  status: "verified" | "unverified";
  created_at: string;
}

interface Enrollment {
  id: string;
  qrCode: string;
  secret: string;
}

const MfaSetupCard = ({ required = false, onChanged }: { required?: boolean; onChanged?: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp || []) as TotpFactor[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const startEnrollment = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Zivvo Authenticator" });
    setLoading(false);
    if (error || !data?.totp) {
      toast({ title: t("common.error"), description: error?.message, variant: "destructive" });
      return;
    }
    setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };

  const verify = async () => {
    if (!enrollment || !/^\d{6}$/.test(code)) return;
    setLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code });
    setLoading(false);
    if (error) {
      toast({ title: t("productionV2.mfa.invalidCode"), description: error.message, variant: "destructive" });
      return;
    }
    setEnrollment(null);
    setCode("");
    await load();
    onChanged?.();
    toast({ title: t("productionV2.mfa.enabled") });
  };

  const remove = async (factorId: string) => {
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setLoading(false);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      return;
    }
    await load();
    onChanged?.();
  };

  return (
    <Card className={required ? "border-primary/40" : ""}>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-primary" />{t("productionV2.mfa.title")}</CardTitle><p className="text-sm text-muted-foreground">{required ? t("productionV2.mfa.required") : t("productionV2.mfa.subtitle")}</p></CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("common.loading")}</div>}
        {!loading && factors.filter((factor) => factor.status === "verified").map((factor) => <div key={factor.id} className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-success" /><div><p className="text-sm font-medium">{factor.friendly_name || t("productionV2.mfa.authenticator")}</p><p className="text-xs text-muted-foreground">{t("productionV2.mfa.active")}</p></div></div>{!required && <Button variant="ghost" size="icon" onClick={() => void remove(factor.id)} aria-label={t("productionV2.mfa.remove")}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>)}
        {!enrollment && factors.every((factor) => factor.status !== "verified") && <Button onClick={() => void startEnrollment()} disabled={loading}><KeyRound className="mr-2 h-4 w-4" />{t("productionV2.mfa.enable")}</Button>}
        {enrollment && <div className="space-y-4 rounded-xl border bg-muted/20 p-4"><div className="flex justify-center"><img src={enrollment.qrCode} alt={t("productionV2.mfa.qrAlt")} className="h-48 w-48 rounded-lg bg-white p-2" /></div><div><p className="text-sm font-medium">{t("productionV2.mfa.manualKey")}</p><code className="mt-1 block break-all rounded bg-muted p-2 text-xs">{enrollment.secret}</code></div><div><Label htmlFor="mfa-code">{t("productionV2.mfa.code")}</Label><div className="flex gap-2"><Input id="mfa-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" /><Button onClick={() => void verify()} disabled={loading || code.length !== 6}>{t("productionV2.mfa.verify")}</Button></div></div></div>}
      </CardContent>
    </Card>
  );
};

export default MfaSetupCard;
