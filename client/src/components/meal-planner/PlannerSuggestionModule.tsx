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
      className="rounded-[1.5rem] border border-amber-200/70 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,251,235,0.94))] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-amber-400/20 dark:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_22%),linear-gradient(180deg,rgba(51,65,85,0.9),rgba(15,23,42,0.84))] dark:shadow-[0_20px_46px_rgba(2,6,23,0.42)]"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-right">
          <h3 className="text-lg font-black text-foreground">ملاحظات خفيفة لهذا الأسبوع</h3>
          <p className="text-sm text-muted-foreground">مختصرة، عملية، وتبقي الخطة سهلة التنفيذ.</p>
        </div>
        <div className="rounded-full border border-amber-200/70 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-amber-400/20 dark:bg-white/10 dark:text-amber-200">
          اقتراحات ذكية
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {ITEMS.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3 rounded-[1rem] border border-transparent px-1 py-1">
            <p className="flex-1 text-right text-sm leading-7 text-foreground">{suggestions[key]}</p>
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
              <Icon className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
