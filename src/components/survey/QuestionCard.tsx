import { Question, LIKERT_OPTIONS } from "@/lib/survey-questions";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  index: number;
  total: number;
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}

export const QuestionCard = ({
  index,
  total,
  question,
  value,
  onChange,
}: QuestionCardProps) => {
  const renderInput = () => {
    if (question.type === "text") {
      return (
        <Textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua resposta..."
          className="min-h-[100px] resize-none text-base"
          maxLength={1000}
        />
      );
    }

    const options =
      question.type === "likert"
        ? LIKERT_OPTIONS
        : question.type === "yesno"
        ? ["Sim", "Não"]
        : question.options || [];

    if (question.type === "multi") {
      const selected = (value as string[]) || [];
      return (
        <div className="space-y-2.5">
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-smooth active:scale-[0.99]",
                  isChecked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...selected, opt]);
                    else onChange(selected.filter((s) => s !== opt));
                  }}
                  className="mt-0.5"
                />
                <span className="text-sm leading-snug font-medium text-foreground flex-1">
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <RadioGroup
        value={(value as string) || ""}
        onValueChange={onChange}
        className="space-y-2.5"
      >
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <label
              key={opt}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-smooth active:scale-[0.99]",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <RadioGroupItem value={opt} id={`${question.id}-${opt}`} className="mt-0.5" />
              <span className="text-sm leading-snug font-medium text-foreground flex-1">
                {opt}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    );
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/60">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {index} / {total}
        </span>
        {question.required && (
          <span className="text-[10px] text-destructive font-semibold uppercase tracking-wide">
            Obrigatória
          </span>
        )}
      </div>
      <Label className="text-base font-semibold text-foreground leading-snug block mb-4">
        {question.label}
      </Label>
      {renderInput()}
    </div>
  );
};
