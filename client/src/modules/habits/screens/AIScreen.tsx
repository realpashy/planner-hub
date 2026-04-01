import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AICoachBriefCard } from "@/modules/habits/components/AICoachBriefCard";
import { AICoachSignals } from "@/modules/habits/components/AICoachSignals";
import { AI_LockedCard } from "@/modules/habits/components/AI_LockedCard";
import type { HabitsCoachResponse } from "@shared/ai/habits-coach";
import type { HabitsState } from "@/modules/habits/types";
import { buildHabitsCoachPayload } from "@/modules/habits/utils/habits";

interface AIScreenProps {
  state: HabitsState;
  onAddHabit: () => void;
  onOpenHabit: (habitName: string) => void;
}

const HABITS_AI_CACHE_KEY = "planner-hub-habits-ai-brief-v1";

export function AIScreen({ state, onAddHabit, onOpenHabit }: AIScreenProps) {
  const [result, setResult] = useState<HabitsCoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => buildHabitsCoachPayload(state), [state]);
  const todayCacheKey = summary.generatedAt.slice(0, 10);

  const readCachedBrief = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(HABITS_AI_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        date?: string;
        manualRefreshCount?: number;
        result?: HabitsCoachResponse;
      };
      if (parsed.date !== todayCacheKey || !parsed.result) {
        return null;
      }
      return {
        result: parsed.result,
        manualRefreshCount: parsed.manualRefreshCount ?? 0,
      };
    } catch {
      return null;
    }
  }, [todayCacheKey]);

  const storeCachedBrief = useCallback(
    (nextResult: HabitsCoachResponse, manualRefreshCount: number) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        HABITS_AI_CACHE_KEY,
        JSON.stringify({
          date: todayCacheKey,
          manualRefreshCount,
          result: nextResult,
        }),
      );
    },
    [todayCacheKey],
  );

  const cachedBrief = useMemo(() => readCachedBrief(), [readCachedBrief]);
  const remainingManualRefreshes = Math.max(0, 2 - (cachedBrief?.manualRefreshCount ?? 0));

  const loadCoach = useCallback(async (forceRefresh = false) => {
    if (!summary.totalHabits) return;

    const cached = readCachedBrief();

    if (!forceRefresh && cached) {
      setResult(cached.result);
      setError(null);
      return;
    }

    if (forceRefresh && (cached?.manualRefreshCount ?? 0) >= 2) {
      setError("يمكن تحديث القراءة مرتين يدويًا فقط في اليوم.");
      if (cached?.result) {
        setResult(cached.result);
      }
      return;
    }

    if (!forceRefresh && cached?.result) {
      setResult(cached.result);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/habits/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ summary }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body?.message === "string" ? body.message : "تعذر تحميل قراءة المدرب");
      }

      const nextResult = body.result as HabitsCoachResponse;
      const nextManualCount = forceRefresh ? (cached?.manualRefreshCount ?? 0) + 1 : (cached?.manualRefreshCount ?? 0);
      setResult(nextResult);
      storeCachedBrief(nextResult, nextManualCount);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "تعذر تحميل قراءة المدرب");
    } finally {
      setLoading(false);
    }
  }, [readCachedBrief, storeCachedBrief, summary]);

  useEffect(() => {
    void loadCoach();
  }, [loadCoach]);

  return (
    <div className="space-y-5">
      <div className="surface-shell rounded-[calc(var(--radius)+0.9rem)] p-5 text-right">
        <h2 className="text-2xl font-black text-foreground">المدرب الذكي</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          قراءة ذكية قصيرة تساعدك على معرفة أين تبدأ اليوم، وما هي الخطوة التالية الأكثر فائدة،
          مع بقاء الميزات الأعمق محجوبة حتى تنضج بشكل يليق بالمنتج.
        </p>
      </div>

      {summary.totalHabits ? (
        <>
          <AICoachSignals
            moodLabel={summary.todayMoodLabel}
            moodHint={summary.todayMoodHint}
            pendingToday={summary.pendingToday}
            averagePercent={summary.averagePercent}
            reminderCount={summary.reminders.length}
            bestStreak={summary.bestStreak}
          />

          <AICoachBriefCard
            result={result}
            loading={loading}
            onRefresh={() => void loadCoach(true)}
            remainingManualRefreshes={remainingManualRefreshes}
            onOpenHabit={onOpenHabit}
          />

          {error ? (
            <div className="surface-subtle rounded-[calc(var(--radius)+0.75rem)] border border-destructive/20 bg-destructive/[0.06] p-4 text-right">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground">تعذر تحميل قراءة المدرب</p>
                  <p className="text-xs leading-6 text-muted-foreground">{error}</p>
                </div>
                <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-destructive/20 bg-background/70 text-destructive">
                  <BrainCircuit className="h-5 w-5" />
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="surface-subtle rounded-[calc(var(--radius)+0.85rem)] border-dashed border-border/60 p-6 text-right">
          <p className="text-lg font-black text-foreground">أضف عادة أولًا ليعمل المدرب الذكي</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            يحتاج المدرب إلى بعض الإشارات من يومك الحالي: عادة واحدة على الأقل، وتقدم بسيط يمكن قراءته.
          </p>
          <Button className="mt-4" onClick={onAddHabit}>
            <Plus className="h-4 w-4" />
            إضافة أول عادة
          </Button>
        </div>
      )}

      <AI_LockedCard />
    </div>
  );
}
