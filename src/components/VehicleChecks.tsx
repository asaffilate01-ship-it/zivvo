import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield, FileCheck, AlertTriangle, Car, ExternalLink, Loader2,
  CheckCircle, XCircle, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VehicleChecksProps {
  registration?: string | null;
  vin?: string | null;
  country: string;
}

type CheckResult = {
  success: boolean;
  data?: any;
  error?: string;
};

const VehicleChecks = ({ registration, vin, country }: VehicleChecksProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogData, setDialogData] = useState<any>(null);
  const [dialogType, setDialogType] = useState<string>("");

  const runCheck = async (type: string) => {
    setLoading(type);
    try {
      let result: CheckResult;

      switch (type) {
        case "dvla": {
          if (!registration) {
            toast({ title: "No registration number", description: "This listing doesn't have a registration number to look up.", variant: "destructive" });
            break;
          }
          const { data, error } = await supabase.functions.invoke("dvla-lookup", {
            body: { registration },
          });
          if (error) throw error;
          result = data as CheckResult;
          if (result.success) {
            setDialogTitle("DVLA Vehicle Check");
            setDialogType("dvla");
            setDialogData(result.data);
            setDialogOpen(true);
          } else {
            toast({ title: "DVLA Check Failed", description: result.error, variant: "destructive" });
          }
          break;
        }
        case "mot": {
          if (!registration) {
            toast({ title: "No registration number", description: "Registration required for MOT history lookup.", variant: "destructive" });
            break;
          }
          const { data, error } = await supabase.functions.invoke("mot-history", {
            body: { registration },
          });
          if (error) throw error;
          result = data as CheckResult;
          if (result.success) {
            setDialogTitle("MOT History");
            setDialogType("mot");
            setDialogData(result.data);
            setDialogOpen(true);
          } else {
            toast({ title: "MOT Check Failed", description: result.error, variant: "destructive" });
          }
          break;
        }
        case "nhtsa": {
          if (!vin) {
            toast({ title: "No VIN", description: "This listing doesn't have a VIN for NHTSA lookup.", variant: "destructive" });
            break;
          }
          const { data, error } = await supabase.functions.invoke("nhtsa-vin-decode", {
            body: { vin },
          });
          if (error) throw error;
          result = data as CheckResult;
          if (result.success) {
            setDialogTitle("NHTSA VIN Report");
            setDialogType("nhtsa");
            setDialogData(result.data);
            setDialogOpen(true);
          } else {
            toast({ title: "VIN Decode Failed", description: result.error, variant: "destructive" });
          }
          break;
        }
        case "hpi": {
          if (!registration && !vin) {
            toast({ title: "Missing info", description: "Registration or VIN required for HPI check.", variant: "destructive" });
            break;
          }
          const { data, error } = await supabase.functions.invoke("hpi-check", {
            body: { registration, vin },
          });
          if (error) throw error;
          result = data as CheckResult;
          if (result.success) {
            setDialogTitle("HPI Check Report");
            setDialogType("hpi");
            setDialogData(result.data);
            setDialogOpen(true);
          } else {
            toast({ title: "HPI Check Failed", description: result.error, variant: "destructive" });
          }
          break;
        }
      }
    } catch (err: any) {
      toast({ title: "Check failed", description: err.message || "An error occurred", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const StatusIcon = ({ value, invert }: { value: any; invert?: boolean }) => {
    if (value === null || value === undefined) return <Info className="h-4 w-4 text-muted-foreground" />;
    const isGood = invert ? value : !value;
    return isGood ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />;
  };

  const renderDialogContent = () => {
    if (!dialogData) return null;

    if (dialogType === "dvla") {
      const d = dialogData;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Registration", value: d.registration },
              { label: "Make", value: d.make },
              { label: "Colour", value: d.colour },
              { label: "Fuel Type", value: d.fuel_type },
              { label: "Year", value: d.year_of_manufacture },
              { label: "Engine", value: d.engine_capacity },
              { label: "CO₂ Emissions", value: d.co2_emissions ? `${d.co2_emissions} g/km` : "N/A" },
              { label: "Euro Status", value: d.euro_status || "N/A" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium text-card-foreground">{item.value || "N/A"}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Tax Status</span>
              <Badge variant={d.tax_status === "Taxed" ? "default" : "destructive"}>{d.tax_status || "Unknown"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">MOT Status</span>
              <Badge variant={d.mot_status === "Valid" ? "default" : "destructive"}>{d.mot_status || "Unknown"}</Badge>
            </div>
            {d.mot_expiry_date && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">MOT Expiry</span>
                <span className="text-sm font-medium text-card-foreground">{d.mot_expiry_date}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (dialogType === "mot") {
      const d = dialogData;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{d.make} {d.model}</p>
              <p className="text-xs text-muted-foreground">{d.registration}</p>
            </div>
            <Badge variant={d.latest_result === "PASSED" ? "default" : "destructive"}>
              {d.latest_result || "No tests"}
            </Badge>
          </div>
          {d.latest_expiry && (
            <p className="text-sm text-muted-foreground">Expires: {d.latest_expiry}</p>
          )}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {d.tests?.map((test: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{test.completed_date}</span>
                    <Badge variant={test.test_result === "PASSED" ? "default" : "destructive"} className="text-xs">
                      {test.test_result}
                    </Badge>
                  </div>
                  {test.odometer_value && (
                    <p className="mt-1 text-xs text-muted-foreground">{test.odometer_value} {test.odometer_unit}</p>
                  )}
                  {test.defects?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {test.defects.map((d: any, j: number) => (
                        <li key={j} className="flex items-start gap-1 text-xs">
                          <span className={d.type === "DANGEROUS" || d.type === "MAJOR" ? "text-destructive" : "text-warning"}>•</span>
                          <span className="text-muted-foreground">{d.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (dialogType === "nhtsa") {
      const d = dialogData;
      return (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Make", value: d.make },
            { label: "Model", value: d.model },
            { label: "Year", value: d.year },
            { label: "Body Type", value: d.body_type },
            { label: "Fuel Type", value: d.fuel_type },
            { label: "Engine", value: d.engine_size },
            { label: "Cylinders", value: d.engine_cylinders },
            { label: "Horsepower", value: d.engine_hp },
            { label: "Transmission", value: d.transmission },
            { label: "Drivetrain", value: d.drivetrain },
            { label: "Doors", value: d.doors },
            { label: "Vehicle Type", value: d.vehicle_type },
            { label: "Plant Country", value: d.plant_country },
            { label: "Plant City", value: d.plant_city },
          ].filter(item => item.value).map((item) => (
            <div key={item.label} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-medium text-card-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      );
    }

    if (dialogType === "hpi") {
      const d = dialogData;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Registration", value: d.registration },
              { label: "VIN", value: d.vin },
              { label: "Make", value: d.make },
              { label: "Model", value: d.model },
              { label: "Year", value: d.year },
              { label: "Colour", value: d.colour },
            ].filter(i => i.value).map((item) => (
              <div key={item.label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium text-card-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Finance Outstanding</span>
              <div className="flex items-center gap-2">
                <StatusIcon value={d.finance_outstanding} />
                <span className="text-sm font-medium">{d.finance_outstanding ? "Yes" : d.finance_outstanding === false ? "Clear" : "Unknown"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Stolen</span>
              <div className="flex items-center gap-2">
                <StatusIcon value={d.stolen_reported} />
                <span className="text-sm font-medium">{d.stolen_reported ? "Reported" : d.stolen_reported === false ? "Clear" : "Unknown"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Write-off</span>
              <div className="flex items-center gap-2">
                <StatusIcon value={d.write_off} />
                <span className="text-sm font-medium">{d.write_off || "Clear"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Mileage Anomaly</span>
              <div className="flex items-center gap-2">
                <StatusIcon value={d.mileage_anomaly} />
                <span className="text-sm font-medium">{d.mileage_anomaly ? "Detected" : "Clear"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Scrapped</span>
              <div className="flex items-center gap-2">
                <StatusIcon value={d.scrapped} />
                <span className="text-sm font-medium">{d.scrapped ? "Yes" : "No"}</span>
              </div>
            </div>
            {d.previous_keepers !== null && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Previous Keepers</span>
                <span className="text-sm font-medium">{d.previous_keepers}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Determine which buttons to show based on country
  const isUK = country === "DE";
  const isUS = false;

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* HPI Check — UK primary, available globally */}
        <Button
          variant="outline"
          className="justify-start gap-2 border-success/30 bg-success/5 hover:bg-success/10"
          onClick={() => runCheck("hpi")}
          disabled={loading === "hpi"}
        >
          {loading === "hpi" ? <Loader2 className="h-4 w-4 animate-spin text-success" /> : <Shield className="h-4 w-4 text-success" />}
          <span className="text-success">HPI / Finance Check</span>
          <ExternalLink className="ml-auto h-3 w-3 text-success" />
        </Button>

        {/* DVLA — UK only */}
        {isUK && (
          <Button
            variant="outline"
            className="justify-start gap-2 border-info/30 bg-info/5 hover:bg-info/10"
            onClick={() => runCheck("dvla")}
            disabled={loading === "dvla"}
          >
            {loading === "dvla" ? <Loader2 className="h-4 w-4 animate-spin text-info" /> : <FileCheck className="h-4 w-4 text-info" />}
            <span className="text-info">DVLA Vehicle Check</span>
            <ExternalLink className="ml-auto h-3 w-3 text-info" />
          </Button>
        )}

        {/* MOT History — UK only */}
        {isUK && (
          <Button
            variant="outline"
            className="justify-start gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
            onClick={() => runCheck("mot")}
            disabled={loading === "mot"}
          >
            {loading === "mot" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Car className="h-4 w-4 text-primary" />}
            <span className="text-primary">MOT History</span>
            <ExternalLink className="ml-auto h-3 w-3 text-primary" />
          </Button>
        )}

        {/* NHTSA VIN Decode — US primary, available if VIN exists */}
        {(isUS || vin) && (
          <Button
            variant="outline"
            className="justify-start gap-2 border-warning/30 bg-warning/5 hover:bg-warning/10"
            onClick={() => runCheck("nhtsa")}
            disabled={loading === "nhtsa"}
          >
            {loading === "nhtsa" ? <Loader2 className="h-4 w-4 animate-spin text-warning" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
            <span className="text-warning">NHTSA VIN Report</span>
            <ExternalLink className="ml-auto h-3 w-3 text-warning" />
          </Button>
        )}

        {/* Fallback for non-UK/US without VIN */}
        {!isUK && !isUS && !vin && (
          <Button
            variant="outline"
            className="justify-start gap-2 border-warning/30 bg-warning/5 hover:bg-warning/10"
            onClick={() => toast({ title: "Vehicle History", description: "Vehicle history checks require a VIN number. Ask the seller for the VIN." })}
          >
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-warning">Vehicle History</span>
            <ExternalLink className="ml-auto h-3 w-3 text-warning" />
          </Button>
        )}
      </div>

      {/* Results Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{dialogTitle}</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VehicleChecks;
