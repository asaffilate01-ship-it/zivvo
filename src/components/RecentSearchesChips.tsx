import { Link } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { useRecentSearches } from "@/hooks/useRecentSearches";

interface Props {
  className?: string;
  variant?: "light" | "dark";
}

const RecentSearchesChips = ({ className = "", variant = "light" }: Props) => {
  const { items, remove } = useRecentSearches();
  if (items.length === 0) return null;

  const chipBase =
    variant === "dark"
      ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
      : "border-border bg-card text-foreground hover:border-primary hover:text-primary";

  const labelMuted = variant === "dark" ? "text-primary-foreground/70" : "text-muted-foreground";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className={`flex items-center gap-1 text-[11px] font-medium ${labelMuted}`}>
        <Clock className="h-3 w-3" /> Recent
      </span>
      {items.map((item) => (
        <div
          key={item.label}
          className={`group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${chipBase}`}
        >
          <Link to={`/browse?${item.query}`} className="max-w-[160px] truncate">
            {item.label}
          </Link>
          <button
            type="button"
            aria-label={`Remove ${item.label}`}
            onClick={() => remove(item.label)}
            className="rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default RecentSearchesChips;
