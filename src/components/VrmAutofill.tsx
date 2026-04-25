import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DvlaData {
  registration: string;
  make: string | null;
  colour: string | null;
  fuel_type: string | null;
  year_of_manufacture: number | null;
  engine_capacity: string | null;
  co2_emissions: number | null;
  mot_status: string | null;
  mot_expiry_date: string | null;
  tax_status: string | null;
  tax_due_date: string | null;
}

interface VrmAutofillProps {
  value: string;
  onChange: (reg: string) => void;
  onAutofill: (data: DvlaData) => void;
  className?: string;
  label?: string;
  compact?: boolean;
}

const VrmAutofill = ({
  value,
  onChange,
  onAutofill,
  className,
  label = "Number plate",
  compact = false,
}: VrmAutofillProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [filled, setFilled] = useState(false);

  const lookup = async () => {
    const reg = value?.trim();
    if (!reg) {
      toast({ title: "Enter a number plate", variant: "destructive" });
      return;
    }
    setLoading(true);
    setFilled(false);
    try {
      const { data, error } = await supabase.functions.invoke("dvla-lookup", {
        body: { registration: reg },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Lookup failed");
      onAutofill(data.data as DvlaData);
      setFilled(true);
      toast({
        title: "Vehicle found",
        description: `${data.data.make || "Vehicle"} · ${data.data.year_of_manufacture || "—"} · ${data.data.colour || ""}`,
      });
    } catch (err: any) {
      toast({
        title: "Lookup failed",
        description: err?.message || "Could not find this number plate.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {!compact && <Label className="mb-1.5 block">{label}</Label>}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          {/* UK plate-style input */}
          <Input
            value={value}
            onChange={(e) => {
              setFilled(false);
              onChange(e.target.value.toUpperCase());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
            placeholder="AB12 CDE"
            maxLength={10}
            className="h-11 bg-yellow-300 font-mono text-lg font-bold uppercase tracking-wider text-black placeholder:text-black/40 focus-visible:ring-yellow-500"
            aria-label={label}
          />
          {filled && (
            <CheckCircle2 className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-success" />
          )}
        </div>
        <Button
          type="button"
          onClick={lookup}
          disabled={loading || !value?.trim()}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Find vehicle
        </Button>
      </div>
      {!compact && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Auto-fills make, model year, fuel, colour, MOT & tax status from the DVLA.
        </p>
      )}
    </div>
  );
};

export default VrmAutofill;
