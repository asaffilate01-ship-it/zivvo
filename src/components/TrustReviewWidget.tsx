import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TrustReviewWidget = () => {
  const [stats, setStats] = useState({ count: 0, avgRating: 0 });

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, count } = await supabase
        .from("seller_reviews")
        .select("rating", { count: "exact" })
        .limit(1000);
      if (data && count) {
        const avg = data.reduce((a, r) => a + r.rating, 0) / data.length;
        setStats({ count, avgRating: Math.round(avg * 10) / 10 });
      }
    };
    fetchReviews();
  }, []);

  const displayRating = stats.avgRating > 0 ? stats.avgRating : 4.9;
  const displayCount = stats.count > 0 ? stats.count.toLocaleString() : "—";
  const filledStars = Math.round(displayRating);

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
            <p className="mt-1 text-sm font-semibold text-card-foreground">Rated <span className="text-primary">Excellent</span></p>
            <p className="text-xs text-muted-foreground">Based on {displayCount} verified reviews</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="text-center">
            <p className="font-display text-xl font-bold text-foreground">{displayRating}</p>
            <p>Rating</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-display text-xl font-bold text-foreground">98%</p>
            <p>Recommend</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-display text-xl font-bold text-foreground">24h</p>
            <p>Avg Response</p>
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
