import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/survey/Stepper";
import { ConsentData, ConsentStep } from "@/components/survey/ConsentStep";
import { EligibilityStep } from "@/components/survey/EligibilityStep";
import { PersonalDataStep, PersonalData, personalDataSchema } from "@/components/survey/PersonalDataStep";
import { SuccessStep } from "@/components/survey/SuccessStep";
import { GoogleFormStep } from "@/components/survey/GoogleFormStep";
import { DeclinedStep } from "@/components/survey/DeclinedStep";
import { TokenValidationStep } from "@/components/survey/TokenValidationStep";
import { supabase } from "@/integrations/supabase/client";

type Stage =
  | "consent"
  | "eligibility"
  | "personal"
  | "token"
  | "googleForm"
  | "success"
  | "declined";
type DeclinedReason = "consent" | "age" | "location" | "criteria";

const STORAGE_KEY = "uniftc-glp1-survey-v3";
const STEPS = ["Termo", "Critérios", "Dados", "Token", "Forms", "Fim"];

interface FormState {
  stage: Stage;
  personal: Partial<PersonalData>;
  consent?: ConsentData;
  declinedReason?: DeclinedReason;
  trackingCode?: string;
}

const initial: FormState = {
  stage: "consent",
  personal: {},
};

const Index = () => {
  const [state, setState] = useState<FormState>(initial);
  const [personalValid, setPersonalValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.stage]);

  const stepNumber = useMemo(() => {
    switch (state.stage) {
      case "consent":
        return 1;
      case "eligibility":
        return 2;
      case "personal":
        return 3;
      case "token":
        return 4;
      case "googleForm":
        return 5;
      case "success":
      case "declined":
        return 6;
    }
  }, [state.stage]);

  const goTo = (stage: Stage) => setState((s) => ({ ...s, stage }));

  const goToTokenStep = () => {
    const personalCheck = personalDataSchema.safeParse(state.personal);
    if (!personalCheck.success) {
      toast.error("Verifique os dados pessoais");
      goTo("personal");
      return;
    }
    goTo("token");
  };

  const handleTokenValidated = async (token: string) => {
    const personalCheck = personalDataSchema.safeParse(state.personal);
    if (!personalCheck.success) {
      toast.error("Verifique os dados pessoais");
      goTo("personal");
      return;
    }

    setSubmitting(true);
    setState((s) => ({ ...s, trackingCode: token }));

    const { error } = await supabase.from("survey_responses").insert({
      full_name: personalCheck.data.full_name,
      age: personalCheck.data.age,
      nationality: personalCheck.data.nationality,
      cep: personalCheck.data.cep,
      street: personalCheck.data.street || null,
      number: personalCheck.data.number || null,
      neighborhood: personalCheck.data.neighborhood,
      city: personalCheck.data.city,
      state: personalCheck.data.state,
      gender: personalCheck.data.gender,
      phone: personalCheck.data.phone,
      email: personalCheck.data.email || null,
      tracking_code: token,
      screening_answers: {
        electronic_consent: {
          participant_name: state.consent?.participantName || personalCheck.data.full_name,
          identity_document: state.consent?.identityDocument || null,
          consent_city: state.consent?.consentCity || null,
          consent_date: state.consent?.consentDate || null,
          accepted_tcle: true,
        },
      },
      main_answers: {},
      consent_given: true,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar seus dados. Tente novamente.");
      return;
    }

    goTo("googleForm");
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...initial });
  };

  const renderStage = () => {
    switch (state.stage) {
      case "consent":
        return (
          <ConsentStep
            onAccept={(consent) =>
              setState((s) => ({ ...s, consent, stage: "eligibility" }))
            }
            onDecline={() =>
              setState((s) => ({ ...s, stage: "declined", declinedReason: "consent" }))
            }
          />
        );
      case "eligibility":
        return (
          <EligibilityStep
            onEligible={() => goTo("personal")}
            onIneligible={(reason) =>
              setState((s) => ({ ...s, stage: "declined", declinedReason: reason }))
            }
          />
        );
      case "personal":
        return (
          <PersonalDataStep
            data={state.personal}
            onChange={(d) => setState((s) => ({ ...s, personal: d }))}
            onValidityChange={setPersonalValid}
          />
        );
      case "token":
        return (
          <TokenValidationStep
            onValidated={handleTokenValidated}
            loading={submitting}
          />
        );
      case "googleForm":
        return (
          <GoogleFormStep
            personal={state.personal}
            trackingCode={state.trackingCode}
            onDone={() => {
              localStorage.removeItem(STORAGE_KEY);
              goTo("success");
            }}
          />
        );
      case "success":
        return <SuccessStep onRestart={restart} />;
      case "declined":
        return <DeclinedStep onRestart={restart} reason={state.declinedReason} />;
    }
  };

  const showFooter = state.stage === "personal";

  const canAdvance = () => {
    if (state.stage === "personal") return personalValid;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) {
      toast.error("Responda todos os campos obrigatórios para continuar");
      return;
    }
    if (state.stage === "personal") goToTokenStep();
  };

  const handleBack = () => {
    if (state.stage === "personal") goTo("eligibility");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
                UNIFTC · Pesquisa Acadêmica
              </p>
              <h1 className="text-sm font-bold text-foreground truncate">
                Pesquisa GLP-1 & Estética
              </h1>
            </div>
          </div>
          <Stepper current={stepNumber} steps={STEPS} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-32">{renderStage()}</main>

      {showFooter && (
        <footer className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/60 shadow-elevated">
          <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={submitting}
              className="h-12 rounded-xl px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline ml-1">Voltar</span>
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              disabled={submitting}
              className="h-12 rounded-xl flex-1 bg-gradient-primary font-semibold"
            >
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Index;
