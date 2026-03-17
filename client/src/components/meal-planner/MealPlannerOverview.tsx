import { TrendingUp, Heart, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WeekSummary, RecentMeal, MealPlannerSettings } from "@/lib/meal-planner";

interface MealPlannerOverviewProps {
  summary: WeekSummary;
  recentMeals: RecentMeal[];
  favoritesCount: number;
  settings: MealPlannerSettings;
  onStartWeek: () => void;
  onOpenShopping: () => void;
}

export function MealPlannerOverview({
  summary,
  recentMeals,
  favoritesCount,
  settings,
  onStartWeek,
  onOpenShopping,
}: MealPlannerOverviewProps) {
  const shoppingProgress =
    summary.shoppingItemsCount === 0
      ? 0
      : Math.round(
          ((summary.shoppingItemsCount -
            summary.shoppingItemsCount) /
            summary.shoppingItemsCount) *
            100,
        );

  return (
    <section className="space-y-4" dir="rtl">
      <Card className="overflow-hidden border-0 bg-gradient-to-l from-emerald-50 via-sky-50 to-amber-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:p-6">
          <div className="flex-1 text-right space-y-2">
            <p className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:bg-slate-900/60 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>وجبات منظمة تعني أسبوع أهدأ</span>
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              خطّط وجبات أسبوعك براحة ووضوح
            </h1>
            <p className="text-sm text-muted-foreground leading-6">
              اختر وجباتك للأيام القادمة، واجمع قائمة تسوّق ذكية، ثم اربطها لاحقاً
              بالميزانية والمهام اليومية.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 text-xs text-muted-foreground">
              <span>عدد أفراد الأسرة: {settings.householdSize}</span>
              <span className="mx-1">•</span>
              <span>الحصص الافتراضية: {settings.defaultServings}</span>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:w-56">
            <Button className="w-full" onClick={onStartWeek}>
              ابدأ تخطيط هذا الأسبوع
            </Button>
            <Button variant="outline" className="w-full" onClick={onOpenShopping}>
              توليد قائمة التسوّق
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SmallStatCard
          label="الوجبات المخططة"
          value={`${summary.plannedMeals}/${summary.totalSlots}`}
          tone="primary"
        />
        <SmallStatCard
          label="الخانات الفارغة"
          value={summary.emptySlots}
          tone="warn"
        />
        <SmallStatCard
          label="عناصر التسوّق"
          value={summary.shoppingItemsCount}
          tone="soft"
        />
        <SmallStatCard
          label="الوصفات المفضّلة المستخدمة"
          value={summary.favoriteRecipesUsed}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>الوجبات الحديثة</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-right">
                لم تُسجّل أي وجبات بعد. ابدأ بإضافة وجبة من لوحة الأسبوع.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {recentMeals.slice(0, 5).map((meal) => (
                  <li
                    key={meal.id}
                    className="rtl-row items-center rounded-xl bg-muted/40 px-3 py-1.5"
                  >
                    <span className="flex-1 text-right font-medium text-foreground truncate">
                      {meal.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[11px] whitespace-nowrap"
                    >
                      {meal.mealType === "breakfast"
                        ? "فطور"
                        : meal.mealType === "lunch"
                        ? "غداء"
                        : meal.mealType === "dinner"
                        ? "عشاء"
                        : "سناك"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>لمحة عن الأسبوع</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.totalSlots === 0 ? (
              <p className="text-sm text-muted-foreground text-right">
                لم يتم تفعيل أي أنواع وجبات بعد. يمكنك ضبط ذلك من إعدادات الموديول.
              </p>
            ) : (
              <>
                <p className="text-sm text-right text-muted-foreground">
                  املأ أكبر عدد ممكن من الخانات لتقليل قرارات الطعام اليومية
                  وتحسين استهلاك الميزانية.
                </p>
                <div className="rounded-2xl border bg-muted/40 p-3 text-right space-y-2">
                  <div className="rtl-row items-center text-xs text-muted-foreground">
                    <span className="flex-1">نسبة الخانات المخططة</span>
                    <span className="budget-value-left tabular-nums">
                      {summary.totalSlots === 0
                        ? "0%"
                        : `${Math.round(
                            (summary.plannedMeals / summary.totalSlots) * 100,
                          )}%`}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-primary transition-all",
                      )}
                      style={{
                        width:
                          summary.totalSlots === 0
                            ? "0%"
                            : `${Math.round(
                                (summary.plannedMeals / summary.totalSlots) *
                                  100,
                              )}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between border-t pt-2 mt-1 text-xs text-muted-foreground">
              <span>تلميح سريع</span>
              <span>ابدأ بوجبات العشاء ثم أضف الفطور لاحقاً.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SmallStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "primary" | "warn" | "soft" | "accent";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "warn"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "accent"
      ? "text-pink-600 dark:text-pink-300"
      : "text-slate-600 dark:text-slate-300";

  return (
    <Card className="border border-slate-200/80 bg-card/80">
      <CardContent className="p-3 text-right space-y-1.5">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={cn("text-base font-semibold tabular-nums", toneClass)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

