import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Palette, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

interface DealerPageBuilderProps {
  dealerId: string;
  currentConfig: LandingPageConfig;
  businessName: string;
  onSaved: (config: LandingPageConfig) => void;
}

const DealerPageBuilder = ({ dealerId, currentConfig, businessName, onSaved }: DealerPageBuilderProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
  });

  const update = (key: keyof LandingPageConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("dealers")
      .update({ landing_page_config: config as any })
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Landing Page</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Headline</Label>
                <Input value={config.hero_title} onChange={(e) => update("hero_title", e.target.value)} placeholder={businessName} />
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.accent_color}
                    onChange={(e) => update("accent_color", e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded border border-border"
                  />
                  <Input value={config.accent_color} onChange={(e) => update("accent_color", e.target.value)} className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">About Section</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={config.about_text}
                onChange={(e) => update("about_text", e.target.value)}
                placeholder="Tell customers about your dealership..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "show_phone" as const, label: "Show Phone Number" },
                { key: "show_email" as const, label: "Show Email Address" },
                { key: "show_address" as const, label: "Show Address" },
              ].map(({ key, label }) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealerPageBuilder;
