import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  delivery_postcode: z.string().trim().min(2).max(20),
  notes: z.string().trim().max(1000).optional(),
});

interface Props {
  listingId: string;
  dealerId?: string | null;
  trigger?: React.ReactNode;
}

const TransportQuoteDialog = ({ listingId, dealerId, trigger }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", delivery_postcode: "", notes: "" });

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check your details", description: "Please enter name, email and postcode.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("transport_quotes").insert({
      listing_id: listingId, dealer_id: dealerId ?? null, buyer_id: user?.id ?? null,
      name: parsed.data.name, email: parsed.data.email,
      phone: parsed.data.phone || null,
      delivery_postcode: parsed.data.delivery_postcode.toUpperCase(),
      notes: parsed.data.notes || null,
      status: "pending",
    });
    setLoading(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Quote requested", description: "The dealer will get back to you with delivery options." });
    setOpen(false);
    setForm({ name: "", email: "", phone: "", delivery_postcode: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline"><Truck className="w-4 h-4 mr-2" /> Delivery quote</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Get a delivery quote</DialogTitle>
          <DialogDescription>We'll send you a transport quote to your postcode.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Delivery postcode</Label>
            <Input value={form.delivery_postcode} onChange={(e) => setForm({ ...form, delivery_postcode: e.target.value })} /></div>
          <div><Label className="text-xs">Notes (optional)</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Truck className="w-4 h-4 mr-2" />}
            Request quote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransportQuoteDialog;
