
-- Pipeline lead stages enum
CREATE TYPE public.pipeline_stage AS ENUM ('lead', 'enquiry', 'viewing', 'offer', 'negotiation', 'sold', 'lost');

-- Pipeline leads table  
CREATE TABLE public.pipeline_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_id UUID,
  stage pipeline_stage NOT NULL DEFAULT 'lead',
  notes TEXT,
  expected_value NUMERIC DEFAULT 0,
  actual_value NUMERIC,
  source TEXT DEFAULT 'website',
  assigned_to UUID,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  lost_reason TEXT
);

-- Enable RLS
ALTER TABLE public.pipeline_leads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Sellers can manage own pipeline leads"
  ON public.pipeline_leads FOR ALL TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all pipeline leads"
  ON public.pipeline_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view pipeline for their dealers"
  ON public.pipeline_leads FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dealers d 
      WHERE d.id = pipeline_leads.dealer_id 
      AND d.onboarded_by_agent = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_pipeline_leads_updated_at
  BEFORE UPDATE ON public.pipeline_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_pipeline_leads_seller ON public.pipeline_leads(seller_id);
CREATE INDEX idx_pipeline_leads_dealer ON public.pipeline_leads(dealer_id);
CREATE INDEX idx_pipeline_leads_stage ON public.pipeline_leads(stage);
