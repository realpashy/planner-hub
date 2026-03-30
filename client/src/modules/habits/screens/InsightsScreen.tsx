import { Brain, Flame, LineChart } from "lucide-react";
import { InsightCharts } from "@/modules/habits/components/InsightCharts";
import type {
  CategoryBreakdownItem,
  HabitsState,
  TrendPoint,
} from "@/modules/habits/types";
import { getMoodBreakdown } from "@/modules/habits/utils/habits";

interface InsightsScreenProps {
  state: HabitsState;
  averagePercent: number;
  totalCheckIns: number;
  bestDayLabel: string;
  bestDayPercent: number;
  weeklyTrend: TrendPoint[];
  monthlyTrend: TrendPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
}

export function InsightsScreen({
  state,
  averagePercent,
  totalCheckIns,
  bestDayLabel,
  bestDayPercent,
  weeklyTrend,
  monthlyTrend,
  categoryBreakdown,
}: InsightsScreenProps) {
  const moodBreakdown = getMoodBreakdown(state);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-primary/20 bg-background/70 text-primary shadow-[0_0_0_1px_rgba(149,223,30,0.16),0_0_16px_rgba(149,223,30,0.12)]">
            <LineChart className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">متوسط الأسبوع</p>
          <p className="cashflow-number mt-1 text-3xl font-black text-foreground">{averagePercent}%</p>
        </div>
        <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-sky-500/20 bg-background/70 text-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.16),0_0_16px_rgba(14,165,233,0.12)]">
            <Flame className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">أفضل يوم مؤخرًا</p>
          <p className="mt-1 text-lg font-black text-foreground">{bestDayLabel}</p>
          <p className="cashflow-number text-sm font-semibold text-primary">{bestDayPercent}%</p>
        </div>
        <div className="surface-shell rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.375rem)] border border-fuchsia-500/20 bg-background/70 text-fuchsia-300 shadow-[0_0_0_1px_rgba(217,70,239,0.16),0_0_16px_rgba(217,70,239,0.12)]">
            <Brain className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">تسجيلات الشهر</p>
          <p className="cashflow-number mt-1 text-3xl font-black text-foreground">{totalCheckIns}</p>
        </div>
      </div>

      {moodBreakdown.length ? (
        <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] p-4 text-right">
          <div className="mb-4">
            <h2 className="text-xl font-black text-foreground">المزاج خلال آخر 14 يومًا</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              تتبع خفيف فقط، ليعطي السياق دون تعقيد.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {moodBreakdown.map((item) => (
              <div
                key={item.value}
                className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/60 p-3 text-right"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                  <span className="text-xl">{item.emoji}</span>
                </div>
                <p className="cashflow-number mt-3 text-2xl font-black text-foreground">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <InsightCharts
        weeklyTrend={weeklyTrend}
        monthlyTrend={monthlyTrend}
        categoryBreakdown={categoryBreakdown}
      />
    </div>
  );
}
