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
      className="rounded-[1.5rem] border border-white/60 bg-white/82 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_18px_46px_rgba(2,6,23,0.42)]"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-semibold text-primary">اقتراحات ذكية</div>
        <div className="text-right">
          <h3 className="text-lg font-bold text-foreground">ملاحظات خفيفة لهذا الأسبوع</h3>
          <p className="text-sm text-muted-foreground">مختصرة، عملية، وغير مشتتة.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {ITEMS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3 rounded-[1rem] px-1 py-1">
            <p className="flex-1 text-right text-sm leading-7 text-foreground">{suggestions[key]}</p>
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
