-- Contact messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact messages"
ON public.contact_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit contact message"
ON public.contact_messages FOR INSERT TO authenticated
WITH CHECK (true);

-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Admins can view subscribers"
ON public.newsletter_subscribers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Bug reports table
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  page_url text,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit bug reports"
ON public.bug_reports FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Admins can manage bug reports"
ON public.bug_reports FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));