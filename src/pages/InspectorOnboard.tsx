import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const InspectorOnboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    qualifications: "",
    years_experience: "0",
    bio: "",
    base_address: "",
    coverage_postcodes: "",
    max_travel_miles: "30",
  });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("inspector_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setExistingId(data.id);
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          email: data.email || user.email || "",
          qualifications: data.qualifications || "",
          years_experience: String(data.years_experience || 0),
          bio: data.bio || "",
          base_address: data.base_address || "",
          coverage_postcodes: (data.coverage_postcodes || []).join(", "),
          max_travel_miles: String(data.max_travel_miles || 30),
        });
      } else {
        setForm((f) => ({ ...f, email: user.email || "" }));
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!form.full_name || !form.phone) {
      toast({ title: "Required fields missing", description: "Full name and phone are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        qualifications: form.qualifications,
        years_experience: parseInt(form.years_experience) || 0,
        bio: form.bio,
        base_address: form.base_address,
        coverage_postcodes: form.coverage_postcodes
          .split(",").map((p) => p.trim().toUpperCase()).filter(Boolean),
        max_travel_miles: parseInt(form.max_travel_miles) || 30,
      };
      const { error } = existingId
        ? await supabase.from("inspector_profiles").update(payload).eq("id", existingId)
        : await supabase.from("inspector_profiles").insert(payload);
      if (error) throw error;
      toast({ title: "Profile saved", description: existingId ? "Changes saved" : "Awaiting admin verification" });
      navigate("/inspector");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Inspector profile</h1>
        <p className="text-muted-foreground text-sm mb-6">Set up your profile so we can route inspection jobs in your area.</p>

        <Card>
          <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>Qualifications (e.g. NVQ Level 3, IMI)</Label><Input value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} /></div>
            <div><Label>Years of experience</Label><Input type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} /></div>
            <div><Label>Short bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Coverage area</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Base address</Label><Input value={form.base_address} onChange={(e) => setForm({ ...form, base_address: e.target.value })} /></div>
            <div>
              <Label>Postcode prefixes covered (comma-separated)</Label>
              <Input placeholder="e.g. SW, SE, E, EC, N, NW" value={form.coverage_postcodes} onChange={(e) => setForm({ ...form, coverage_postcodes: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Use the outward part only (first letters/digits before the space).</p>
            </div>
            <div><Label>Max travel distance (miles)</Label><Input type="number" value={form.max_travel_miles} onChange={(e) => setForm({ ...form, max_travel_miles: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={saving} className="w-full mt-4">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save profile
        </Button>
      </div>
    </div>
  );
};

export default InspectorOnboard;
