
-- Allow users to delete their own profile (needed for GDPR account deletion)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to delete any profile
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow messages to be deleted by sender or recipient (needed for account deletion)
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Create reports table for reporting inappropriate listings
CREATE TABLE public.listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report listings"
ON public.listing_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.listing_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
ON public.listing_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create seller reviews table
CREATE TABLE public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  listing_id uuid REFERENCES public.car_listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reviewer_id, seller_id)
);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON public.seller_reviews
FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.seller_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != seller_id);

CREATE POLICY "Users can update own reviews"
ON public.seller_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins can manage all reviews"
ON public.seller_reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
