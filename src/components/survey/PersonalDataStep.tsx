import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { toast } from "sonner";

export const personalDataSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  age: z
    .number({ invalid_type_error: "Informe sua idade" })
    .int()
    .min(18, "Idade mínima: 18 anos")
    .max(110, "Idade inválida"),
  nationality: z.string().trim().min(2, "Informe sua nacionalidade").max(60),
  cep: z
    .string()
    .regex(/^\d{5}-\d{3}$/, "CEP inválido (use o formato 00000-000)"),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z
    .string()
    .trim()
    .length(2, "UF deve conter 2 letras"),
  gender: z.string().min(1, "Selecione o gênero"),
  sexual_orientation: z.string().min(1, "Selecione a orientação sexual"),
  phone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .max(255, "E-mail muito longo"),
});

export type PersonalData = z.infer<typeof personalDataSchema>;

interface PersonalDataStepProps {
  data: Partial<PersonalData>;
  onChange: (data: Partial<PersonalData>) => void;
  onValidityChange: (valid: boolean) => void;
}

const GENDERS = [
  "Feminino",
  "Masculino",
  "Não-binário",
  "Transgênero",
  "Prefiro não informar",
  "Outro",
];

const SEXUAL_ORIENTATIONS = [
  "Heterossexual",
  "Homossexual",
  "Bissexual",
  "Assexual",
  "Pansexual",
  "Prefiro não informar",
  "Outra",
];

const NATIONALITIES = [
  "Brasileira",
  "Portuguesa",
  "Argentina",
  "Outra",
];

const formatCEP = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && a.length === 2 ? ") " : "", b, c && `-${c}`]
        .filter(Boolean)
        .join(""),
    );
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};

export const PersonalDataStep = ({
  data,
  onChange,
  onValidityChange,
}: PersonalDataStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [lastValidCep, setLastValidCep] = useState<string>(data.cep || "");
  const dataRef = useRef<Partial<PersonalData>>(data);
  const lastLookupCepRef = useRef<string>("");

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const update = (patch: Partial<PersonalData>, verifiedCep = lastValidCep) => {
    const next = { ...dataRef.current, ...patch };
    dataRef.current = next;
    onChange(next);
    const result = personalDataSchema.safeParse(next);
    const cepIsVerified = !!next.cep && next.cep === verifiedCep && !!next.state;
    if (result.success && cepIsVerified) {
      setErrors({});
      onValidityChange(true);
    } else {
      const errs: Record<string, string> = {};
      if (!result.success) {
        result.error.issues.forEach((i) => {
          if (i.path[0]) errs[String(i.path[0])] = i.message;
        });
      }
      if (!cepIsVerified && next.cep?.length === 9) {
        errs.cep = "Confirme um CEP válido do Brasil";
      }
      setErrors(errs);
      onValidityChange(false);
    }
  };

  const lookupCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    setLastValidCep("");
    try {
      lastLookupCepRef.current = cep;
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (json.erro) {
        update({ neighborhood: "", city: "", state: "" });
        toast.error("CEP não encontrado");
        return;
      }
      setLastValidCep(cep);
      update({
        neighborhood: json.bairro || "",
        city: json.localidade || "",
        state: (json.uf || "").toUpperCase(),
      }, cep);
    } catch {
      toast.error("Erro ao buscar o CEP");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Dados Pessoais"
        subtitle="Preencha seus dados antes de iniciar as perguntas. O CEP deve ser válido em território brasileiro."
      />

      <Card>
        <Field label="Nome completo" error={errors.full_name}>
          <Input
            value={data.full_name || ""}
            onChange={(e) => update({ full_name: e.target.value })}
            placeholder="Digite seu nome completo"
            maxLength={120}
            className="h-12"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Idade" error={errors.age}>
            <Input
              type="number"
              inputMode="numeric"
              value={data.age ?? ""}
              onChange={(e) =>
                update({ age: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="Ex.: 28"
              min={18}
              max={110}
              className="h-12"
            />
          </Field>
          <Field label="Gênero" error={errors.gender}>
            <Select
              value={data.gender || ""}
              onValueChange={(v) => update({ gender: v })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Orientação sexual" error={errors.sexual_orientation}>
          <Select
            value={data.sexual_orientation || ""}
            onValueChange={(v) => update({ sexual_orientation: v })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione sua orientação sexual" />
            </SelectTrigger>
            <SelectContent>
              {SEXUAL_ORIENTATIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Nacionalidade" error={errors.nationality}>
          <Select
            value={data.nationality || ""}
            onValueChange={(v) => update({ nationality: v })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione sua nacionalidade" />
            </SelectTrigger>
            <SelectContent>
              {NATIONALITIES.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          Localização
        </p>
        <Field label="CEP" error={errors.cep}>
          <Input
            value={data.cep || ""}
            onChange={(e) => {
              const formatted = formatCEP(e.target.value);
              if (formatted.length < 9) {
                lastLookupCepRef.current = "";
              }

              update(
                formatted === lastValidCep
                  ? { cep: formatted }
                  : { cep: formatted, neighborhood: "", city: "", state: "" },
              );

              if (
                formatted.length === 9 &&
                formatted !== lastValidCep &&
                formatted !== lastLookupCepRef.current &&
                !cepLoading
              ) {
                lookupCEP(formatted);
              }
            }}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            className="h-12"
          />
          {cepLoading && (
            <p className="text-xs text-muted-foreground mt-1">Buscando localização...</p>
          )}
          {!cepLoading && lastValidCep === data.cep && !!data.state && (
            <p className="text-xs text-primary font-medium mt-1">CEP validado com sucesso.</p>
          )}
        </Field>

        <Field label="Bairro" error={errors.neighborhood}>
          <Input
            value={data.neighborhood || ""}
            onChange={(e) => update({ neighborhood: e.target.value })}
            className="h-12"
          />
        </Field>

        <div className="grid grid-cols-[1fr_90px] gap-3">
          <Field label="Cidade" error={errors.city}>
            <Input
              value={data.city || ""}
              onChange={(e) => update({ city: e.target.value })}
              className="h-12"
            />
          </Field>
          <Field label="UF" error={errors.state}>
            <Input
              value={data.state || ""}
              onChange={(e) =>
                update({ state: e.target.value.toUpperCase().slice(0, 2) })
              }
              maxLength={2}
              className="h-12 uppercase"
            />
          </Field>
        </div>
      </Card>

      <Card>
        <Field label="Telefone" error={errors.phone}>
          <Input
            value={data.phone || ""}
            onChange={(e) => update({ phone: formatPhone(e.target.value) })}
            placeholder="(11) 91234-5678"
            inputMode="tel"
            className="h-12"
          />
        </Field>
        <Field label="E-mail para receber informações e resultados" error={errors.email}>
          <Input
            type="email"
            value={data.email || ""}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="seu@email.com"
            inputMode="email"
            maxLength={255}
            className="h-12"
          />
        </Field>
      </Card>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="bg-gradient-hero rounded-2xl p-5 text-primary-foreground shadow-soft">
    <h2 className="text-lg font-bold">{title}</h2>
    <p className="text-sm opacity-90 mt-0.5 leading-snug">{subtitle}</p>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-5 shadow-card border border-border/60 space-y-4">
    {children}
  </div>
);

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-semibold text-foreground">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive font-medium">{error}</p>}
  </div>
);
