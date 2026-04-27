import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name?: string | null;
  created_at: string;
}

/**
 * Honest reviews block. Shows real seller_reviews if any exist, otherwise
 * shows a transparent "founding members" CTA — no fake testimonials.
 */
const RealReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("seller_reviews")
        .select("id, rating, comment, created_at")
        .gte("rating", 4)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setReviews(data as Review[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return null;

  // No real reviews → show transparent founding-members CTA
  if (reviews.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-8 md:p-12"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 text-xs">
              <Sparkles className="h-3 w-3 text-primary" />
              Founding members
            </Badge>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Be one of the first to <span className="text-gradient-primary">join Zivvo</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              We're a brand-new UK marketplace built by car people, for car people.
              No inflated review counts, no fake five-star averages — just real listings,
              verified sellers, and honest pricing from day one. Your review will help
              shape the platform.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/sell">
                <Button className="gradient-primary border-0">
                  List your car free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dealer-pricing">
                <Button variant="outline">Become a founding dealer</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  // Real reviews — render them
  return (
    <section className="container mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <Badge variant="outline" className="mb-4 text-xs">Real reviews</Badge>
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">What our community says</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Verified reviews from real Zivvo sellers and buyers
        </p>
      </motion.div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
            </div>
            <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-muted-foreground">
              "{r.comment}"
            </p>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RealReviewsSection;
