import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarRange,
  Copy,
  Droplets,
  Heart,
  MoreHorizontal,
  RefreshCcw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { MealPlannerHeader } from "@/components/meal-planner/MealPlannerHeader";
import { MealPlannerProfileSheet } from "@/components/meal-planner/MealPlannerProfileSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import {
  DIET_TYPE_LABELS,
  MEAL_SOURCE_LABELS,
  MEAL_STATUS_LABELS,
  MEAL_TYPE_LABELS,
  PREP_EFFORT_LABELS,
  cupsToLiters,
  formatLiters,
  getMealCompletionPercent,
  type MealDayPlan,
  type MealPlannerDayInfo,
  type MealStatus,
  type MealType,
} from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

const TAB_SETUP = "setup";
const TAB_DASHBOARD = "dashboard";
const CHART_CONFIG = {
  calories: { label: "Calories", color: "#14b8a6" },
  water: { label: "Water", color: "#38bdf8" },
  completion: { label: "Completion", color: "#8b5cf6" },
};

type TabValue = typeof TAB_SETUP | typeof TAB_DASHBOARD;

function toneClasses(tone: "info" | "success" | "warning") {
  if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (tone === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function SplitTags({ value, onChange, placeholder }: { value: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  return (
    <Input
      value={value.join("، ")}
      onChange={(event) =>
        onChange(
          event.target.value
            .split(/[،,]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 8),
        )
      }
      placeholder={placeholder}
      className="h-11 rounded-2xl border-border/70 bg-background/80 text-right"
    />
  );
}

function StatCard({ label, value, note, icon: Icon, accent }: { label: string; value: string; note: string; icon: typeof Sparkles; accent: string }) {
  return (
    <Card className="rounded-[1.6rem] border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4 text-right">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-2xl font-extrabold text-foreground">{value}</p>
          <p className="text-xs leading-5 text-muted-foreground">{note}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function MealThumb({ emoji, small = false }: { emoji: string; small?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/15 to-violet-500/20", small ? "h-10 w-10 text-lg" : "h-14 w-14 text-2xl")}>
      <span>{emoji}</span>
    </div>
  );
}

function CopyPopover({
  days,
  exclude,
  onApply,
  trigger,
}: {
  days: MealPlannerDayInfo[];
  exclude: string;
  onApply: (targets: string[]) => void;
  trigger: React.ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const available = days.filter((day) => day.dateISO !== exclude);
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent dir="rtl" className="w-72 rounded-[1.4rem] border-border/80 p-4">
        <div className="space-y-3 text-right">
          <p className="text-sm font-bold text-foreground">تطبيق على أيام أخرى</p>
          <div className="grid gap-2">
            {available.map((day) => {
              const active = selected.includes(day.dateISO);
              return (
                <button
                  key={day.dateISO}
                  type="button"
                  onClick={() => setSelected((current) => (active ? current.filter((item) => item !== day.dateISO) : [...current, day.dateISO]))}
                  className={cn("rounded-2xl border px-3 py-2 text-sm transition", active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background/70 text-foreground")}
                >
                  {day.weekdayLong}
                </button>
              );
            })}
          </div>
          <Button className="w-full rounded-2xl" disabled={!selected.length} onClick={() => onApply(selected)}>
            تطبيق
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MealCard({
  meal,
  onOpen,
  menu,
}: {
  meal: MealDayPlan["meals"][number];
  onOpen: () => void;
  menu: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-[1.25rem] border border-border/70 bg-background/80 p-3 text-right shadow-sm transition hover:border-primary/30 hover:bg-background">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <MealThumb emoji={meal.image} small />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">{meal.title || `أضف ${MEAL_TYPE_LABELS[meal.mealType]}`}</p>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">{MEAL_TYPE_LABELS[meal.mealType]}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{meal.calories ? `${meal.calories} kcal` : "جاهز للتعديل السريع"}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {meal.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div onClick={(event) => event.stopPropagation()}>{menu}</div>
      </div>
    </button>
  );
}

export default function MealPlanner() {
  const [, setLocation] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayMobile, setSelectedDayMobile] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState<"meals" | "all" | null>(null);
  const {
    state,
    weekDays,
    weekSummary,
    recommendations,
    shoppingItems,
    chartData,
    waterTargetCups,
    waterTargetLiters,
    hasActivePlan,
    getPlan,
    getSuggestions,
    updatePreferences,
    updateProfile,
    generateWeeklyPlan,
    updateMeal,
    setMealStatus,
    regenerateMeal,
    applyMealToDays,
    copyDayToDays,
    updateDay,
    saveMealAsFavorite,
    applyFavoriteToMeal,
    resetPlan,
  } = useMealPlanner();

  const initialTab = hasActivePlan ? TAB_DASHBOARD : TAB_SETUP;
  const [tab, setTab] = useState<TabValue>(initialTab);

  useEffect(() => {
    setTab(hasActivePlan ? TAB_DASHBOARD : TAB_SETUP);
  }, [hasActivePlan]);

  useEffect(() => {
    if (!selectedDayMobile && weekDays[0]) setSelectedDayMobile(weekDays[0].dateISO);
  }, [selectedDayMobile, weekDays]);

  const selectedPlan = selectedDay ? getPlan(selectedDay) : null;
  const mobileDayPlan = selectedDayMobile ? getPlan(selectedDayMobile) : null;
  const setupPreview = useMemo(() => weekDays.map((day) => ({ day, plan: getPlan(day.dateISO) })), [weekDays, getPlan, state]);
  const guidanceItems = useMemo(
    () => [
      `هدف الماء الحالي ${waterTargetCups} أكواب (${waterTargetLiters.toLocaleString("en-US")} لتر).`,
      state.preferences.preferVariety ? "التنويع مفعّل لتقليل التكرار في الأسبوع." : "الوضع الحالي يسمح بإعادة استخدام الوجبات بشكل أكبر.",
      state.preferences.lowEffort ? "الجيل الحالي يفضّل الأطباق الأخف تحضيرًا." : "يمكنك تفعيل low effort إذا أردت أسبوعًا أسرع.",
    ],
    [state.preferences.lowEffort, state.preferences.preferVariety, waterTargetCups, waterTargetLiters],
  );

  const handleGenerate = () => {
    generateWeeklyPlan();
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <MealPlannerHeader title="مخطط الوجبات" subtitle="توليد أسبوع سريع ثم إدارة مرئية مرنة" onOpenSettings={() => setSettingsOpen(true)} />
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)} dir="rtl" className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <TabsList className="h-12 rounded-2xl border border-border/70 bg-card/80 p-1">
              <TabsTrigger value={TAB_SETUP} className="rounded-[1rem] px-5 text-sm font-bold">الإعداد</TabsTrigger>
              <TabsTrigger value={TAB_DASHBOARD} className="rounded-[1rem] px-5 text-sm font-bold" disabled={!hasActivePlan}>لوحة التحكم</TabsTrigger>
            </TabsList>
            {hasActivePlan ? (
              <div className="hidden items-center gap-2 md:flex">
                <Button variant="outline" className="rounded-2xl" onClick={() => setTab(TAB_SETUP)}>تعديل التفضيلات</Button>
                <Button className="rounded-2xl" onClick={() => setLocation("/meal")}>عرض الأسبوع</Button>
              </div>
            ) : null}
          </div>

          <TabsContent value={TAB_SETUP} className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[0.92fr,1.08fr]">
              <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-xl">
                <CardContent className="space-y-5 p-5 md:p-6 text-right">
                  <div className="rounded-[1.8rem] border border-teal-500/20 bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(59,130,246,0.12),rgba(139,92,246,0.12))] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge className="rounded-full border-white/30 bg-white/70 text-slate-900">مولد محلي مجاني</Badge>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">ولّد أسبوعًا كاملًا في أقل من دقيقة</h2>
                        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">أدخل تفضيلات بسيطة، ودع النظام يبني هيكل الأسبوع. بعد ذلك تعدّل فقط ما تريده.</p>
                      </div>
                      <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-teal-700 shadow-sm md:flex">
                        <Wand2 className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground">نوع النظام</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(DIET_TYPE_LABELS).map(([value, label]) => {
                          const active = state.preferences.dietType === value;
                          return (
                            <button key={value} type="button" onClick={() => updatePreferences({ dietType: value as typeof state.preferences.dietType })} className={cn("rounded-full border px-4 py-2 text-sm transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background/70 text-foreground")}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground">Calories target</p>
                        <Input type="number" value={state.preferences.caloriesTarget} onChange={(event) => updatePreferences({ caloriesTarget: Number(event.target.value) || 1900 })} className="h-11 rounded-2xl border-border/70 bg-background/80 text-right" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground">Meals per day</p>
                        <Select dir="rtl" value={String(state.preferences.mealsPerDay)} onValueChange={(value) => updatePreferences({ mealsPerDay: Number(value) as 2 | 3 | 4 })}>
                          <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/80"><SelectValue /></SelectTrigger>
                          <SelectContent dir="rtl">
                            <SelectItem value="2">2 meals</SelectItem>
                            <SelectItem value="3">3 meals</SelectItem>
                            <SelectItem value="4">4 meals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-bold text-foreground">Exclusions</p>
                      <SplitTags value={state.preferences.exclusions} onChange={(value) => updatePreferences({ exclusions: value })} placeholder="مثال: nuts، fish، dairy" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToggleRow label="budget friendly" checked={state.preferences.budgetFriendly} onCheckedChange={(checked) => updatePreferences({ budgetFriendly: checked })} />
                      <ToggleRow label="low effort" checked={state.preferences.lowEffort} onCheckedChange={(checked) => updatePreferences({ lowEffort: checked })} />
                      <ToggleRow label="prefer variety" checked={state.preferences.preferVariety} onCheckedChange={(checked) => updatePreferences({ preferVariety: checked })} />
                      <ToggleRow label="allow repetition" checked={state.preferences.allowRepetition} onCheckedChange={(checked) => updatePreferences({ allowRepetition: checked })} />
                      <ToggleRow label="same breakfast daily" checked={state.preferences.sameBreakfastDaily} onCheckedChange={(checked) => updatePreferences({ sameBreakfastDaily: checked })} />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button className="h-12 flex-1 rounded-2xl text-base font-bold" onClick={handleGenerate}>
                        <Wand2 className="me-2 h-4 w-4" />
                        Generate Weekly Plan
                      </Button>
                      <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setTab(TAB_DASHBOARD)} disabled={!hasActivePlan}>
                        Save Plan & Go to Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-xl">
                <CardHeader className="text-right">
                  <CardTitle className="text-xl font-extrabold">معاينة الأسبوع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {setupPreview.map(({ day, plan }) => (
                    <div key={day.dateISO} className="rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-right">
                          <p className="font-bold text-foreground">{day.weekdayLong}</p>
                          <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
                        </div>
                        <Badge className="rounded-full bg-primary/10 text-primary">{getMealCompletionPercent(plan)}%</Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {plan.meals.filter((meal) => meal.active).map((meal) => (
                          <div key={meal.mealType} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                            <div className="flex items-center gap-3">
                              <MealThumb emoji={meal.image} small />
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">{meal.title || MEAL_TYPE_LABELS[meal.mealType]}</p>
                                <p className="text-[11px] text-muted-foreground">{meal.calories ? `${meal.calories} kcal` : "جاهز للتوليد"}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => regenerateMeal(day.dateISO, meal.mealType)}>regenerate</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedDay(day.dateISO)}>manual edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => saveMealAsFavorite(day.dateISO, meal.mealType)}>save to favorites</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value={TAB_DASHBOARD} className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
              <Card className="overflow-hidden rounded-[2rem] border-white/20 bg-[linear-gradient(135deg,rgba(15,118,110,0.96),rgba(6,95,70,0.9),rgba(49,46,129,0.84))] text-white shadow-2xl">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 text-right">
                      <Badge className="rounded-full border-white/20 bg-white/15 text-white">الأسبوع الحالي</Badge>
                      <h2 className="text-3xl font-extrabold">لوحة تحكم أسبوع الوجبات</h2>
                      <p className="max-w-xl text-sm leading-7 text-white/80">{recommendations[0]?.body ?? "الأسبوع جاهز للمراجعة والتعديل السريع."}</p>
                    </div>
                    <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/10 md:flex"><CalendarRange className="h-7 w-7" /></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Weekly calories" value={weekSummary.totalWeeklyCalories.toLocaleString("en-US")} note={`${weekSummary.averageCaloriesPerDay.toLocaleString("en-US")} avg/day`} icon={BarChart3} accent="border-white/15 bg-white/10 text-white" />
                    <StatCard label="Meals planned" value={`${weekSummary.plannedMeals}/${weekSummary.totalMeals}`} note={`${weekSummary.emptyMeals} empty slots left`} icon={Sparkles} accent="border-white/15 bg-white/10 text-white" />
                    <StatCard label="Water total" value={`${weekSummary.weeklyWaterTotal} cups`} note={`${formatLiters(weekSummary.weeklyWaterTotal)} this week`} icon={Droplets} accent="border-white/15 bg-white/10 text-white" />
                    <StatCard label="Completion" value={`${weekSummary.completionPercent}%`} note={`${weekSummary.daysFullyPlanned} fully planned days`} icon={Heart} accent="border-white/15 bg-white/10 text-white" />
                  </div>
                  <div className="flex flex-wrap justify-start gap-2">
                    <Button variant="secondary" className="rounded-2xl" onClick={generateWeeklyPlan}><RefreshCcw className="me-2 h-4 w-4" />regenerate week</Button>
                    <Button variant="secondary" className="rounded-2xl" onClick={() => setTab(TAB_SETUP)}>update preferences</Button>
                    <Button variant="secondary" className="rounded-2xl" onClick={() => setResetMode("meals")}>start over</Button>
                    <Button variant="secondary" className="rounded-2xl" onClick={() => setResetMode("all")}>delete plan</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {recommendations.map((item) => (
                  <div key={item.id} className={cn("rounded-[1.5rem] border p-4 text-right", toneClasses(item.tone))}>
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.22fr,0.78fr]">
              <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-xl">
                <CardHeader className="pb-3 text-right">
                  <CardTitle className="text-xl font-extrabold">الأسبوع المرئي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="md:hidden">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {weekDays.map((day) => (
                        <button key={day.dateISO} type="button" onClick={() => setSelectedDayMobile(day.dateISO)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition", selectedDayMobile === day.dateISO ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background/70 text-foreground")}>{day.weekdayLabel}</button>
                      ))}
                    </div>
                    {mobileDayPlan && selectedDayMobile ? <DayBoard day={weekDays.find((item) => item.dateISO === selectedDayMobile)!} plan={mobileDayPlan} weekDays={weekDays} onOpenDay={setSelectedDay} onCopyDay={copyDayToDays} onCopyMeal={applyMealToDays} /> : null}
                  </div>
                  <div className="hidden grid-cols-7 gap-3 md:grid">
                    {weekDays.map((day) => (
                      <DayColumn key={day.dateISO} day={day} plan={getPlan(day.dateISO)} weekDays={weekDays} onOpenDay={setSelectedDay} onCopyDay={copyDayToDays} onCopyMeal={applyMealToDays} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-5">
                <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-xl">
                  <CardHeader className="text-right">
                    <CardTitle className="text-xl font-extrabold">تحليلات الأسبوع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={CHART_CONFIG} className="h-[260px] w-full">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="calories" fill="var(--color-calories)" radius={[8, 8, 0, 0]} />
                        <Line type="monotone" dataKey="water" stroke="var(--color-water)" strokeWidth={3} dot={false} />
                      </ComposedChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-xl">
                  <CardHeader className="text-right"><CardTitle className="text-xl font-extrabold">التسوق السريع</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {shoppingItems.slice(0, 8).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-sm">
                        <span className="font-semibold text-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{item.count}x</span>
                      </div>
                    ))}
                    {!shoppingItems.length ? <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">ولّد خطة أولاً لتظهر قائمة شراء مبدئية.</p> : null}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <DayDetailSheet
        open={Boolean(selectedDay && selectedPlan)}
        onOpenChange={(open) => setSelectedDay(open ? selectedDay : null)}
        day={weekDays.find((item) => item.dateISO === selectedDay) ?? null}
        plan={selectedPlan}
        weekDays={weekDays}
        favorites={state.favorites}
        getSuggestions={getSuggestions}
        onUpdateMeal={updateMeal}
        onSetMealStatus={setMealStatus}
        onRegenerateMeal={regenerateMeal}
        onCopyMeal={applyMealToDays}
        onSaveFavorite={saveMealAsFavorite}
        onApplyFavorite={applyFavoriteToMeal}
        onUpdateDay={updateDay}
      />

      <MealPlannerProfileSheet open={settingsOpen} onOpenChange={setSettingsOpen} profile={state.profile} guidanceItems={guidanceItems} waterTargetCups={waterTargetCups} waterTargetLiters={waterTargetLiters} onUpdateProfile={updateProfile} />

      <AlertDialog open={resetMode !== null} onOpenChange={(open) => setResetMode(open ? resetMode : null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>{resetMode === "all" ? "حذف الخطة الحالية" : "إعادة ضبط الوجبات"}</AlertDialogTitle>
            <AlertDialogDescription>
              {resetMode === "all" ? "سيتم حذف الخطة والتفضيلات الحالية والعودة إلى الإعداد من جديد." : "سيتم حذف الوجبات الحالية مع الاحتفاظ بالتفضيلات التي أدخلتها."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (resetMode) resetPlan(resetMode); setResetMode(null); }}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function DayBoard({
  day,
  plan,
  weekDays,
  onOpenDay,
  onCopyDay,
  onCopyMeal,
}: {
  day: MealPlannerDayInfo;
  plan: MealDayPlan;
  weekDays: MealPlannerDayInfo[];
  onOpenDay: (dateISO: string) => void;
  onCopyDay: (fromDateISO: string, targetDateISOs: string[]) => void;
  onCopyMeal: (fromDateISO: string, mealType: MealType, targetDateISOs: string[]) => void;
}) {
  return (
    <Card className="rounded-[1.8rem] border-border/70 bg-card/95 shadow-lg">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <p className="text-lg font-extrabold text-foreground">{day.weekdayLong}</p>
            <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
          </div>
          <div className="space-y-2 text-left">
            <Badge className="rounded-full bg-primary/10 text-primary">{getMealCompletionPercent(plan)}%</Badge>
            <p className="text-xs text-muted-foreground">{plan.waterActualCups}/{plan.waterTargetCups} cups</p>
          </div>
        </div>
        <div className="space-y-3">
          {plan.meals.filter((meal) => meal.active).map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onOpen={() => onOpenDay(day.dateISO)}
              menu={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>{meal.title || MEAL_TYPE_LABELS[meal.mealType]}</DropdownMenuLabel>
                    <CopyPopover days={weekDays} exclude={day.dateISO} onApply={(targets) => onCopyMeal(day.dateISO, meal.mealType, targets)} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>apply to other days</DropdownMenuItem>} />
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">الماء اليومي</p>
            <p className="text-xs text-muted-foreground">{cupsToLiters(plan.waterActualCups).toLocaleString("en-US")} لتر</p>
          </div>
          <Progress value={(plan.waterActualCups / Math.max(plan.waterTargetCups, 1)) * 100} className="h-2 flex-1" />
          <CopyPopover days={weekDays} exclude={day.dateISO} onApply={(targets) => onCopyDay(day.dateISO, targets)} trigger={<Button variant="outline" className="rounded-2xl"><Copy className="me-2 h-4 w-4" />copy day</Button>} />
        </div>
      </CardContent>
    </Card>
  );
}

function DayColumn(props: Parameters<typeof DayBoard>[0]) {
  const { day, plan } = props;
  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-card/90 p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-right">
          <p className="font-bold text-foreground">{day.weekdayLabel}</p>
          <p className="text-[11px] text-muted-foreground">{day.dayLabel}</p>
        </div>
        <Badge className="rounded-full bg-primary/10 text-primary">{getMealCompletionPercent(plan)}%</Badge>
      </div>
      <div className="space-y-2">
        {plan.meals.filter((meal) => meal.active).map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onOpen={() => props.onOpenDay(day.dateISO)}
            menu={
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <CopyPopover days={props.weekDays} exclude={day.dateISO} onApply={(targets) => props.onCopyMeal(day.dateISO, meal.mealType, targets)} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>copy meal to...</DropdownMenuItem>} />
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        ))}
      </div>
    </div>
  );
}

function DayDetailSheet({
  open,
  onOpenChange,
  day,
  plan,
  weekDays,
  favorites,
  getSuggestions,
  onUpdateMeal,
  onSetMealStatus,
  onRegenerateMeal,
  onCopyMeal,
  onSaveFavorite,
  onApplyFavorite,
  onUpdateDay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: MealPlannerDayInfo | null;
  plan: MealDayPlan | null;
  weekDays: MealPlannerDayInfo[];
  favorites: Array<{ id: string; title: string; mealType: MealType }>;
  getSuggestions: (mealType: MealType) => Array<{ title: string; source: string; tags: string[]; image: string }>;
  onUpdateMeal: (dateISO: string, mealType: MealType, patch: Partial<MealDayPlan["meals"][number]>) => void;
  onSetMealStatus: (dateISO: string, mealType: MealType, status: MealStatus) => void;
  onRegenerateMeal: (dateISO: string, mealType: MealType) => void;
  onCopyMeal: (fromDateISO: string, mealType: MealType, targetDateISOs: string[]) => void;
  onSaveFavorite: (dateISO: string, mealType: MealType) => void;
  onApplyFavorite: (dateISO: string, mealType: MealType, favoriteId: string) => void;
  onUpdateDay: (dateISO: string, patch: Partial<MealDayPlan>) => void;
}) {
  if (!day || !plan) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" dir="rtl" className="w-[96vw] max-w-[38rem] overflow-y-auto p-0 [&>button]:left-5 [&>button]:right-auto [&>button]:top-5">
        <div className="space-y-5 p-6 text-right">
          <SheetHeader className="text-right">
            <SheetTitle className="text-2xl font-extrabold">{day.fullLabel}</SheetTitle>
            <SheetDescription>تفاصيل اليوم مع تعديل سريع ونسخ ذكي عبر الأسبوع.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Calories" value={plan.meals.filter((meal) => meal.active).reduce((sum, meal) => sum + meal.calories, 0).toLocaleString("en-US")} note="إجمالي اليوم" icon={BarChart3} accent="border-primary/15 bg-primary/10 text-primary" />
            <StatCard label="Water" value={`${plan.waterActualCups}/${plan.waterTargetCups}`} note={`${formatLiters(plan.waterActualCups)}`} icon={Droplets} accent="border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-300" />
          </div>

          <div className="space-y-3">
            {plan.meals.filter((meal) => meal.active).map((meal) => (
              <Card key={meal.id} className="rounded-[1.6rem] border-border/70 bg-card/95">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MealThumb emoji={meal.image} />
                      <div className="text-right">
                        <p className="font-bold text-foreground">{MEAL_TYPE_LABELS[meal.mealType]}</p>
                        <p className="text-xs text-muted-foreground">{MEAL_SOURCE_LABELS[meal.source]}</p>
                      </div>
                    </div>
                    <CopyPopover days={weekDays} exclude={day.dateISO} onApply={(targets) => onCopyMeal(day.dateISO, meal.mealType, targets)} trigger={<Button variant="outline" className="rounded-2xl"><Copy className="me-2 h-4 w-4" />copy</Button>} />
                  </div>
                  <Input value={meal.title} onChange={(event) => onUpdateMeal(day.dateISO, meal.mealType, { title: event.target.value })} placeholder={`اكتب ${MEAL_TYPE_LABELS[meal.mealType]}`} className="h-11 rounded-2xl border-border/70 bg-background/80 text-right" />
                  <Textarea value={meal.note} onChange={(event) => onUpdateMeal(day.dateISO, meal.mealType, { note: event.target.value })} placeholder="ملاحظة سريعة أو تعديل خفيف" className="min-h-[84px] rounded-2xl border-border/70 bg-background/80 text-right" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select dir="rtl" value={meal.status} onValueChange={(value) => onSetMealStatus(day.dateISO, meal.mealType, value as MealStatus)}>
                      <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/80"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        {Object.entries(MEAL_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select dir="rtl" value={meal.prepEffort} onValueChange={(value) => onUpdateMeal(day.dateISO, meal.mealType, { prepEffort: value as typeof meal.prepEffort })}>
                      <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/80"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        {Object.entries(PREP_EFFORT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getSuggestions(meal.mealType).slice(0, 4).map((suggestion) => (
                      <button key={`${meal.mealType}-${suggestion.title}`} type="button" onClick={() => onUpdateMeal(day.dateISO, meal.mealType, { title: suggestion.title, source: suggestion.source as never, tags: suggestion.tags, image: suggestion.image })} className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-foreground transition hover:border-primary/30 hover:bg-primary/5">
                        {suggestion.title}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={() => onRegenerateMeal(day.dateISO, meal.mealType)}><RefreshCcw className="me-2 h-4 w-4" />regenerate</Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => onSaveFavorite(day.dateISO, meal.mealType)}><Heart className="me-2 h-4 w-4" />favorite</Button>
                    {favorites.filter((favorite) => favorite.mealType === meal.mealType).length ? (
                      <Select dir="rtl" onValueChange={(value) => onApplyFavorite(day.dateISO, meal.mealType, value)}>
                        <SelectTrigger className="h-10 w-[12rem] rounded-2xl border-border/70 bg-background/80"><SelectValue placeholder="من المفضلة" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {favorites.filter((favorite) => favorite.mealType === meal.mealType).map((favorite) => <SelectItem key={favorite.id} value={favorite.id}>{favorite.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-[1.6rem] border-border/70 bg-card/95">
            <CardContent className="space-y-3 p-4">
              <p className="font-bold text-foreground">ملاحظات اليوم والماء</p>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <div className="text-right">
                  <p className="font-semibold text-foreground">{plan.waterActualCups} أكواب</p>
                  <p className="text-xs text-muted-foreground">{formatLiters(plan.waterActualCups)}</p>
                </div>
                <Input type="number" min={0} max={20} value={plan.waterActualCups} onChange={(event) => onUpdateDay(day.dateISO, { waterActualCups: Number(event.target.value) || 0 })} className="h-10 w-24 rounded-2xl border-border/70 bg-background/80 text-center" />
              </div>
              <Textarea value={plan.notes} onChange={(event) => onUpdateDay(day.dateISO, { notes: event.target.value })} placeholder="ملاحظات اليوم أو تذكير للتحضير" className="min-h-[96px] rounded-2xl border-border/70 bg-background/80 text-right" />
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
