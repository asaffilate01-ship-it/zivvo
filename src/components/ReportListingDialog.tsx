import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flag, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const reasons = [
  "Fraudulent listing",
  "Incorrect information",
  "Already sold",
  "Offensive content",
  "Suspicious pricing",
  "Other",
];

const ReportListingDialog = ({ listingId }: { listingId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!user) { toast({ title: "Sign in to report listings", variant: "destructive" }); return; }
    if (!reason) { toast({ title: "Please select a reason", variant: "destructive" }); return; }

    setLoading(true);
    const { error } = await supabase.from("listing_reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason,
      details: details || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSent(false); setReason(""); setDetails(""); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="mr-1 h-3.5 w-3.5" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Report Listing</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-12 w-12 text-success" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Report Submitted</h3>
            <p className="mt-1 text-sm text-muted-foreground">Our team will review this listing. Thank you.</p>
            <Button className="mt-4" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Reason</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Additional details (optional)</label>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Provide more context..." rows={3} />
            </div>
            <Button className="w-full gradient-primary border-0" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
              Submit Report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportListingDialog;
