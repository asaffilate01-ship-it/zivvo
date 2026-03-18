import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Palette, Save, Loader2, Upload, Eye, Settings, Building2, Phone, Mail, MapPin,
  Globe, BadgeCheck, Star, Clock, Shield, Car, ArrowRight, Plus, Trash2, X, Monitor,
  Smartphone,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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
  tagline?: string;
  show_stats?: boolean;
  show_testimonials?: boolean;
  testimonials?: Array<{ name: string; text: string; rating: number }>;
  opening_hours?: string;
  specialities?: string[];
  hero_style?: "overlay" | "split" | "minimal";
}

interface DealerPageBuilderProps {
  dealerId: string;
  currentConfig: LandingPageConfig;
  businessName: string;
  onSaved: (config: LandingPageConfig) => void;
}

/* ─── Full-Page Preview ─── */
const FullPreview = ({ config, businessName, previewMode }: { config: LandingPageConfig; businessName: string; previewMode: "desktop" | "mobile" }) => {
  const accent = config.accent_color || "#2563eb";
  const heroStyle = config.hero_style || "overlay";
  const heroImage = config.hero_image || "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1920&q=80";

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={`mx-auto overflow-hidden rounded-xl border border-border bg-background shadow-elevated ${previewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
      {children}
    </div>
  );

  return (
    <Wrapper>
      {/* Preview Hero */}
      {heroStyle === "split" ? (
        <div className="grid grid-cols-2">
          <div className="flex flex-col justify-center p-4">
            {config.logo_url && <img src={config.logo_url} alt="Logo" className="mb-2 h-6 w-auto object-contain" />}
            <h3 className="text-sm font-bold text-foreground">{config.hero_title || businessName}</h3>
            {config.hero_subtitle && <p className="mt-0.5 text-[10px] text-muted-foreground">{config.hero_subtitle}</p>}
            <div className="mt-2 flex gap-1">
              <span className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium text-white" style={{ backgroundColor: accent }}>
                {config.cta_text || "View Inventory"}
              </span>
            </div>
          </div>
          <div className="min-h-[120px] bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        </div>
      ) : heroStyle === "minimal" ? (
        <div className="flex items-center gap-3 border-b border-border p-4">
          {config.logo_url ? (
            <img src={config.logo_url} alt="Logo" className="h-8 w-8 rounded border border-border object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded border border-border"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
          )}
          <div className="flex-1">
            <h3 className="text-xs font-bold text-foreground">{config.hero_title || businessName}</h3>
            {config.hero_subtitle && <p className="text-[9px] text-muted-foreground">{config.hero_subtitle}</p>}
          </div>
          <span className="rounded px-2 py-0.5 text-[9px] font-medium text-white" style={{ backgroundColor: accent }}>
            {config.cta_text || "View Inventory"}
          </span>
        </div>
      ) : (
        <div
          className="relative flex flex-col items-center justify-center px-4 py-10 text-center"
          style={{
            background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(${heroImage}) center/cover`,
          }}
        >
          {config.logo_url && (
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm">
              <img src={config.logo_url} alt="Logo" className="h-7 w-7 rounded object-contain" />
            </div>
          )}
          <h3 className="text-base font-bold text-white">{config.hero_title || businessName}</h3>
          {config.hero_subtitle && <p className="mt-1 text-[11px] text-white/70">{config.hero_subtitle}</p>}
          <span className="mt-3 inline-block rounded-md px-4 py-1.5 text-[11px] font-medium text-white shadow" style={{ backgroundColor: accent }}>
            {config.cta_text || "Browse Inventory"}
          </span>
          <div className="mt-3 flex gap-3 text-[9px] text-white/50">
            {config.show_phone !== false && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" /> Phone</span>}
            {config.show_email !== false && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" /> Email</span>}
            {config.show_address !== false && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> Location</span>}
          </div>
        </div>
      )}

      {/* Stats */}
      {config.show_stats !== false && (
        <div className="grid grid-cols-4 border-b border-border text-center text-[9px]">
          {["🚗 Stock", "⭐ 4.9", `🕐 ${config.opening_hours || "Mon–Sat"}`, "✅ Verified"].map((s) => (
            <div key={s} className="border-r border-border last:border-0 py-2 text-muted-foreground">{s}</div>
          ))}
        </div>
      )}

      {/* About */}
      {config.about_text && (
        <div className="border-b border-border p-4">
          <p className="text-[10px] font-semibold text-foreground mb-1">About</p>
          <p className="text-[9px] leading-relaxed text-muted-foreground line-clamp-4">{config.about_text}</p>
          {config.specialities && config.specialities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {config.specialities.map((s) => (
                <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fake inventory */}
      <div className="p-4">
        <p className="text-[10px] font-semibold text-foreground mb-2">Inventory</p>
        <div className={`grid gap-2 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-3"}`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="h-12 bg-muted" />
              <div className="p-2">
                <div className="h-2 w-3/4 rounded bg-muted" />
                <div className="mt-1 h-2 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      {config.show_testimonials !== false && config.testimonials && config.testimonials.length > 0 && (
        <div className="border-t border-border bg-muted/30 p-4">
          <p className="text-[10px] font-semibold text-foreground mb-2 text-center">Customer Reviews</p>
          <div className={`grid gap-2 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
            {config.testimonials.slice(0, 2).map((t, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-2 w-2 fill-warning text-warning" />
                  ))}
                </div>
                <p className="mt-1 text-[8px] text-muted-foreground line-clamp-2">"{t.text}"</p>
                <p className="mt-1 text-[7px] font-semibold text-foreground">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA footer */}
      <div className="p-4 text-center" style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}15)` }}>
        <p className="text-[10px] font-semibold text-foreground">Ready to find your next car?</p>
        <span className="mt-1 inline-block rounded px-3 py-1 text-[9px] font-medium text-white" style={{ backgroundColor: accent }}>
          Contact Us
        </span>
      </div>
    </Wrapper>
  );
};

/* ─── Main Builder ─── */
const DealerPageBuilder = ({ dealerId, currentConfig, businessName, onSaved }: DealerPageBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newSpeciality, setNewSpeciality] = useState("");
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
    tagline: currentConfig.tagline || "",
    show_stats: currentConfig.show_stats !== false,
    show_testimonials: currentConfig.show_testimonials !== false,
    testimonials: currentConfig.testimonials || [],
    opening_hours: currentConfig.opening_hours || "Mon–Sat 9am–6pm",
    specialities: currentConfig.specialities || [],
    hero_style: currentConfig.hero_style || "overlay",
  });

  const update = (key: keyof LandingPageConfig, value: any) => setConfig((prev) => ({ ...prev, [key]: value }));

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

  const addTestimonial = () => {
    update("testimonials", [...(config.testimonials || []), { name: "", text: "", rating: 5 }]);
  };
  const updateTestimonial = (idx: number, field: string, value: any) => {
    const updated = [...(config.testimonials || [])];
    (updated[idx] as any)[field] = value;
    update("testimonials", updated);
  };
  const removeTestimonial = (idx: number) => {
    update("testimonials", (config.testimonials || []).filter((_, i) => i !== idx));
  };

  const addSpeciality = () => {
    if (!newSpeciality.trim()) return;
    update("specialities", [...(config.specialities || []), newSpeciality.trim()]);
    setNewSpeciality("");
  };
  const removeSpeciality = (idx: number) => {
    update("specialities", (config.specialities || []).filter((_, i) => i !== idx));
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

  const ACCENT_PRESETS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#4f46e5", "#be123c"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="mr-1 h-4 w-4" /> Customize Page
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-5xl p-0">
        <div className="flex h-[85vh] flex-col md:flex-row">
          {/* Settings panel */}
          <div className="w-full overflow-y-auto border-r border-border p-5 md:w-[400px] md:shrink-0">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base">Page Builder</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Hero Style */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Hero Layout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {(["overlay", "split", "minimal"] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => update("hero_style", style)}
                        className={`rounded-lg border-2 p-2 text-center text-[10px] font-medium capitalize transition-all ${config.hero_style === style ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                      >
                        {style === "overlay" && "🖼️"}
                        {style === "split" && "◧"}
                        {style === "minimal" && "—"}
                        <br />{style}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Logo */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Logo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {config.logo_url ? (
                      <img src={config.logo_url} alt="Logo" className="h-10 w-auto rounded border border-border object-contain" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-border">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                      {config.logo_url ? "Change" : "Upload"}
                    </Button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </CardContent>
              </Card>

              {/* Hero Content */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Hero Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs">Headline</Label>
                    <Input className="h-8 text-sm" value={config.hero_title} onChange={(e) => update("hero_title", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle</Label>
                    <Input className="h-8 text-sm" value={config.hero_subtitle} onChange={(e) => update("hero_subtitle", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hero Image URL</Label>
                    <Input className="h-8 text-sm" value={config.hero_image} onChange={(e) => update("hero_image", e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CTA Button Text</Label>
                    <Input className="h-8 text-sm" value={config.cta_text} onChange={(e) => update("cta_text", e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.accent_color} onChange={(e) => update("accent_color", e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" />
                      <Input className="h-8 flex-1 text-xs" value={config.accent_color} onChange={(e) => update("accent_color", e.target.value)} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ACCENT_PRESETS.map((c) => (
                        <button
                          key={c}
                          onClick={() => update("accent_color", c)}
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${config.accent_color === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About & Specialities */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">About Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <Textarea rows={3} className="text-sm" value={config.about_text} onChange={(e) => update("about_text", e.target.value)} placeholder="Tell customers about your dealership..." />
                  <div className="space-y-1">
                    <Label className="text-xs">Specialities</Label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {(config.specialities || []).map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1">
                          {s}
                          <button onClick={() => removeSpeciality(i)}><X className="h-2.5 w-2.5" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input className="h-7 text-xs flex-1" value={newSpeciality} onChange={(e) => setNewSpeciality(e.target.value)} placeholder="e.g. German Cars" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpeciality())} />
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addSpeciality}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Opening Hours</Label>
                    <Input className="h-8 text-sm" value={config.opening_hours} onChange={(e) => update("opening_hours", e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Toggles */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {([
                    { key: "show_phone" as const, label: "Phone Number" },
                    { key: "show_email" as const, label: "Email Address" },
                    { key: "show_address" as const, label: "Address" },
                    { key: "show_stats" as const, label: "Statistics Strip" },
                    { key: "show_testimonials" as const, label: "Testimonials" },
                  ]).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-xs">{label}</Label>
                      <Switch checked={config[key] !== false} onCheckedChange={(v) => update(key, v)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Testimonials */}
              {config.show_testimonials !== false && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Testimonials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(config.testimonials || []).map((t, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 space-y-2 relative">
                        <button onClick={() => removeTestimonial(i)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <Input className="h-7 text-xs" placeholder="Customer name" value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)} />
                        <Textarea rows={2} className="text-xs" placeholder="Their review..." value={t.text} onChange={(e) => updateTestimonial(i, "text", e.target.value)} />
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground mr-1">Rating:</Label>
                          {[1, 2, 3, 4, 5].map((r) => (
                            <button key={r} onClick={() => updateTestimonial(i, "rating", r)}>
                              <Star className={`h-3.5 w-3.5 ${r <= t.rating ? "fill-warning text-warning" : "text-border"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={addTestimonial}>
                      <Plus className="mr-1 h-3 w-3" /> Add Testimonial
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleSave} className="w-full gradient-primary border-0" disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Save & Publish
              </Button>
            </div>
          </div>

          {/* Preview panel */}
          <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground">Live Preview</p>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-3 w-3" /> Desktop
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-3 w-3" /> Mobile
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FullPreview config={config} businessName={businessName} previewMode={previewMode} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealerPageBuilder;
