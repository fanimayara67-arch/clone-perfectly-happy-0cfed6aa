import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  current: number;
  steps: string[];
}

export const Stepper = ({ current, steps }: StepperProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-smooth shrink-0",
                    isDone && "bg-success text-success-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !isDone && !isActive && "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs text-center leading-tight font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 -mt-5 transition-smooth",
                    isDone ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
