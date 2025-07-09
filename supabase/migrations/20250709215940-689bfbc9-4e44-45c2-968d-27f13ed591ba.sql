CREATE OR REPLACE FUNCTION public.get_current_domain_owner()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT CASE 
    WHEN public.get_current_domain() IN ('localhost', '127.0.0.1') THEN 
      auth.uid()
    ELSE (
      SELECT user_id FROM public.domain_owners 
      WHERE domain = public.get_current_domain() 
      LIMIT 1
    )
  END;
$function$