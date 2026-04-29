-- Tabela de tokens válidos
CREATE TABLE public.valid_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_response_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_token_format CHECK (code ~ '^UFTC-[A-Z0-9]{4,16}$')
);

CREATE INDEX idx_valid_tokens_code ON public.valid_tokens(code);

ALTER TABLE public.valid_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem operar diretamente na tabela
CREATE POLICY "Admins manage tokens select" ON public.valid_tokens
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage tokens insert" ON public.valid_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage tokens update" ON public.valid_tokens
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage tokens delete" ON public.valid_tokens
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bloquear qualquer escrita anônima (defesa em profundidade)
CREATE POLICY "Block anon writes insert" ON public.valid_tokens
  AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (false);

CREATE POLICY "Block anon writes update" ON public.valid_tokens
  AS RESTRICTIVE FOR UPDATE TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Block anon writes delete" ON public.valid_tokens
  AS RESTRICTIVE FOR DELETE TO anon
  USING (false);

-- RPC: valida e consome token de forma atômica
CREATE OR REPLACE FUNCTION public.validate_and_consume_token(_code TEXT, _response_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized TEXT;
  v_updated INTEGER;
BEGIN
  IF _code IS NULL THEN RETURN false; END IF;
  v_normalized := upper(trim(_code));

  IF v_normalized !~ '^UFTC-[A-Z0-9]{4,16}$' THEN
    RETURN false;
  END IF;

  UPDATE public.valid_tokens
  SET used_at = now(),
      used_by_response_id = _response_id
  WHERE code = v_normalized
    AND is_active = true
    AND used_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_and_consume_token(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_and_consume_token(TEXT, UUID) TO anon, authenticated;

-- Token inicial
INSERT INTO public.valid_tokens (code, is_active, notes)
VALUES ('UFTC-7RDHED', true, 'Token inicial cadastrado pelo sistema');