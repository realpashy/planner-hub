import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AICoachBriefCard } from "@/modules/habits/components/AICoachBriefCard";
import { AI_LockedCard } from "@/modules/habits/components/AI_LockedCard";
import type { HabitsCoachResponse } from "@shared/ai/habits-coach";
import type { HabitsState } from "@/modules/habits/types";
import { buildHabitsCoachPayload } from "@/modules/habits/utils/habits";

interface AIScreenProps {
  state: HabitsState;
  onAddHabit: () => void;
}

export function AIScreen({ state, onAddHabit }: AIScreenProps) {
  const [result, setResult] = useState<HabitsCoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => buildHabitsCoachPayload(state), [state]);

  const loadCoach = useCallback(async () => {
    if (!summary.totalHabits) return;
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

      setResult(body.result as HabitsCoachResponse);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "تعذر تحميل قراءة المدرب");
    } finally {
      setLoading(false);
    }
  }, [summary]);

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
          <AICoachBriefCard result={result} loading={loading} onRefresh={() => void loadCoach()} />

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
