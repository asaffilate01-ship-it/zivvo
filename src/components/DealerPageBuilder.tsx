import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Save, Loader2, Upload, Eye, Settings } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface LandingPageConfig {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  accent_color?: string;
  about_text?: string;
  show_phone?: boolean;
  show_email?: boolean;
  show_address?: boolean;
  cta_text?: string;
  logo_url?: string;
}

interface DealerPageBuilderProps {
  dealerId: string;
  currentConfig: LandingPageConfig;
  businessName: string;
  onSaved: (config: LandingPageConfig) => void;
}

const LivePreview = ({ config, businessName }: { config: LandingPageConfig; businessName: string }) => {
  const accent = config.accent_color || "#2563eb";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background text-xs">
      {/* Mini hero */}
      <div
        className="relative flex flex-col items-center justify-center px-4 py-8 text-center"
        style={{
          background: config.hero_image
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${config.hero_image}) center/cover`
            : accent,
          color: "white",
        }}
      >
        {config.logo_url && (
          <img src={config.logo_url} alt="Logo" className="mb-2 h-8 w-auto rounded object-contain" />
        )}
        <h3 className="text-sm font-bold">{config.hero_title || businessName}</h3>
        <p className="mt-0.5 text-[10px] opacity-80">{config.hero_subtitle || "Quality vehicles"}</p>
        <span
          className="mt-2 inline-block rounded px-3 py-1 text-[10px] font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          {config.cta_text || "Browse Inventory"}
        </span>
      </div>
      {/* Mini about */}
      {config.about_text && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground line-clamp-3">{config.about_text}</p>
        </div>
      )}
      {/* Contact bar */}
      <div className="flex gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
        {config.show_phone !== false && <span>📞 Phone</span>}
        {config.show_email !== false && <span>✉️ Email</span>}
        {config.show_address !== false && <span>📍 Address</span>}
      </div>
    </div>
  );
};

const DealerPageBuilder = ({ dealerId, currentConfig, businessName, onSaved }: DealerPageBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<LandingPageConfig>({
    hero_title: currentConfig.hero_title || businessName,
    hero_subtitle: currentConfig.hero_subtitle || "Quality vehicles at great prices",
    hero_image: currentConfig.hero_image || "",
    accent_color: currentConfig.accent_color || "#2563eb",
    about_text: currentConfig.about_text || "",
    show_phone: currentConfig.show_phone !== false,
    show_email: currentConfig.show_email !== false,
    show_address: currentConfig.show_address !== false,
    cta_text: currentConfig.cta_text || "Browse Our Inventory",
    logo_url: currentConfig.logo_url || "",
  });

  const update = (key: keyof LandingPageConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo must be under 2MB", variant: "destructive" });
      return;
    }
    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("car-images").getPublicUrl(path);
      update("logo_url", data.publicUrl);
      toast({ title: "Logo uploaded!" });
    } else {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploadingLogo(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("dealers")
      .update({ landing_page_config: config as any, logo_url: config.logo_url || null })
      .eq("id", dealerId);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Landing page updated!" });
      onSaved(config);
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="mr-1 h-4 w-4" /> Customize Page
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Landing Page</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="settings" className="flex-1 gap-1">
              <Settings className="h-3.5 w-3.5" /> Settings
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 gap-1">
              <Eye className="h-3.5 w-3.5" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 pt-2">
            {/* Logo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {config.logo_url ? (
                    <img src={config.logo_url} alt="Logo" className="h-12 w-auto rounded border border-border object-contain" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-border text-muted-foreground">
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                      {config.logo_url ? "Change Logo" : "Upload Logo"}
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground">Max 2MB. PNG or JPG recommended.</p>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </CardContent>
            </Card>

            {/* Hero */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Headline</Label>
                  <Input value={config.hero_title} onChange={(e) => update("hero_title", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Subtitle</Label>
                  <Input value={config.hero_subtitle} onChange={(e) => update("hero_subtitle", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hero Image URL</Label>
                  <Input value={config.hero_image} onChange={(e) => update("hero_image", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CTA Button Text</Label>
                  <Input value={config.cta_text} onChange={(e) => update("cta_text", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Branding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label className="text-xs">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.accent_color} onChange={(e) => update("accent_color", e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-border" />
                    <Input value={config.accent_color} onChange={(e) => update("accent_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">About Section</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea rows={4} value={config.about_text} onChange={(e) => update("about_text", e.target.value)} placeholder="Tell customers about your dealership..." />
              </CardContent>
            </Card>

            {/* Contact Visibility */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contact Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {([
                  { key: "show_phone" as const, label: "Show Phone Number" },
                  { key: "show_email" as const, label: "Show Email Address" },
                  { key: "show_address" as const, label: "Show Address" },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs">{label}</Label>
                    <Switch checked={!!config[key]} onCheckedChange={(v) => update(key, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full gradient-primary border-0" disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Save Changes
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="pt-2">
            <p className="mb-3 text-xs text-muted-foreground">This is a preview of how your landing page will look.</p>
            <LivePreview config={config} businessName={businessName} />
            <Button onClick={handleSave} className="mt-4 w-full gradient-primary border-0" disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Save Changes
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DealerPageBuilder;
