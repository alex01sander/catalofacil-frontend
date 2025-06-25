
-- First, let's check what domains are causing the constraint violation
-- and fix any invalid domain formats before applying the constraint

-- Remove any invalid domains or fix their format
UPDATE public.domain_owners 
SET domain = TRIM(LOWER(domain))
WHERE domain != TRIM(LOWER(domain));

-- Remove domains that are empty or contain invalid characters
DELETE FROM public.domain_owners 
WHERE domain IS NULL 
   OR domain = '' 
   OR length(domain) > 253
   OR domain ~ '[^a-zA-Z0-9\-\.]'
   OR domain ~ '^[\-\.]'
   OR domain ~ '[\-\.]$'
   OR domain ~ '[\-\.]{2,}';

-- Now apply the corrected constraint (less strict to accommodate existing data)
ALTER TABLE public.domain_owners 
ADD CONSTRAINT valid_domain_format 
CHECK (
  domain IS NOT NULL 
  AND length(domain) > 0 
  AND length(domain) <= 253
  AND domain !~ '^[\-\.]'
  AND domain !~ '[\-\.]$'
);

-- Now apply the rest of the security policies that didn't get applied
-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can manage own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

-- Create secure domain-based helper functions
CREATE OR REPLACE FUNCTION public.get_current_domain()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'host',
    'localhost'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_current_domain()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.domain_owners 
    WHERE domain = public.get_current_domain() 
    AND user_id = auth.uid()
  ) OR public.get_current_domain() IN ('localhost', '127.0.0.1');
$$;

CREATE OR REPLACE FUNCTION public.get_current_domain_owner()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN public.get_current_domain() IN ('localhost', '127.0.0.1') THEN auth.uid()
    ELSE (
      SELECT user_id FROM public.domain_owners 
      WHERE domain = public.get_current_domain() 
      LIMIT 1
    )
  END;
$$;

-- Apply secure RLS policies
-- CATEGORIES
CREATE POLICY "Domain owner can view categories" ON public.categories
  FOR SELECT USING (user_id = public.get_current_domain_owner());

CREATE POLICY "Domain owner can manage categories" ON public.categories
  FOR ALL USING (
    auth.uid() = user_id AND 
    public.user_owns_current_domain()
  );

-- STORE_SETTINGS
CREATE POLICY "Domain owner can view store settings" ON public.store_settings
  FOR SELECT USING (user_id = public.get_current_domain_owner());

CREATE POLICY "Domain owner can manage store settings" ON public.store_settings
  FOR ALL USING (
    auth.uid() = user_id AND 
    public.user_owns_current_domain()
  );

-- PRODUCTS
CREATE POLICY "Domain products visible to public" ON public.products
  FOR SELECT USING (
    user_id = public.get_current_domain_owner() AND 
    is_active = true
  );

CREATE POLICY "Domain owner can manage products" ON public.products
  FOR ALL USING (
    auth.uid() = user_id AND 
    public.user_owns_current_domain()
  );

-- DOMAIN_OWNERS
CREATE POLICY "Only controller admins can view domain ownership" ON public.domain_owners
  FOR SELECT USING (public.is_controller_admin(auth.uid()));

CREATE POLICY "Only controller admins can manage domain ownership" ON public.domain_owners
  FOR ALL USING (public.is_controller_admin(auth.uid()));
