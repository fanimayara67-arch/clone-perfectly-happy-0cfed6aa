-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Colunas novas em survey_responses
ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS google_form_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_form_completed_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public.survey_responses ADD CONSTRAINT survey_responses_tracking_code_key UNIQUE (tracking_code);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_survey_responses_tracking_code ON public.survey_responses(tracking_code);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses(created_at DESC);

-- 3. Policies
DROP POLICY IF EXISTS "Authenticated users can view all responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.survey_responses;
CREATE POLICY "Admins can view all responses" ON public.survey_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. RPC para marcar conclusão
CREATE OR REPLACE FUNCTION public.mark_google_form_completed(_tracking_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.survey_responses
  SET google_form_completed = true,
      google_form_completed_at = now()
  WHERE tracking_code = _tracking_code AND google_form_completed = false;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_google_form_completed(TEXT) TO anon, authenticated;

-- 5. Realtime
ALTER TABLE public.survey_responses REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;