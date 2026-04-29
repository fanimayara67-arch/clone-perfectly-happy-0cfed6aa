import { CheckCircle2, Users, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessStepProps {
  onRestart: () => void;
}

// PLACEHOLDERS — substitua pelos dados oficiais do TCC
const AUTHORS = [
  "[Nome do(a) Aluno(a) 1]",
  "[Nome do(a) Aluno(a) 2]",
];
const ADVISOR = "[Nome do(a) Orientador(a)]";

export const SuccessStep = ({ onRestart }: SuccessStepProps) => {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-hero rounded-3xl p-7 text-primary-foreground text-center shadow-elevated">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4 backdrop-blur-sm">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Obrigado pela participação!</h1>
        <p className="text-sm opacity-95 leading-relaxed">
          Sua contribuição é fundamental para o avanço da pesquisa científica em
          Odontologia.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/60 space-y-4">
        <SectionTitle icon={<GraduationCap className="h-4 w-4" />}>
          Sobre o Estudo
        </SectionTitle>
        <InfoBlock label="Instituição" value="Centro Universitário UNIFTC" />
        <InfoBlock label="Curso" value="Odontologia" />
        <InfoBlock
          label="Tema"
          value="Percepção de Adultos sobre o Uso de Agonistas de GLP-1 para Emagrecimento e seus Impactos Estéticos Faciais e Corporais"
        />
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/60 space-y-3">
        <SectionTitle icon={<Users className="h-4 w-4" />}>
          Autores e Orientação
        </SectionTitle>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Autores
          </p>
          <ul className="space-y-1">
            {AUTHORS.map((a) => (
              <li key={a} className="text-sm text-foreground font-medium">
                • {a}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Orientação
          </p>
          <p className="text-sm text-foreground font-medium">{ADVISOR}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/60 space-y-3">
        <SectionTitle icon={<BookOpen className="h-4 w-4" />}>
          Referências Bibliográficas
        </SectionTitle>
        <ol className="space-y-2 list-decimal list-inside">
          {REFERENCES.map((ref, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed">
              {ref}
            </li>
          ))}
        </ol>
      </div>

      <Button
        onClick={onRestart}
        variant="outline"
        size="lg"
        className="w-full h-12 rounded-xl"
      >
        Iniciar nova resposta
      </Button>

      <p className="text-center text-xs text-muted-foreground pb-2">
        © {new Date().getFullYear()} UNIFTC — Pesquisa Acadêmica
      </p>
    </div>
  );
};

const SectionTitle = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 pb-1 border-b border-border/60">
    <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
      {icon}
    </span>
    <h3 className="text-sm font-bold text-foreground">{children}</h3>
  </div>
);

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
      {label}
    </p>
    <p className="text-sm text-foreground font-medium leading-snug">{value}</p>
  </div>
);
