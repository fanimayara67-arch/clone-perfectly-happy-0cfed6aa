import { useEffect, useRef, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TokenValidationStepProps {
  onValidated: (token: string) => Promise<void> | void;
  loading?: boolean;
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60_000;
const TOKEN_REGEX = /^UFTC-[A-Z0-9]{4,16}$/;

export const TokenValidationStep = ({ onValidated, loading }: TokenValidationStepProps) => {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!cooldownUntil) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [cooldownUntil]);

  const blocked = cooldownUntil !== null && now < cooldownUntil;
  const remaining = blocked ? Math.ceil((cooldownUntil! - now) / 1000) : 0;

  const handleChange = (raw: string) => {
    let v = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (v.length > 0 && !v.startsWith("UFTC")) {
      // permite digitar só o sufixo
      if (!v.startsWith("U")) v = `UFTC-${v}`;
    }
    if (v.length > 5 && v[4] !== "-") {
      v = `UFTC-${v.replace(/^UFTC-?/, "")}`;
    }
    if (v.length > 21) v = v.slice(0, 21);
    setCode(v);
    setError(null);
  };

  const validate = async () => {
    if (blocked) return;
    const normalized = code.trim().toUpperCase();
    if (!TOKEN_REGEX.test(normalized)) {
      setError("Formato inválido. Use UFTC-XXXXXX.");
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("validate_and_consume_token", {
        _code: normalized,
        _response_id: null,
      });
      if (rpcError) {
        console.error(rpcError);
        toast.error("Erro ao validar o token. Tente novamente.");
        return;
      }
      if (data === true) {
        toast.success("Token válido! Acesso liberado.");
        await onValidated(normalized);
        return;
      }
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + COOLDOWN_MS;
        setCooldownUntil(until);
        setError("Muitas tentativas. Aguarde 1 minuto.");
      } else {
        setError(`Token inválido ou já utilizado. (${MAX_ATTEMPTS - next} tentativa${MAX_ATTEMPTS - next === 1 ? "" : "s"} restantes)`);
      }
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-hero rounded-2xl p-5 text-primary-foreground shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-2">
          Acesso restrito
        </p>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Informe seu token de participação
        </h2>
        <p className="text-sm opacity-90 mt-1 leading-snug">
          Apenas tokens cadastrados pela equipe da pesquisa liberam o acesso ao formulário.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 border-2 border-primary/30 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <KeyRound className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground leading-snug">
              Token de identificação
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Digite o código fornecido pela equipe da pesquisa (formato <code className="font-mono">UFTC-XXXXXX</code>).
            </p>
          </div>
        </div>

        <div>
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !validating && !blocked) validate();
            }}
            placeholder="UFTC-XXXXXX"
            className="text-center text-lg font-mono font-bold tracking-widest h-14 rounded-xl"
            disabled={validating || blocked || loading}
            maxLength={21}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
          />
          {error && (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {blocked && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Tente novamente em {remaining}s
            </p>
          )}
        </div>

        <Button
          onClick={validate}
          size="lg"
          disabled={validating || blocked || loading || !code}
          className="h-12 w-full rounded-xl bg-gradient-primary font-semibold"
        >
          {validating || loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Validar token e continuar
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Não recebeu um token? Entre em contato com a equipe responsável pela pesquisa.
      </p>
    </div>
  );
};
