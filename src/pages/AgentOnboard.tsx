import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { idempotencyHeaders } from "@/lib/idempotency";

const AgentOnboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    business_email: "",
    business_phone: "",
    address: "",
    city: "",
    postcode: "",
    website_url: "",
    description: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.business_name.trim()) {
      toast({ title: "Business name is required", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.functions.invoke("invite-dealer", {
      headers: idempotencyHeaders(),
      body: form,
    });

    if (error) {
      toast({ title: "Einladung fehlgeschlagen", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Händler eingeladen", description: `${form.business_name} erhält eine sichere Konto-Einladung.` });
      navigate("/agent");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/agent")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zum Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Neuen Händler einladen</CardTitle>
                <p className="text-sm text-muted-foreground">Der Händler erhält ein eigenes Konto und durchläuft anschließend Abo und KYC.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Firmenname *</label>
                <Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} placeholder="Autohaus Beispiel GmbH" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Geschäftliche E-Mail *</label>
                  <Input required type="email" value={form.business_email} onChange={(e) => update("business_email", e.target.value)} placeholder="info@autohaus.de" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Telefon</label>
                  <Input value={form.business_phone} onChange={(e) => update("business_phone", e.target.value)} placeholder="+49 30 12345678" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Anschrift</label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Beispielstraße 1" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Ort</label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Berlin" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">PLZ</label>
                  <Input value={form.postcode} onChange={(e) => update("postcode", e.target.value)} placeholder="10115" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Website (HTTPS)</label>
                <Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://autohaus.de" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Interne Notiz</label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Ansprechpartner und Kontext zur Einladung" rows={3} />
              </div>

              <Button type="submit" className="gradient-primary w-full border-0" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Einladung senden
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentOnboard;
