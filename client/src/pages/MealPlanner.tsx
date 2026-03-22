import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, RefreshCcw, Sparkles, Trash2, Wand2, Zap } from "lucide-react";
import { MealPlannerHeader } from "@/components/meal-planner/MealPlannerHeader";
import { DayCard } from "@/components/meal-planner/DayCard";
import { MealCard } from "@/components/meal-planner/MealCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { showFeedbackToast } from "@/components/ui/feedback-toast";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import {
  ACTIVITY_LABELS,
  calculateBMI,
  COOKING_TIME_LABELS,
  DIET_LABELS,
  formatWater,
  getBMIFeedback,
  GOAL_LABELS,
  MEAL_TYPE_LABELS,
  SKILL_LEVEL_LABELS,
  type GoalType,
  type MealSwapMode,
  type PlannerDay,
  type PlannerPreferences,
  type SexType,
} from "@/lib/meal-planner";

const STEPS = ["مرحبًا", "أسلوب الأكل", "القيود", "الهدف", "بيانات الجسم", "التفضيلات", "الأيام المزدحمة", "الصيام", "التأكيد"];
const LOADING_MESSAGES = ["نحلل تفضيلاتك", "نوازن التغذية", "نكيّف الأسبوع", "نرتب التسوق"];
const BUSY_DAYS = [
  ["sunday", "الأحد"],
  ["monday", "الاثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
  ["saturday", "السبت"],
] as const;

function hasMeaningfulSavedPreferences(preferences: PlannerPreferences | null) {
  if (!preferences) return false;
  return Boolean(
    preferences.dietType !== "balanced" ||
      preferences.mealsPerDay !== 3 ||
      !preferences.snacks ||
      preferences.cuisinePreferences.length ||
      preferences.allergies.length ||
      preferences.dislikedIngredients.length ||
      preferences.dislikedMeals.length ||
      preferences.foodRules.length ||
      preferences.ingredientsAtHome.length ||
      preferences.goal !== "eat_healthier" ||
      preferences.caloriesTarget !== 1900 ||
      preferences.age ||
      preferences.heightCm ||
      preferences.weightKg ||
      preferences.activityLevel !== "moderate" ||
      preferences.workout ||
      preferences.cookingTime !== "medium" ||
      preferences.skillLevel !== "beginner" ||
      !preferences.repeatMeals ||
      !preferences.leftovers ||
      preferences.maxIngredients !== 8 ||
      !preferences.quickMealsPreference ||
      preferences.busyDays.length ||
      preferences.fastingEnabled ||
      preferences.fastingWindow !== "12:00 - 20:00",
  );
}

function SplitInput({ value, placeholder, onChange }: { value: string[]; placeholder: string; onChange: (next: string[]) => void }) {
  return (
    <Input
      value={value.join("، ")}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(/[،,]/)
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
      placeholder={placeholder}
      className="h-12 rounded-2xl text-right"
    />
  );
}

function StepChip({
  index,
  current,
  title,
  onClick,
  showConnector,
}: {
  index: number;
  current: number;
  title: string;
  onClick: () => void;
  showConnector: boolean;
}) {
  const state = index < current ? "done" : index === current ? "current" : "upcoming";
  const isCurrent = state === "current";
  const isDone = state === "done";
  return (
    <motion.div layout className="flex shrink-0 items-center gap-2">
      {showConnector ? (
        <div className={`h-[2px] w-8 rounded-full md:w-10 ${index < current ? "bg-primary/70" : "bg-border"}`} />
      ) : null}
      <InteractiveButton
        type="button"
        variant="ghost"
        disabled={!isDone}
        onClick={isDone ? onClick : undefined}
        className="h-auto rounded-full px-0 py-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <motion.div layout className="flex flex-row-reverse items-center gap-2 text-right">
          <motion.div
            layout
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              isDone
                ? "bg-emerald-500 text-white"
                : isCurrent
                  ? "bg-primary text-primary-foreground shadow-[0_0_0_6px_rgba(99,91,255,0.12)]"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
          </motion.div>
          <AnimatePresence initial={false}>
            {isCurrent ? (
              <motion.div
                key={`step_label_${index}`}
                layout
                initial={{ opacity: 0, x: 12, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="min-w-[7.75rem] rounded-full border border-primary/20 bg-primary/10 px-3 py-2"
              >
                <p className="text-xs font-bold text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground">الخطوة {index + 1}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </InteractiveButton>
    </motion.div>
  );
}

function PlannerSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton lines={4} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LoadingSkeleton lines={5} />
        <LoadingSkeleton lines={5} />
        <LoadingSkeleton lines={5} />
      </div>
    </div>
  );
}

export default function MealPlanner() {
  const mealPlanner = useMealPlanner();
  const {
    state,
    usage,
    dashboardSummary,
    hydrating,
    generating,
    workingAction,
    isAdmin,
    adminDebug,
    patchPreferences,
    usePreviousPreferences,
    generatePlan,
    regenerateDay,
    swapMeal,
    deletePlan,
  } = mealPlanner;
  const [step, setStep] = useState(0);
  const [selectedDay, setSelectedDay] = useState<PlannerDay | null>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState<null | "meals" | "all">(null);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [caloriesInput, setCaloriesInput] = useState(String(state.preferences.caloriesTarget));

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => setLoadingIndex((value) => (value + 1) % LOADING_MESSAGES.length), 1300);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    setCaloriesInput(String(state.preferences.caloriesTarget));
  }, [state.preferences.caloriesTarget]);

  const bmi = useMemo(() => calculateBMI(state.preferences.heightCm, state.preferences.weightKg), [state.preferences.heightCm, state.preferences.weightKg]);
  const plan = state.activePlan;
  const plannerDays = plan?.days ?? [];
  const currentDay = selectedDay ?? plannerDays[0] ?? null;
  const nextStepTitle = step < STEPS.length - 1 ? STEPS[step + 1] : null;
  const previousStepTitle = step > 0 ? STEPS[step - 1] : null;
  const canUsePreviousPreferences = useMemo(() => hasMeaningfulSavedPreferences(state.savedPreferences), [state.savedPreferences]);

  const nextEnabled = useMemo(() => {
    if (step === 4) return Boolean(state.preferences.heightCm && state.preferences.weightKg);
    if (step === 7) return !state.preferences.fastingEnabled || Boolean(state.preferences.fastingWindow.trim());
    return true;
  }, [state.preferences, step]);

  const toastError = (title: string, error: unknown) =>
    showFeedbackToast({ title, description: error instanceof Error ? error.message : "حاول مرة أخرى.", tone: "error" });

  const openDay = (day: PlannerDay) => {
    setSelectedDay(day);
    setExpandedMealId(null);
    setDayOpen(true);
  };

  async function handleGenerate(replaceCurrent = false) {
    try {
      const result = await generatePlan(replaceCurrent);
      showFeedbackToast({
        title: result.source === "ai" ? "تم توليد الخطة الأسبوعية" : "تم تجهيز خطة أساسية",
        description: result.source === "ai" ? "النسخة الجديدة أصبحت نشطة." : "تعذر الذكاء الاصطناعي، فتم استخدام الخطة الأساسية.",
        tone: result.source === "ai" ? "success" : "warning",
      });
      setReplaceDialog(false);
    } catch (error) {
      toastError("تعذر توليد الخطة", error);
    }
  }

  async function handleRegenerateDay(dateISO: string) {
    try {
      const result = await regenerateDay(dateISO);
      showFeedbackToast({
        title: result?.source === "ai" ? "تم تحديث اليوم" : "تم استخدام يوم أساسي",
        tone: result?.source === "ai" ? "success" : "warning",
      });
    } catch (error) {
      toastError("تعذر إعادة توليد اليوم", error);
    }
  }

  async function handleSwapMeal(dateISO: string, mealType: string, mode: MealSwapMode) {
    try {
      const result = await swapMeal(dateISO, mealType, mode);
      showFeedbackToast({
        title: result?.source === "ai" ? "تم تبديل الوجبة" : "تم تطبيق بديل أساسي",
        tone: result?.source === "ai" ? "success" : "warning",
      });
    } catch (error) {
      toastError("تعذر تبديل الوجبة", error);
    }
  }

  async function handleDelete() {
    if (!deleteMode) return;
    try {
      await deletePlan(deleteMode);
      showFeedbackToast({
        title: deleteMode === "all" ? "تمت إعادة الضبط الكاملة" : "تم حذف الخطة الحالية",
        tone: "success",
      });
      setDeleteMode(null);
    } catch (error) {
      toastError("تعذر حذف الخطة", error);
    }
  }

  function renderStep() {
    if (step === 0) {
      return (
        <div className="space-y-5 text-right">
          <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary">إعداد ذكي وسريع</Badge>
          <h2 className="text-3xl font-black text-foreground">لنصمم أسبوعك الغذائي خلال دقائق</h2>
          <p className="text-sm leading-7 text-muted-foreground">سننشئ خطة نشطة من اليوم وحتى السبت مع تعديلات سريعة على مستوى اليوم والوجبة.</p>
          <div className="flex flex-wrap justify-end gap-3">
            {canUsePreviousPreferences ? (
              <InteractiveButton
                type="button"
                variant="outline"
                className="min-h-12 rounded-2xl px-5"
                onClick={() => {
                  usePreviousPreferences();
                  setStep(8);
                }}
              >
                استخدام التفضيلات السابقة
              </InteractiveButton>
            ) : null}
            <InteractiveButton type="button" className="min-h-12 rounded-2xl px-5" onClick={() => setStep(1)}>
              ابدأ الآن
            </InteractiveButton>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4 text-right">
          <h3 className="text-xl font-extrabold text-foreground">أسلوب الأكل</h3>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">نوع النظام</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {Object.entries(DIET_LABELS).map(([value, label]) => (
              <InteractiveButton key={value} type="button" variant={state.preferences.dietType === value ? "default" : "outline"} active={state.preferences.dietType === value} className="rounded-full px-4" onClick={() => patchPreferences({ dietType: value as PlannerPreferences["dietType"] })}>
                {label}
              </InteractiveButton>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">عدد الوجبات والسناك</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select dir="rtl" value={String(state.preferences.mealsPerDay)} onValueChange={(value) => patchPreferences({ mealsPerDay: Number(value) as 2 | 3 | 4 })}>
              <SelectTrigger className="h-12 rounded-2xl bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="2">وجبتان</SelectItem>
                <SelectItem value="3">3 وجبات</SelectItem>
                <SelectItem value="4">4 وجبات</SelectItem>
              </SelectContent>
            </Select>
            <InteractiveCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">سناك</p>
                  <p className="text-xs text-muted-foreground">يُضاف عند الحاجة.</p>
                </div>
                <Switch checked={state.preferences.snacks} onCheckedChange={(checked) => patchPreferences({ snacks: checked })} />
              </div>
            </InteractiveCard>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">المطابخ المفضلة</p>
            <Separator className="bg-border/60" />
          </div>
          <SplitInput value={state.preferences.cuisinePreferences} onChange={(value) => patchPreferences({ cuisinePreferences: value })} placeholder="مطابخ مفضلة" />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-3 text-right">
          <h3 className="text-xl font-extrabold text-foreground">القيود</h3>
          <Separator className="bg-border/60" />
          <SplitInput value={state.preferences.allergies} onChange={(value) => patchPreferences({ allergies: value })} placeholder="الحساسيات" />
          <SplitInput value={state.preferences.dislikedIngredients} onChange={(value) => patchPreferences({ dislikedIngredients: value })} placeholder="مكونات لا تحبها" />
          <SplitInput value={state.preferences.dislikedMeals} onChange={(value) => patchPreferences({ dislikedMeals: value })} placeholder="وجبات لا ترغب بها" />
          <SplitInput value={state.preferences.foodRules} onChange={(value) => patchPreferences({ foodRules: value })} placeholder="قواعد إضافية" />
          <SplitInput value={state.preferences.ingredientsAtHome} onChange={(value) => patchPreferences({ ingredientsAtHome: value })} placeholder="ماذا يوجد في المنزل؟" />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4 text-right">
          <h3 className="text-xl font-extrabold text-foreground">الهدف والسعرات</h3>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">الهدف</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {Object.entries(GOAL_LABELS).map(([value, label]) => (
              <InteractiveButton key={value} type="button" variant={state.preferences.goal === value ? "default" : "outline"} active={state.preferences.goal === value} className="rounded-full px-4" onClick={() => patchPreferences({ goal: value as GoalType })}>
                {label}
              </InteractiveButton>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">السعرات اليومية</p>
            <Separator className="bg-border/60" />
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={caloriesInput}
            onChange={(e) => {
              const nextValue = e.target.value.replace(/[^\d]/g, "");
              setCaloriesInput(nextValue);
              if (nextValue) {
                patchPreferences({ caloriesTarget: Number(nextValue) });
              }
            }}
            onBlur={() => {
              if (!caloriesInput.trim()) {
                setCaloriesInput("1900");
                patchPreferences({ caloriesTarget: 1900 });
              }
            }}
            className="h-12 rounded-2xl text-right"
            placeholder="1900"
          />
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-4 text-right">
          <h3 className="text-xl font-extrabold text-foreground">بيانات الجسم</h3>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">المعلومات الأساسية</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="number" value={state.preferences.age ?? ""} onChange={(e) => patchPreferences({ age: Number(e.target.value) || null })} className="h-12 rounded-2xl text-right" placeholder="العمر" />
            <Select dir="rtl" value={state.preferences.sex} onValueChange={(value) => patchPreferences({ sex: value as SexType })}>
              <SelectTrigger className="h-12 rounded-2xl bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl"><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent>
            </Select>
            <Input type="number" value={state.preferences.heightCm ?? ""} onChange={(e) => patchPreferences({ heightCm: Number(e.target.value) || null })} className="h-12 rounded-2xl text-right" placeholder="الطول سم" />
            <Input type="number" value={state.preferences.weightKg ?? ""} onChange={(e) => patchPreferences({ weightKg: Number(e.target.value) || null })} className="h-12 rounded-2xl text-right" placeholder="الوزن كغ" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">النشاط والتمارين</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select dir="rtl" value={state.preferences.activityLevel} onValueChange={(value) => patchPreferences({ activityLevel: value as PlannerPreferences["activityLevel"] })}>
              <SelectTrigger className="h-12 rounded-2xl bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <InteractiveCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right"><p className="text-sm font-bold">تمارين منتظمة</p><p className="text-xs text-muted-foreground">لتقريب التوقيت والبروتين.</p></div>
                <Switch checked={state.preferences.workout} onCheckedChange={(checked) => patchPreferences({ workout: checked })} />
              </div>
            </InteractiveCard>
          </div>
          <InteractiveCard className="bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right"><p className="text-sm font-bold text-foreground">BMI</p><p className="text-xs leading-6 text-muted-foreground">{getBMIFeedback(bmi)}</p></div>
              <div className="rounded-2xl bg-background px-4 py-3 text-xl font-black text-foreground">{bmi ?? "--"}</div>
            </div>
          </InteractiveCard>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-4 text-right">
          <h3 className="text-xl font-extrabold text-foreground">تفضيلات الطبخ</h3>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">الوقت والمهارة</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select dir="rtl" value={state.preferences.cookingTime} onValueChange={(value) => patchPreferences({ cookingTime: value as PlannerPreferences["cookingTime"] })}>
              <SelectTrigger className="h-12 rounded-2xl bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">{Object.entries(COOKING_TIME_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <Select dir="rtl" value={state.preferences.skillLevel} onValueChange={(value) => patchPreferences({ skillLevel: value as PlannerPreferences["skillLevel"] })}>
              <SelectTrigger className="h-12 rounded-2xl bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">{Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">تفضيلات التنفيذ</p>
            <Separator className="bg-border/60" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InteractiveCard className="p-4"><div className="flex items-center justify-between"><div className="text-right"><p className="text-sm font-bold">تكرار الوجبات</p><p className="text-xs text-muted-foreground">لتقليل القرارات.</p></div><Switch checked={state.preferences.repeatMeals} onCheckedChange={(checked) => patchPreferences({ repeatMeals: checked })} /></div></InteractiveCard>
            <InteractiveCard className="p-4"><div className="flex items-center justify-between"><div className="text-right"><p className="text-sm font-bold">إعادة استخدام البواقي</p><p className="text-xs text-muted-foreground">لتقليل الهدر.</p></div><Switch checked={state.preferences.leftovers} onCheckedChange={(checked) => patchPreferences({ leftovers: checked })} /></div></InteractiveCard>
            <InteractiveCard className="p-4"><div className="flex items-center justify-between"><div className="text-right"><p className="text-sm font-bold">أفضلية الوجبات السريعة</p><p className="text-xs text-muted-foreground">للأيام العملية.</p></div><Switch checked={state.preferences.quickMealsPreference} onCheckedChange={(checked) => patchPreferences({ quickMealsPreference: checked })} /></div></InteractiveCard>
            <Input type="number" value={state.preferences.maxIngredients} onChange={(e) => patchPreferences({ maxIngredients: Number(e.target.value) || 8 })} className="h-12 rounded-2xl text-right" placeholder="أقصى عدد مكونات" />
          </div>
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="space-y-4 text-right">
          <h3 className="text-xl font-extrabold text-foreground">الأيام المزدحمة</h3>
          <Separator className="bg-border/60" />
          <div className="flex flex-wrap justify-end gap-2">
            {BUSY_DAYS.map(([value, label]) => (
              <InteractiveButton
                key={value}
                type="button"
                variant={state.preferences.busyDays.includes(value) ? "default" : "outline"}
                active={state.preferences.busyDays.includes(value)}
                className="rounded-full px-4"
                onClick={() =>
                  patchPreferences({
                    busyDays: state.preferences.busyDays.includes(value)
                      ? state.preferences.busyDays.filter((item) => item !== value)
                      : [...state.preferences.busyDays, value],
                  })
                }
              >
                {label}
              </InteractiveButton>
            ))}
          </div>
        </div>
      );
    }

    if (step === 7) {
      return (
        <div className="space-y-4 text-right">
          <h3 className="text-xl font-extrabold text-foreground">الصيام</h3>
          <Separator className="bg-border/60" />
          <InteractiveCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right"><p className="text-sm font-bold">تفعيل الصيام المتقطع</p><p className="text-xs text-muted-foreground">سنتكيف مع نافذة الأكل.</p></div>
              <Switch checked={state.preferences.fastingEnabled} onCheckedChange={(checked) => patchPreferences({ fastingEnabled: checked })} />
            </div>
          </InteractiveCard>
          {state.preferences.fastingEnabled ? <Input value={state.preferences.fastingWindow} onChange={(e) => patchPreferences({ fastingWindow: e.target.value })} className="h-12 rounded-2xl text-right" placeholder="12:00 - 20:00" /> : null}
        </div>
      );
    }

    return (
      <div className="space-y-4 text-right">
        <h3 className="text-xl font-extrabold text-foreground">التأكيد النهائي</h3>
        <InteractiveCard className="p-4">
          <div className="space-y-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">النظام</p>
              <p className="mt-1 text-sm font-bold text-foreground">{DIET_LABELS[state.preferences.dietType]}</p>
            </div>
            <Separator className="bg-border/60" />
            <div>
              <p className="text-xs text-muted-foreground">السعرات</p>
              <p className="mt-1 text-sm font-bold text-foreground">{state.preferences.caloriesTarget} kcal</p>
            </div>
            <Separator className="bg-border/60" />
            <div>
              <p className="text-xs text-muted-foreground">الهدف</p>
              <p className="mt-1 text-sm font-bold text-foreground">{GOAL_LABELS[state.preferences.goal]}</p>
            </div>
            <Separator className="bg-border/60" />
            <div>
              <p className="text-xs text-muted-foreground">BMI</p>
              <p className="mt-1 text-sm font-bold text-foreground">{bmi ?? "غير مكتمل"}</p>
            </div>
          </div>
        </InteractiveCard>
        {plan ? <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-800 dark:text-amber-200">سيتم إنشاء نسخة جديدة نشطة لهذا الأسبوع مع تصفير عدادات التبديل وإعادة توليد الأيام للنسخة الجديدة.</div> : null}
      </div>
    );
  }

  const plannerView = plan ? (
    <motion.div key="planner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <InteractiveCard className="p-5 md:p-6">
          <div className="space-y-5 text-right">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary">{plan.source === "ai" ? "خطة ذكية" : "خطة أساسية"}</Badge>
                  <Badge variant="secondary" className="rounded-full">الإصدار {plan.version}</Badge>
                </div>
                <h2 className="text-2xl font-black text-foreground md:text-3xl">الأسبوع الجاري من اليوم وحتى السبت</h2>
                <p className="text-sm leading-7 text-muted-foreground">{plan.summary}</p>
              </div>
              <InteractiveButton type="button" className="rounded-2xl px-5" loading={generating} onClick={() => setReplaceDialog(true)}>
                <RefreshCcw className="h-4 w-4" />
                إعادة توليد الأسبوع
              </InteractiveButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["السعرات", `${dashboardSummary.totalCalories} kcal`],
                ["متوسط اليوم", `${dashboardSummary.averageCalories} kcal`],
                ["البروتين", `${dashboardSummary.totalProtein} غ`],
                ["الماء", formatWater(dashboardSummary.totalWater)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-background/75 p-4 text-right">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-extrabold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </InteractiveCard>

        <InteractiveCard className="space-y-4 p-5 text-right">
          <div className="flex items-center justify-between">
            <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{state.tier === "admin" ? "غير محدود" : `${usage.generationsLeft ?? "∞"} توليد متبقٍ`}</Badge>
            <p className="text-base font-extrabold text-foreground">الاستخدام الحالي</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">إعادة توليد يوم: <span className="font-bold text-foreground">{usage.dayRegenerationsLeft ?? "∞"}</span></div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">تبديل الوجبات: <span className="font-bold text-foreground">{usage.swapsLeft ?? "∞"}</span></div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">اكتمال الخطة: <span className="font-bold text-foreground">{dashboardSummary.completionPercent}%</span></div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-bold text-foreground">اقتراحات ذكية</p>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3 text-sm leading-7 text-muted-foreground">{plan.suggestions.nutritionInsight}</div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3 text-sm leading-7 text-muted-foreground">{plan.suggestions.habitSuggestion}</div>
          </div>
        </InteractiveCard>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <InteractiveButton type="button" variant="outline" className="rounded-2xl px-4" onClick={() => setSettingsOpen(true)}>إعدادات الخطة</InteractiveButton>
          <div className="text-right">
            <h3 className="text-xl font-extrabold text-foreground">الأسبوع النشط</h3>
            <p className="text-sm text-muted-foreground">انقر على أي يوم لفتح التفاصيل السريعة.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plannerDays.map((day) => (
            <div key={day.dateISO} className="space-y-2">
              <DayCard day={day} selected={selectedDay?.dateISO === day.dateISO && dayOpen} onClick={() => openDay(day)} />
              <div className="flex justify-end gap-2">
                <InteractiveButton type="button" variant="outline" size="sm" className="rounded-xl px-3" loading={workingAction === "regenerate"} onClick={() => handleRegenerateDay(day.dateISO)}>
                  <RefreshCcw className="h-4 w-4" />
                  إعادة اليوم
                </InteractiveButton>
                <InteractiveButton type="button" variant="ghost" size="sm" className="rounded-xl px-3" onClick={() => openDay(day)}>
                  فتح التفاصيل
                </InteractiveButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Collapsible open={groceryOpen} onOpenChange={setGroceryOpen}>
          <InteractiveCard className="overflow-hidden">
            <CollapsibleTrigger className="w-full text-right">
              <div className="flex items-center justify-between gap-3 p-5">
                <InteractiveButton type="button" variant="ghost" size="sm" className="rounded-xl">{groceryOpen ? "إغلاق" : "فتح"}</InteractiveButton>
                <div>
                  <p className="text-lg font-extrabold text-foreground">قائمة التسوق</p>
                  <p className="text-sm text-muted-foreground">{plan.grocery.reduce((sum, group) => sum + group.items.length, 0)} عنصرًا مجمعًا</p>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 border-t border-border/60 p-5">
                {plan.grocery.map((group) => (
                  <div key={group.key} className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-right">
                    <p className="text-sm font-bold text-foreground">{group.title}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.items.map((item) => (
                        <div key={item.key} className="rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{item.label}</span>
                          <span className="ms-2">{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </InteractiveCard>
        </Collapsible>

        <InteractiveCard className="p-5 text-right">
          <p className="text-lg font-extrabold text-foreground">إشارات سريعة</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4"><p className="text-xs text-muted-foreground">الاكتمال</p><p className="mt-1 text-xl font-black text-foreground">{dashboardSummary.completionPercent}%</p><Progress value={dashboardSummary.completionPercent} className="mt-3 h-2" /></div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4"><p className="text-xs text-muted-foreground">الأيام المتبقية</p><p className="mt-1 text-xl font-black text-foreground">{dashboardSummary.remainingDays}</p><p className="mt-2 text-xs text-muted-foreground">نخفي الأيام الماضية تلقائيًا.</p></div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4"><p className="text-xs text-muted-foreground">نوع الخطة</p><p className="mt-1 text-xl font-black text-foreground">{plan.source === "ai" ? "AI" : "Basic"}</p><p className="mt-2 text-xs text-muted-foreground">{plan.source === "ai" ? "مولدة بالذكاء الاصطناعي" : "Fallback محلي حتمي"}</p></div>
          </div>
        </InteractiveCard>
      </div>

      {isAdmin ? (
        <InteractiveCard className="border-dashed border-amber-500/30 bg-amber-500/5 p-5">
          <div className="space-y-4 text-right">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">Admin Debug</Badge>
              <p className="text-lg font-extrabold text-foreground">تشخيص الخلفية والذكاء الاصطناعي</p>
            </div>
            {adminDebug.length === 0 && !state.lastError ? (
              <p className="text-sm text-muted-foreground">لا توجد أخطاء مرصودة حتى الآن.</p>
            ) : (
              <div className="space-y-3">
                {state.lastError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">آخر خطأ: {state.lastError}</div> : null}
                {adminDebug.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-full">{entry.kind}</Badge>
                      <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-GB")}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-foreground">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </InteractiveCard>
      ) : null}
    </motion.div>
  ) : (
    <EmptyState icon={Sparkles} title="ابدأ أول خطة للأسبوع الجاري" description="لا توجد خطة نشطة للأيام المتبقية من هذا الأسبوع." actionLabel="بدء الإعداد" onAction={() => setStep(0)} />
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <MealPlannerHeader title="مخطط الوجبات" subtitle={state.viewState === "planner" ? "من اليوم وحتى السبت" : "إعداد سريع يقود إلى خطة أسبوعية ذكية"} onOpenSettings={() => setSettingsOpen(true)} backHref="/" />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {hydrating ? (
          <PlannerSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {state.viewState === "loading" || generating ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl">
                <InteractiveCard className="space-y-6 p-8 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-primary/20 bg-background/80">
                    <Wand2 className="h-8 w-8 text-primary" />
                  </motion.div>
                  <h2 className="text-3xl font-black text-foreground">جارٍ بناء أسبوعك الغذائي</h2>
                  <p className="text-sm text-muted-foreground">{LOADING_MESSAGES[loadingIndex]}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {LOADING_MESSAGES.map((message, index) => (
                      <motion.div key={message} initial={false} animate={{ opacity: loadingIndex === index ? 1 : 0.4, scale: loadingIndex === index ? 1 : 0.98 }} className="rounded-2xl border border-border/70 bg-background/70 p-3 text-sm text-foreground">
                        {message}
                      </motion.div>
                    ))}
                  </div>
                </InteractiveCard>
              </motion.div>
            ) : plan ? (
              plannerView
            ) : (
              <motion.div key="onboarding" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl space-y-6">
                <InteractiveCard className="space-y-6 p-5 md:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-row-reverse items-start justify-between gap-3 text-right">
                      <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary">{step === 8 ? "جاهز للتوليد" : "إعداد تفاعلي"}</Badge>
                      <div className="text-right">
                        <h1 className="text-2xl font-black text-foreground md:text-3xl">{STEPS[step]}</h1>
                        <p className="text-sm text-muted-foreground">خطوة {step + 1} من {STEPS.length}</p>
                      </div>
                    </div>
                    <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
                    <div className="flex flex-row-reverse items-center justify-start gap-2 overflow-x-auto pb-1 md:gap-3">
                      {STEPS.map((title, index) => (
                        <StepChip
                          key={title}
                          title={title}
                          index={index}
                          current={step}
                          onClick={() => setStep(index)}
                          showConnector={index < STEPS.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.98 }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="min-h-[30rem]"
                    >
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                  {state.lastError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-right text-sm text-rose-700 dark:text-rose-300">{state.lastError}</div> : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
                    <div className="text-right text-xs text-muted-foreground">{step === 8 ? "لن تظهر عملية التوليد إلا في الخطوة النهائية." : "نعرض فقط ما تحتاجه في هذه الخطوة."}</div>
                    <div className="flex flex-wrap gap-3">
                      {step > 0 ? (
                        <InteractiveButton
                          type="button"
                          variant="outline"
                          className="min-h-12 rounded-2xl px-5"
                          onClick={() => setStep((current) => Math.max(0, current - 1))}
                        >
                          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <ChevronRight className="h-4 w-4" />
                            <span>{previousStepTitle ? `العودة إلى ${previousStepTitle}` : "العودة"}</span>
                          </span>
                        </InteractiveButton>
                      ) : null}
                      {step < 8 ? (
                        <InteractiveButton
                          type="button"
                          className="min-h-12 rounded-2xl px-5"
                          disabled={!nextEnabled}
                          onClick={() => setStep((current) => Math.min(8, current + 1))}
                        >
                          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <span>{nextStepTitle ? `المتابعة إلى ${nextStepTitle}` : "المتابعة"}</span>
                            <ChevronLeft className="h-4 w-4" />
                          </span>
                        </InteractiveButton>
                      ) : (
                        <InteractiveButton type="button" className="min-h-12 rounded-2xl px-5" loading={generating} onClick={() => (plan ? setReplaceDialog(true) : handleGenerate(false))}>
                          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <span>توليد خطة أسبوعية</span>
                            <Wand2 className="h-4 w-4" />
                          </span>
                        </InteractiveButton>
                      )}
                    </div>
                  </div>
                </InteractiveCard>
                {isAdmin ? (
                  <InteractiveCard className="border-dashed border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="space-y-3 text-right">
                      <p className="text-lg font-extrabold text-foreground">Admin Debug</p>
                      {adminDebug.length === 0 && !state.lastError ? <p className="text-sm text-muted-foreground">لا توجد أخطاء حتى الآن.</p> : <div className="space-y-2">{state.lastError ? <p className="text-sm text-rose-700 dark:text-rose-300">{state.lastError}</p> : null}{adminDebug.map((entry) => <div key={entry.id} className="rounded-2xl border border-border/70 bg-background/80 p-3 text-sm text-foreground">{entry.message}</div>)}</div>}
                    </div>
                  </InteractiveCard>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <Sheet open={dayOpen} onOpenChange={setDayOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="text-right"><SheetTitle>{currentDay?.dayName ?? "تفاصيل اليوم"}</SheetTitle></SheetHeader>
          {currentDay ? (
            <div className="mt-6 space-y-5 text-right">
              <div className="rounded-[1.6rem] border border-border/70 bg-background/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-lg font-extrabold text-foreground">{currentDay.dateLabel}</p><p className="mt-1 text-sm text-muted-foreground">{currentDay.aiTip}</p></div>
                  {currentDay.busyDay ? <Badge className="rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"><Zap className="me-1 h-3 w-3" />يوم مزدحم</Badge> : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-sm"><p className="font-semibold text-foreground">الملخص الغذائي</p><p className="mt-2 text-muted-foreground">{currentDay.nutrition.calories} kcal • {currentDay.nutrition.protein}غ بروتين</p><p className="text-muted-foreground">{currentDay.nutrition.carbs}غ كربوهيدرات • {currentDay.nutrition.fat}غ دهون</p></div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-sm"><p className="font-semibold text-foreground">الماء</p><p className="mt-2 text-muted-foreground">{formatWater(currentDay.nutrition.waterCups)}</p><p className="text-muted-foreground">{currentDay.notes || "لا توجد ملاحظات إضافية لهذا اليوم."}</p></div>
                </div>
                <div className="mt-4 flex justify-end gap-2"><InteractiveButton type="button" variant="outline" className="rounded-xl px-4" loading={workingAction === "regenerate"} onClick={() => handleRegenerateDay(currentDay.dateISO)}><RefreshCcw className="h-4 w-4" />إعادة توليد هذا اليوم</InteractiveButton></div>
              </div>
              <div className="space-y-3">{currentDay.meals.map((meal) => <MealCard key={meal.id} meal={meal} expanded={expandedMealId === meal.id} onToggle={() => setExpandedMealId((current) => current === meal.id ? null : meal.id)} />)}</div>
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">تبديل سريع</p>
                {currentDay.meals.map((meal) => (
                  <div key={`${meal.id}_actions`} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 p-3">
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild><InteractiveButton type="button" variant="outline" size="sm" className="rounded-xl px-3"><RefreshCcw className="h-4 w-4" />تبديل</InteractiveButton></DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleSwapMeal(currentDay.dateISO, meal.mealType, "similar")}>سعرات مشابهة</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSwapMeal(currentDay.dateISO, meal.mealType, "higher_protein")}>بروتين أعلى</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSwapMeal(currentDay.dateISO, meal.mealType, "faster")}>أسرع تحضيرًا</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSwapMeal(currentDay.dateISO, meal.mealType, "vegetarian")}>بديل نباتي</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="text-right"><p className="text-sm font-bold text-foreground">{meal.title}</p><p className="text-xs text-muted-foreground">{MEAL_TYPE_LABELS[meal.mealType]}</p></div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader className="text-right"><SheetTitle>إعدادات المخطط</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5 text-right">
            <InteractiveCard className="p-4">
              <p className="text-sm font-bold text-foreground">حدود الاستخدام</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>توليد أسبوعي متبقٍ: {usage.generationsLeft ?? "∞"}</p>
                <p>إعادة توليد يوم: {usage.dayRegenerationsLeft ?? "∞"}</p>
                <p>تبديل الوجبات: {usage.swapsLeft ?? "∞"}</p>
              </div>
            </InteractiveCard>
            <InteractiveCard className="p-4">
              <p className="text-sm font-bold text-foreground">خيارات حساسة</p>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <InteractiveButton type="button" variant="outline" className="rounded-2xl px-4" onClick={() => setDeleteMode("meals")}><Trash2 className="h-4 w-4" />حذف الخطة الحالية</InteractiveButton>
                <InteractiveButton type="button" variant="outline" feedbackTone="warning" className="rounded-2xl px-4" onClick={() => setDeleteMode("all")}><AlertTriangle className="h-4 w-4" />إعادة الضبط كاملة</InteractiveButton>
              </div>
            </InteractiveCard>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={replaceDialog} onOpenChange={setReplaceDialog}>
        <AlertDialogContent dir="rtl"><AlertDialogHeader className="text-right"><AlertDialogTitle>استبدال الخطة الحالية؟</AlertDialogTitle><AlertDialogDescription className="leading-7">سيتم إنشاء نسخة جديدة نشطة لهذا الأسبوع مع تصفير عدادات التبديل وإعادة التوليد للنسخة الجديدة.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="sm:justify-start"><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleGenerate(true)}>تأكيد التوليد</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteMode)} onOpenChange={(open) => !open && setDeleteMode(null)}>
        <AlertDialogContent dir="rtl"><AlertDialogHeader className="text-right"><AlertDialogTitle>{deleteMode === "all" ? "إعادة ضبط كاملة" : "حذف الخطة الحالية"}</AlertDialogTitle><AlertDialogDescription className="leading-7">{deleteMode === "all" ? "سيتم حذف الخطة الحالية وإعادة التفضيلات إلى القيم الافتراضية." : "سيتم حذف النسخة النشطة الحالية فقط مع الاحتفاظ بالتفضيلات المحفوظة."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="sm:justify-start"><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
