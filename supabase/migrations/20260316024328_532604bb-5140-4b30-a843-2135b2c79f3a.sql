-- Replace SECURITY DEFINER-style public views with RLS-protected mirror tables
-- This keeps base tables private while exposing only safe public columns.

-- 1) Drop existing views
DROP VIEW IF EXISTS public.dealer_landing_public;
DROP VIEW IF EXISTS public.dealers_public;
DROP VIEW IF EXISTS public.profiles_public;

-- 2) Create public mirror tables with safe columns only
CREATE TABLE IF NOT EXISTS public.dealer_landing_public (
  id uuid PRIMARY KEY,
  business_name text,
  description text,
  city text,
  country text,
  logo_url text,
  website_url text,
  slug text,
  is_active boolean,
  tier public.dealer_tier,
  landing_page_config jsonb,
  kyc_verified boolean,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealers_public (
  id uuid PRIMARY KEY,
  business_name text,
  city text,
  country text,
  description text,
  logo_url text,
  website_url text,
  slug text,
  is_active boolean,
  tier public.dealer_tier,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles_public (
  user_id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Enable RLS + policies
ALTER TABLE public.dealer_landing_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_public ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read dealer landing public" ON public.dealer_landing_public;
CREATE POLICY "Public can read dealer landing public"
  ON public.dealer_landing_public
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Public can read dealers public" ON public.dealers_public;
CREATE POLICY "Public can read dealers public"
  ON public.dealers_public
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Public can read profiles public" ON public.profiles_public;
CREATE POLICY "Public can read profiles public"
  ON public.profiles_public
  FOR SELECT
  TO public
  USING (true);

-- 4) Sync function for dealers -> public mirrors
CREATE OR REPLACE FUNCTION public.sync_dealer_public_rows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.dealer_landing_public WHERE id = OLD.id;
    DELETE FROM public.dealers_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.is_active = true THEN
    INSERT INTO public.dealer_landing_public (
      id, business_name, description, city, country, logo_url, website_url, slug,
      is_active, tier, landing_page_config, kyc_verified, updated_at
    )
    VALUES (
      NEW.id, NEW.business_name, NEW.description, NEW.city, NEW.country, NEW.logo_url, NEW.website_url, NEW.slug,
      NEW.is_active, NEW.tier, NEW.landing_page_config, NEW.kyc_verified, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      description = EXCLUDED.description,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      logo_url = EXCLUDED.logo_url,
      website_url = EXCLUDED.website_url,
      slug = EXCLUDED.slug,
      is_active = EXCLUDED.is_active,
      tier = EXCLUDED.tier,
      landing_page_config = EXCLUDED.landing_page_config,
      kyc_verified = EXCLUDED.kyc_verified,
      updated_at = now();

    INSERT INTO public.dealers_public (
      id, business_name, city, country, description, logo_url, website_url, slug,
      is_active, tier, updated_at
    )
    VALUES (
      NEW.id, NEW.business_name, NEW.city, NEW.country, NEW.description, NEW.logo_url, NEW.website_url, NEW.slug,
      NEW.is_active, NEW.tier, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      description = EXCLUDED.description,
      logo_url = EXCLUDED.logo_url,
      website_url = EXCLUDED.website_url,
      slug = EXCLUDED.slug,
      is_active = EXCLUDED.is_active,
      tier = EXCLUDED.tier,
      updated_at = now();
  ELSE
    DELETE FROM public.dealer_landing_public WHERE id = NEW.id;
    DELETE FROM public.dealers_public WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Sync function for profiles -> public mirror
CREATE OR REPLACE FUNCTION public.sync_profile_public_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.profiles_public WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;

  INSERT INTO public.profiles_public (user_id, full_name, avatar_url, updated_at)
  VALUES (NEW.user_id, NEW.full_name, NEW.avatar_url, now())
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 6) Triggers for live sync
DROP TRIGGER IF EXISTS sync_dealer_public_rows_trigger ON public.dealers;
CREATE TRIGGER sync_dealer_public_rows_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.dealers
FOR EACH ROW
EXECUTE FUNCTION public.sync_dealer_public_rows();

DROP TRIGGER IF EXISTS sync_profile_public_row_trigger ON public.profiles;
CREATE TRIGGER sync_profile_public_row_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_public_row();

-- 7) Backfill current data
INSERT INTO public.dealer_landing_public (
  id, business_name, description, city, country, logo_url, website_url, slug,
  is_active, tier, landing_page_config, kyc_verified, updated_at
)
SELECT
  d.id, d.business_name, d.description, d.city, d.country, d.logo_url, d.website_url, d.slug,
  d.is_active, d.tier, d.landing_page_config, d.kyc_verified, now()
FROM public.dealers d
WHERE d.is_active = true
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  slug = EXCLUDED.slug,
  is_active = EXCLUDED.is_active,
  tier = EXCLUDED.tier,
  landing_page_config = EXCLUDED.landing_page_config,
  kyc_verified = EXCLUDED.kyc_verified,
  updated_at = now();

INSERT INTO public.dealers_public (
  id, business_name, city, country, description, logo_url, website_url, slug,
  is_active, tier, updated_at
)
SELECT
  d.id, d.business_name, d.city, d.country, d.description, d.logo_url, d.website_url, d.slug,
  d.is_active, d.tier, now()
FROM public.dealers d
WHERE d.is_active = true
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  slug = EXCLUDED.slug,
  is_active = EXCLUDED.is_active,
  tier = EXCLUDED.tier,
  updated_at = now();

INSERT INTO public.profiles_public (user_id, full_name, avatar_url, updated_at)
SELECT p.user_id, p.full_name, p.avatar_url, now()
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = now();