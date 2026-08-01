
-- FIX: Messages - recipients can only update 'read' column (trigger enforcement)
-- The enforce_message_update_safety trigger already exists and handles this correctly.

-- FIX: Enquiries - enforce seller can only update reply/status fields (trigger already exists)
-- The enforce_enquiry_update_safety trigger already exists and handles this correctly.

-- FIX: has_role function - restrict to only check calling user's own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_user_id = auth.uid() OR (SELECT current_setting('request.jwt.claim.role', true)) = 'service_role')
  )
$$;
