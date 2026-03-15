import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Car, Loader2, Save, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [myListings, setMyListings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [profileRes, listingsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("car_listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name || "",
          phone: profileRes.data.phone || "",
          avatar_url: profileRes.data.avatar_url || "",
        });
      }
      if (listingsRes.data) setMyListings(listingsRes.data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
    }).eq("user_id", user.id);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated!" });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and listings</p>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="listings">My Listings ({myListings.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                  <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
                  <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+44 7123 456789" />
                </div>
                <Button onClick={handleSave} className="gradient-primary border-0" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="mt-4 space-y-3">
            {myListings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">You haven't listed any cars yet</p>
                  <Link to="/sell"><Button className="gradient-primary mt-4 border-0">Post Your First Ad</Button></Link>
                </CardContent>
              </Card>
            ) : myListings.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <Link to={`/car/${l.id}`} className="font-medium text-card-foreground hover:text-primary">{l.title}</Link>
                    <p className="text-sm text-muted-foreground">{l.make} {l.model} · {l.year}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge>
                    <span className="font-display font-semibold text-card-foreground">${Number(l.price).toLocaleString()}</span>
                    <Link to={`/dashboard/listings/edit?edit=${l.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4 text-primary" /> Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-card-foreground">Account Created</p>
                  <p className="text-sm text-muted-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-medium text-destructive">Danger Zone</p>
                  <p className="mt-1 text-sm text-muted-foreground">Account deletion is permanent and cannot be undone.</p>
                  <Button variant="outline" size="sm" className="mt-3 border-destructive text-destructive">Request Account Deletion</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
