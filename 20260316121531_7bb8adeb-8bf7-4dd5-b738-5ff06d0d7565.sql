
-- Saved cars / favourites
CREATE TABLE public.saved_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.saved_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved cars"
ON public.saved_cars FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enquiries / messaging
CREATE TABLE public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  message TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  status TEXT NOT NULL DEFAULT 'unread',
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Senders can view and create their own enquiries
CREATE POLICY "Senders can manage own enquiries"
ON public.enquiries FOR ALL
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Sellers can view enquiries on their listings
CREATE POLICY "Sellers can view enquiries on own listings"
ON public.enquiries FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

-- Sellers can update (reply to) enquiries on their listings
CREATE POLICY "Sellers can reply to enquiries"
ON public.enquiries FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id);

-- Admins can manage all enquiries
CREATE POLICY "Admins can manage all enquiries"
ON public.enquiries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for enquiries
ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
