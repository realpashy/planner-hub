import { BrainCircuit, Leaf, Sparkles } from "lucide-react";

interface PlannerSuggestionModuleProps {
  suggestions: {
    nutritionInsight: string;
    habitSuggestion: string;
    supplementPlaceholder: string;
  };
}

const ITEMS = [
  { key: "nutritionInsight", icon: BrainCircuit },
  { key: "habitSuggestion", icon: Leaf },
  { key: "supplementPlaceholder", icon: Sparkles },
] as const;

export function PlannerSuggestionModule({ suggestions }: PlannerSuggestionModuleProps) {
  return (
    <section
      className="meal-surface-guidance rounded-[calc(var(--radius)+0.75rem)] p-5 shadow-xl"
      dir="rtl"
    >
      <div className="flex items-center justify-start gap-3 text-right">
        <div className="meal-label-surface text-amber-400 dark:text-amber-300">
          اقتراحات ذكية
        </div>
        <div className="text-right flex-1">
          <h3 className="text-lg font-black text-foreground">ملاحظات خفيفة لهذا الأسبوع</h3>
          <p className="text-sm text-muted-foreground">مختصرة، عملية، وتبقي الخطة سهلة التنفيذ.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {ITEMS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-start justify-start gap-3 rounded-[calc(var(--radius)+0.375rem)] px-1 py-1 text-right">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-primary/25 bg-primary text-primary-foreground shadow-[var(--app-shadow)] dark:bg-primary/[0.12] dark:text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <p className="flex-1 text-right text-sm leading-7 text-foreground">{suggestions[key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
