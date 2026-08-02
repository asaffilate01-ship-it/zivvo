import { useEffect, useState, useRef } from "react";
import { useCountry } from "@/contexts/CountryContext";
import { formatPrice } from "@/lib/countryConfig";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Car, Loader2, Save, Edit, Camera, Download, Trash2, Gift, Gavel } from "lucide-react";
import ReferralPanel from "@/components/ReferralPanel";
import MyAuctions from "@/components/MyAuctions";
import AuctionAnalytics from "@/components/AuctionAnalytics";
import MfaSetupCard from "@/components/security/MfaSetupCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { t } = useTranslation("profile");
  const { user, signOut } = useAuth();
  const { config } = useCountry();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [myListings, setMyListings] = useState<any[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("toast.fileTooLarge"), description: t("toast.max5mb"), variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: t("toast.uploadFailed"), description: uploadError.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
      toast({ title: t("toast.avatarUpdated") });
    }
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
    }).eq("user_id", user.id);

    if (error) toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    else toast({ title: t("toast.profileUpdated") });
    setSaving(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profileRes, listingsRes, enquiriesRes, savedRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("car_listings").select("*").eq("seller_id", user.id),
        supabase.from("enquiries").select("*").or(`sender_id.eq.${user.id},seller_id.eq.${user.id}`),
        supabase.from("saved_cars").select("*").eq("user_id", user.id),
        supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        email: user.email,
        profile: profileRes.data,
        listings: listingsRes.data,
        enquiries: enquiriesRes.data,
        saved_cars: savedRes.data,
        messages: messagesRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zivvo-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("toast.exportSuccess") });
    } catch {
      toast({ title: t("toast.exportFailed"), variant: "destructive" });
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      toast({ title: t("toast.accountDeleted"), description: t("toast.accountDeletedDesc") });
      navigate("/");
    } catch {
      toast({ title: t("toast.deleteError"), variant: "destructive" });
    }
    setDeleting(false);
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
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="listings">{t("tabs.listings", { count: myListings.length })}</TabsTrigger>
            <TabsTrigger value="auctions"><Gavel className="mr-1 h-3.5 w-3.5" /> {t("tabs.auctions")}</TabsTrigger>
            <TabsTrigger value="referrals"><Gift className="mr-1 h-3.5 w-3.5" /> {t("tabs.referrals")}</TabsTrigger>
            <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> {t("personalInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-muted">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110"
                    >
                      {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("profilePhoto")}</p>
                    <p className="text-xs text-muted-foreground">{t("profilePhotoDesc")}</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fullName")}</label>
                  <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} placeholder={t("fullNamePlaceholder")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("email")}</label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="mt-1 text-xs text-muted-foreground">{t("emailCannotChange")}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("phone")}</label>
                  <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder={t("phonePlaceholder")} />
                </div>
                <Button onClick={handleSave} className="gradient-primary border-0" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t("saveChanges")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="mt-4 space-y-3">
            {myListings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">{t("noListings")}</p>
                  <Link to="/sell"><Button className="gradient-primary mt-4 border-0">{t("postFirstAd")}</Button></Link>
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
                    <span className="font-display font-semibold text-card-foreground">{formatPrice(Number(l.price), config)}</span>
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

          <TabsContent value="auctions" className="mt-4 space-y-6">
            <MyAuctions />
            <AuctionAnalytics />
          </TabsContent>

          <TabsContent value="referrals" className="mt-4">
            <ReferralPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4 text-primary" /> {t("accountSettings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-card-foreground">{t("accountCreated")}</p>
                  <p className="text-sm text-muted-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : t("notAvailable")}</p>
                </div>

                <MfaSetupCard />

                {/* GDPR Data Export */}
                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium text-card-foreground">{t("exportData")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("exportDataDesc")}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleExportData} disabled={exporting}>
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {t("exportDataBtn")}
                  </Button>
                </div>

                {/* Account Deletion */}
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-medium text-destructive">{t("dangerZone")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("dangerZoneDesc")}</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-3 border-destructive text-destructive" disabled={deleting}>
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        {t("deleteAccount")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("confirmDeleteDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {t("confirmDeleteAction")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
