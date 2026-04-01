import { motion } from "framer-motion";
import { BrainCircuit, RefreshCcw, Sparkles, Stars } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { HabitsCoachResponse } from "@shared/ai/habits-coach";

interface AICoachBriefCardProps {
  result: HabitsCoachResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export function AICoachBriefCard({ result, loading, onRefresh }: AICoachBriefCardProps) {
  return (
    <Card className="surface-shell overflow-hidden rounded-[calc(var(--radius)+0.95rem)] border-primary/20">
      <CardHeader className="relative gap-4 text-right">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(149,223,30,0.12),transparent_58%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
              <BrainCircuit className="h-3.5 w-3.5" />
              ملخص ذكي سريع لليوم
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black">المدرب الذكي</CardTitle>
              <CardDescription>
                قراءة قصيرة وعملية مبنية على عاداتك الحالية، بدون تعقيد أو محادثة طويلة.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-[calc(var(--radius)+0.4rem)] border-primary/20 bg-background/60 text-primary hover:bg-primary/[0.08]"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث القراءة
            </Button>
            <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.5rem)] border-primary/25 bg-primary/[0.14] text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && !result ? (
          <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <div className="h-7 w-2/3 animate-pulse rounded-[5px] bg-muted/70" />
              <div className="h-20 animate-pulse rounded-[calc(var(--radius)+0.4rem)] bg-muted/60" />
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="h-16 animate-pulse rounded-[calc(var(--radius)+0.35rem)] bg-muted/55" />
                <div className="h-16 animate-pulse rounded-[calc(var(--radius)+0.35rem)] bg-muted/55" />
                <div className="h-16 animate-pulse rounded-[calc(var(--radius)+0.35rem)] bg-muted/55" />
              </div>
            </div>
            <div className="h-full min-h-[220px] animate-pulse rounded-[calc(var(--radius)+0.55rem)] bg-muted/55" />
          </div>
        ) : result ? (
          <motion.div
            key={result.generatedAt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]"
          >
            <div className="space-y-4 text-right">
              <div className="space-y-2 rounded-[calc(var(--radius)+0.55rem)] border border-primary/20 bg-primary/[0.06] p-4">
                <p className="text-lg font-black text-foreground">{result.headline}</p>
                <p className="text-sm leading-7 text-muted-foreground">{result.overview}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/60 p-3 text-right">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-primary/20 bg-background/70 text-primary shadow-[0_0_0_1px_rgba(149,223,30,0.16),0_0_16px_rgba(149,223,30,0.12)]">
                    <Stars className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">زخم اليوم</p>
                  <p className="mt-1 text-sm font-black text-foreground">{result.momentumLabel}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/60 p-3 text-right">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-sky-500/20 bg-background/70 text-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.16),0_0_16px_rgba(14,165,233,0.12)]">
                    <span className="text-base">🎯</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">تركيزك الآن</p>
                  <p className="mt-1 text-sm font-black text-foreground">{result.focusHabits[0] ?? "ابدأ بعادة واحدة"}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/60 p-3 text-right">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-emerald-500/20 bg-background/70 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.16),0_0_16px_rgba(16,185,129,0.12)]">
                    <span className="text-base">⚡</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">دفعة صغيرة</p>
                  <p className="mt-1 text-sm font-black text-foreground">{result.encouragement}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-primary/20 bg-primary/[0.06] p-3 text-right">
                  <p className="text-xs font-semibold text-muted-foreground">هدف اليوم الواضح</p>
                  <p className="mt-1 text-sm font-black leading-7 text-foreground">{result.winCondition}</p>
                </div>
                <div className="rounded-[calc(var(--radius)+0.45rem)] border border-amber-500/20 bg-amber-500/[0.06] p-3 text-right">
                  <p className="text-xs font-semibold text-muted-foreground">انتبه لهذا اليوم</p>
                  <p className="mt-1 text-sm font-black leading-7 text-foreground">{result.watchOut}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[calc(var(--radius)+0.55rem)] border border-border/70 bg-background/55 p-4 text-right">
                <p className="text-sm font-black text-foreground">اقتراحات اليوم</p>
                <div className="mt-3 space-y-2.5">
                  {result.actions.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-[calc(var(--radius)+0.35rem)] border border-border/60 bg-background/70 px-3.5 py-3 text-sm leading-7 text-muted-foreground"
                    >
                      <span className="font-semibold text-primary">{index + 1}.</span>{" "}
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[calc(var(--radius)+0.55rem)] border border-border/70 bg-background/55 p-4 text-right">
                <p className="text-sm font-black text-foreground">العادات الأهم الآن</p>
                <div className="mt-3 flex flex-wrap justify-start gap-2">
                  {result.focusHabits.map((habit) => (
                    <div
                      key={habit}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[12px] font-semibold text-primary"
                    >
                      <span>{habit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  );
}
