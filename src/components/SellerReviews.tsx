import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SellerReviewsProps {
  sellerId: string;
  listingId?: string;
}

const SellerReviews = ({ sellerId, listingId }: SellerReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("seller_reviews")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (data) {
        setReviews(data);
        if (user) setHasReviewed(data.some((r) => r.reviewer_id === user.id));
      }
      setLoading(false);
    };
    fetch();
  }, [sellerId, user]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const handleSubmit = async () => {
    if (!user) { toast({ title: "Sign in to leave a review", variant: "destructive" }); return; }
    if (rating === 0) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    if (user.id === sellerId) { toast({ title: "You can't review yourself", variant: "destructive" }); return; }

    setSubmitting(true);
    const { data, error } = await supabase.from("seller_reviews").insert({
      seller_id: sellerId,
      reviewer_id: user.id,
      listing_id: listingId || null,
      rating,
      comment: comment.trim() || null,
    }).select().single();

    if (error) {
      if (error.code === "23505") toast({ title: "You've already reviewed this seller" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setReviews((prev) => [data, ...prev]);
      setHasReviewed(true);
      setRating(0);
      setComment("");
      toast({ title: "Review submitted!" });
    }
    setSubmitting(false);
  };

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && setRating(i)}
        >
          <Star
            className={`h-5 w-5 ${
              (interactive ? (hoverRating || rating) : value) >= i
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-display text-lg font-bold text-foreground">Seller Reviews</h3>
        {avgRating && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-semibold text-foreground">{avgRating}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Review form */}
      {user && user.id !== sellerId && !hasReviewed && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Leave a review</p>
            <StarRating value={0} interactive />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)..."
              rows={2}
            />
            <Button size="sm" className="gradient-primary border-0" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 5).map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <StarRating value={r.rating} />
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerReviews;
