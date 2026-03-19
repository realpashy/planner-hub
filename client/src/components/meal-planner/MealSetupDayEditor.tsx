import { useMemo } from "react";
import { CalendarCheck2, ChevronDown, Droplets, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MEAL_STATUS_LABELS, MEAL_TYPE_LABELS, type MealDayPlan, type MealStatus, type MealType } from "@/lib/meal-planner";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const STATUS_VALUES: MealStatus[] = ["planned", "done", "leftover", "eating_out", "skipped"];

interface MealSetupDayEditorProps {
  day: { dateISO: string; weekdayLabel: string; dayLabel: string; fullLabel: string };
  plan: MealDayPlan;
  waterTargetCups: number;
  waterTargetLiters: number;
  recentMeals: string[];
  onSetMealTitle: (mealType: MealType, title: string) => void;
  onSetMealStatus: (mealType: MealType, status: MealStatus) => void;
  onSetMealNote: (mealType: MealType, note: string) => void;
  onUpdateDayFields: (patch: Partial<MealDayPlan>) => void;
  onFinishDay: () => void;
}

export function MealSetupDayEditor({
  day,
  plan,
  waterTargetCups,
  waterTargetLiters,
  recentMeals,
  onSetMealTitle,
  onSetMealStatus,
  onSetMealNote,
  onUpdateDayFields,
  onFinishDay,
}: MealSetupDayEditorProps) {
  const plannedMealsCount = useMemo(
    () => plan.meals.filter((meal) => meal.title.trim() || meal.status !== "planned" || meal.note.trim()).length,
    [plan.meals],
  );
  const completionPercent = Math.round((plannedMealsCount / 3) * 100);
  const literValue = (plan.waterCups * 0.25).toLocaleString("en-US");

  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-xl">
      <div className="border-b border-border/70 bg-[linear-gradient(135deg,rgba(15,118,110,0.96),rgba(5,150,105,0.92))] px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white/80">{day.weekdayLabel}</p>
            <h2 className="mt-1 text-2xl font-extrabold">{day.fullLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              عبّئ اليوم خطوة بخطوة ثم قرر كيف تنتقل لليوم التالي بدون فوضى أو تمرير طويل.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-end backdrop-blur">
            <p className="text-xs text-white/75">التقدم</p>
            <p className="text-lg font-extrabold">{plannedMealsCount}/3</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={completionPercent} className="h-2.5 bg-white/15 [&>div]:bg-white" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex flex-wrap justify-start gap-2">
          <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1 text-primary">
            يوم {day.dayLabel}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {plan.isComplete ? "اليوم مكتمل" : "اليوم قيد الإعداد"}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {plan.waterCups} أكواب / {literValue} لتر
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-0">
        {MEAL_TYPES.map((mealType) => {
          const meal = plan.meals.find((item) => item.mealType === mealType)!;
          const suggestions = recentMeals.filter((title) => title !== meal.title).slice(0, 3);

          return (
            <div key={mealType} className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{MEAL_TYPE_LABELS[mealType]}</p>
                  <p className="text-xs text-muted-foreground">عنوان واضح، حالة، وملاحظة صغيرة إذا لزم.</p>
                </div>
                <Select dir="rtl" value={meal.status} onValueChange={(value) => onSetMealStatus(mealType, value as MealStatus)}>
                  <SelectTrigger className="meal-select-trigger h-11 w-[9.25rem]" data-testid={`setup-status-${day.dateISO}-${mealType}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="meal-select-content">
                    {STATUS_VALUES.map((status) => (
                      <SelectItem key={status} value={status} className="meal-select-item">
                        {MEAL_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={meal.title}
                onChange={(event) => onSetMealTitle(mealType, event.target.value)}
                placeholder={`اكتب ${MEAL_TYPE_LABELS[mealType]} اليوم`}
                className="meal-input"
                data-testid={`setup-input-${day.dateISO}-${mealType}`}
              />

              {suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-start gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={`${day.dateISO}-${mealType}-${suggestion}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-border/80 bg-card/85 px-3 text-xs font-medium"
                      onClick={() => onSetMealTitle(mealType, suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              <Textarea
                value={meal.note}
                onChange={(event) => onSetMealNote(mealType, event.target.value)}
                placeholder="ملاحظة قصيرة مرتبطة بهذه الوجبة"
                className="meal-textarea mt-3 min-h-[78px]"
              />
            </div>
          );
        })}

        <div className="grid gap-3">
          <Collapsible className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-right">
              <div>
                <p className="text-sm font-bold text-foreground">السناك والملاحظات الخفيفة</p>
                <p className="text-xs text-muted-foreground">افتحها فقط إذا كنت تحتاجها لهذا اليوم.</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              <Input
                value={plan.snackNote}
                onChange={(event) => onUpdateDayFields({ snackNote: event.target.value })}
                placeholder="مثال: فاكهة، زبادي، حفنة مكسرات"
                className="meal-input"
              />
              <Textarea
                value={plan.prepNote}
                onChange={(event) => onUpdateDayFields({ prepNote: event.target.value })}
                placeholder="ماذا تريد أن تجهز أو تتذكر لهذا اليوم؟"
                className="meal-textarea min-h-[88px]"
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">الماء اليومي</p>
                <p className="text-xs text-muted-foreground">
                  الهدف {waterTargetCups} أكواب / {waterTargetLiters.toLocaleString("en-US")} لتر
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                <Droplets className="h-4 w-4" />
                {plan.waterCups} كوب
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/85 p-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl px-4" onClick={() => onUpdateDayFields({ waterCups: Math.max(0, plan.waterCups - 1) })}>
                -1
              </Button>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{plan.waterCups} أكواب</p>
                <p className="text-xs text-muted-foreground">{literValue} لتر</p>
              </div>
              <Button type="button" size="sm" className="rounded-xl px-4" onClick={() => onUpdateDayFields({ waterCups: Math.min(20, plan.waterCups + 1) })}>
                +1
              </Button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-5 border-t border-border/70 bg-card/95 px-5 pb-5 pt-4 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-[1fr,13rem]">
            <Button type="button" className="h-12 rounded-2xl text-sm font-bold" onClick={onFinishDay}>
              <Wand2 className="h-4 w-4" />
              حفظ اليوم والمتابعة
            </Button>
            <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => onUpdateDayFields({ isComplete: !plan.isComplete })}>
              <CalendarCheck2 className="h-4 w-4" />
              {plan.isComplete ? "إلغاء الإكمال" : "تمييز كمكتمل"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
