-- Fix security definer views by setting them to security invoker
ALTER VIEW public.auction_bids_public SET (security_invoker = on);
ALTER VIEW public.auctions_public SET (security_invoker = on);