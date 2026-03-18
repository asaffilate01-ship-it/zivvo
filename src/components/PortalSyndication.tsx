import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Settings, CheckCircle, XCircle, Clock, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface PortalInfo {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
}

const PORTALS: PortalInfo[] = [
  { id: "autotrader", name: "AutoTrader", description: "UK's #1 car marketplace", logo: "🚗", color: "bg-blue-500/10 text-blue-600" },
  { id: "ebay_motors", name: "eBay Motors", description: "Global auction & buy-it-now platform", logo: "🏷️", color: "bg-red-500/10 text-red-600" },
  { id: "pistonheads", name: "PistonHeads", description: "Enthusiast car marketplace (CarGurus)", logo: "🏎️", color: "bg-orange-500/10 text-orange-600" },
  { id: "gumtree", name: "Gumtree", description: "UK classified ads", logo: "🌳", color: "bg-green-500/10 text-green-600" },
  { id: "cazoo", name: "Cazoo", description: "Online car retailer", logo: "🔵", color: "bg-cyan-500/10 text-cyan-600" },
  { id: "motors_co_uk", name: "Motors.co.uk", description: "Leading UK motors marketplace", logo: "🔧", color: "bg-purple-500/10 text-purple-600" },
];

interface PortalConfig {
  id?: string;
  portal: string;
  is_enabled: boolean;
  api_key: string;
  api_secret: string;
  dealer_ref: string;
  feed_url: string;
}

interface Props {
  dealerId: string;
}

const PortalSyndication = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<Record<string, PortalConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPortal, setEditingPortal] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, [dealerId]);

  const fetchConfigs = async () => {
    const { data } = await supabase
      .from("dealer_portal_configs")
      .select("*")
      .eq("dealer_id", dealerId);

    const configMap: Record<string, PortalConfig> = {};
    PORTALS.forEach((p) => {
      const existing = data?.find((c: any) => c.portal === p.id);
      configMap[p.id] = existing
        ? {
            id: existing.id,
            portal: existing.portal,
            is_enabled: existing.is_enabled,
            api_key: existing.api_key || "",
            api_secret: existing.api_secret || "",
            dealer_ref: existing.dealer_ref || "",
            feed_url: existing.feed_url || "",
          }
        : {
            portal: p.id,
            is_enabled: false,
            api_key: "",
            api_secret: "",
            dealer_ref: "",
            feed_url: "",
          };
    });
    setConfigs(configMap);
    setLoading(false);
  };

  const togglePortal = async (portalId: string, enabled: boolean) => {
    setSaving(portalId);
    const config = configs[portalId];

    const payload = {
      dealer_id: dealerId,
      portal: portalId as any,
      is_enabled: enabled,
      api_key: config.api_key || null,
      api_secret: config.api_secret || null,
      dealer_ref: config.dealer_ref || null,
      feed_url: config.feed_url || null,
    };

    if (config.id) {
      await supabase
        .from("dealer_portal_configs")
        .update({ is_enabled: enabled } as any)
        .eq("id", config.id);
    } else {
      const { data } = await supabase
        .from("dealer_portal_configs")
        .insert(payload as any)
        .select()
        .single();
      if (data) config.id = data.id;
    }

    setConfigs((prev) => ({
      ...prev,
      [portalId]: { ...prev[portalId], is_enabled: enabled, id: config.id },
    }));
    setSaving(null);
    toast({ title: `${PORTALS.find((p) => p.id === portalId)?.name} ${enabled ? "enabled" : "disabled"}` });
  };

  const saveConfig = async (portalId: string) => {
    setSaving(portalId);
    const config = configs[portalId];

    const payload = {
      dealer_id: dealerId,
      portal: portalId as any,
      is_enabled: config.is_enabled,
      api_key: config.api_key || null,
      api_secret: config.api_secret || null,
      dealer_ref: config.dealer_ref || null,
      feed_url: config.feed_url || null,
    };

    if (config.id) {
      await supabase
        .from("dealer_portal_configs")
        .update(payload as any)
        .eq("id", config.id);
    } else {
      const { data } = await supabase
        .from("dealer_portal_configs")
        .insert(payload as any)
        .select()
        .single();
      if (data) {
        setConfigs((prev) => ({ ...prev, [portalId]: { ...prev[portalId], id: data.id } }));
      }
    }

    setSaving(null);
    setEditingPortal(null);
    toast({ title: "Portal settings saved" });
  };

  const updateField = (portalId: string, field: keyof PortalConfig, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [portalId]: { ...prev[portalId], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Portal Syndication</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Connect to external marketplaces to automatically push your listings. Enable a portal, add your API credentials, and your active listings will sync automatically.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PORTALS.map((portal) => {
          const config = configs[portal.id];
          return (
            <Card key={portal.id} className={config?.is_enabled ? "border-primary/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${portal.color}`}>
                      {portal.logo}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{portal.name}</p>
                      <p className="text-xs text-muted-foreground">{portal.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={config?.is_enabled || false}
                    onCheckedChange={(checked) => togglePortal(portal.id, checked)}
                    disabled={saving === portal.id}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={config?.is_enabled ? "default" : "secondary"} className="text-xs">
                    {config?.is_enabled ? (config.api_key ? "Connected" : "Needs API Key") : "Disabled"}
                  </Badge>

                  <Dialog open={editingPortal === portal.id} onOpenChange={(open) => setEditingPortal(open ? portal.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-3.5 w-3.5 mr-1" /> Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-lg">{portal.logo}</span> {portal.name} Settings
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter API key from portal"
                            value={config?.api_key || ""}
                            onChange={(e) => updateField(portal.id, "api_key", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>API Secret (if required)</Label>
                          <Input
                            type="password"
                            placeholder="Optional API secret"
                            value={config?.api_secret || ""}
                            onChange={(e) => updateField(portal.id, "api_secret", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dealer / Advertiser Reference</Label>
                          <Input
                            placeholder="Your ID on the portal"
                            value={config?.dealer_ref || ""}
                            onChange={(e) => updateField(portal.id, "dealer_ref", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Feed URL (for CSV/XML feed portals)</Label>
                          <Input
                            placeholder="https://..."
                            value={config?.feed_url || ""}
                            onChange={(e) => updateField(portal.id, "feed_url", e.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => saveConfig(portal.id)}
                          disabled={saving === portal.id}
                        >
                          {saving === portal.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Configuration
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PortalSyndication;
