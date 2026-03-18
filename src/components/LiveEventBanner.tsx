import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, Calendar, Users, ArrowRight, Radio } from "lucide-react";
import { motion } from "framer-motion";

const LiveEventBanner = () => {
  const { data: liveEvents = [] } = useQuery({
    queryKey: ["live-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("auctions")
        .select("*, car_listings!inner(title, make, model, year, images)")
        .eq("format", "live_event" as any)
        .in("status", ["approved", "live"] as any[])
        .not("live_event_date", "is", null)
        .order("live_event_date", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  if (liveEvents.length === 0) return null;

  return (
    <section className="border-t border-border bg-gradient-to-r from-primary/5 via-background to-accent/5 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <Radio className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Upcoming Live Events</h2>
            <p className="text-sm text-muted-foreground">Join our curated live auction events</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveEvents.map((event: any) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Link to={`/auction/${event.id}`}>
                <Card className="group hover:shadow-lg transition-all hover:border-primary/30 overflow-hidden">
                  <div className="relative h-32 bg-muted overflow-hidden">
                    <img src={event.car_listings?.images?.[0] || "/placeholder.svg"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className={`${event.status === "live" ? "bg-red-500 animate-pulse" : "bg-primary"} text-white border-0`}>
                        {event.status === "live" ? "🔴 LIVE NOW" : "Upcoming"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                      {event.live_event_name || `Live Event #${event.lot_number || ""}`}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.live_event_date ? new Date(event.live_event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBA"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {event.watchers_count || 0} watching
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveEventBanner;
