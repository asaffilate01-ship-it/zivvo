import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnquiryFormProps {
  listingId: string;
  sellerId: string;
  listingTitle: string;
}

const EnquiryForm = ({ listingId, sellerId, listingTitle }: EnquiryFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    message: "",
    sender_name: "",
    sender_email: "",
    sender_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in to send enquiries", variant: "destructive" });
      return;
    }
    if (!form.message.trim()) return;

    setLoading(true);
    const { data: enquiry, error } = await supabase.from("enquiries").insert({
      listing_id: listingId,
      seller_id: sellerId,
      sender_id: user.id,
      message: form.message,
      sender_name: form.sender_name || null,
      sender_email: form.sender_email || null,
      sender_phone: form.sender_phone || null,
    }).select("id").single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      // Increment enquiries count
      const { data: listing } = await supabase.from("car_listings").select("enquiries_count").eq("id", listingId).single();
      if (listing) {
        await supabase.from("car_listings").update({ enquiries_count: (listing.enquiries_count || 0) + 1 }).eq("id", listingId);
      }
      // Trigger notification (fire-and-forget)
      if (enquiry?.id) {
        supabase.functions.invoke("notify-enquiry", {
          body: { enquiryId: enquiry.id },
        }).catch(() => {}); // silent fail
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Mail className="mr-2 h-4 w-4" />
          Send Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Send Enquiry</DialogTitle>
          <p className="text-sm text-muted-foreground">About: {listingTitle}</p>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">Message Sent!</h3>
            <p className="mt-1 text-sm text-muted-foreground">The seller will be notified of your enquiry.</p>
            <Button className="mt-4" onClick={() => { setOpen(false); setSent(false); setForm({ message: "", sender_name: "", sender_email: "", sender_phone: "" }); }}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Your Name</label>
              <Input value={form.sender_name} onChange={(e) => setForm((p) => ({ ...p, sender_name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={form.sender_email} onChange={(e) => setForm((p) => ({ ...p, sender_email: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
                <Input value={form.sender_phone} onChange={(e) => setForm((p) => ({ ...p, sender_phone: e.target.value }))} placeholder="+44 7123 456789" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Message *</label>
              <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Hi, I'm interested in this vehicle..." rows={4} required />
            </div>
            <Button type="submit" className="gradient-primary w-full border-0" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Enquiry
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryForm;
