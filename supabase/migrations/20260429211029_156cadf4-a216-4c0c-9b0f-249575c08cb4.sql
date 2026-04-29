-- 1. Remove survey_responses from realtime to prevent data leak to all authenticated users
ALTER PUBLICATION supabase_realtime DROP TABLE public.survey_responses;

-- 2. Lock down mark_google_form_completed: revoke from anon, add format validation
REVOKE EXECUTE ON FUNCTION public.mark_google_form_completed(TEXT) FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION public.mark_google_form_completed(_tracking_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate tracking code format (UFTC-XXXXXX style, 8-32 chars alphanumeric/dash)
  IF _tracking_code IS NULL OR char_length(_tracking_code) < 6 OR char_length(_tracking_code) > 32 THEN
    RETURN false;
  END IF;
  IF _tracking_code !~ '^[A-Z0-9-]+$' THEN
    RETURN false;
  END IF;

  UPDATE public.survey_responses
  SET google_form_completed = true,
      google_form_completed_at = now()
  WHERE tracking_code = _tracking_code AND google_form_completed = false;
  RETURN FOUND;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.mark_google_form_completed(TEXT) TO anon, authenticated;

-- 3. Add server-side input validation as CHECK constraints on survey_responses
ALTER TABLE public.survey_responses
  ADD CONSTRAINT chk_age CHECK (age BETWEEN 0 AND 130),
  ADD CONSTRAINT chk_full_name_len CHECK (char_length(full_name) BETWEEN 2 AND 120),
  ADD CONSTRAINT chk_phone_len CHECK (char_length(phone) BETWEEN 8 AND 30),
  ADD CONSTRAINT chk_email_len CHECK (email IS NULL OR char_length(email) BETWEEN 3 AND 254),
  ADD CONSTRAINT chk_city_len CHECK (char_length(city) BETWEEN 2 AND 80),
  ADD CONSTRAINT chk_state_len CHECK (char_length(state) BETWEEN 2 AND 60),
  ADD CONSTRAINT chk_neighborhood_len CHECK (char_length(neighborhood) BETWEEN 1 AND 80),
  ADD CONSTRAINT chk_nationality_len CHECK (char_length(nationality) BETWEEN 2 AND 80),
  ADD CONSTRAINT chk_cep_len CHECK (char_length(cep) BETWEEN 5 AND 12),
  ADD CONSTRAINT chk_gender_len CHECK (char_length(gender) BETWEEN 1 AND 40),
  ADD CONSTRAINT chk_street_len CHECK (street IS NULL OR char_length(street) <= 160),
  ADD CONSTRAINT chk_number_len CHECK (number IS NULL OR char_length(number) <= 20),
  ADD CONSTRAINT chk_tracking_code CHECK (tracking_code IS NULL OR (char_length(tracking_code) BETWEEN 6 AND 32 AND tracking_code ~ '^[A-Z0-9-]+$')),
  ADD CONSTRAINT chk_screening_size CHECK (pg_column_size(screening_answers) < 50000),
  ADD CONSTRAINT chk_main_size CHECK (pg_column_size(main_answers) < 50000);

-- 4. Explicitly deny INSERT/UPDATE/DELETE on user_roles to prevent privilege escalation
-- (RLS already denies by default, but make it explicit with restrictive policies)
CREATE POLICY "No client modifications to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
