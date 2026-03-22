import { BrainCircuit, Leaf, Pill } from "lucide-react";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";

interface PlannerSuggestionModuleProps {
  suggestions: {
    nutritionInsight: string;
    habitSuggestion: string;
    supplementPlaceholder: string;
  };
}

const ITEMS = [
  { key: "nutritionInsight", icon: BrainCircuit, label: "رؤية غذائية" },
  { key: "habitSuggestion", icon: Leaf, label: "اقتراح عادة" },
  { key: "supplementPlaceholder", icon: Pill, label: "قسم المكملات لاحقًا" },
] as const;

export function PlannerSuggestionModule({ suggestions }: PlannerSuggestionModuleProps) {
  return (
    <section className="rounded-[1.85rem] border border-white/60 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/70" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <PlannerMetaBadge icon={BrainCircuit} label="اقتراحات ذكية" tone="accent" />
        <div className="text-right">
          <p className="text-lg font-black text-foreground">إشارات لتحسين الأسبوع</p>
          <p className="text-xs text-muted-foreground">خفيفة وواضحة وقابلة للتوسع لاحقًا</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {ITEMS.map(({ key, icon: Icon, label }) => (
          <div key={key} className="rounded-[1.35rem] border border-border/55 bg-background/70 p-4 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm leading-7 text-foreground">{suggestions[key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
