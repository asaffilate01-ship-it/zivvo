import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Loader2 } from "lucide-react";

interface FinancePreApprovalFormProps {
  auctionId: string;
  onApproved: () => void;
}

const FinancePreApprovalForm = ({ auctionId, onApproved }: FinancePreApprovalFormProps) => {
  const { user } = useAuth();
  const [provider, setProvider] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !provider || !reference || !amount) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.rpc as any)("submit_auction_finance_request", {
        p_auction_id: auctionId,
        p_provider: provider,
        p_reference: reference,
        p_amount: parseFloat(amount),
      });

      if (error) throw error;

      // Also mark any future bids as finance_preapproved
      setSubmitted(true);
      toast.success("Finanzierungsnachweis eingereicht. Nach Prüfung können Sie bieten.");
      onApproved();
    } catch (err: any) {
      toast.error(err.message || "Finanzierungsnachweis konnte nicht eingereicht werden");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-medium text-sm">Finanzierung zur Prüfung eingereicht</p>
            <p className="text-xs text-muted-foreground">{provider} – Referenz: {reference}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4 text-primary" /> Finanzierungsnachweis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Kreditgeber laut Ihrem Nachweis</Label>
            <Input value={provider} onChange={(event) => setProvider(event.target.value)} maxLength={120} placeholder="Name des Kreditgebers" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Vorgangs- oder Zusagereferenz</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="z. B. FA-2026-12345"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Beantragter Betrag (€)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="z. B. 25000"
              min="1"
              max="10000000"
              className="mt-1"
            />
          </div>

          <Button type="submit" size="sm" className="w-full gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
            {submitting ? "Wird eingereicht…" : "Nachweis einreichen"}
          </Button>

          <p className="text-[10px] text-muted-foreground">
            Die Angaben werden von Zivvo geprüft. Erst ein verifizierter, ausreichend hoher Nachweis ersetzt die Kartenkaution.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default FinancePreApprovalForm;
