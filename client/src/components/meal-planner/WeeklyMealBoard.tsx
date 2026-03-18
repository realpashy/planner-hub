import { Copy, CopyPlus, Droplets, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getWeekdayLabels,
  MEAL_STATUS_LABELS,
  MEAL_TYPE_LABELS,
  type MealDayMeta,
  type MealPlannerSettings,
  type MealStatus,
  type MealType,
  type PlannedMeal,
} from "@/lib/meal-planner";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_STATUS_VALUES: MealStatus[] = ["planned", "done", "leftover", "eating_out", "skipped"];

interface WeeklyMealBoardProps {
  settings: MealPlannerSettings;
  weekDates: Array<{ dateISO: string; dateLabel: string }>;
  meals: PlannedMeal[];
  dayMeta: MealDayMeta[];
  recentMealTitles: string[];
  waterTargetCups: number;
  onSetMealTitle: (dateISO: string, mealType: MealType, title: string) => void;
  onSetMealStatus: (dateISO: string, mealType: MealType, status: MealStatus) => void;
  onSetMealNote: (dateISO: string, mealType: MealType, note: string) => void;
  onToggleMealDone: (dateISO: string, mealType: MealType) => void;
  onUpdateDayMeta: (dateISO: string, partial: Partial<MealDayMeta>) => void;
  onCopyDay: (fromDateISO: string, toDateISO: string) => void;
  onOpenCopyDay: (fromDateISO: string) => void;
  onOpenCopyMeal: (fromDateISO: string, mealType: MealType) => void;
  onCopyMealToNextDay: (fromDateISO: string, mealType: MealType) => void;
  onClearMeal: (dateISO: string, mealType: MealType) => void;
  onClearDay: (dateISO: string) => void;
}

export function WeeklyMealBoard({
  settings,
  weekDates,
  meals,
  dayMeta,
  recentMealTitles,
  waterTargetCups,
  onSetMealTitle,
  onSetMealStatus,
  onSetMealNote,
  onToggleMealDone,
  onUpdateDayMeta,
  onCopyDay,
  onOpenCopyDay,
  onOpenCopyMeal,
  onCopyMealToNextDay,
  onClearMeal,
  onClearDay,
}: WeeklyMealBoardProps) {
  const weekdayLabels = getWeekdayLabels(settings.preferredWeekStart);

  return (
    <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3" dir="rtl">
      {weekDates.map((day, index) => {
        const dayMeals = meals.filter((meal) => meal.dateISO === day.dateISO);
        const dayMetaEntry = dayMeta.find((item) => item.dateISO === day.dateISO) ?? {
          dateISO: day.dateISO,
          snackNote: "",
          prepNote: "",
          waterCups: 0,
        };
        const dayIsEmpty = dayMeals.length === 0 && !dayMetaEntry.snackNote && !dayMetaEntry.prepNote && dayMetaEntry.waterCups === 0;
        const previousDateISO = index > 0 ? weekDates[index - 1].dateISO : null;

        return (
          <Card
            key={day.dateISO}
            className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/95 shadow-sm"
          >
            <CardHeader className="space-y-4 border-b border-border/70 bg-background/55 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <CardTitle className="text-lg font-extrabold text-foreground">
                    {weekdayLabels[index]?.label ?? day.dateLabel}
                  </CardTitle>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{day.dateLabel}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/80 bg-background/80 px-3"
                    onClick={() => previousDateISO && dayIsEmpty && onCopyDay(previousDateISO, day.dateISO)}
                    disabled={!previousDateISO || !dayIsEmpty}
                  >
                    <Copy className="h-4 w-4" />
                    نسخ السابق
                  </Button>

                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-2xl">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="meal-dropdown-content">
                      <DropdownMenuItem className="meal-dropdown-item" onSelect={() => onOpenCopyDay(day.dateISO)}>
                        <CopyPlus className="h-4 w-4" />
                        نسخ هذا اليوم إلى يوم آخر
                      </DropdownMenuItem>
                      <DropdownMenuItem className="meal-dropdown-item text-destructive focus:text-destructive" onSelect={() => onClearDay(day.dateISO)}>
                        <Trash2 className="h-4 w-4" />
                        مسح اليوم بالكامل
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-3 text-right">
                  <p className="text-[11px] font-semibold text-muted-foreground">تغطية اليوم</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {dayMeals.length}/3 وجبات مخططة
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-3 text-right">
                  <p className="text-[11px] font-semibold text-muted-foreground">الماء</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {dayMetaEntry.waterCups}/{waterTargetCups} أكواب
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {MEAL_ORDER.map((mealType) => {
                const meal = dayMeals.find((item) => item.mealType === mealType) ?? null;
                return (
                  <MealRow
                    key={`${day.dateISO}-${mealType}`}
                    dateISO={day.dateISO}
                    mealType={mealType}
                    meal={meal}
                    recentMealTitles={recentMealTitles}
                    onSetTitle={onSetMealTitle}
                    onSetStatus={onSetMealStatus}
                    onSetNote={onSetMealNote}
                    onToggleDone={onToggleMealDone}
                    onOpenCopyMeal={onOpenCopyMeal}
                    onCopyMealToNextDay={onCopyMealToNextDay}
                    onClearMeal={onClearMeal}
                  />
                );
              })}

              <div className="grid gap-3 border-t border-border/70 pt-4">
                <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">ملاحظات السناك</p>
                      <p className="text-xs text-muted-foreground">حقل خفيف لتذكير سريع عند الحاجة.</p>
                    </div>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <Input
                    value={dayMetaEntry.snackNote}
                    onChange={(event) => onUpdateDayMeta(day.dateISO, { snackNote: event.target.value })}
                    placeholder="مثال: فاكهة، زبادي، حفنة مكسرات"
                    className="meal-input"
                    data-testid={`input-snack-note-${day.dateISO}`}
                  />
                </div>

                <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">تحضير أو تذكير</p>
                      <p className="text-xs text-muted-foreground">مكان لأي ملاحظة قصيرة مرتبطة باليوم.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-border/80 bg-background/80 px-3"
                      onClick={() => onUpdateDayMeta(day.dateISO, { prepNote: "" })}
                    >
                      مسح
                    </Button>
                  </div>
                  <Textarea
                    value={dayMetaEntry.prepNote}
                    onChange={(event) => onUpdateDayMeta(day.dateISO, { prepNote: event.target.value })}
                    placeholder="مثال: إخراج الدجاج من الفريزر أو تجهيز السلطة مساءً"
                    className="meal-textarea min-h-[90px]"
                    data-testid={`textarea-prep-note-${day.dateISO}`}
                  />
                </div>

                <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">الماء</p>
                      <p className="text-xs text-muted-foreground">هدف اليوم {waterTargetCups} أكواب.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-sm font-semibold text-primary">
                      <Droplets className="h-4 w-4" />
                      {dayMetaEntry.waterCups}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/85 p-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-4"
                      onClick={() => onUpdateDayMeta(day.dateISO, { waterCups: Math.max(0, dayMetaEntry.waterCups - 1) })}
                    >
                      -1
                    </Button>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">{dayMetaEntry.waterCups}/{waterTargetCups}</p>
                      <p className="text-xs text-muted-foreground">
                        {dayMetaEntry.waterCups >= waterTargetCups ? "ممتاز، تم تحقيق الهدف" : "زيدي كوبًا أو كوبين خلال اليوم"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl px-4"
                      onClick={() => onUpdateDayMeta(day.dateISO, { waterCups: Math.min(20, dayMetaEntry.waterCups + 1) })}
                    >
                      +1
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

interface MealRowProps {
  dateISO: string;
  mealType: MealType;
  meal: PlannedMeal | null;
  recentMealTitles: string[];
  onSetTitle: (dateISO: string, mealType: MealType, title: string) => void;
  onSetStatus: (dateISO: string, mealType: MealType, status: MealStatus) => void;
  onSetNote: (dateISO: string, mealType: MealType, note: string) => void;
  onToggleDone: (dateISO: string, mealType: MealType) => void;
  onOpenCopyMeal: (fromDateISO: string, mealType: MealType) => void;
  onCopyMealToNextDay: (fromDateISO: string, mealType: MealType) => void;
  onClearMeal: (dateISO: string, mealType: MealType) => void;
}

function MealRow({
  dateISO,
  mealType,
  meal,
  recentMealTitles,
  onSetTitle,
  onSetStatus,
  onSetNote,
  onToggleDone,
  onOpenCopyMeal,
  onCopyMealToNextDay,
  onClearMeal,
}: MealRowProps) {
  const filteredSuggestions = recentMealTitles.filter((title) => title !== meal?.title).slice(0, 3);
  const isDone = meal?.status === "done";

  return (
    <div className={cn(
      "rounded-[1.35rem] border p-4 transition-colors",
      isDone
        ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10"
        : "border-border/70 bg-background/70"
    )}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">{MEAL_TYPE_LABELS[mealType]}</p>
          <p className="text-xs text-muted-foreground">إدخال سريع مع حالة واضحة ونسخ ذكي.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/85 px-3 py-2">
            <Checkbox
              checked={isDone}
              onCheckedChange={() => onToggleDone(dateISO, mealType)}
              data-testid={`checkbox-meal-done-${dateISO}-${mealType}`}
            />
            <span className="text-xs font-semibold text-foreground">تمت</span>
          </div>

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-2xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="meal-dropdown-content">
              <DropdownMenuItem className="meal-dropdown-item" onSelect={() => onOpenCopyMeal(dateISO, mealType)}>
                <CopyPlus className="h-4 w-4" />
                نسخ هذه الوجبة إلى يوم آخر
              </DropdownMenuItem>
              <DropdownMenuItem className="meal-dropdown-item" onSelect={() => onCopyMealToNextDay(dateISO, mealType)}>
                <Sparkles className="h-4 w-4" />
                نسخ سريع إلى يوم لاحق
              </DropdownMenuItem>
              <DropdownMenuItem className="meal-dropdown-item text-destructive focus:text-destructive" onSelect={() => onClearMeal(dateISO, mealType)}>
                <Trash2 className="h-4 w-4" />
                مسح الوجبة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr,12rem]">
        <Input
          value={meal?.title ?? ""}
          onChange={(event) => onSetTitle(dateISO, mealType, event.target.value)}
          placeholder={`اكتب ${MEAL_TYPE_LABELS[mealType]} اليوم`}
          className="meal-input"
          data-testid={`input-meal-title-${dateISO}-${mealType}`}
        />

        <Select
          dir="rtl"
          value={meal?.status ?? "planned"}
          onValueChange={(value) => onSetStatus(dateISO, mealType, value as MealStatus)}
        >
          <SelectTrigger className="meal-select-trigger" data-testid={`select-meal-status-${dateISO}-${mealType}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl" className="meal-select-content">
            {MEAL_STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status} className="meal-select-item">
                {MEAL_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3">
        <Textarea
          value={meal?.note ?? ""}
          onChange={(event) => onSetNote(dateISO, mealType, event.target.value)}
          placeholder="ملاحظة صغيرة: كميات، وقت مناسب، أو تذكير مرتبط بهذه الوجبة"
          className="meal-textarea min-h-[78px]"
          data-testid={`textarea-meal-note-${dateISO}-${mealType}`}
        />
      </div>

      {filteredSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-start gap-2">
          {filteredSuggestions.map((suggestion) => (
            <Button
              key={`${dateISO}-${mealType}-${suggestion}`}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border/80 bg-card/85 px-3 text-xs font-medium"
              onClick={() => onSetTitle(dateISO, mealType, suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
