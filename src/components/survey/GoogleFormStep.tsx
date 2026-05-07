import { useMemo, useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonalData } from "@/components/survey/PersonalDataStep";
import { QuestionsStep } from "@/components/survey/QuestionsStep";
import { MAIN_QUESTIONS, SCREENING_QUESTIONS } from "@/lib/survey-questions";
import type { AnswerMap } from "@/lib/google-forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleFormStepProps {
  personal?: Partial<PersonalData>;
  trackingCode?: string;
  onDone: () => void;
}

const isAnswered = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
};

export const GoogleFormStep = ({ personal, trackingCode, onDone }: GoogleFormStepProps) => {
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screeningAnswers, setScreeningAnswers] = useState<AnswerMap>({});
  const [mainAnswers, setMainAnswers] = useState<AnswerMap>({});

  const allQuestions = useMemo(() => [...SCREENING_QUESTIONS, ...MAIN_QUESTIONS], []);

  const missingRequired = useMemo(() => {
    return allQuestions.filter((question) => {
      if (!question.required) return false;
      const source = SCREENING_QUESTIONS.some((item) => item.id === question.id)
        ? screeningAnswers
        : mainAnswers;
      return !isAnswered(source[question.id]);
    });
  }, [allQuestions, mainAnswers, screeningAnswers]);

  const copyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success("Token copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o token.");
    }
  };

  const handleSubmit = async () => {
    if (!trackingCode) {
      toast.error("Token de identificação não encontrado.");
      return;
    }

    if (missingRequired.length > 0) {
      toast.error("Responda todas as perguntas obrigatórias antes de enviar.");
      return;
    }

    if (!personal?.full_name || !personal?.age || !personal?.cep) {
      toast.error("Os dados pessoais não foram carregados corretamente.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-google-form-response", {
        body: {
          trackingCode,
          screening: screeningAnswers,
          main: mainAnswers,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Respostas enviadas com sucesso.");
      onDone();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível enviar a pesquisa. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-hero rounded-2xl p-5 text-primary-foreground shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-2">
          Pesquisa
        </p>
        <h2 className="text-lg font-bold">Respostas com validação de token</h2>
        <p className="text-sm opacity-90 mt-1 leading-snug">
          O envio só é liberado com o token gerado nesta pesquisa. O participante não envia nada ao formulário externo sem passar por essa validação.
        </p>
      </div>

      {trackingCode && (
        <div className="bg-card rounded-2xl p-5 border-2 border-primary/30 shadow-card">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Send className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground leading-snug">Token da resposta</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Este token identifica a resposta e é enviado automaticamente ao Google Forms somente após a validação.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
            <code className="flex-1 text-base font-mono font-bold text-foreground tracking-wider text-center">
              {trackingCode}
            </code>
            <Button size="sm" variant="outline" onClick={copyCode} className="h-9 rounded-lg shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5 text-xs font-semibold">{copied ? "Copiado" : "Copiar"}</span>
            </Button>
          </div>
        </div>
      )}

      {SCREENING_QUESTIONS.length > 0 && (
        <QuestionsStep
          title="Triagem"
          subtitle="Responda às questões iniciais antes do envio da pesquisa."
          questions={SCREENING_QUESTIONS}
          answers={screeningAnswers}
          onChange={(id, value) => setScreeningAnswers((prev) => ({ ...prev, [id]: value }))}
        />
      )}

      <QuestionsStep
        title="Questionário principal"
        subtitle="As respostas serão validadas aqui e enviadas ao Google Forms apenas se o token for legítimo."
        questions={MAIN_QUESTIONS}
        answers={mainAnswers}
        onChange={(id, value) => setMainAnswers((prev) => ({ ...prev, [id]: value }))}
      />

      <Button
        size="lg"
        onClick={handleSubmit}
        disabled={submitting}
        className="h-12 w-full rounded-xl bg-gradient-primary font-semibold"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar respostas"}
      </Button>
    </div>
  );
};
