import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast({ title: t("dealer.vehicleFinder.checkDetailsTitle"), description: t("dealer.vehicleFinder.checkDetailsDescription"), variant: "destructive" });
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
      toast({ title: t("dealer.vehicleFinder.couldNotSubmit"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("dealer.vehicleFinder.thanksTitle"), description: t("dealer.vehicleFinder.thanksDescription", { dealerName: dealerName ?? t("dealer.vehicleFinder.theDealer") }) });
    setForm({ name: "", email: "", phone: "", make: "", model: "", year_from: "", year_to: "",
      budget_max: "", fuel_type: "", transmission: "", body_type: "", notes: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchCheck className="w-5 h-5 text-primary" /> {t("dealer.vehicleFinder.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("dealer.vehicleFinder.subtitle", { dealerName: dealerName ?? t("dealer.vehicleFinder.us") })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-xs">{t("dealer.vehicleFinder.yourName")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.email")}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.phoneOptional")}</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.maxBudget")}</Label>
            <Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.make")}</Label>
            <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.model")}</Label>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.yearFrom")}</Label>
            <Input type="number" value={form.year_from} onChange={(e) => setForm({ ...form, year_from: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.yearTo")}</Label>
            <Input type="number" value={form.year_to} onChange={(e) => setForm({ ...form, year_to: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.fuel")}</Label>
            <Input placeholder={t("dealer.vehicleFinder.fuelPlaceholder")} value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} /></div>
          <div><Label className="text-xs">{t("dealer.vehicleFinder.bodyType")}</Label>
            <Input placeholder={t("dealer.vehicleFinder.bodyTypePlaceholder")} value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })} /></div>
        </div>
        <div>
          <Label className="text-xs">{t("dealer.vehicleFinder.otherRequirements")}</Label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SearchCheck className="w-4 h-4 mr-2" />}
          {t("dealer.vehicleFinder.findMe")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VehicleFinderForm;
