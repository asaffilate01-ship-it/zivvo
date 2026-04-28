import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";

interface Props {
  listing: any;
  open: boolean;
  onClose: () => void;
}

const docFields: { key: string; label: string }[] = [
  { key: "logbook_url", label: "V5C Logbook" },
  { key: "photo_id_url", label: "Photo ID" },
  { key: "consignment_agreement_url", label: "Consignment Agreement" },
  { key: "trade_invoice_url", label: "Trade Invoice" },
  { key: "finance_settlement_letter_url", label: "Finance Settlement Letter" },
];

const AdminVerificationDialog = ({ listing, open, onClose }: Props) => {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !listing) return;
    (async () => {
      const urls: Record<string, string> = {};
      for (const { key } of docFields) {
        const path = listing[key];
        if (!path) continue;
        const { data } = await supabase.storage.from("listing-documents").createSignedUrl(path, 600);
        if (data?.signedUrl) urls[key] = data.signedUrl;
      }
      setSignedUrls(urls);
    })();
  }, [open, listing]);

  if (!listing) return null;
  const hpi = listing.hpi_check_data;
  const hpiIssues = hpi && (hpi.stolen_reported || hpi.finance_outstanding || hpi.write_off);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Verification: {listing.year} {listing.make} {listing.model}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><span className="text-muted-foreground">Sale type:</span> <Badge variant="outline">{listing.sale_type || "own"}</Badge></div>
            <div><span className="text-muted-foreground">Registration:</span> {listing.registration || "—"}</div>
          </div>

          {listing.sale_type === "consignment" && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <p className="font-medium">Consignment Owner</p>
              <p className="text-xs text-muted-foreground">{listing.owner_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{listing.owner_address || "—"}</p>
            </div>
          )}

          <div className={`rounded-md border p-3 ${listing.finance_outstanding ? "border-amber-500/40 bg-amber-500/5" : "border-success/40 bg-success/5"}`}>
            <p className="font-medium flex items-center gap-2">
              {listing.finance_outstanding ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-success" />}
              Finance: {listing.finance_outstanding ? "Outstanding (declared)" : "None declared"}
            </p>
            {listing.finance_outstanding && (
              <div className="mt-2 text-xs">
                <p>Lender: <strong>{listing.finance_lender || "—"}</strong></p>
                <p>Settlement: <strong>£{Number(listing.finance_settlement_amount || 0).toLocaleString()}</strong></p>
              </div>
            )}
          </div>

          {hpi && (
            <div className={`rounded-md border p-3 ${hpiIssues ? "border-destructive/40 bg-destructive/5" : "border-success/40 bg-success/5"}`}>
              <p className="font-medium">HPI Cross-Check {hpiIssues ? "⚠️ Issues" : "✅ Clear"}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>Stolen: {hpi.stolen_reported ? "❌" : "✅"}</div>
                <div>Finance: {hpi.finance_outstanding ? "❌" : "✅"}</div>
                <div>Write-off: {hpi.write_off ? "❌" : "✅"}</div>
              </div>
              {hpi.finance_outstanding && !listing.finance_outstanding && (
                <p className="mt-2 text-xs text-destructive">⚠️ HPI shows finance, but seller declared NONE — investigate before approving.</p>
              )}
            </div>
          )}

          <div>
            <p className="font-medium mb-2">Documents</p>
            <div className="space-y-2">
              {docFields.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-md border p-2">
                  <span className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" /> {label}
                  </span>
                  {listing[key] ? (
                    signedUrls[key] ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={signedUrls[key]} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" /> View
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline">Loading…</Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="mr-1 h-3 w-3" /> Not provided
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="font-medium">Truth Declaration</p>
            <p className="text-muted-foreground">
              {listing.truth_declaration_accepted
                ? `✅ Accepted ${listing.truth_declaration_at ? `on ${new Date(listing.truth_declaration_at).toLocaleString()}` : ""}`
                : "❌ Not accepted"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVerificationDialog;
