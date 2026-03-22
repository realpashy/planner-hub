import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Droplets,
  Heart,
  MoreHorizontal,
  RefreshCcw,
  ShoppingBasket,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { DayCard } from "@/components/meal-planner/DayCard";
import { MealCard } from "@/components/meal-planner/MealCard";
import { MealPlannerHeader } from "@/components/meal-planner/MealPlannerHeader";
import { MealPlannerProfileSheet } from "@/components/meal-planner/MealPlannerProfileSheet";
import { AiLimitDialog } from "@/components/meal-planner/AiLimitDialog";
import { AiQuotaNotice } from "@/components/meal-planner/AiQuotaNotice";
import { TierBadge } from "@/components/meal-planner/TierBadge";
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
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { showFeedbackToast } from "@/components/ui/feedback-toast";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
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
import { useAuth } from "@/lib/auth";
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
  calories: { label: "السعرات", color: "#14b8a6" },
  water: { label: "الماء", color: "#38bdf8" },
  completion: { label: "الاكتمال", color: "#8b5cf6" },
};

type TabValue = typeof TAB_SETUP | typeof TAB_DASHBOARD;

function SplitTags({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
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

function Stepper({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  const steps = [
    { index: 1, label: "النظام", hint: "الاختيارات الأساسية" },
    { index: 2, label: "الإيقاع", hint: "السعرات والوجبات" },
    { index: 3, label: "الإنهاء", hint: "اللمسات الأخيرة" },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {steps.map((step) => {
        const state =
          currentStep === step.index ? "current" : currentStep > step.index ? "done" : "upcoming";
        return (
          <InteractiveCard
            key={step.index}
            interactive={state === "done"}
            selected={state === "current"}
            className={cn(
              "p-3 text-right",
              state === "done" && "border-emerald-500/20 bg-emerald-500/8",
              state === "upcoming" && "bg-background/70 shadow-sm",
            )}
            onClick={state === "done" ? () => onStepClick(step.index) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.hint}</p>
              </div>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "done" && "bg-emerald-500 text-white",
                  state === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : step.index}
              </div>
            </div>
          </InteractiveCard>
        );
      })}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <InteractiveCard className="bg-background/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </InteractiveCard>
  );
}

function SetupStepPanel({
  step,
  state,
  updatePreferences,
}: {
  step: number;
  state: ReturnType<typeof useMealPlanner>["state"];
  updatePreferences: ReturnType<typeof useMealPlanner>["updatePreferences"];
}) {
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="space-y-2 text-right">
          <p className="text-base font-extrabold text-foreground">الخطوة 1: اختر أسلوب الأسبوع</p>
          <p className="text-sm leading-7 text-muted-foreground">
            نقلل الخيارات هنا إلى النظام الغذائي والاستبعادات الأساسية فقط حتى تبدأ بسهولة.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DIET_TYPE_LABELS).map(([value, label]) => {
            const active = state.preferences.dietType === value;
            return (
              <InteractiveButton
                key={value}
                type="button"
                variant={active ? "default" : "outline"}
                active={active}
                className="min-h-11 rounded-full px-4"
                onClick={() => updatePreferences({ dietType: value as typeof state.preferences.dietType })}
              >
                {label}
              </InteractiveButton>
            );
          })}
        </div>
        <div className="space-y-2 text-right">
          <p className="text-sm font-bold text-foreground">استبعادات أساسية</p>
          <SplitTags
            value={state.preferences.exclusions}
            onChange={(value) => updatePreferences({ exclusions: value })}
            placeholder="مثال: nuts، fish، dairy"
          />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="space-y-2 text-right">
          <p className="text-base font-extrabold text-foreground">الخطوة 2: حدّد الإيقاع اليومي</p>
          <p className="text-sm leading-7 text-muted-foreground">
            يكفي هدف السعرات وعدد الوجبات ليبني النظام أسبوعًا عمليًا ثم تراجع التفاصيل لاحقًا.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InteractiveCard className="p-4">
            <div className="space-y-2 text-right">
              <p className="text-sm font-bold text-foreground">السعرات المستهدفة</p>
              <Input
                type="number"
                value={state.preferences.caloriesTarget}
                onChange={(event) => updatePreferences({ caloriesTarget: Number(event.target.value) || 1900 })}
                className="h-12 rounded-2xl border-border/70 bg-background/80 text-right"
              />
            </div>
          </InteractiveCard>
          <InteractiveCard className="p-4">
            <div className="space-y-2 text-right">
              <p className="text-sm font-bold text-foreground">عدد الوجبات يوميًا</p>
              <Select
                dir="rtl"
                value={String(state.preferences.mealsPerDay)}
                onValueChange={(value) => updatePreferences({ mealsPerDay: Number(value) as 2 | 3 | 4 })}
              >
                <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="2">وجبتان</SelectItem>
                  <SelectItem value="3">3 وجبات</SelectItem>
                  <SelectItem value="4">4 وجبات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </InteractiveCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-right">
        <p className="text-base font-extrabold text-foreground">الخطوة 3: اللمسات الذكية</p>
        <p className="text-sm leading-7 text-muted-foreground">
          فعّل فقط التعديلات التي تهمك ثم ولّد الخطة النهائية. هنا فقط تظهر عملية التوليد.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow label="اقتصادي" description="يميل إلى خيارات أقل تكلفة." checked={state.preferences.budgetFriendly} onCheckedChange={(checked) => updatePreferences({ budgetFriendly: checked })} />
        <ToggleRow label="تحضير منخفض" description="يركز على الأطباق الأسرع تجهيزًا." checked={state.preferences.lowEffort} onCheckedChange={(checked) => updatePreferences({ lowEffort: checked })} />
        <ToggleRow label="تنويع أعلى" description="يقلل التكرار قدر الإمكان." checked={state.preferences.preferVariety} onCheckedChange={(checked) => updatePreferences({ preferVariety: checked })} />
        <ToggleRow label="السماح بالتكرار" description="مفيد لتخفيف القرارات والمشتريات." checked={state.preferences.allowRepetition} onCheckedChange={(checked) => updatePreferences({ allowRepetition: checked })} />
        <ToggleRow label="فطور ثابت يوميًا" description="يثبّت الفطور لتقليل الحمل الذهني." checked={state.preferences.sameBreakfastDaily} onCheckedChange={(checked) => updatePreferences({ sameBreakfastDaily: checked })} />
      </div>
    </div>
  );
}

function SummaryMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/40 bg-white/75 p-3 text-right shadow-sm dark:bg-slate-950/40">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function MetricCard({
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
  accent: "primary" | "sky" | "emerald" | "violet";
}) {
  const accentClasses = {
    primary: "border-primary/15 bg-primary/10 text-primary",
    sky: "border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    emerald: "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    violet: "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  } as const;

  return (
    <InteractiveCard className="p-4">
      <div className="flex items-start justify-between gap-3 text-right">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="text-2xl font-extrabold text-foreground">{value}</p>
          <p className="text-xs leading-5 text-muted-foreground">{note}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", accentClasses[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </InteractiveCard>
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
                <InteractiveButton
                  key={day.dateISO}
                  type="button"
                  variant="outline"
                  active={active}
                  className="justify-between rounded-2xl px-3 py-2 text-sm"
                  onClick={() => setSelected((current) => (active ? current.filter((item) => item !== day.dateISO) : [...current, day.dateISO]))}
                >
                  <span>{day.dayLabel}</span>
                  <span>{day.weekdayLong}</span>
                </InteractiveButton>
              );
            })}
          </div>
          <InteractiveButton className="h-11 w-full" disabled={!selected.length} onClick={() => onApply(selected)}>
            تطبيق
          </InteractiveButton>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function MealPlanner() {
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [focusedDay, setFocusedDay] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState<"meals" | "all" | null>(null);
  const [setupStep, setSetupStep] = useState(1);
  const [tab, setTab] = useState<TabValue>(TAB_SETUP);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasFreshGeneration, setHasFreshGeneration] = useState(false);
  const [busyMealKey, setBusyMealKey] = useState<string | null>(null);
  const [busyDayKey, setBusyDayKey] = useState<string | null>(null);
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
    quota,
    quotaLoading,
    limitReached,
    setLimitReached,
    getPlan,
    getSuggestions,
    updatePreferences,
    updateProfile,
    generateWeeklyPlan,
    updateMeal,
    setMealStatus,
    regenerateMeal,
    regenerateDay,
    applyMealToDays,
    copyDayToDays,
    updateDay,
    saveMealAsFavorite,
    applyFavoriteToMeal,
    resetPlan,
    refreshQuota,
  } = useMealPlanner();

  useEffect(() => {
    setTab(hasActivePlan ? TAB_DASHBOARD : TAB_SETUP);
  }, [hasActivePlan]);

  useEffect(() => {
    if (!focusedDay && weekDays[0]) setFocusedDay(weekDays[0].dateISO);
    if (focusedDay && !weekDays.find((day) => day.dateISO === focusedDay)) {
      setFocusedDay(weekDays[0]?.dateISO ?? null);
    }
  }, [focusedDay, weekDays]);

  const selectedPlan = selectedDay ? getPlan(selectedDay) : null;
  const focusedDayInfo = weekDays.find((day) => day.dateISO === focusedDay) ?? null;
  const focusedDayPlan = focusedDayInfo ? getPlan(focusedDayInfo.dateISO) : null;
  const guidanceItems = useMemo(
    () => [
      `هدف الماء الحالي ${waterTargetCups} أكواب (${waterTargetLiters.toLocaleString("en-US")} لتر).`,
      state.preferences.preferVariety ? "التنويع مفعّل لتقليل التكرار بين الأيام." : "يمكنك السماح بإعادة استخدام الأطباق لتخفيف قرارات الأسبوع.",
      state.preferences.lowEffort ? "الخطة الحالية تفضّل التحضير السريع." : "فعّل التحضير المنخفض إذا أردت أسبوعًا أخف تنفيذًا.",
    ],
    [state.preferences.lowEffort, state.preferences.preferVariety, waterTargetCups, waterTargetLiters],
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateWeeklyPlan();
      setHasFreshGeneration(true);
      showFeedbackToast({
        title: result.provider === "openai" ? "تم توليد الخطة عبر GPT-5 mini" : "تم توليد الخطة محليًا",
        description: result.provider === "openai" ? "راجع الأسبوع ثم عدّل ما تحتاجه فقط." : "استمر التخطيط بسلاسة باستخدام fallback محلي.",
        tone: "success",
      });
    } catch (error) {
      console.error("Meal planner generation failed", error);
      showFeedbackToast({ title: "تعذر التوليد الآن", description: "يمكنك المتابعة يدويًا أو إعادة المحاولة.", tone: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateMeal = async (dateISO: string, mealType: MealType) => {
    const key = `${dateISO}-${mealType}`;
    setBusyMealKey(key);
    try {
      const result = await regenerateMeal(dateISO, mealType);
      showFeedbackToast({
        title: result.provider === "openai" ? "تم تحديث الوجبة بالذكاء الاصطناعي" : "تم تحديث الوجبة محليًا",
        tone: "success",
      });
    } catch (error) {
      console.error("Meal regeneration failed", error);
      showFeedbackToast({ title: "تعذر تحديث الوجبة", tone: "error" });
    } finally {
      setBusyMealKey(null);
    }
  };

  const handleRegenerateDay = async (dateISO: string) => {
    setBusyDayKey(dateISO);
    try {
      const result = await regenerateDay(dateISO);
      showFeedbackToast({
        title: result.provider === "openai" ? "تم تحديث اليوم عبر GPT-5 mini" : "تم تحديث اليوم محليًا",
        tone: "success",
      });
    } catch (error) {
      console.error("Day regeneration failed", error);
      showFeedbackToast({ title: "تعذر تحديث اليوم", tone: "error" });
    } finally {
      setBusyDayKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <MealPlannerHeader title="مخطط الوجبات" subtitle="أسبوع مرئي أخف قرارات وأكثر وضوحًا" onOpenSettings={() => setSettingsOpen(true)} />
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)} dir="rtl" className="space-y-5">
          <AiQuotaNotice quota={quota} usesAi={tab === TAB_SETUP || isGenerating} />
          <div className="flex items-center justify-between gap-3">
            <TabsList className="h-12 rounded-2xl border border-border/70 bg-card/80 p-1">
              <TabsTrigger value={TAB_SETUP} className="rounded-[1rem] px-5 text-sm font-bold">الإعداد</TabsTrigger>
              <TabsTrigger value={TAB_DASHBOARD} className="rounded-[1rem] px-5 text-sm font-bold" disabled={!hasActivePlan}>لوحة التحكم</TabsTrigger>
            </TabsList>
            {quota ? <TierBadge tier={quota.tier} /> : null}
          </div>

          <TabsContent value={TAB_SETUP} className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[0.95fr,1.05fr]">
              <InteractiveCard className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 p-5 shadow-xl md:p-6">
                <div className="space-y-5 text-right">
                  <div className="rounded-[1.8rem] border border-teal-500/20 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(59,130,246,0.1),rgba(139,92,246,0.08))] p-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge className="rounded-full border-white/30 bg-white/75 text-slate-900">تهيئة تفاعلية</Badge>
                        <Badge className="rounded-full border-white/30 bg-white/75 text-slate-900">
                          الخطوة {setupStep} من 3
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        ولّد أسبوعك بسرعة ثم عدّل فقط ما تحتاجه
                      </h2>
                      <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                        نقلل الخيارات في كل خطوة لتخفيف الحمل الذهني. لا تظهر عملية التوليد النهائية إلا عند
                        اكتمال الإعداد.
                      </p>
                    </div>
                  </div>

                  <Stepper currentStep={setupStep} onStepClick={setSetupStep} />

                  <motion.div
                    key={setupStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <SetupStepPanel step={setupStep} state={state} updatePreferences={updatePreferences} />
                  </motion.div>

                  {hasFreshGeneration ? (
                    <InteractiveCard className="border-emerald-500/20 bg-emerald-500/10 p-4 text-right">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            الخطة أصبحت جاهزة للمراجعة
                          </p>
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-200/90">
                            انتقل الآن إلى لوحة التحكم لرؤية الأسبوع والتعديل على أي يوم.
                          </p>
                        </div>
                        <InteractiveButton className="h-11" feedbackTone="success" onClick={() => setTab(TAB_DASHBOARD)}>
                          حفظ والانتقال للوحة التحكم
                        </InteractiveButton>
                      </div>
                    </InteractiveCard>
                  ) : null}

                  <div className="flex items-center justify-between gap-3">
                    <InteractiveButton
                      variant="outline"
                      className="h-11"
                      onClick={() => setSetupStep((current) => Math.max(1, current - 1))}
                      disabled={setupStep === 1 || isGenerating}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </InteractiveButton>

                    {setupStep < 3 ? (
                      <InteractiveButton
                        variant="outline"
                        className="h-11"
                        onClick={() => setSetupStep((current) => Math.min(3, current + 1))}
                        disabled={isGenerating}
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </InteractiveButton>
                    ) : (
                      <InteractiveButton className="h-12 min-w-[13rem] text-base font-bold" onClick={() => void handleGenerate()} loading={isGenerating}>
                        <Wand2 className="h-4 w-4" />
                        توليد خطة أسبوعية
                      </InteractiveButton>
                    )}
                  </div>
                </div>
              </InteractiveCard>

              <InteractiveCard className="rounded-[2rem] border-border/70 bg-card/95 p-5 shadow-xl md:p-6">
                <div className="space-y-4 text-right">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-foreground">معاينة الأيام القادمة</h3>
                      <p className="text-sm text-muted-foreground">
                        يتم عرض اليوم الحالي وما بعده فقط حتى يبقى الأسبوع نشطًا ونظيفًا.
                      </p>
                    </div>
                    <Badge className="rounded-full border-primary/15 bg-primary/10 text-primary">
                      {weekDays.length} أيام نشطة
                    </Badge>
                  </div>

                  {isGenerating ? (
                    <div className="space-y-3">
                      <LoadingSkeleton lines={4} />
                      <LoadingSkeleton lines={4} />
                      <LoadingSkeleton lines={4} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {weekDays.map((day) => {
                        const plan = getPlan(day.dateISO);
                        return (
                          <InteractiveCard key={day.dateISO} className="p-4">
                            <div className="space-y-3 text-right">
                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="font-bold text-foreground">{day.weekdayLong}</p>
                                  <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
                                </div>
                                <Badge className="rounded-full border-primary/15 bg-primary/10 text-primary">
                                  {getMealCompletionPercent(plan)}%
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {plan.meals.filter((meal) => meal.active).slice(0, 3).map((meal) => (
                                  <div
                                    key={meal.id}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-2"
                                  >
                                    <span className="truncate text-xs text-muted-foreground">
                                      {meal.title || `أضف ${MEAL_TYPE_LABELS[meal.mealType]}`}
                                    </span>
                                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                                      {MEAL_TYPE_LABELS[meal.mealType]}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </InteractiveCard>
                        );
                      })}
                    </div>
                  )}
                </div>
              </InteractiveCard>
            </section>
          </TabsContent>

          <TabsContent value={TAB_DASHBOARD} className="space-y-5">
            {!hasActivePlan ? (
              <EmptyState
                icon={CalendarRange}
                title="ابدأ من الإعداد أولًا"
                description="لا توجد خطة نشطة لهذا الأسبوع بعد. ولّد أسبوعك أولًا ثم عد لإدارته من لوحة التحكم."
                actionLabel="الانتقال إلى الإعداد"
                onAction={() => setTab(TAB_SETUP)}
              />
            ) : (
              <>
                <InteractiveCard className="overflow-hidden border-teal-500/15 bg-[linear-gradient(135deg,rgba(20,184,166,0.2),rgba(56,189,248,0.1),rgba(139,92,246,0.1))] p-5 shadow-xl">
                  <div className="space-y-5 text-right">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Badge className="rounded-full border-white/30 bg-white/75 text-slate-900">الأسبوع الجاري</Badge>
                          {quota ? <TierBadge tier={quota.tier} /> : null}
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {weekSummary.completionPercent}% من الأسبوع جاهز الآن
                        </h2>
                        <p className="max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-200">
                          تبقّى {weekSummary.emptyMeals} خانات غير مكتملة، وإجمالي الماء الحالي {weekSummary.weeklyWaterTotal} كوب.
                          ركّز على الأيام الأخف أولًا لاستكمال الأسبوع بسرعة.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:w-[20rem]">
                        <InteractiveButton variant="outline" className="bg-white/75 text-slate-900" onClick={() => void handleGenerate()} loading={isGenerating}>
                          <Wand2 className="h-4 w-4" />
                          إعادة التوليد
                        </InteractiveButton>
                        <InteractiveButton variant="outline" className="bg-white/75 text-slate-900" onClick={() => setTab(TAB_SETUP)}>
                          <CalendarRange className="h-4 w-4" />
                          الإعداد
                        </InteractiveButton>
                        <InteractiveButton variant="outline" className="bg-white/75 text-slate-900" onClick={() => setSettingsOpen(true)}>
                          <Sparkles className="h-4 w-4" />
                          التفضيلات
                        </InteractiveButton>
                        <InteractiveButton variant="outline" className="bg-white/75 text-slate-900" onClick={() => void refreshQuota()}>
                          <RefreshCcw className="h-4 w-4" />
                          تحديث الحصة
                        </InteractiveButton>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <SummaryMiniCard label="الوجبات المخططة" value={`${weekSummary.plannedMeals}/${weekSummary.totalMeals}`} />
                      <SummaryMiniCard label="الماء هذا الأسبوع" value={`${weekSummary.weeklyWaterTotal}/${weekSummary.weeklyWaterTarget} كوب`} />
                      <SummaryMiniCard label="أيام مكتملة" value={`${weekSummary.daysFullyPlanned}`} />
                      <SummaryMiniCard label="تكرار الوجبات" value={`${weekSummary.repeatedMealsCount}`} />
                    </div>
                  </div>
                </InteractiveCard>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="الوجبات المخططة" value={`${weekSummary.plannedMeals}/${weekSummary.totalMeals}`} note="المتبقي يظهر مباشرة في التقويم" icon={Sparkles} accent="primary" />
                  <MetricCard title="الماء الإجمالي" value={`${weekSummary.weeklyWaterTotal} كوب`} note={`${cupsToLiters(weekSummary.weeklyWaterTotal).toLocaleString("en-US")} لتر`} icon={Droplets} accent="sky" />
                  <MetricCard title="الأيام المكتملة" value={`${weekSummary.daysFullyPlanned}`} note={`${weekSummary.daysPartiallyPlanned} أيام جزئية`} icon={CheckCircle2} accent="emerald" />
                  <MetricCard title="حمل المشتريات" value={`${shoppingItems.length}`} note="عدد العناصر المتوقعة" icon={ShoppingBasket} accent="violet" />
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.35fr,0.65fr]">
                  <InteractiveCard className="overflow-hidden rounded-[2rem] p-4 md:p-5">
                    <div className="space-y-4 text-right">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-xl font-extrabold text-foreground">الأسبوع المرئي</h3>
                          <p className="text-sm text-muted-foreground">تقويم أسبوعي خفيف يفتح التفاصيل عند التفاعل فقط.</p>
                        </div>
                        <InteractiveButton variant="outline" className="h-10" onClick={() => focusedDay && void handleRegenerateDay(focusedDay)} loading={busyDayKey === focusedDay} disabled={!focusedDay}>
                          <RefreshCcw className="h-4 w-4" />
                          تحديث اليوم
                        </InteractiveButton>
                      </div>

                      <div className="hidden gap-3 lg:grid lg:grid-cols-7">
                        {weekDays.map((day) => {
                          const plan = getPlan(day.dateISO);
                          return (
                            <DayCard
                              key={day.dateISO}
                              title={day.weekdayLong}
                              subtitle={day.dayLabel}
                              mealCount={plan.meals.filter((meal) => meal.active && meal.title.trim()).length}
                              completionPercent={getMealCompletionPercent(plan)}
                              waterLabel={`${plan.waterActualCups}/${plan.waterTargetCups} كوب`}
                              selected={day.dateISO === focusedDay}
                              onClick={() => {
                                setFocusedDay(day.dateISO);
                                setSelectedDay(day.dateISO);
                              }}
                              footer={
                                <div className="space-y-2">
                                  {plan.meals.filter((meal) => meal.active).slice(0, 3).map((meal) => (
                                    <div key={meal.id} className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-right">
                                      <div className="flex items-center justify-between gap-2">
                                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                                          {MEAL_TYPE_LABELS[meal.mealType]}
                                        </Badge>
                                        <p className="truncate text-xs font-semibold text-foreground">{meal.title || "غير محددة بعد"}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              }
                            />
                          );
                        })}
                      </div>

                      <div className="space-y-4 lg:hidden">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {weekDays.map((day) => (
                            <InteractiveButton key={day.dateISO} type="button" variant={focusedDay === day.dateISO ? "default" : "outline"} active={focusedDay === day.dateISO} className="min-w-[7.5rem] rounded-full" onClick={() => setFocusedDay(day.dateISO)}>
                              <span>{day.dayLabel}</span>
                              <span>{day.weekdayLong}</span>
                            </InteractiveButton>
                          ))}
                        </div>

                        {focusedDayInfo && focusedDayPlan ? (
                          <DayCard
                            title={focusedDayInfo.weekdayLong}
                            subtitle={focusedDayInfo.fullLabel}
                            mealCount={focusedDayPlan.meals.filter((meal) => meal.active && meal.title.trim()).length}
                            completionPercent={getMealCompletionPercent(focusedDayPlan)}
                            waterLabel={`${focusedDayPlan.waterActualCups}/${focusedDayPlan.waterTargetCups} كوب`}
                            selected
                            footer={
                              <div className="space-y-3">
                                {focusedDayPlan.meals.filter((meal) => meal.active).map((meal) => (
                                  <MealCard key={meal.id} meal={meal} compact interactive onClick={() => setSelectedDay(focusedDayInfo.dateISO)} />
                                ))}
                              </div>
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  </InteractiveCard>

                  <div className="space-y-5">
                    <InteractiveCard className="rounded-[2rem] p-5">
                      <div className="space-y-4 text-right">
                        <div className="space-y-1">
                          <h3 className="text-lg font-extrabold text-foreground">التحليلات السريعة</h3>
                          <p className="text-sm text-muted-foreground">قراءة بصرية خفيفة للسعرات والماء ونسبة الاكتمال.</p>
                        </div>
                        {chartData.length ? (
                          <ChartContainer config={CHART_CONFIG} className="h-[240px] w-full">
                            <ComposedChart data={chartData} margin={{ top: 10, left: 0, right: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                              <YAxis tickLine={false} axisLine={false} width={34} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="calories" fill="var(--color-calories)" radius={[8, 8, 0, 0]} barSize={18} />
                              <Bar dataKey="water" fill="var(--color-water)" radius={[8, 8, 0, 0]} barSize={10} />
                              <Line type="monotone" dataKey="completion" stroke="var(--color-completion)" strokeWidth={3} dot={{ r: 3 }} />
                            </ComposedChart>
                          </ChartContainer>
                        ) : (
                          <EmptyState icon={BarChart3} title="لا توجد بيانات مرئية بعد" description="ولّد الخطة أولًا ليظهر أداء الأسبوع هنا تلقائيًا." actionLabel="العودة إلى الإعداد" onAction={() => setTab(TAB_SETUP)} />
                        )}
                      </div>
                    </InteractiveCard>

                    <InteractiveCard className="rounded-[2rem] p-5">
                      <div className="space-y-4 text-right">
                        <h3 className="text-lg font-extrabold text-foreground">توصيات الأسبوع</h3>
                        <div className="space-y-3">
                          {recommendations.map((item) => (
                            <InteractiveCard key={item.id} className={cn("p-4", item.tone === "success" && "border-emerald-500/20 bg-emerald-500/10", item.tone === "warning" && "border-amber-500/20 bg-amber-500/10", item.tone === "info" && "border-sky-500/20 bg-sky-500/10")}>
                              <div className="space-y-1 text-right">
                                <p className="text-sm font-bold text-foreground">{item.title}</p>
                                <p className="text-xs leading-6 text-muted-foreground">{item.body}</p>
                              </div>
                            </InteractiveCard>
                          ))}
                        </div>
                      </div>
                    </InteractiveCard>

                    <InteractiveCard className="rounded-[2rem] p-5">
                      <div className="space-y-4 text-right">
                        <h3 className="text-lg font-extrabold text-foreground">المشتريات القادمة</h3>
                        {shoppingItems.length ? (
                          <div className="space-y-2">
                            {shoppingItems.slice(0, 6).map((item) => (
                              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-3 py-2">
                                <span className="text-xs text-muted-foreground">{item.count}x</span>
                                <span className="text-sm font-semibold text-foreground">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState icon={ShoppingBasket} title="لا توجد قائمة مشتريات بعد" description="أضف الوجبات أو ولّد الخطة ليُستخرج حمل المشتريات تلقائيًا." />
                        )}
                      </div>
                    </InteractiveCard>
                  </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[1fr,0.8fr]">
                  <InteractiveCard className="rounded-[2rem] p-5">
                    <div className="space-y-4 text-right">
                      <div className="flex items-center justify-between gap-3">
                        <InteractiveButton variant="outline" className="h-10" onClick={() => setResetMode("all")}>
                          إعادة تعيين الخطة
                        </InteractiveButton>
                        <div className="space-y-1">
                          <h3 className="text-lg font-extrabold text-foreground">إجراءات سريعة</h3>
                          <p className="text-sm text-muted-foreground">كل ما تحتاجه لإدارة الأسبوع بدون إرباك.</p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InteractiveButton variant="outline" className="h-11 justify-between" onClick={() => void handleGenerate()}>
                          <Wand2 className="h-4 w-4" />
                          توليد أسبوع جديد
                        </InteractiveButton>
                        <InteractiveButton variant="outline" className="h-11 justify-between" onClick={() => setTab(TAB_SETUP)}>
                          <CalendarRange className="h-4 w-4" />
                          تعديل الإعداد
                        </InteractiveButton>
                        <InteractiveButton variant="outline" className="h-11 justify-between" onClick={() => setSettingsOpen(true)}>
                          <Sparkles className="h-4 w-4" />
                          ضبط التفضيلات
                        </InteractiveButton>
                        <InteractiveButton variant="outline" className="h-11 justify-between" onClick={() => void refreshQuota()}>
                          <RefreshCcw className="h-4 w-4" />
                          تحديث الحصة
                        </InteractiveButton>
                      </div>
                    </div>
                  </InteractiveCard>

                  {(user?.role === "admin" || user?.role === "super_admin") ? <AdminUsagePanel onRefresh={refreshQuota} /> : null}
                </section>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MealPlannerProfileSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        profile={state.profile}
        guidanceItems={guidanceItems}
        waterTargetCups={waterTargetCups}
        waterTargetLiters={waterTargetLiters}
        onUpdateProfile={(partial) => {
          updateProfile(partial);
          showFeedbackToast({ title: "تم حفظ التفضيلات", tone: "success", duration: 1600 });
        }}
      />

      <DayDetailSheet
        open={Boolean(selectedDay)}
        onOpenChange={(open) => setSelectedDay(open ? selectedDay : null)}
        day={selectedDay ? weekDays.find((entry) => entry.dateISO === selectedDay) ?? null : null}
        plan={selectedPlan}
        weekDays={weekDays}
        favorites={state.favorites}
        busyMealKey={busyMealKey}
        getSuggestions={getSuggestions}
        onUpdateMeal={updateMeal}
        onSetMealStatus={setMealStatus}
        onRegenerateMeal={handleRegenerateMeal}
        onCopyMeal={applyMealToDays}
        onSaveFavorite={(dateISO, mealType) => {
          saveMealAsFavorite(dateISO, mealType);
          showFeedbackToast({ title: "تمت إضافة الوجبة إلى المفضلة", tone: "success" });
        }}
        onApplyFavorite={(dateISO, mealType, favoriteId) => {
          applyFavoriteToMeal(dateISO, mealType, favoriteId);
          showFeedbackToast({ title: "تم تطبيق وجبة من المفضلة", tone: "success" });
        }}
        onUpdateDay={updateDay}
        onCopyDay={copyDayToDays}
      />

      <AlertDialog open={Boolean(resetMode)} onOpenChange={(open) => !open && setResetMode(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>إعادة تعيين خطة الوجبات</AlertDialogTitle>
            <AlertDialogDescription className="leading-7">
              سيتم حذف بيانات الأسبوع النشط فقط. يمكنك اختيار إعادة التهيئة الكاملة أو مسح الوجبات فقط.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 sm:justify-start">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!resetMode) return;
                void resetPlan(resetMode).then(() =>
                  showFeedbackToast({
                    title: resetMode === "all" ? "تمت إعادة التهيئة الكاملة" : "تم مسح الوجبات الحالية",
                    tone: "success",
                  }),
                );
                setHasFreshGeneration(false);
                setResetMode(null);
                setTab(TAB_SETUP);
              }}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AiLimitDialog open={limitReached} onOpenChange={setLimitReached} quota={quota} />
    </div>
  );
}

function AdminUsagePanel({ onRefresh }: { onRefresh: () => Promise<unknown> }) {
  const [summary, setSummary] = useState<null | {
    totalEstimatedCostUsd: number;
    topUsers: Array<{ id: string; email: string; planTier: string; estimatedCostUsd: number }>;
    activeUsersByTier: Array<{ planTier: string; count: number }>;
    aggregates: { fullGenerationsUsed: number; lightEditsUsed: number; overLimitAttempts: number };
  }>(null);

  useEffect(() => {
    fetch("/api/admin/ai-usage", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSummary(data))
      .catch(() => null);
  }, []);

  if (!summary) {
    return <LoadingSkeleton lines={5} />;
  }

  return (
    <InteractiveCard className="rounded-[2rem] p-5">
      <div className="space-y-4 text-right">
        <div className="flex items-center justify-between gap-3">
          <InteractiveButton variant="outline" className="h-10" onClick={() => void onRefresh()}>
            تحديث
          </InteractiveButton>
          <h3 className="text-lg font-extrabold text-foreground">مؤشرات الإدارة</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard title="تكلفة الشهر" value={`$${summary.totalEstimatedCostUsd.toFixed(2)}`} note="تقدير تقريبي" icon={Sparkles} accent="violet" />
          <MetricCard title="توليد كامل" value={String(summary.aggregates.fullGenerationsUsed)} note="هذا الشهر" icon={Wand2} accent="primary" />
          <MetricCard title="تجاوزات الحصة" value={String(summary.aggregates.overLimitAttempts)} note="محاولات مرفوضة" icon={CalendarRange} accent="emerald" />
        </div>
      </div>
    </InteractiveCard>
  );
}

function DayDetailSheet({
  open,
  onOpenChange,
  day,
  plan,
  weekDays,
  favorites,
  busyMealKey,
  getSuggestions,
  onUpdateMeal,
  onSetMealStatus,
  onRegenerateMeal,
  onCopyMeal,
  onSaveFavorite,
  onApplyFavorite,
  onUpdateDay,
  onCopyDay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: MealPlannerDayInfo | null;
  plan: MealDayPlan | null;
  weekDays: MealPlannerDayInfo[];
  favorites: Array<{ id: string; title: string; mealType: MealType }>;
  busyMealKey: string | null;
  getSuggestions: (mealType: MealType) => Array<{ title: string; source: string; tags: string[]; image: string }>;
  onUpdateMeal: (dateISO: string, mealType: MealType, patch: Partial<MealDayPlan["meals"][number]>) => void;
  onSetMealStatus: (dateISO: string, mealType: MealType, status: MealStatus) => void;
  onRegenerateMeal: (dateISO: string, mealType: MealType) => Promise<void>;
  onCopyMeal: (fromDateISO: string, mealType: MealType, targetDateISOs: string[]) => void;
  onSaveFavorite: (dateISO: string, mealType: MealType) => void;
  onApplyFavorite: (dateISO: string, mealType: MealType, favoriteId: string) => void;
  onUpdateDay: (dateISO: string, patch: Partial<MealDayPlan>) => void;
  onCopyDay: (fromDateISO: string, targetDateISOs: string[]) => void;
}) {
  if (!day || !plan) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" dir="rtl" className="w-[96vw] max-w-[40rem] overflow-y-auto p-0 [&>button]:right-5 [&>button]:left-auto [&>button]:top-5">
        <div className="space-y-5 p-6 text-right">
          <SheetHeader className="text-right">
            <SheetTitle className="text-2xl font-extrabold">{day.fullLabel}</SheetTitle>
            <SheetDescription>التفاصيل تظهر هنا فقط حتى يبقى التقويم الأسبوعي خفيفًا وسهل المسح.</SheetDescription>
          </SheetHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard title="سعرات اليوم" value={plan.meals.filter((meal) => meal.active).reduce((sum, meal) => sum + meal.calories, 0).toLocaleString("en-US")} note="إجمالي اليوم" icon={BarChart3} accent="primary" />
            <MetricCard title="ماء اليوم" value={`${plan.waterActualCups}/${plan.waterTargetCups}`} note={formatLiters(plan.waterActualCups)} icon={Droplets} accent="sky" />
          </div>

          <InteractiveCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <CopyPopover
                days={weekDays}
                exclude={day.dateISO}
                onApply={(targets) => {
                  onCopyDay(day.dateISO, targets);
                  showFeedbackToast({ title: "تم نسخ اليوم إلى الأيام المحددة", tone: "success" });
                }}
                trigger={
                  <InteractiveButton variant="outline" className="h-10">
                    <Copy className="h-4 w-4" />
                    نسخ اليوم
                  </InteractiveButton>
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">نسخ سريع</p>
                <p className="text-xs text-muted-foreground">انسخ اليوم كاملًا إلى بقية الأيام النشطة.</p>
              </div>
            </div>
          </InteractiveCard>

          <div className="space-y-3">
            {plan.meals.filter((meal) => meal.active).map((meal) => (
              <InteractiveCard key={meal.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <MealCard meal={meal} meta={<p className="text-xs text-muted-foreground">{MEAL_SOURCE_LABELS[meal.source]}</p>} />
                    </div>
                    <CopyPopover
                      days={weekDays}
                      exclude={day.dateISO}
                      onApply={(targets) => {
                        onCopyMeal(day.dateISO, meal.mealType, targets);
                        showFeedbackToast({ title: "تم نسخ الوجبة", tone: "success" });
                      }}
                      trigger={
                        <InteractiveButton variant="outline" className="h-10">
                          <Copy className="h-4 w-4" />
                          نسخ
                        </InteractiveButton>
                      }
                    />
                  </div>

                  <Input value={meal.title} onChange={(event) => onUpdateMeal(day.dateISO, meal.mealType, { title: event.target.value })} placeholder={`اكتب ${MEAL_TYPE_LABELS[meal.mealType]}`} className="h-11 rounded-2xl border-border/70 bg-background/80 text-right" />
                  <Textarea value={meal.note} onChange={(event) => onUpdateMeal(day.dateISO, meal.mealType, { note: event.target.value })} placeholder="ملاحظة سريعة أو تعديل خفيف" className="min-h-[88px] rounded-2xl border-border/70 bg-background/80 text-right" />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select dir="rtl" value={meal.status} onValueChange={(value) => {
                      onSetMealStatus(day.dateISO, meal.mealType, value as MealStatus);
                      showFeedbackToast({ title: "تم تحديث حالة الوجبة", tone: "success", duration: 1800 });
                    }}>
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
                      <InteractiveButton key={`${meal.mealType}-${suggestion.title}`} type="button" variant="outline" className="rounded-full px-3 py-1.5 text-xs" onClick={() => onUpdateMeal(day.dateISO, meal.mealType, { title: suggestion.title, source: suggestion.source as never, tags: suggestion.tags, image: suggestion.image })}>
                        {suggestion.title}
                      </InteractiveButton>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <InteractiveButton variant="outline" className="h-10" onClick={() => void onRegenerateMeal(day.dateISO, meal.mealType)} loading={busyMealKey === `${day.dateISO}-${meal.mealType}`}>
                      <RefreshCcw className="h-4 w-4" />
                      إعادة توليد
                    </InteractiveButton>
                    <InteractiveButton variant="outline" className="h-10" onClick={() => onSaveFavorite(day.dateISO, meal.mealType)}>
                      <Heart className="h-4 w-4" />
                      مفضلة
                    </InteractiveButton>

                    {favorites.filter((favorite) => favorite.mealType === meal.mealType).length ? (
                      <Select dir="rtl" onValueChange={(value) => onApplyFavorite(day.dateISO, meal.mealType, value)}>
                        <SelectTrigger className="h-10 w-[12rem] rounded-2xl border-border/70 bg-background/80"><SelectValue placeholder="من المفضلة" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {favorites.filter((favorite) => favorite.mealType === meal.mealType).map((favorite) => <SelectItem key={favorite.id} value={favorite.id}>{favorite.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>

          <InteractiveCard className="p-4">
            <div className="space-y-3">
              <p className="font-bold text-foreground">ملاحظات اليوم والماء</p>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <div className="space-y-1 text-right">
                  <p className="font-semibold text-foreground">{plan.waterActualCups} أكواب</p>
                  <p className="text-xs text-muted-foreground">{formatLiters(plan.waterActualCups)}</p>
                </div>
                <Input type="number" min={0} max={20} value={plan.waterActualCups} onChange={(event) => onUpdateDay(day.dateISO, { waterActualCups: Number(event.target.value) || 0 })} className="h-10 w-24 rounded-2xl border-border/70 bg-background/80 text-center" />
              </div>
              <Textarea value={plan.notes} onChange={(event) => onUpdateDay(day.dateISO, { notes: event.target.value })} placeholder="ملاحظات اليوم أو تذكير للتحضير" className="min-h-[96px] rounded-2xl border-border/70 bg-background/80 text-right" />
            </div>
          </InteractiveCard>
        </div>
      </SheetContent>
    </Sheet>
  );
}
