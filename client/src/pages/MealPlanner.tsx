import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";
import { MealPlannerHeader } from "@/components/meal-planner/MealPlannerHeader";
import { MealPlannerProfileSheet } from "@/components/meal-planner/MealPlannerProfileSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import {
  MEAL_SOURCE_LABELS,
  MEAL_STATUS_LABELS,
  MEAL_TYPE_LABELS,
  PREP_EFFORT_LABELS,
  WEEKLY_MODE_OPTIONS,
  WEEKLY_STYLE_OPTIONS,
  cupsToLiters,
  formatLiters,
  getMealCompletionPercent,
  type MealDayPlan,
  type MealFavorite,
  type MealPlannerDayInfo,
  type MealSource,
  type MealStatus,
  type MealType,
  type PrepEffort,
  type WeeklyPreferenceMode,
  type WeeklyPlanningStyle,
} from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const STATUS_VALUES: MealStatus[] = ["planned", "done", "leftover", "eating_out", "skipped"];
const SOURCE_VALUES: MealSource[] = ["custom", "favorite", "template", "leftover", "eating_out", "copied", "autofill"];
const PREP_VALUES: PrepEffort[] = ["low", "medium", "high"];

function getToneClasses(tone: "info" | "success" | "warning") {
  if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (tone === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function getDayState(plan: MealDayPlan, repeated: boolean) {
  const completion = getMealCompletionPercent(plan);
  if (completion === 100) return "مخطط بالكامل";
  if (completion === 0) return "فارغ";
  if (repeated) return "مكرر";
  return "جزئي";
}

function SplitTags({ value, onChange, placeholder }: { value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  return (
    <Input
      value={value.join("، ")}
      onChange={(event) =>
        onChange(
          event.target.value
            .split(/[،,]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 5),
        )
      }
      placeholder={placeholder}
      className="meal-input h-11"
    />
  );
}

function StatTile({
  title,
  value,
  note,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof Sparkles;
  accent: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/60 bg-card/90 p-4 shadow-lg dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 text-right">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="text-2xl font-extrabold text-foreground">{value}</p>
          <p className="text-xs leading-5 text-muted-foreground">{note}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function CopyTargetsPopover({
  trigger,
  title,
  days,
  excludeDateISO,
  onApply,
}: {
  trigger: React.ReactNode;
  title: string;
  days: MealPlannerDayInfo[];
  excludeDateISO?: string;
  onApply: (targets: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const availableDays = days.filter((day) => day.dateISO !== excludeDateISO);

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent dir="rtl" className="w-72 rounded-[1.4rem] border-border/80 p-4">
        <div className="space-y-3 text-right">
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">اختيار أكثر من يوم لتنفيذ النسخ بسرعة.</p>
          </div>
          <div className="grid gap-2">
            {availableDays.map((day) => (
              <label key={day.dateISO} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-2">
                <span className="text-sm text-foreground">{day.weekdayLong}</span>
                <Checkbox
                  checked={selected.includes(day.dateISO)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) => (checked ? [...prev, day.dateISO] : prev.filter((item) => item !== day.dateISO)))
                  }
                />
              </label>
            ))}
          </div>
          <Button className="h-10 w-full rounded-2xl" disabled={selected.length === 0} onClick={() => onApply(selected)}>
            تطبيق على {selected.length} أيام
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function MealPlanner() {
  const {
    state,
    weekDays,
    weekSummary,
    shoppingItems,
    recommendations,
    waterTargetCups,
    waterTargetLiters,
    getPlan,
    getSuggestions,
    setMealFields,
    setMealStatus,
    updateDayFields,
    copyDayToDays,
    copyMealToDays,
    autofillEmptySlots,
    generateWeek,
    copyFromPreviousWeek,
    clearDay,
    clearMeal,
    markDayEatingOut,
    saveMealAsFavorite,
    applyFavoriteToMeal,
    saveDayAsTemplate,
    applyTemplateToDays,
    updateProfile,
  } = useMealPlanner();

  const [profileOpen, setProfileOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);
  const [setupStyle, setSetupStyle] = useState<WeeklyPlanningStyle>("low_effort_week");
  const [setupMode, setSetupMode] = useState<WeeklyPreferenceMode>("balanced");

  const selectedDay = selectedDayISO ? weekDays.find((day) => day.dateISO === selectedDayISO) ?? null : null;
  const selectedPlan = selectedDay ? getPlan(selectedDay.dateISO) : null;

  const repeatedTitles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const day of weekDays) {
      for (const meal of getPlan(day.dateISO).meals) {
        if (!meal.title.trim()) continue;
        counts.set(meal.title.trim(), (counts.get(meal.title.trim()) ?? 0) + 1);
      }
    }
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([title]) => title));
  }, [getPlan, weekDays]);

  const mealTypeCompletion = useMemo(() => {
    return Object.fromEntries(
      MEAL_TYPES.map((mealType) => {
        const planned = weekDays.filter((day) => getPlan(day.dateISO).meals.find((meal) => meal.mealType === mealType)?.title.trim()).length;
        return [mealType, planned];
      }),
    ) as Record<MealType, number>;
  }, [getPlan, weekDays]);

  const summarySentence = useMemo(() => {
    if (weekSummary.daysFullyPlanned === 7) return "الأسبوع مضبوط بالكامل مع صورة أوضح للتسوق والتحضير.";
    if (weekSummary.emptyMeals === weekSummary.totalMeals) return "الأسبوع ما زال فارغًا. يمكنك توليد هيكل أسبوع كامل خلال أقل من دقيقة.";
    return `تم تخطيط ${weekSummary.plannedMeals} من ${weekSummary.totalMeals} خانات هذا الأسبوع، وما زالت ${weekSummary.emptyMeals} خانات تحتاج قرارًا سريعًا.`;
  }, [weekSummary]);

  const quickInsights = [
    `الماء هذا الأسبوع: ${weekSummary.weeklyWaterTotal}/${weekSummary.weeklyWaterTarget} كوب`,
    `أيام جاهزة للتسوق: ${weekSummary.shoppingReadyDays}/7`,
    weekSummary.busiestPrepDay ? `أعلى ضغط تحضير: ${weekSummary.busiestPrepDay}` : "لا يوجد يوم مزدحم جدًا بعد",
  ];

  return (
    <div className="min-h-screen bg-background pb-10" dir="rtl">
      <MealPlannerHeader
        title="مخطط الوجبات الأسبوعي"
        subtitle="مركز تخطيط أسبوعي أسرع وأغنى بالمعلومة"
        onOpenSettings={() => setProfileOpen(true)}
      />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.22),transparent_50%),radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_40%)]" />
        <div className="relative mx-auto max-w-[92rem] px-4 pb-8 pt-5 md:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <div className="rounded-[2rem] border border-white/60 bg-card/90 p-3 shadow-xl dark:border-white/10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2 text-right">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/15 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    أسبوع واضح، تعديل أسرع، إعادة استخدام أذكى
                  </div>
                  <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">لوحة قيادة الوجبات لهذا الأسبوع</h1>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{summarySentence}</p>
                </div>
                <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-[1.5rem] bg-background/80 p-2">
                  <TabsTrigger value="overview" className="rounded-2xl px-4 py-2.5">نظرة أسبوعية</TabsTrigger>
                  <TabsTrigger value="calendar" className="rounded-2xl px-4 py-2.5">التقويم</TabsTrigger>
                  <TabsTrigger value="plan" className="rounded-2xl px-4 py-2.5">خطة الأسبوع</TabsTrigger>
                  <TabsTrigger value="shopping" className="rounded-2xl px-4 py-2.5">التسوق</TabsTrigger>
                  <TabsTrigger value="favorites" className="rounded-2xl px-4 py-2.5">المفضلة / القوالب</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="mt-5 space-y-5">
              <section className="grid gap-5 xl:grid-cols-[1.35fr,0.9fr]">
                <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-card/95 shadow-2xl dark:border-white/10">
                  <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr,0.85fr] lg:p-6">
                    <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,118,110,0.98),rgba(6,95,70,0.95))] p-5 text-white shadow-xl">
                      <div className="space-y-5 text-right">
                        <div className="flex flex-wrap justify-start gap-2">
                          <Badge className="rounded-full border-0 bg-white/15 px-3 py-1 text-white">الأسبوع الحالي</Badge>
                          <Badge className="rounded-full border-0 bg-white/10 px-3 py-1 text-white/85">{weekSummary.completionPercent}% مكتمل</Badge>
                        </div>
                        <div>
                          <h2 className="text-3xl font-extrabold md:text-4xl">نظرة كاملة على الأسبوع بدل متابعة يومية متقطعة</h2>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/85 md:text-base">راجع الأسبوع كله، افتح أي يوم من التقويم، وكرّر الهياكل الجاهزة بدل ملء نفس البيانات مرارًا.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-white/70">الأسبوع مكتمل</p>
                            <p className="mt-1 text-2xl font-extrabold">{weekSummary.daysFullyPlanned}/7</p>
                            <p className="text-xs text-white/80">{weekSummary.daysPartiallyPlanned} أيام جزئية</p>
                          </div>
                          <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-white/70">الخانات غير المخططة</p>
                            <p className="mt-1 text-2xl font-extrabold">{weekSummary.emptyMeals}</p>
                            <p className="text-xs text-white/80">{weekSummary.emptyDinners} منها عشاءات</p>
                          </div>
                          <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs text-white/70">الماء هذا الأسبوع</p>
                            <p className="mt-1 text-2xl font-extrabold">{weekSummary.weeklyWaterTotal} كوب</p>
                            <p className="text-xs text-white/80">{formatLiters(weekSummary.weeklyWaterTotal)} من {formatLiters(weekSummary.weeklyWaterTarget)}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {recommendations.slice(0, 2).map((item) => (
                            <div key={item.id} className={cn("rounded-[1.3rem] border px-4 py-3 text-sm leading-6", getToneClasses(item.tone), "bg-white/10 text-white")}>
                              <p className="font-bold">{item.title}</p>
                              <p className="text-white/85">{item.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <StatTile title="الوجبات المخططة" value={`${weekSummary.plannedMeals}/${weekSummary.totalMeals}`} note={`بقي ${weekSummary.emptyMeals} خانة هذا الأسبوع`} icon={UtensilsCrossed} accent="border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300" />
                      <StatTile title="نسبة الالتزام" value={`${weekSummary.completionPercent}%`} note={`${weekSummary.completedMeals} وجبات منجزة و${weekSummary.repeatedMealsCount} تكرارات`} icon={CheckCircle2} accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" />
                      <StatTile title="جاهزية التسوق" value={`${weekSummary.shoppingReadyDays}/7`} note={`${shoppingItems.length} عناصر مشتريات مستخلصة تلقائيًا`} icon={ShoppingBasket} accent="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                  <CardHeader className="pb-3 text-right">
                    <CardTitle className="text-xl">إجراءات سريعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <QuickAction label="توليد أسبوع سريع" icon={Wand2} onClick={() => setSetupOpen(true)} />
                      <QuickAction label="نسخ من الأسبوع الماضي" icon={Copy} onClick={copyFromPreviousWeek} />
                      <QuickAction label="ملء الأيام الفارغة" icon={Sparkles} onClick={() => autofillEmptySlots()} />
                      <QuickAction label="فتح التقويم" icon={CalendarDays} onClick={() => setActiveTab("calendar")} />
                      <QuickAction label="إضافة قالب أسبوعي" icon={Plus} onClick={() => setActiveTab("favorites")} />
                    </div>
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4 text-right">
                      <p className="text-sm font-bold text-foreground">نبضات ذكية لهذا الأسبوع</p>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {quickInsights.map((item) => (
                          <div key={item} className="rounded-2xl bg-card px-3 py-2">{item}</div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.45fr,0.85fr]">
                <WeeklyCalendarBoard
                  weekDays={weekDays}
                  getPlan={getPlan}
                  repeatedTitles={repeatedTitles}
                  onOpenDay={setSelectedDayISO}
                  onCopyDay={copyDayToDays}
                  onAutofillDay={(dateISO) => copyDayToDays(dateISO, weekDays.filter((day) => day.dateISO !== dateISO && getMealCompletionPercent(getPlan(day.dateISO)) === 0).map((day) => day.dateISO))}
                  onMarkEatingOut={markDayEatingOut}
                  onClearDay={clearDay}
                  onSaveTemplate={saveDayAsTemplate}
                  onToggleShoppingReady={(dateISO) => updateDayFields(dateISO, { shoppingReady: !getPlan(dateISO).shoppingReady })}
                />

                <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                  <CardHeader className="pb-3 text-right">
                    <CardTitle className="text-xl">إضاءات وإحصاءات أسبوعية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <InsightStrip label="اكتمال الأيام" value={weekSummary.daysFullyPlanned} total={7} colorClass="[&>div]:bg-emerald-500" />
                    <InsightStrip label="التسوق والاستعداد" value={weekSummary.shoppingReadyDays} total={7} colorClass="[&>div]:bg-amber-500" />
                    <InsightStrip label="الترطيب" value={weekSummary.daysWithWaterTarget} total={7} colorClass="[&>div]:bg-sky-500" />
                    <InsightStrip label="التحضير العالي" value={weekSummary.prepHeavyDays} total={7} colorClass="[&>div]:bg-violet-500" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniMetric label="تكرار الوجبات" value={`${weekSummary.repeatedMealsCount}`} note="مرات فوق الطبيعي" />
                      <MiniMetric label="فرص البقايا" value={`${weekSummary.leftoverOpportunities}`} note="أيام يمكن إعادة استخدامها" />
                      <MiniMetric label="أيام منسوخة" value={`${weekSummary.copiedDays}`} note="إعادة استخدام هيكل يومي" />
                      <MiniMetric label="وجبات من القوالب" value={`${weekSummary.templateMeals}`} note="اعتماد على القوالب" />
                    </div>

                    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4 text-right">
                      <p className="text-sm font-bold text-foreground">اكتمال حسب نوع الوجبة</p>
                      <div className="mt-3 grid gap-2">
                        {MEAL_TYPES.map((mealType) => (
                          <div key={mealType} className="grid grid-cols-[5rem,1fr,3rem] items-center gap-3">
                            <span className="text-xs font-semibold text-foreground">{MEAL_TYPE_LABELS[mealType]}</span>
                            <Progress value={(mealTypeCompletion[mealType] / 7) * 100} className="h-2.5 [&>div]:bg-teal-500" />
                            <span className="text-xs text-muted-foreground">{mealTypeCompletion[mealType]}/7</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            <TabsContent value="calendar" className="mt-5">
              <WeeklyCalendarBoard
                weekDays={weekDays}
                getPlan={getPlan}
                repeatedTitles={repeatedTitles}
                onOpenDay={setSelectedDayISO}
                onCopyDay={copyDayToDays}
                onAutofillDay={(dateISO) => copyDayToDays(dateISO, weekDays.filter((day) => day.dateISO !== dateISO && getMealCompletionPercent(getPlan(day.dateISO)) === 0).map((day) => day.dateISO))}
                onMarkEatingOut={markDayEatingOut}
                onClearDay={clearDay}
                onSaveTemplate={saveDayAsTemplate}
                onToggleShoppingReady={(dateISO) => updateDayFields(dateISO, { shoppingReady: !getPlan(dateISO).shoppingReady })}
                expanded
              />
            </TabsContent>

            <TabsContent value="plan" className="mt-5">
              <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                <CardHeader className="pb-3 text-right">
                  <CardTitle className="text-xl">خطة الأسبوع بنظرة شبكية</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="min-w-[66rem] rounded-[1.5rem] border border-border/70 bg-background/80 p-3">
                    <div className="grid grid-cols-[8rem,repeat(7,minmax(0,1fr))] gap-2">
                      <div />
                      {weekDays.map((day) => (
                        <div key={day.dateISO} className="rounded-2xl bg-card px-3 py-3 text-center shadow-sm">
                          <p className="text-sm font-bold text-foreground">{day.weekdayLabel}</p>
                          <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
                        </div>
                      ))}
                      {MEAL_TYPES.map((mealType) => (
                        <FragmentRow key={mealType} mealType={mealType} weekDays={weekDays} getPlan={getPlan} onOpenDay={setSelectedDayISO} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shopping" className="mt-5">
              <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                <CardHeader className="pb-3 text-right">
                  <CardTitle className="text-xl">التسوق والجاهزية</CardTitle>
                </CardHeader>
                <CardContent>
                  {shoppingItems.length === 0 ? (
                    <EmptyState title="لا توجد بيانات مشتريات بعد" body="أضف مكونات مختصرة داخل الوجبات أو استخدم التوليد السريع ليبدأ التطبيق في تكوين قائمة مشتريات مفيدة." actionLabel="توليد أسبوع سريع" onAction={() => setSetupOpen(true)} />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {shoppingItems.map((item) => (
                        <div key={item.id} className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4 text-right">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-bold text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.count} استخدامات خلال الأسبوع</p>
                            </div>
                            <Badge variant="secondary" className="rounded-full px-3 py-1">{item.count}</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap justify-start gap-2">
                            {item.days.map((day) => (
                              <Badge key={`${item.id}-${day}`} className="rounded-full border-0 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">{day}</Badge>
                            ))}
                          </div>
                          <p className="mt-3 text-xs leading-6 text-muted-foreground">{item.mealTitles.slice(0, 3).join(" • ") || "بدون أسماء وجبات واضحة بعد"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="mt-5 space-y-5">
              <section className="grid gap-5 xl:grid-cols-[1fr,1.15fr]">
                <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                  <CardHeader className="pb-3 text-right">
                    <CardTitle className="text-xl">المفضلة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {state.favorites.length === 0 ? (
                      <EmptyState title="لا توجد وجبات مفضلة بعد" body="احفظ أي وجبة من داخل درج اليوم لتصبح قابلة للإدراج السريع في أي يوم لاحق." />
                    ) : (
                      <div className="grid gap-3">
                        {state.favorites.map((favorite) => (
                          <FavoriteCard key={favorite.id} favorite={favorite} weekDays={weekDays} onApply={(targets) => targets.forEach((dateISO) => applyFavoriteToMeal(dateISO, favorite.mealType, favorite.id))} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                  <CardHeader className="pb-3 text-right">
                    <CardTitle className="text-xl">القوالب اليومية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {state.templates.length === 0 ? (
                      <EmptyState title="لا توجد قوالب حتى الآن" body="احفظ يومًا كاملًا من التقويم كقالب، ثم أعد استخدامه على أي مجموعة أيام." />
                    ) : (
                      <div className="grid gap-3">
                        {state.templates.map((template) => (
                          <div key={template.id} className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4 text-right">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-bold text-foreground">{template.name}</p>
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                              </div>
                              <CopyTargetsPopover title={`تطبيق قالب ${template.name}`} days={weekDays} onApply={(targets) => applyTemplateToDays(template.id, targets)} trigger={<Button size="sm" variant="outline" className="rounded-xl">تطبيق</Button>} />
                            </div>
                            <div className="mt-3 flex flex-wrap justify-start gap-2">
                              {Object.entries(template.meals).map(([key, meal]) => meal?.title ? <Badge key={`${template.id}-${key}`} variant="secondary" className="rounded-full px-3 py-1">{MEAL_TYPE_LABELS[key as MealType]}: {meal.title}</Badge> : null)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Sheet open={Boolean(selectedDay)} onOpenChange={(open) => !open && setSelectedDayISO(null)}>
        <SheetContent side="left" className="w-full overflow-y-auto border-white/20 bg-background/98 p-0 sm:max-w-[42rem]" dir="rtl">
          {selectedDay && selectedPlan ? (
            <div className="space-y-6 p-6">
              <SheetHeader className="space-y-2 text-right">
                <div className="flex flex-wrap justify-start gap-2">
                  <Badge className="rounded-full border-0 bg-teal-500/10 px-3 py-1 text-teal-700 dark:text-teal-300">{selectedDay.weekdayLong}</Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">{getDayState(selectedPlan, selectedPlan.meals.some((meal) => repeatedTitles.has(meal.title.trim())))}</Badge>
                  {selectedPlan.shoppingReady ? <Badge className="rounded-full border-0 bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300">جاهز للتسوق</Badge> : null}
                </div>
                <SheetTitle className="text-2xl font-extrabold">{selectedDay.fullLabel}</SheetTitle>
                <SheetDescription className="text-right leading-6">عدّل اليوم من داخل السياق الأسبوعي بدل الانتقال إلى صفحة إعداد طويلة.</SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <MiniMetric label="اكتمال اليوم" value={`${getMealCompletionPercent(selectedPlan)}%`} note={`${selectedPlan.meals.filter((meal) => meal.title.trim()).length}/4 خانات`} />
                <MiniMetric label="الماء" value={`${selectedPlan.waterActualCups}/${selectedPlan.waterTargetCups}`} note={`${cupsToLiters(selectedPlan.waterActualCups).toLocaleString("en-US")} لتر`} />
                <MiniMetric label="التحضير" value={PREP_EFFORT_LABELS[selectedPlan.prepLoad]} note={selectedPlan.leftoversAvailable ? "مع بقايا قابلة لإعادة الاستخدام" : "بدون بقايا واضحة"} />
              </div>

              <div className="grid gap-4">
                {MEAL_TYPES.map((mealType) => {
                  const meal = selectedPlan.meals.find((item) => item.mealType === mealType)!;
                  const suggestions = getSuggestions(selectedDay.dateISO, mealType);
                  const favorites = state.favorites.filter((item) => item.mealType === mealType).slice(0, 6);
                  return (
                    <div key={`${selectedDay.dateISO}-${mealType}`} className="rounded-[1.7rem] border border-white/60 bg-card/90 p-4 shadow-lg dark:border-white/10">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{MEAL_TYPE_LABELS[mealType]}</p>
                          <p className="text-xs text-muted-foreground">{MEAL_SOURCE_LABELS[meal.source]} • {MEAL_STATUS_LABELS[meal.status]}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-2xl" onClick={() => {
                                const suggestion = suggestions[0];
                                if (!suggestion) return;
                                setMealFields(selectedDay.dateISO, mealType, { title: suggestion.title, source: suggestion.source, categoryTags: suggestion.tags });
                              }}>
                                <Sparkles className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>اقتراح ذكي</TooltipContent>
                          </Tooltip>
                          <CopyTargetsPopover title={`تطبيق ${MEAL_TYPE_LABELS[mealType]} على أيام أخرى`} days={weekDays} excludeDateISO={selectedDay.dateISO} onApply={(targets) => copyMealToDays(selectedDay.dateISO, mealType, targets)} trigger={<Button size="icon" variant="ghost" className="h-9 w-9 rounded-2xl"><Copy className="h-4 w-4" /></Button>} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-2xl"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="meal-dropdown-content">
                              <DropdownMenuLabel>إجراءات سريعة</DropdownMenuLabel>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="meal-dropdown-item">من المفضلة</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="meal-dropdown-content">
                                  {favorites.length === 0 ? <DropdownMenuItem className="meal-dropdown-item" disabled>لا توجد مفضلات بعد</DropdownMenuItem> : favorites.map((favorite) => <DropdownMenuItem key={favorite.id} className="meal-dropdown-item" onClick={() => applyFavoriteToMeal(selectedDay.dateISO, mealType, favorite.id)}>{favorite.title}</DropdownMenuItem>)}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="meal-dropdown-item">من القوالب</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="meal-dropdown-content">
                                  {state.templates.map((template) => <DropdownMenuItem key={template.id} className="meal-dropdown-item" onClick={() => applyTemplateToDays(template.id, [selectedDay.dateISO])}>{template.name}</DropdownMenuItem>)}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="meal-dropdown-item" onClick={() => setMealStatus(selectedDay.dateISO, mealType, "skipped")}>تمييز كتخطي</DropdownMenuItem>
                              <DropdownMenuItem className="meal-dropdown-item" onClick={() => setMealStatus(selectedDay.dateISO, mealType, "eating_out")}>تمييز كخارج المنزل</DropdownMenuItem>
                              <DropdownMenuItem className="meal-dropdown-item" onClick={() => setMealStatus(selectedDay.dateISO, mealType, "leftover")}>استخدام بقايا</DropdownMenuItem>
                              <DropdownMenuItem className="meal-dropdown-item" onClick={() => saveMealAsFavorite(selectedDay.dateISO, mealType)}>حفظ كمفضلة</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="meal-dropdown-item text-rose-600 dark:text-rose-300" onClick={() => clearMeal(selectedDay.dateISO, mealType)}>إفراغ الخانة</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <Input value={meal.title} onChange={(event) => setMealFields(selectedDay.dateISO, mealType, { title: event.target.value })} placeholder={`اكتب ${MEAL_TYPE_LABELS[mealType]}`} className="meal-input" />
                        <div className="grid gap-3 md:grid-cols-4">
                          <Select dir="rtl" value={meal.status} onValueChange={(value) => setMealStatus(selectedDay.dateISO, mealType, value as MealStatus)}>
                            <SelectTrigger className="meal-select-trigger"><SelectValue placeholder="الحالة" /></SelectTrigger>
                            <SelectContent dir="rtl" className="meal-select-content">{STATUS_VALUES.map((status) => <SelectItem key={status} value={status} className="meal-select-item">{MEAL_STATUS_LABELS[status]}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select dir="rtl" value={meal.source} onValueChange={(value) => setMealFields(selectedDay.dateISO, mealType, { source: value as MealSource })}>
                            <SelectTrigger className="meal-select-trigger"><SelectValue placeholder="المصدر" /></SelectTrigger>
                            <SelectContent dir="rtl" className="meal-select-content">{SOURCE_VALUES.map((source) => <SelectItem key={source} value={source} className="meal-select-item">{MEAL_SOURCE_LABELS[source]}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select dir="rtl" value={meal.prepEffort} onValueChange={(value) => setMealFields(selectedDay.dateISO, mealType, { prepEffort: value as PrepEffort })}>
                            <SelectTrigger className="meal-select-trigger"><SelectValue placeholder="التحضير" /></SelectTrigger>
                            <SelectContent dir="rtl" className="meal-select-content">{PREP_VALUES.map((effort) => <SelectItem key={effort} value={effort} className="meal-select-item">{PREP_EFFORT_LABELS[effort]}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="number" min={0} max={180} value={meal.prepMinutes} onChange={(event) => setMealFields(selectedDay.dateISO, mealType, { prepMinutes: Number(event.target.value) })} className="meal-input text-center" placeholder="دقائق" />
                        </div>
                        <Input value={meal.ingredientSummary} onChange={(event) => setMealFields(selectedDay.dateISO, mealType, { ingredientSummary: event.target.value })} placeholder="ملخص المكونات: دجاج، أرز، سلطة" className="meal-input h-11" />
                        <SplitTags value={meal.categoryTags} onChange={(value) => setMealFields(selectedDay.dateISO, mealType, { categoryTags: value })} placeholder="وسوم مثل: سريع، عائلي، بروتين" />
                        <Textarea value={meal.note} onChange={(event) => setMealFields(selectedDay.dateISO, mealType, { note: event.target.value })} placeholder="ملاحظة قصيرة أو تذكير بهذه الوجبة" className="meal-textarea min-h-[84px]" />
                        {suggestions.length > 0 ? <div className="flex flex-wrap justify-start gap-2">{suggestions.slice(0, 4).map((suggestion) => <Button key={`${selectedDay.dateISO}-${mealType}-${suggestion.title}`} size="sm" type="button" variant="outline" className="rounded-full border-border/80 bg-card/85 px-3 text-xs" onClick={() => setMealFields(selectedDay.dateISO, mealType, { title: suggestion.title, source: suggestion.source, categoryTags: suggestion.tags })}>{suggestion.title}</Button>)}</div> : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.7rem] border border-white/60 bg-card/90 p-4 shadow-lg dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">تفاصيل اليوم</p>
                      <p className="text-xs text-muted-foreground">ماء، ملاحظات، ضغط تحضير، وتسوق.</p>
                    </div>
                    <CopyTargetsPopover title={`نسخ ${selectedDay.weekdayLong} إلى أيام أخرى`} days={weekDays} excludeDateISO={selectedDay.dateISO} onApply={(targets) => copyDayToDays(selectedDay.dateISO, targets)} trigger={<Button variant="outline" size="sm" className="rounded-xl">نسخ اليوم</Button>} />
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <WaterCounter label="الماء الفعلي" cups={selectedPlan.waterActualCups} onChange={(value) => updateDayFields(selectedDay.dateISO, { waterActualCups: value })} />
                      <WaterCounter label="الهدف اليومي" cups={selectedPlan.waterTargetCups} onChange={(value) => updateDayFields(selectedDay.dateISO, { waterTargetCups: value })} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ToggleTile label="جاهز للتسوق" checked={selectedPlan.shoppingReady} onCheckedChange={(checked) => updateDayFields(selectedDay.dateISO, { shoppingReady: checked })} />
                      <ToggleTile label="بقايا قابلة لإعادة الاستخدام" checked={selectedPlan.leftoversAvailable} onCheckedChange={(checked) => updateDayFields(selectedDay.dateISO, { leftoversAvailable: checked })} />
                    </div>
                    <Select dir="rtl" value={selectedPlan.prepLoad} onValueChange={(value) => updateDayFields(selectedDay.dateISO, { prepLoad: value as PrepEffort })}>
                      <SelectTrigger className="meal-select-trigger"><SelectValue placeholder="ضغط التحضير" /></SelectTrigger>
                      <SelectContent dir="rtl" className="meal-select-content">{PREP_VALUES.map((effort) => <SelectItem key={effort} value={effort} className="meal-select-item">{PREP_EFFORT_LABELS[effort]}</SelectItem>)}</SelectContent>
                    </Select>
                    <Textarea value={selectedPlan.notes} onChange={(event) => updateDayFields(selectedDay.dateISO, { notes: event.target.value })} placeholder="ملاحظات اليوم العامة" className="meal-textarea min-h-[88px]" />
                    <Textarea value={selectedPlan.prepNote} onChange={(event) => updateDayFields(selectedDay.dateISO, { prepNote: event.target.value })} placeholder="ملاحظات التحضير أو البقايا أو الترتيب" className="meal-textarea min-h-[88px]" />
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-white/60 bg-card/90 p-4 shadow-lg dark:border-white/10">
                  <p className="text-sm font-bold text-foreground">سياق أسبوعي مرتبط بهذا اليوم</p>
                  <div className="mt-4 space-y-3">
                    {recommendations.slice(0, 3).map((item) => (
                      <div key={`${selectedDay.dateISO}-${item.id}`} className={cn("rounded-2xl border px-3 py-3 text-right", getToneClasses(item.tone))}>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="mt-1 text-sm leading-6">{item.body}</p>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-right">
                      <p className="text-sm font-bold text-foreground">إجراءات إضافية</p>
                      <div className="mt-3 flex flex-wrap justify-start gap-2">
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => saveDayAsTemplate(selectedDay.dateISO)}>حفظ كقالب</Button>
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => autofillEmptySlots()}>ملء الفارغ</Button>
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => markDayEatingOut(selectedDay.dateISO)}>خارج المنزل</Button>
                        <Button size="sm" variant="outline" className="rounded-full text-rose-600 dark:text-rose-300" onClick={() => clearDay(selectedDay.dateISO)}>مسح اليوم</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Drawer open={setupOpen} onOpenChange={setSetupOpen}>
        <DrawerContent dir="rtl" className="rounded-t-[2rem] border-white/60 bg-card/98">
          <div className="mx-auto w-full max-w-4xl px-4 pb-6">
            <DrawerHeader className="px-0 text-right">
              <DrawerTitle className="text-2xl font-extrabold">إعداد أسبوع سريع</DrawerTitle>
              <DrawerDescription className="text-right leading-6">اختر أسلوب التخطيط والوضع الأسبوعي، وسيتم بناء هيكل أسبوع كامل بسرعة ثم يمكنك تعديله من التقويم.</DrawerDescription>
            </DrawerHeader>
            <div className="grid gap-5 lg:grid-cols-[1fr,0.9fr]">
              <div className="space-y-4">
                <SelectionGroup title="أسلوب التخطيط" options={WEEKLY_STYLE_OPTIONS} value={setupStyle} onChange={(value) => setSetupStyle(value as WeeklyPlanningStyle)} />
                <SelectionGroup title="الوضع الأسبوعي" options={WEEKLY_MODE_OPTIONS} value={setupMode} onChange={(value) => setSetupMode(value as WeeklyPreferenceMode)} twoColumns />
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.7rem] border border-teal-500/15 bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(14,165,233,0.08))] p-5 text-right">
                  <p className="text-sm font-bold text-foreground">مراجعة سريعة قبل التطبيق</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <p>الأسلوب المختار: {WEEKLY_STYLE_OPTIONS.find((item) => item.value === setupStyle)?.label}</p>
                    <p>الوضع المختار: {WEEKLY_MODE_OPTIONS.find((item) => item.value === setupMode)?.label}</p>
                    <p>سيتم تجهيز الأسبوع الحالي ليظهر مباشرة داخل التقويم ولوحة النظرة الأسبوعية.</p>
                  </div>
                </div>
                <div className="rounded-[1.7rem] border border-border/70 bg-background/80 p-4 text-right">
                  <p className="text-sm font-bold text-foreground">النتيجة المتوقعة</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <div className="rounded-2xl bg-card px-3 py-2">هيكل أسبوع كامل في أقل من دقيقة</div>
                    <div className="rounded-2xl bg-card px-3 py-2">وجبات سريعة قابلة للنسخ والتعديل لاحقًا</div>
                    <div className="rounded-2xl bg-card px-3 py-2">مؤشرات أوضح للتسوق والماء والتحضير</div>
                  </div>
                </div>
              </div>
            </div>
            <DrawerFooter className="px-0">
              <Button className="h-12 rounded-2xl" onClick={() => { generateWeek(setupStyle, setupMode); setSetupOpen(false); }}>تطبيق على الأسبوع الحالي</Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <MealPlannerProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={state.profile}
        guidanceItems={[
          `هدف الماء اليومي المقترح ${waterTargetCups} أكواب (${waterTargetLiters.toLocaleString("en-US")} لتر).`,
          `الوضع الحالي يعتمد على ${weekSummary.shoppingReadyDays} أيام جاهزة للتسوق و${weekSummary.leftoverOpportunities} فرص لإعادة الاستخدام.`,
          `أكبر ضغط تحضير هذا الأسبوع: ${weekSummary.busiestPrepDay ?? "لم يتحدد بعد"}.`,
        ]}
        waterTargetCups={waterTargetCups}
        waterTargetLiters={waterTargetLiters}
        onUpdateProfile={updateProfile}
      />
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Sparkles; onClick: () => void }) {
  return <Button variant="outline" className="h-12 justify-start rounded-[1.3rem] border-border/70 bg-background/80 text-sm font-semibold" onClick={onClick}><Icon className="h-4 w-4" />{label}</Button>;
}

function InsightStrip({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  return <div className="rounded-[1.3rem] border border-border/70 bg-background/80 p-3 text-right"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm font-bold text-foreground">{label}</p><span className="text-xs text-muted-foreground">{value}/{total}</span></div><Progress value={(value / total) * 100} className={cn("h-2.5", colorClass)} /></div>;
}

function MiniMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4 text-right"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-xl font-extrabold text-foreground">{value}</p><p className="text-xs leading-5 text-muted-foreground">{note}</p></div>;
}

function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return <div className="rounded-[1.7rem] border border-dashed border-border/80 bg-background/70 p-8 text-center"><p className="text-lg font-bold text-foreground">{title}</p><p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>{actionLabel && onAction ? <Button className="mt-4 rounded-2xl" onClick={onAction}>{actionLabel}</Button> : null}</div>;
}

function FavoriteCard({ favorite, weekDays, onApply }: { favorite: MealFavorite; weekDays: MealPlannerDayInfo[]; onApply: (targets: string[]) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4 text-right">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-foreground">{favorite.title}</p>
          <p className="text-sm text-muted-foreground">{MEAL_TYPE_LABELS[favorite.mealType]} • {PREP_EFFORT_LABELS[favorite.prepEffort]}</p>
        </div>
        <CopyTargetsPopover title={`إدراج ${favorite.title}`} days={weekDays} onApply={onApply} trigger={<Button size="sm" variant="outline" className="rounded-xl">إدراج</Button>} />
      </div>
      {favorite.categoryTags.length > 0 ? <div className="mt-3 flex flex-wrap justify-start gap-2">{favorite.categoryTags.map((tag) => <Badge key={`${favorite.id}-${tag}`} variant="secondary" className="rounded-full px-3 py-1">{tag}</Badge>)}</div> : null}
      <p className="mt-3 text-xs leading-6 text-muted-foreground">{favorite.ingredientSummary || favorite.note || "بدون وصف إضافي"}</p>
    </div>
  );
}

function FragmentRow({ mealType, weekDays, getPlan, onOpenDay }: { mealType: MealType; weekDays: MealPlannerDayInfo[]; getPlan: (dateISO: string) => MealDayPlan; onOpenDay: (dateISO: string) => void }) {
  return (
    <>
      <div className="flex items-center rounded-2xl bg-card px-3 py-3 text-sm font-bold text-foreground shadow-sm">{MEAL_TYPE_LABELS[mealType]}</div>
      {weekDays.map((day) => {
        const meal = getPlan(day.dateISO).meals.find((slot) => slot.mealType === mealType)!;
        return (
          <button key={`${day.dateISO}-${mealType}`} type="button" className="min-h-[6rem] rounded-2xl border border-border/70 bg-card/90 p-3 text-right shadow-sm transition hover:border-primary/25" onClick={() => onOpenDay(day.dateISO)}>
            <p className="line-clamp-2 text-sm font-medium text-foreground">{meal.title || "غير محددة"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{meal.note || MEAL_SOURCE_LABELS[meal.source]}</p>
          </button>
        );
      })}
    </>
  );
}

function WaterCounter({ label, cups, onChange }: { label: string; cups: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onChange(Math.max(0, cups - 1))}>-1</Button>
        <div className="text-center">
          <p className="text-lg font-extrabold text-foreground">{cups} كوب</p>
          <p className="text-xs text-muted-foreground">{cupsToLiters(cups).toLocaleString("en-US")} لتر</p>
        </div>
        <Button size="sm" className="rounded-xl" onClick={() => onChange(Math.min(20, cups + 1))}>+1</Button>
      </div>
    </div>
  );
}

function ToggleTile({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function SelectionGroup({ title, options, value, onChange, twoColumns = false }: { title: string; options: Array<{ value: string; label: string; description: string }>; value: string; onChange: (value: string) => void; twoColumns?: boolean }) {
  return (
    <div className="rounded-[1.7rem] border border-border/70 bg-background/80 p-4">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <div className={cn("mt-3 grid gap-3", twoColumns && "sm:grid-cols-2")}>
        {options.map((option) => (
          <button key={option.value} type="button" className={cn("rounded-[1.4rem] border px-4 py-3 text-right transition-all", value === option.value ? "border-teal-500/25 bg-teal-500/10 shadow-sm" : "border-border/70 bg-card/85")} onClick={() => onChange(option.value)}>
            <p className="text-sm font-bold text-foreground">{option.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function WeeklyCalendarBoard({
  weekDays,
  getPlan,
  repeatedTitles,
  onOpenDay,
  onCopyDay,
  onAutofillDay,
  onMarkEatingOut,
  onClearDay,
  onSaveTemplate,
  onToggleShoppingReady,
  expanded = false,
}: {
  weekDays: MealPlannerDayInfo[];
  getPlan: (dateISO: string) => MealDayPlan;
  repeatedTitles: Set<string>;
  onOpenDay: (dateISO: string) => void;
  onCopyDay: (fromDateISO: string, targets: string[]) => void;
  onAutofillDay: (dateISO: string) => void;
  onMarkEatingOut: (dateISO: string) => void;
  onClearDay: (dateISO: string) => void;
  onSaveTemplate: (dateISO: string) => void;
  onToggleShoppingReady: (dateISO: string) => void;
  expanded?: boolean;
}) {
  return (
    <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
      <CardHeader className="pb-3 text-right">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">التقويم الأسبوعي التفاعلي</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">الواجهة الأساسية للتخطيط والنسخ والتعديل داخل نفس الأسبوع.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 p-2"><LayoutGrid className="h-5 w-5 text-primary" /></div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className={cn("grid min-w-[74rem] gap-3", expanded ? "grid-cols-7" : "grid-cols-7")}>
          {weekDays.map((day, index) => {
            const plan = getPlan(day.dateISO);
            const repeated = plan.meals.some((meal) => repeatedTitles.has(meal.title.trim()));
            const statusLabel = getDayState(plan, repeated);
            const completion = getMealCompletionPercent(plan);
            const statusChips = [statusLabel, repeated ? "مكرر" : null, plan.shoppingReady ? "جاهز للتسوق" : null, plan.meals.some((meal) => meal.status === "eating_out") ? "خارج المنزل" : null].filter(Boolean);
            return (
              <motion.button key={day.dateISO} type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="group rounded-[1.7rem] border border-white/60 bg-background/85 p-4 text-right shadow-lg transition-all hover:-translate-y-1 hover:border-primary/25 dark:border-white/10" onClick={() => onOpenDay(day.dateISO)}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm font-extrabold text-foreground">{day.weekdayLong}</p><p className="text-xs text-muted-foreground">{day.dayLabel}</p></div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-2xl opacity-80 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="meal-dropdown-content">
                      <DropdownMenuLabel>إجراءات اليوم</DropdownMenuLabel>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="meal-dropdown-item">نسخ اليوم إلى...</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="meal-dropdown-content">
                          {weekDays.filter((target) => target.dateISO !== day.dateISO).map((target) => <DropdownMenuItem key={`${day.dateISO}-${target.dateISO}`} className="meal-dropdown-item" onClick={() => onCopyDay(day.dateISO, [target.dateISO])}>{target.weekdayLong}</DropdownMenuItem>)}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem className="meal-dropdown-item" onClick={() => onAutofillDay(day.dateISO)}>تعبئة الأيام الفارغة بهذا اليوم</DropdownMenuItem>
                      <DropdownMenuItem className="meal-dropdown-item" onClick={() => onMarkEatingOut(day.dateISO)}>تمييز كخارج المنزل</DropdownMenuItem>
                      <DropdownMenuItem className="meal-dropdown-item" onClick={() => onToggleShoppingReady(day.dateISO)}>{plan.shoppingReady ? "إلغاء جاهزية التسوق" : "تمييز جاهز للتسوق"}</DropdownMenuItem>
                      <DropdownMenuItem className="meal-dropdown-item" onClick={() => onSaveTemplate(day.dateISO)}>حفظ كقالب</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="meal-dropdown-item text-rose-600 dark:text-rose-300" onClick={() => onClearDay(day.dateISO)}>مسح اليوم</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex flex-wrap justify-start gap-2">{statusChips.map((chip) => <Badge key={`${day.dateISO}-${chip}`} variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">{chip}</Badge>)}</div>
                <div className="mt-3 space-y-2">{MEAL_TYPES.map((mealType) => { const meal = plan.meals.find((item) => item.mealType === mealType)!; return <div key={`${day.dateISO}-${mealType}`} className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/85 px-3 py-2"><span className="text-[11px] font-semibold text-muted-foreground">{MEAL_TYPE_LABELS[mealType]}</span><span className="line-clamp-1 text-xs font-medium text-foreground">{meal.title || "—"}</span></div>; })}</div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>إكمال اليوم</span><span>{completion}%</span></div>
                  <Progress value={completion} className="h-2.5 [&>div]:bg-teal-500" />
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{plan.waterActualCups}/{plan.waterTargetCups} كوب</span><span>{cupsToLiters(plan.waterActualCups).toLocaleString("en-US")} لتر</span></div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
