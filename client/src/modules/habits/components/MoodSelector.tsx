import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MoodValue } from "@/modules/habits/types";
import { MOOD_OPTIONS } from "@/modules/habits/utils/habits";

interface MoodSelectorProps {
  value?: MoodValue;
  onChange: (value: MoodValue) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-black text-foreground">كيف تشعر اليوم؟</p>
          <p className="text-xs leading-6 text-muted-foreground">اختيار سريع واحد يكفي ليبقى اليوم واضحًا.</p>
        </div>
        <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-fuchsia-500/20 bg-fuchsia-500/[0.12] text-fuchsia-300">
          <span className="text-lg">🫶</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
        {MOOD_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative overflow-hidden rounded-[calc(var(--radius)+0.45rem)] border px-3 py-3 text-right transition-all duration-200",
                active
                  ? "border-primary/35 bg-primary/[0.08] text-foreground shadow-[0_0_0_1px_rgba(149,223,30,0.16),0_0_18px_rgba(149,223,30,0.12)]"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="mood-selector-highlight"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.12),transparent_55%)]"
                />
              ) : null}
              <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-1 text-right">
                  <p className="text-sm font-bold">{option.label}</p>
                  <p className="text-[11px] leading-5 text-muted-foreground">{option.hint}</p>
                </div>
                <span className="text-xl leading-none">{option.emoji}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
