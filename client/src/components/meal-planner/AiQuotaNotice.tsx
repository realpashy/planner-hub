import { AlertTriangle, Bot, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MealPlannerQuotaResponse } from "@/lib/ai/meal-planner-ai";
import { TierBadge } from "./TierBadge";
import { UpgradeCta } from "./UpgradeCta";

function quotaPercent(remaining: number | null, fallback = 100) {
  if (remaining === null) return 100;
  return Math.max(0, Math.min(100, fallback));
}

export function AiQuotaNotice({
  quota,
  usesAi,
}: {
  quota: MealPlannerQuotaResponse | null;
  usesAi: boolean;
}) {
  if (!quota) return null;

  const hasLimitedQuota =
    quota.remainingFullGenerationsToday !== null || quota.remainingLightEditsToday !== null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[1.7rem] border-border/70 bg-card/95 shadow-sm">
        <CardContent className="space-y-4 p-4 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-start gap-2">
                <TierBadge tier={quota.tier} />
                {usesAi ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Bot className="h-3.5 w-3.5" />
                    هذا الإجراء يستخدم الذكاء الاصطناعي
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    الوضع المحلي ما يزال متاحًا دائمًا
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-foreground">حصص الذكاء الاصطناعي في مخطط الوجبات</p>
              <p className="text-xs leading-6 text-muted-foreground">
                حتى لو انتهت الحصة، يبقى التخطيط المحلي والنسخ والتعديل اليدوي متاحًا.
              </p>
            </div>
            {!quota.entitlements.mealPlanner.smartOptimization ? <UpgradeCta compact /> : null}
          </div>

          {hasLimitedQuota ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">التوليد الكامل اليوم</span>
                  <span className="text-muted-foreground">{quota.remainingFullGenerationsToday ?? "غير محدود"}</span>
                </div>
                <Progress value={quotaPercent(quota.remainingFullGenerationsToday, quota.remainingFullGenerationsToday === 0 ? 0 : 100)} className="mt-2 h-2" />
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">التعديلات السريعة اليوم</span>
                  <span className="text-muted-foreground">{quota.remainingLightEditsToday ?? "غير محدود"}</span>
                </div>
                <Progress value={quotaPercent(quota.remainingLightEditsToday, quota.remainingLightEditsToday === 0 ? 0 : 100)} className="mt-2 h-2" />
              </div>
            </div>
          ) : null}

          {!quota.aiEnabled ? (
            <div className="flex items-center justify-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              الذكاء الاصطناعي متوقف الآن، لذلك سيعمل المولد المحلي فقط.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
