-- Survey responses table for the GLP-1 perception study
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  nationality TEXT NOT NULL,
  cep TEXT NOT NULL,
  street TEXT,
  number TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  screening_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  main_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a survey response"
  ON public.survey_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all responses"
  ON public.survey_responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_survey_responses_created_at ON public.survey_responses(created_at DESC);