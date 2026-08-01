import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Loader2 } from "lucide-react";

interface FinancePreApprovalFormProps {
  auctionId: string;
  onApproved: () => void;
}

const FINANCE_PROVIDERS = [
  "Moneybarn",
  "Black Horse Finance",
  "Close Brothers",
  "Santander Consumer Finance",
  "Barclays Partner Finance",
  "Zuto",
  "CarFinance 247",
  "Other",
];

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
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      // Create a deposit record with finance details
      const { error } = await supabase.from("auction_deposits").insert({
        auction_id: auctionId,
        user_id: user.id,
        amount: 0, // No card hold for finance
        type: "finance_preapproval",
        status: "authorized",
        authorized_at: new Date().toISOString(),
        finance_provider: provider,
        finance_reference: reference,
        finance_amount: parseFloat(amount),
      } as any);

      if (error) throw error;

      // Also mark any future bids as finance_preapproved
      setSubmitted(true);
      toast.success("Finance pre-approval recorded! You can now bid.");
      onApproved();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit finance details");
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
            <p className="font-medium text-sm">Finance Pre-approved</p>
            <p className="text-xs text-muted-foreground">{provider} — Ref: {reference}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Banknote className="w-4 h-4 text-primary" /> Finance Pre-approval
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Finance Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {FINANCE_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Pre-approval Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. FA-2024-12345"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Approved Amount (£)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="mt-1"
            />
          </div>

          <Button type="submit" size="sm" className="w-full gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
            {submitting ? "Submitting..." : "Submit Pre-approval"}
          </Button>

          <p className="text-[10px] text-muted-foreground">
            Finance pre-approval allows you to bid without a card deposit. Your bid will show a 
            <Badge variant="outline" className="text-[8px] py-0 mx-1">Finance</Badge> badge.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default FinancePreApprovalForm;
