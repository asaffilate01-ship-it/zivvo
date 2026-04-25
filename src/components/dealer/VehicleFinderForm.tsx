import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SearchCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1500).optional(),
});

interface Props {
  dealerId: string;
  dealerName?: string;
}

const VehicleFinderForm = ({ dealerId, dealerName }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    make: "", model: "", year_from: "", year_to: "", budget_max: "",
    fuel_type: "", transmission: "", body_type: "", notes: "",
  });

  const submit = async () => {
    const parsed = schema.safeParse({ name: form.name, email: form.email, phone: form.phone, notes: form.notes });
    if (!parsed.success) {
      toast({ title: "Check your details", description: "Name and a valid email are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("vehicle_finder_requests").insert({
      dealer_id: dealerId,
      buyer_id: user?.id ?? null,
      name: form.name, email: form.email,
      phone: form.phone || null,
      make: form.make || null,
      model: form.model || null,
      year_from: form.year_from ? Number(form.year_from) : null,
      year_to: form.year_to ? Number(form.year_to) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      fuel_type: form.fuel_type || null,
      transmission: form.transmission || null,
      body_type: form.body_type || null,
      notes: form.notes || null,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thanks!", description: `${dealerName ?? "The dealer"} will get in touch when a match is found.` });
    setForm({ name: "", email: "", phone: "", make: "", model: "", year_from: "", year_to: "",
      budget_max: "", fuel_type: "", transmission: "", body_type: "", notes: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchCheck className="w-5 h-5 text-primary" /> Can't find what you're looking for?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell {dealerName ?? "us"} what you want and we'll source it for you.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Your name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Phone (optional)</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="text-xs">Max budget (£)</Label>
            <Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
          <div><Label className="text-xs">Make</Label>
            <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
          <div><Label className="text-xs">Model</Label>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          <div><Label className="text-xs">Year from</Label>
            <Input type="number" value={form.year_from} onChange={(e) => setForm({ ...form, year_from: e.target.value })} /></div>
          <div><Label className="text-xs">Year to</Label>
            <Input type="number" value={form.year_to} onChange={(e) => setForm({ ...form, year_to: e.target.value })} /></div>
          <div><Label className="text-xs">Fuel</Label>
            <Input placeholder="Petrol / Diesel / Electric" value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} /></div>
          <div><Label className="text-xs">Body type</Label>
            <Input placeholder="SUV / Hatchback…" value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })} /></div>
        </div>
        <div>
          <Label className="text-xs">Other requirements</Label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SearchCheck className="w-4 h-4 mr-2" />}
          Find me this vehicle
        </Button>
      </CardContent>
    </Card>
  );
};

export default VehicleFinderForm;
