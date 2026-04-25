import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, PoundSterling } from "lucide-react";
import { formatPrice } from "@/lib/countryConfig";
import { useCountry } from "@/contexts/CountryContext";

interface Props {
  price: number;
  defaultApr?: number;
  onApply?: () => void;
  compact?: boolean;
}

const calc = (principal: number, apr: number, months: number) => {
  if (principal <= 0 || months <= 0) return 0;
  if (apr === 0) return principal / months;
  const r = apr / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

const FinanceCalculator = ({ price, defaultApr = 9.9, onApply, compact }: Props) => {
  const { config } = useCountry();
  const [deposit, setDeposit] = useState<number>(Math.round(price * 0.1));
  const [term, setTerm] = useState<number>(60);
  const [apr, setApr] = useState<number>(defaultApr);

  const principal = Math.max(price - deposit, 0);
  const monthly = useMemo(() => calc(principal, apr, term), [principal, apr, term]);
  const totalPayable = monthly * term + deposit;
  const totalInterest = totalPayable - price;

  return (
    <Card className={compact ? "border-primary/20" : ""}>
      <CardHeader className={compact ? "pb-3" : ""}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="w-5 h-5 text-primary" /> Finance Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <div className="text-xs uppercase text-muted-foreground tracking-wide">Estimated monthly</div>
          <div className="text-3xl font-bold text-primary mt-1">
            {formatPrice(Math.round(monthly), config)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {term} months · {apr.toFixed(1)}% APR · Total {formatPrice(Math.round(totalPayable), config)}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <Label>Deposit</Label>
            <span className="text-muted-foreground">{formatPrice(deposit, config)}</span>
          </div>
          <Slider value={[deposit]} min={0} max={Math.max(Math.round(price * 0.5), 1)} step={100}
            onValueChange={(v) => setDeposit(v[0])} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Term (months)</Label>
            <Input type="number" min={12} max={84} step={12} value={term}
              onChange={(e) => setTerm(Math.max(12, Math.min(84, Number(e.target.value) || 60)))} />
          </div>
          <div>
            <Label className="text-xs">APR (%)</Label>
            <Input type="number" min={0} max={29.9} step={0.1} value={apr}
              onChange={(e) => setApr(Math.max(0, Math.min(29.9, Number(e.target.value) || 0)))} />
          </div>
        </div>

        {onApply && (
          <Button className="w-full" onClick={onApply}>
            <PoundSterling className="w-4 h-4 mr-2" /> Apply for Finance
          </Button>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Representative example. Subject to status. Total interest payable {formatPrice(Math.max(0, Math.round(totalInterest)), config)}.
          Finance subject to a credit check and affordability assessment.
        </p>
      </CardContent>
    </Card>
  );
};

export default FinanceCalculator;
