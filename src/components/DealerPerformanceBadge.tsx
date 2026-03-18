import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Zap, Star } from "lucide-react";

interface DealerPerformanceProps {
  dealerId: string;
  compact?: boolean;
}

interface Performance {
  rating_score: number | null;
  avg_response_time_mins: number | null;
  response_rate_pct: number | null;
  avg_sale_speed_days: number | null;
  total_sales: number | null;
}

const DealerPerformanceBadge = ({ dealerId, compact = true }: DealerPerformanceProps) => {
  const [perf, setPerf] = useState<Performance | null>(null);

  useEffect(() => {
    supabase
      .from("dealer_performance")
      .select("rating_score, avg_response_time_mins, response_rate_pct, avg_sale_speed_days, total_sales")
      .eq("dealer_id", dealerId)
      .maybeSingle()
      .then(({ data }) => { if (data) setPerf(data); });
  }, [dealerId]);

  if (!perf) return null;

  const score = perf.rating_score ?? 0;
  const tier = score >= 90 ? "Platinum" : score >= 70 ? "Gold" : score >= 50 ? "Silver" : "Bronze";
  const tierColors: Record<string, string> = {
    Platinum: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/20",
    Gold: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    Silver: "bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/20",
    Bronze: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${tierColors[tier]} text-[10px] font-semibold gap-0.5 cursor-help`}>
              <Star className="h-3 w-3" />
              {tier} Dealer
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="text-xs space-y-1 max-w-[200px]">
            <p className="font-semibold">{tier} Dealer — Score {score}/100</p>
            {perf.avg_response_time_mins != null && (
              <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Avg response: {perf.avg_response_time_mins < 60 ? `${perf.avg_response_time_mins}m` : `${Math.round(perf.avg_response_time_mins / 60)}h`}</p>
            )}
            {perf.response_rate_pct != null && (
              <p className="flex items-center gap-1"><Zap className="h-3 w-3" /> Reply rate: {perf.response_rate_pct}%</p>
            )}
            {perf.avg_sale_speed_days != null && (
              <p>Avg sale: {perf.avg_sale_speed_days} days</p>
            )}
            {perf.total_sales != null && (
              <p>{perf.total_sales} cars sold</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={`${tierColors[tier]} text-xs font-semibold gap-1`}>
        <Star className="h-3.5 w-3.5" /> {tier} Dealer — {score}/100
      </Badge>
      {perf.avg_response_time_mins != null && (
        <Badge variant="outline" className="text-xs gap-1">
          <Clock className="h-3 w-3" />
          {perf.avg_response_time_mins < 60 ? `Replies in ${perf.avg_response_time_mins}m` : `Replies in ${Math.round(perf.avg_response_time_mins / 60)}h`}
        </Badge>
      )}
      {perf.response_rate_pct != null && perf.response_rate_pct >= 80 && (
        <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
          <Zap className="h-3 w-3" /> {perf.response_rate_pct}% reply rate
        </Badge>
      )}
    </div>
  );
};

export default DealerPerformanceBadge;
