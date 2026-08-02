import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Shield, Loader2 } from "lucide-react";
import { idempotencyHeaders } from "@/lib/idempotency";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

interface DepositFormProps {
  auctionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm = ({ depositId, paymentIntentId, onSuccess }: { depositId: string; paymentIntentId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")) {
        // Confirm deposit in our backend
        const { error: confirmErr } = await supabase.functions.invoke("confirm-deposit", {
          body: { deposit_id: depositId, payment_intent_id: paymentIntentId },
        });
        if (confirmErr) throw confirmErr;
        toast.success("Deposit pre-authorized! You can now bid.");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm deposit");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || processing} className="w-full h-11 gap-2">
        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        {processing ? "Autorisierung …" : "500 € Kaution autorisieren"}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">
        500 € werden auf Ihrer Karte reserviert und nur bei einem Auktionsgewinn verrechnet.
      </p>
    </form>
  );
};

const StripeDepositForm = ({ auctionId, onSuccess, onCancel }: DepositFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initDeposit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!stripePublishableKey) throw new Error("Stripe ist noch nicht für die Produktion konfiguriert");
      const { data, error: fnErr } = await supabase.functions.invoke("deposit-checkout", {
        body: { auction_id: auctionId },
        headers: idempotencyHeaders(),
      });
      if (fnErr) throw fnErr;

      if (data?.already_authorized) {
        toast.success("Deposit already authorized!");
        onSuccess();
        return;
      }

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
        setDepositId(data.deposit_id);
        setPaymentIntentId(data.payment_intent_id);
      } else {
        throw new Error("Failed to create deposit session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize deposit");
      toast.error(err.message || "Failed to initialize deposit");
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Pre-authorize Deposit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                500 € werden auf Ihrer Karte reserviert. Das ist <strong>keine Abbuchung</strong> —
                die Reservierung wird automatisch freigegeben, wenn Sie nicht gewinnen.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary" />
              <span>Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary" />
              <span>Hold released if you don't win</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary" />
              <span>Only captured against winning purchase</span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button onClick={initDeposit} disabled={loading || !stripePublishableKey} className="flex-1 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {loading ? "Loading..." : "Enter Card Details"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <CheckoutForm depositId={depositId!} paymentIntentId={paymentIntentId!} onSuccess={onSuccess} />
        </Elements>
        <Button variant="ghost" size="sm" onClick={onCancel} className="w-full mt-2">
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
};

export default StripeDepositForm;
