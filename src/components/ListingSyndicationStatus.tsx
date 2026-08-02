import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, RefreshCw, XCircle, CheckCircle, Clock, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const PORTAL_LABELS: Record<string, { name: string; emoji: string }> = {
  autotrader: { name: "AutoTrader", emoji: "🚗" },
  ebay_motors: { name: "eBay Motors", emoji: "🏷️" },
  pistonheads: { name: "PistonHeads", emoji: "🏎️" },
  gumtree: { name: "Gumtree", emoji: "🌳" },
  cazoo: { name: "Cazoo", emoji: "🔵" },
  motors_co_uk: { name: "Motors.co.uk", emoji: "🔧" },
};

const statusIcons: Record<string, React.ReactNode> = {
  synced: <CheckCircle className="h-3.5 w-3.5 text-success" />,
  pending: <Clock className="h-3.5 w-3.5 text-warning" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  removed: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
  updating: <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />,
};

interface Props {
  listingId: string;
  dealerId: string;
}

const ListingSyndicationStatus = ({ listingId, dealerId }: Props) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [enabledPortals, setEnabledPortals] = useState<string[]>([]);
  const [selectedPortals, setSelectedPortals] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [logsRes, configsRes] = await Promise.all([
        supabase.from("syndication_log").select("*").eq("listing_id", listingId),
        supabase.from("dealer_portal_configs").select("portal").eq("dealer_id", dealerId).eq("is_enabled", true),
      ]);
      setLogs(logsRes.data || []);
      setEnabledPortals((configsRes.data || []).map((c: any) => c.portal));
      setLoading(false);
    };
    fetchData();
  }, [listingId, dealerId]);

  const syncToPortals = async () => {
    if (selectedPortals.size === 0) {
      toast({ title: "Select at least one portal", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("syndicate-listing", {
        body: { listing_id: listingId, portals: Array.from(selectedPortals) },
      });
      if (error) throw error;

      toast({ title: "Syndication started", description: "Your listing is being pushed to selected portals." });
      // Refresh logs
      const { data: updated } = await supabase.from("syndication_log").select("*").eq("listing_id", listingId);
      setLogs(updated || []);
      setSelectedPortals(new Set());
    } catch (err: any) {
      toast({ title: "Syndication failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return null;
  if (enabledPortals.length === 0) return null;

  const logMap = Object.fromEntries(logs.map((l) => [l.portal, l]));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status badges for synced portals */}
      {logs.filter((l) => l.status !== "removed").map((log) => (
        <Badge key={log.portal} variant="outline" className="gap-1 text-xs">
          {statusIcons[log.status]}
          <span>{PORTAL_LABELS[log.portal]?.emoji}</span>
          <span>{PORTAL_LABELS[log.portal]?.name || log.portal}</span>
        </Badge>
      ))}

      {/* Sync button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
            <Globe className="h-3.5 w-3.5" /> Syndicate
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <p className="text-sm font-medium text-foreground mb-2">Push to Portals</p>
          <div className="space-y-2">
            {enabledPortals.map((portal) => {
              const info = PORTAL_LABELS[portal];
              const log = logMap[portal];
              return (
                <label key={portal} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedPortals.has(portal)}
                    onCheckedChange={(checked) => {
                      setSelectedPortals((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(portal);
                        else next.delete(portal);
                        return next;
                      });
                    }}
                  />
                  <span>{info?.emoji} {info?.name || portal}</span>
                  {log && statusIcons[log.status]}
                </label>
              );
            })}
          </div>
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={syncToPortals}
            disabled={syncing || selectedPortals.size === 0}
          >
            {syncing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
            Sync {selectedPortals.size > 0 ? `(${selectedPortals.size})` : ""}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ListingSyndicationStatus;
