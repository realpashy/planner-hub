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
      className="rounded-[calc(var(--radius)+0.75rem)] border border-amber-500/15 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,rgba(39,35,27,0.98),rgba(29,27,23,0.98))] p-5 shadow-xl"
      dir="rtl"
    >
      <div className="rtl-title-row items-center">
        <div className="text-right flex-1">
          <h3 className="text-lg font-black text-foreground">ملاحظات خفيفة لهذا الأسبوع</h3>
          <p className="text-sm text-muted-foreground">مختصرة، عملية، وتبقي الخطة سهلة التنفيذ.</p>
        </div>
        <div className="stat-chip rounded-full px-3 py-1 text-xs font-semibold text-amber-400 dark:text-amber-300">
          اقتراحات ذكية
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {ITEMS.map(({ key, icon: Icon }) => (
          <div key={key} className="rtl-title-row items-start rounded-[calc(var(--radius)+0.375rem)] px-1 py-1">
            <p className="flex-1 text-right text-sm leading-7 text-foreground">{suggestions[key]}</p>
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border border-amber-500/15 bg-amber-500/[0.12] text-amber-400 dark:text-amber-300 shadow-[var(--app-shadow)]">
              <Icon className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
