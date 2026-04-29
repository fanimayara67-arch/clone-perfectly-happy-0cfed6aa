import { Question } from "@/lib/survey-questions";
import { QuestionCard } from "./QuestionCard";

interface QuestionsStepProps {
  title: string;
  subtitle: string;
  questions: Question[];
  answers: Record<string, string | string[]>;
  onChange: (id: string, value: string | string[]) => void;
}

export const QuestionsStep = ({
  title,
  subtitle,
  questions,
  answers,
  onChange,
}: QuestionsStepProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-hero rounded-2xl p-5 text-primary-foreground shadow-soft">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm opacity-90 mt-0.5 leading-snug">{subtitle}</p>
      </div>

      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          index={idx + 1}
          total={questions.length}
          question={q}
          value={answers[q.id]}
          onChange={(v) => onChange(q.id, v)}
        />
      ))}
    </div>
  );
};
