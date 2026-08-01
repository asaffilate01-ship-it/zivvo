
-- Messages table for real-time chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast conversation lookups
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, read);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can insert messages as sender
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can update read status" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Listing views table for analytics
CREATE TABLE public.listing_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.car_listings(id) ON DELETE CASCADE,
  viewer_id UUID,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_views_listing ON public.listing_views(listing_id, created_at);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views
CREATE POLICY "Anyone can log views" ON public.listing_views
  FOR INSERT TO public
  WITH CHECK (true);

-- Sellers can read views on their listings
CREATE POLICY "Sellers can view analytics" ON public.listing_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.car_listings
      WHERE car_listings.id = listing_views.listing_id
      AND car_listings.seller_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all listing views" ON public.listing_views
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
