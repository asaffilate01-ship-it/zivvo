import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import SponsoredAdCard from "@/components/SponsoredAdCard";
import { supabase } from "@/integrations/supabase/client";

const initial = () => ({ name: "", creative_url: "", destination_path: "/browse", starts_at: new Date().toISOString().slice(0, 16), ends_at: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 16), is_active: false });

const AdManager = () => {
  const [form, setForm] = useState(initial);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.functions.invoke("ad-campaigns", { body: { action: "list" } });
    if (!error) setCampaigns(data?.campaigns || []);
  };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.functions.invoke("ad-campaigns", { body: { action: "save", ...form } });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Kampagne gespeichert"); setForm(initial()); void load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.functions.invoke("ad-campaigns", { body: { action: "delete", id } });
    if (error) toast.error(error.message); else void load();
  };
  return (
    <Card>
      <CardHeader><CardTitle>Werbekampagnen</CardTitle><CardDescription>Globale, zeitgesteuerte Bildkampagnen. Externe Skripte und ungeprüftes HTML sind nicht zulässig; Auslieferung erfolgt erst nach Marketing-Einwilligung.</CardDescription></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div><Label>HTTPS-Bild-URL</Label><Input value={form.creative_url} onChange={(event) => setForm({ ...form, creative_url: event.target.value })} placeholder="https://cdn.example.de/kampagne.webp" /></div>
          <div><Label>Interner Zielpfad</Label><Input value={form.destination_path} onChange={(event) => setForm({ ...form, destination_path: event.target.value })} placeholder="/browse?make=BMW" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><Label>Start</Label><Input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /></div><div><Label>Ende</Label><Input type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /></div></div>
          <label className="flex items-center justify-between rounded-lg border p-3"><span>Aktivieren</span><Switch checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} /></label>
          <Button onClick={save} disabled={saving}>{saving ? "Speichert…" : "Kampagne speichern"}</Button>
          <div className="space-y-2 border-t pt-4">{campaigns.map((campaign) => <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{campaign.name}</p><p className="text-xs text-muted-foreground">{campaign.is_active ? "Aktiv" : "Inaktiv"} · bis {new Date(campaign.ends_at).toLocaleDateString("de-DE")}</p></div><Button size="sm" variant="outline" onClick={() => remove(campaign.id)}>Löschen</Button></div>)}</div>
        </div>
        <div><p className="mb-2 text-sm font-medium">Vorschau</p><SponsoredAdCard manualAd={form.creative_url ? { imageUrl: form.creative_url, href: form.destination_path, alt: form.name } : undefined} /></div>
      </CardContent>
    </Card>
  );
};

export default AdManager;
