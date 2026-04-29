import { Heart, CalendarX, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeclinedReason = "consent" | "age" | "location" | "criteria";

interface DeclinedStepProps {
  onRestart: () => void;
  reason?: DeclinedReason;
}

const CONTENT: Record<
  DeclinedReason,
  { icon: React.ReactNode; title: string; text: string }
> = {
  consent: {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Agradecemos seu tempo",
    text: "Você optou por não participar da pesquisa. Agradecemos sua atenção.",
  },
  age: {
    icon: <CalendarX className="h-8 w-8 text-primary" />,
    title: "Pesquisa restrita a maiores de 18 anos",
    text: "Agradecemos seu interesse em participar. Neste momento, você não se enquadra nos critérios de inclusão da pesquisa, por isso o questionário será encerrado.",
  },
  location: {
    icon: <MapPinOff className="h-8 w-8 text-primary" />,
    title: "Pesquisa restrita ao estado da Bahia",
    text: "Agradecemos seu interesse em participar. Neste momento, você não se enquadra nos critérios de inclusão da pesquisa, por isso o questionário será encerrado.",
  },
  criteria: {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Critérios de inclusão",
    text: "Agradecemos seu interesse em participar. Neste momento, você não se enquadra nos critérios de inclusão da pesquisa, por isso o questionário será encerrado.",
  },
};

export const DeclinedStep = ({ onRestart, reason = "consent" }: DeclinedStepProps) => {
  const c = CONTENT[reason];
  return (
    <div className="space-y-5 pt-8">
      <div className="bg-card rounded-3xl p-7 text-center shadow-card border border-border/60">
        <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          {c.icon}
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{c.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
      </div>
      <Button
        onClick={onRestart}
        size="lg"
        className="w-full h-12 rounded-xl bg-gradient-primary"
      >
        Voltar ao início
      </Button>
    </div>
  );
};
