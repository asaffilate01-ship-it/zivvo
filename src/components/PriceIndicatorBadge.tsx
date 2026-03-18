import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus, Award } from "lucide-react";

type PriceRating = "great" | "good" | "fair" | "high";

interface PriceIndicatorBadgeProps {
  price: number;
  marketAverage?: number | null;
  className?: string;
}

export const getPriceRating = (price: number, marketAverage: number): PriceRating => {
  const ratio = price / marketAverage;
  if (ratio <= 0.85) return "great";
  if (ratio <= 0.95) return "good";
  if (ratio <= 1.05) return "fair";
  return "high";
};

const ratingConfig: Record<PriceRating, { label: string; icon: typeof Award; className: string }> = {
  great: { label: "Great Price", icon: Award, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  good: { label: "Good Price", icon: TrendingDown, className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20" },
  fair: { label: "Fair Price", icon: Minus, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  high: { label: "Above Market", icon: TrendingUp, className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
};

const PriceIndicatorBadge = ({ price, marketAverage, className = "" }: PriceIndicatorBadgeProps) => {
  if (!marketAverage || marketAverage <= 0) return null;

  const rating = getPriceRating(price, marketAverage);
  const config = ratingConfig[rating];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} text-[10px] font-semibold gap-0.5 ${className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default PriceIndicatorBadge;
