import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TrustReviewWidget = () => {
  const [stats, setStats] = useState<{ count: number; avgRating: number } | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, count } = await supabase
        .from("seller_reviews")
        .select("rating", { count: "exact" })
        .limit(1000);
      if (data && count && count > 0) {
        const avg = data.reduce((a, r) => a + r.rating, 0) / data.length;
        setStats({ count, avgRating: Math.round(avg * 10) / 10 });
      } else {
        setStats({ count: 0, avgRating: 0 });
      }
    };
    fetchReviews();
  }, []);

  // Hide entirely until we have real reviews — no fake fallbacks pre-launch
  if (!stats || stats.count === 0) return null;

  const filledStars = Math.round(stats.avgRating);

  return (
    <section className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center sm:flex-row sm:justify-between sm:text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
            <Shield className="h-7 w-7 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < filledStars ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              ))}
            </div>
            <p className="mt-1 text-sm font-semibold text-card-foreground">
              Rated <span className="text-primary">{stats.avgRating} / 5</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Based on {stats.count.toLocaleString()} platform review{stats.count === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <Link
          to="/reviews"
          className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Read Reviews <ExternalLink className="h-3 w-3" />
        </Link>
      </motion.div>
    </section>
  );
};

export default TrustReviewWidget;
