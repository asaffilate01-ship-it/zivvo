import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    country: "GB",
    website_url: "",
    description: "",
    tier: "starter",
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

    // Create a slug from business name
    const slug = form.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // We need a user_id for the dealer - for now create a placeholder
    // The dealer will claim this once they sign up and subscribe
    const { data, error } = await supabase.from("dealers").insert({
      business_name: form.business_name,
      business_email: form.business_email || null,
      business_phone: form.business_phone || null,
      address: form.address || null,
      city: form.city || null,
      postcode: form.postcode || null,
      country: form.country,
      website_url: form.website_url || null,
      description: form.description || null,
      tier: form.tier as "starter" | "professional" | "enterprise",
      slug,
      onboarded_by_agent: user.id,
      user_id: user.id, // Agent creates with their ID; dealer claims later
      kyc_submitted_at: new Date().toISOString(),
      subscription_status: "incomplete",
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dealer onboarded!", description: `${form.business_name} has been added to your pipeline.` });
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
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Onboard New Dealer</CardTitle>
                <p className="text-sm text-muted-foreground">Register a dealer and earn 30% recurring commission</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Business Name *</label>
                <Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} placeholder="Acme Motors Ltd" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Business Email</label>
                  <Input type="email" value={form.business_email} onChange={(e) => update("business_email", e.target.value)} placeholder="info@acmemotors.com" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Business Phone</label>
                  <Input value={form.business_phone} onChange={(e) => update("business_phone", e.target.value)} placeholder="+44 7123 456789" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Address</label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Motor Lane" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">City</label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="London" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Postcode</label>
                  <Input value={form.postcode} onChange={(e) => update("postcode", e.target.value)} placeholder="SW1A 1AA" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Country</label>
                  <Select value={form.country} onValueChange={(v) => update("country", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AE">UAE</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Website</label>
                <Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://acmemotors.com" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Recommended Plan</label>
                <Select value={form.tier} onValueChange={(v) => update("tier", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter (£49/mo)</SelectItem>
                    <SelectItem value="professional">Professional (£99/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (£199/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Description / Notes</label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Additional notes about the business..." rows={3} />
              </div>

              <Button type="submit" className="gradient-primary w-full border-0" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Onboard Dealer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentOnboard;
