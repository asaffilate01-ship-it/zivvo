import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";

interface PaymentCalculatorProps {
  price: number;
}

const PaymentCalculator = ({ price }: PaymentCalculatorProps) => {
  const { config } = useCountry();
  const [deposit, setDeposit] = useState(Math.round(price * 0.1));
  const [term, setTerm] = useState(48);
  const [rate, setRate] = useState(6.9);

  const monthly = useMemo(() => {
    const principal = price - deposit;
    if (principal <= 0) return 0;
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / term;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  }, [price, deposit, term, rate]);

  const totalCost = monthly * term + deposit;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-card-foreground">Finance Calculator</h3>
      </div>

      <div className="text-center mb-5">
        <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
        <p className="font-display text-3xl font-bold text-primary mt-1">
          {formatPrice(Math.round(monthly), config)}
          <span className="text-base font-normal text-muted-foreground">/mo</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground">Deposit</label>
            <span className="text-xs font-semibold text-foreground">{formatPrice(deposit, config)}</span>
          </div>
          <Slider
            min={0}
            max={Math.round(price * 0.5)}
            step={Math.round(price * 0.01) || 100}
            value={[deposit]}
            onValueChange={(v) => setDeposit(v[0])}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground">Term</label>
            <span className="text-xs font-semibold text-foreground">{term} months</span>
          </div>
          <Slider min={12} max={72} step={6} value={[term]} onValueChange={(v) => setTerm(v[0])} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-muted-foreground">APR</label>
            <span className="text-xs font-semibold text-foreground">{rate}%</span>
          </div>
          <Slider min={0} max={20} step={0.1} value={[rate]} onValueChange={(v) => setRate(v[0])} />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">Total Cost</p>
          <p className="text-sm font-semibold text-foreground">{formatPrice(Math.round(totalCost), config)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Total Interest</p>
          <p className="text-sm font-semibold text-foreground">{formatPrice(Math.round(totalCost - price), config)}</p>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground text-center">
        Representative example. Rates may vary. Subject to status.
      </p>
    </div>
  );
};

export default PaymentCalculator;
