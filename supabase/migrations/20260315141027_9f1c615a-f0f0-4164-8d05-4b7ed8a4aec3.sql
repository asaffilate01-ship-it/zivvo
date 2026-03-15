-- Dealer subscription tier enum
CREATE TYPE public.dealer_tier AS ENUM ('starter', 'professional', 'enterprise');

-- Dealer subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');

-- Listing status
CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'sold', 'expired', 'under_review');

-- Dealers table
CREATE TABLE public.dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_email text,
  business_phone text,
  address text,
  city text,
  postcode text,
  country text DEFAULT 'GB',
  logo_url text,
  website_url text,
  description text,
  slug text UNIQUE,
  tier dealer_tier DEFAULT 'starter',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status subscription_status DEFAULT 'incomplete',
  kyc_verified boolean DEFAULT false,
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  approved_by uuid,
  onboarded_by_agent uuid,
  landing_page_config jsonb DEFAULT '{}',
  max_listings int DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Car listings table
CREATE TABLE public.car_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id uuid REFERENCES public.dealers(id) ON DELETE SET NULL,
  title text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  price numeric(12,2) NOT NULL,
  mileage int,
  fuel_type text,
  transmission text,
  body_type text,
  color text,
  doors int,
  engine_size text,
  registration text,
  vin text,
  description text,
  location text,
  images text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  specs jsonb DEFAULT '{}',
  status listing_status DEFAULT 'draft',
  is_featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  finance_check_clear boolean,
  legal_check_clear boolean,
  views_count int DEFAULT 0,
  enquiries_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Agent commissions tracking
CREATE TABLE public.agent_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  commission_rate numeric(5,2) DEFAULT 30.00,
  amount numeric(12,2) DEFAULT 0,
  status text DEFAULT 'pending',
  period_start date,
  period_end date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Update triggers
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_listings_updated_at BEFORE UPDATE ON public.car_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

-- Dealers RLS
CREATE POLICY "Public can view active dealers" ON public.dealers FOR SELECT USING (is_active = true);
CREATE POLICY "Dealers can update own record" ON public.dealers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert dealer" ON public.dealers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all dealers" ON public.dealers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Car listings RLS
CREATE POLICY "Public can view active listings" ON public.car_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage own listings" ON public.car_listings FOR ALL TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Admins can manage all listings" ON public.car_listings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Agent commissions RLS
CREATE POLICY "Agents can view own commissions" ON public.agent_commissions FOR SELECT TO authenticated USING (auth.uid() = agent_id);
CREATE POLICY "Admins can manage all commissions" ON public.agent_commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for listings
ALTER PUBLICATION supabase_realtime ADD TABLE public.car_listings;
