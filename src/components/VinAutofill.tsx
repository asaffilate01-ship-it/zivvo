import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VinData {
  make: string | null;
  model: string | null;
  year: string | null;
  body_type: string | null;
  fuel_type: string | null;
  engine_size: string | null;
  engine_hp: string | null;
  transmission: string | null;
  drivetrain: string | null;
  doors: string | null;
}

interface VinAutofillProps {
  value: string;
  onChange: (vin: string) => void;
  onAutofill: (data: VinData) => void;
  className?: string;
  label?: string;
}

/**
 * German-market vehicle lookup. Germany has no public licence-plate API
 * (§ 39 StVG restricts Halterdaten). Standard replacement is VIN (FIN)
 * lookup via NHTSA vPIC — works globally for any WMI, incl. WDB/WBA/WVW.
 * HSN/TSN from the Fahrzeugschein can be entered separately below.
 */
const VinAutofill = ({
  value,
  onChange,
  onAutofill,
  className,
  label = "Fahrzeug-Identifizierungsnummer (FIN / VIN)",
}: VinAutofillProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [filled, setFilled] = useState(false);
  const [hsn, setHsn] = useState("");
  const [tsn, setTsn] = useState("");

  const lookup = async () => {
    const vin = value?.trim().toUpperCase().replace(/\s+/g, "");
    if (!vin || vin.length !== 17) {
      toast({
        title: "Ungültige FIN",
        description: "Die FIN muss genau 17 Zeichen lang sein.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setFilled(false);
    try {
      const { data, error } = await supabase.functions.invoke("nhtsa-vin-decode", {
        body: { vin },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Fahrzeug nicht gefunden");
      onAutofill(data.data as VinData);
      setFilled(true);
      toast({
        title: "Fahrzeug erkannt",
        description: `${data.data.year || ""} ${data.data.make || ""} ${data.data.model || ""}`.trim(),
      });
    } catch (err: any) {
      toast({
        title: "FIN-Abfrage fehlgeschlagen",
        description: err?.message || "Bitte prüfen Sie die FIN im Fahrzeugschein (Feld E).",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Die 17-stellige FIN finden Sie im Fahrzeugschein (Feld E) oder unten
              in der Windschutzscheibe. In Deutschland gibt es keine öffentliche
              Kennzeichen-Abfrage — die FIN ist der offizielle Weg.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-1.5 flex items-stretch gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => {
              setFilled(false);
              onChange(e.target.value.toUpperCase().replace(/\s+/g, ""));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
            placeholder="WDB2030461A123456"
            maxLength={17}
            className="h-11 font-mono uppercase tracking-wider"
            aria-label={label}
          />
          {filled && (
            <CheckCircle2 className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-success" />
          )}
        </div>
        <Button type="button" onClick={lookup} disabled={loading || !value?.trim()} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Fahrzeug abrufen
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">HSN (Feld 2.1)</Label>
          <Input
            value={hsn}
            onChange={(e) => setHsn(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0603"
            maxLength={4}
            className="mt-1 h-9 font-mono"
          />
        </div>
        <div>
          <Label className="text-xs">TSN (Feld 2.2)</Label>
          <Input
            value={tsn}
            onChange={(e) => setTsn(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="BNM"
            maxLength={3}
            className="mt-1 h-9 font-mono"
          />
        </div>
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        FIN füllt Marke, Modell, Baujahr, Motor & Getriebe automatisch aus. HSN/TSN sind für die KBA-Zuordnung.
      </p>
    </div>
  );
};

export default VinAutofill;
