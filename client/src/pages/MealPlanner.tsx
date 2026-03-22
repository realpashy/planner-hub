import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  RefreshCcw,
  Settings2,
  Sparkles,
  Trash2,
  Waves,
} from "lucide-react";
import { PlannerDayCard } from "@/components/meal-planner/PlannerDayCard";
import { PlannerDayDrawer } from "@/components/meal-planner/PlannerDayDrawer";
import { PlannerGroceryModule } from "@/components/meal-planner/PlannerGroceryModule";
import { PlannerHeroOverview } from "@/components/meal-planner/PlannerHeroOverview";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import { PlannerSkeleton } from "@/components/meal-planner/PlannerSkeleton";
import { PlannerSuggestionModule } from "@/components/meal-planner/PlannerSuggestionModule";
import { PlannerTopBar } from "@/components/meal-planner/PlannerTopBar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { showFeedbackToast } from "@/components/ui/feedback-toast";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Label } from "@/components/ui/label";
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
  GOAL_LABELS,
  SKILL_LEVEL_LABELS,
  getBMIFeedback,
  type GoalType,
  type MealSwapMode,
  type PlannerDay,
  type PlannerPreferences,
  type SexType,
} from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

const STEPS = ["مرحبًا", "أسلوب الأكل", "القيود", "الهدف", "بيانات الجسم", "التفضيلات", "الأيام المزدحمة", "الصيام", "التأكيد"];
const LOADING_MESSAGES = ["نحلل تفضيلاتك", "نوازن المغذيات", "نرتب أيامك النشطة", "نثبت التسوق الذكي"];
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
      onChange={(event) =>
        onChange(
          event.target.value
            .split(/[،,]/)
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
      placeholder={placeholder}
      className="h-12 rounded-[1.15rem] border-border/60 bg-background/80 text-right dark:bg-slate-950/60"
    />
  );
}

function StepRail({ step, onJump }: { step: number; onJump: (index: number) => void }) {
  return (
    <div className="overflow-x-auto pb-2" dir="rtl">
      <div className="flex min-w-max items-center gap-2">
        {STEPS.map((title, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <div key={title} className="flex items-center gap-2">
              {index > 0 ? <div className={cn("h-px w-8 rounded-full md:w-10", done ? "bg-primary/60" : "bg-border")} /> : null}
              <button type="button" disabled={!done} onClick={() => done && onJump(index)} className="inline-flex items-center gap-2 rounded-full text-right">
                {current ? (
                  <motion.div layout className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 shadow-[0_10px_30px_rgba(99,102,241,0.16)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">{index + 1}</div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground">خطوة {index + 1}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-xs font-black", done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionLead({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2 text-right">
      <h3 className="text-2xl font-black tracking-tight text-foreground">{title}</h3>
      <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      <Separator className="bg-border/60" />
    </div>
  );
}

export default function MealPlanner() {
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
  } = useMealPlanner();

  const [step, setStep] = useState(0);
  const [selectedDay, setSelectedDay] = useState<PlannerDay | null>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState<null | "meals" | "all">(null);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
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

  const plan = state.activePlan;
  const plannerDays = plan?.days ?? [];
  const bmi = useMemo(() => calculateBMI(state.preferences.heightCm, state.preferences.weightKg), [state.preferences.heightCm, state.preferences.weightKg]);
  const currentDay = selectedDay ?? plannerDays[0] ?? null;
  const canUsePreviousPreferences = useMemo(() => hasMeaningfulSavedPreferences(state.savedPreferences), [state.savedPreferences]);
  const nextStepTitle = step < STEPS.length - 1 ? STEPS[step + 1] : null;
  const previousStepTitle = step > 0 ? STEPS[step - 1] : null;
  const shellClass =
    "mx-auto max-w-7xl space-y-6 rounded-[2.25rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.92))] p-4 shadow-[0_36px_120px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82),rgba(15,23,42,0.94))] dark:shadow-[0_36px_120px_rgba(2,6,23,0.56)] md:p-6";

  const nextEnabled = useMemo(() => {
    if (step === 4) return Boolean(state.preferences.heightCm && state.preferences.weightKg);
    if (step === 7) return !state.preferences.fastingEnabled || Boolean(state.preferences.fastingWindow.trim());
    return true;
  }, [state.preferences, step]);

  const toastError = (title: string, error: unknown) =>
    showFeedbackToast({
      title,
      description: error instanceof Error ? error.message : "حاول مرة أخرى.",
      tone: "error",
    });

  const openDay = (day: PlannerDay) => {
    setSelectedDay(day);
    setExpandedMealId(null);
    setDayOpen(true);
  };

  const handleGenerate = async (replaceCurrent = false) => {
    try {
      const result = await generatePlan(replaceCurrent);
      showFeedbackToast({
        title: result.cached ? "تم استخدام الخطة الحالية" : "تم توليد الخطة الذكية",
        description: result.cached ? "لم نستهلك طلبًا جديدًا لأن نفس التفضيلات ما زالت فعالة." : "الخطة الجديدة أصبحت جاهزة للعرض والتعديل.",
        tone: "success",
      });
      setReplaceDialog(false);
    } catch (error) {
      toastError("تعذر توليد الخطة", error);
    }
  };

  const handleRegenerateDay = async (dateISO: string) => {
    try {
      await regenerateDay(dateISO);
      showFeedbackToast({ title: "تم تحديث اليوم", description: "حافظنا على بقية الأسبوع كما هي.", tone: "success" });
    } catch (error) {
      toastError("تعذر إعادة توليد اليوم", error);
    }
  };

  const handleSwapMeal = async (dateISO: string, mealType: string, mode: MealSwapMode) => {
    try {
      await swapMeal(dateISO, mealType, mode);
      showFeedbackToast({ title: mode === "refresh" ? "تم تجديد الوجبة" : "تم تبديل الوجبة", tone: "success" });
    } catch (error) {
      toastError(mode === "refresh" ? "تعذر تجديد الوجبة" : "تعذر تبديل الوجبة", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteMode) return;
    try {
      await deletePlan(deleteMode);
      showFeedbackToast({
        title: deleteMode === "all" ? "تمت إعادة الضبط الكاملة" : "تم حذف الخطة الحالية",
        tone: "success",
      });
      setDeleteMode(null);
      setSettingsOpen(false);
    } catch (error) {
      toastError("تعذر حذف الخطة", error);
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-6 text-right">
          <PlannerMetaBadge icon={Sparkles} label="إعداد تفاعلي سريع" tone="accent" />
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">لنصمم أسبوعك الغذائي كمركز قيادة شخصي</h2>
            <p className="max-w-2xl text-sm leading-8 text-muted-foreground">من اليوم وحتى السبت، بخطة مضغوطة ومرحلة تفاصيل أعمق عند الحاجة فقط.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            {canUsePreviousPreferences ? (
              <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem] px-5" onClick={() => { usePreviousPreferences(); setStep(8); }}>
                استخدام التفضيلات السابقة
              </InteractiveButton>
            ) : null}
            <InteractiveButton type="button" className="min-h-12 rounded-[1.2rem] px-5 shadow-[0_16px_36px_rgba(99,102,241,0.24)]" onClick={() => setStep(1)}>
              ابدأ الآن
              <ChevronLeft className="h-4 w-4" />
            </InteractiveButton>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-5 text-right">
          <SectionLead title="أسلوب الأكل" description="حدّد النمط الأساسي حتى نختصر القرار من البداية." />
          <div className="flex flex-wrap justify-end gap-2">
            {Object.entries(DIET_LABELS).map(([value, label]) => (
              <InteractiveButton key={value} type="button" variant={state.preferences.dietType === value ? "default" : "outline"} active={state.preferences.dietType === value} className="rounded-full px-4" onClick={() => patchPreferences({ dietType: value as PlannerPreferences["dietType"] })}>
                {label}
              </InteractiveButton>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="justify-end">عدد الوجبات</Label>
              <Select dir="rtl" value={String(state.preferences.mealsPerDay)} onValueChange={(value) => patchPreferences({ mealsPerDay: Number(value) as 2 | 3 | 4 })}>
                <SelectTrigger className="h-12 rounded-[1.15rem] bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="2">وجبتان</SelectItem>
                  <SelectItem value="3">3 وجبات</SelectItem>
                  <SelectItem value="4">4 وجبات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-[1.35rem] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <Switch checked={state.preferences.snacks} onCheckedChange={(checked) => patchPreferences({ snacks: checked })} />
                <div className="text-right"><p className="text-sm font-bold text-foreground">سناك</p><p className="text-xs text-muted-foreground">أضفه عند الحاجة فقط.</p></div>
              </div>
            </div>
          </div>
          <SplitInput value={state.preferences.cuisinePreferences} onChange={(value) => patchPreferences({ cuisinePreferences: value })} placeholder="مطابخ مفضلة" />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4 text-right">
          <SectionLead title="القيود والتجنب" description="اذكر ما يجب استبعاده الآن كي نقلل الضجيج لاحقًا." />
          <SplitInput value={state.preferences.allergies} onChange={(value) => patchPreferences({ allergies: value })} placeholder="الحساسيات" />
          <SplitInput value={state.preferences.dislikedIngredients} onChange={(value) => patchPreferences({ dislikedIngredients: value })} placeholder="مكونات لا ترغب بها" />
          <SplitInput value={state.preferences.dislikedMeals} onChange={(value) => patchPreferences({ dislikedMeals: value })} placeholder="وجبات لا تناسبك" />
          <SplitInput value={state.preferences.foodRules} onChange={(value) => patchPreferences({ foodRules: value })} placeholder="قواعد غذائية إضافية" />
          <SplitInput value={state.preferences.ingredientsAtHome} onChange={(value) => patchPreferences({ ingredientsAtHome: value })} placeholder="مكونات متوفرة في المنزل" />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-5 text-right">
          <SectionLead title="الهدف والطاقة" description="حدد الهدف ثم عدّل السعرات بسرعة وبشكل مباشر." />
          <div className="flex flex-wrap justify-end gap-2">
            {Object.entries(GOAL_LABELS).map(([value, label]) => (
              <InteractiveButton key={value} type="button" variant={state.preferences.goal === value ? "default" : "outline"} active={state.preferences.goal === value} className="rounded-full px-4" onClick={() => patchPreferences({ goal: value as GoalType })}>
                {label}
              </InteractiveButton>
            ))}
          </div>
          <Input
            type="text"
            inputMode="numeric"
            value={caloriesInput}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/[^\d]/g, "");
              setCaloriesInput(nextValue);
              if (nextValue) patchPreferences({ caloriesTarget: Number(nextValue) });
            }}
            onBlur={() => {
              if (!caloriesInput.trim()) {
                setCaloriesInput("1900");
                patchPreferences({ caloriesTarget: 1900 });
              }
            }}
            className="h-12 rounded-[1.15rem] border-border/60 bg-background/80 text-right dark:bg-slate-950/60"
            placeholder="1900"
          />
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-5 text-right">
          <SectionLead title="بيانات الجسم" description="هذه القيم تحسن تقريب السعرات والبروتين دون تعقيد." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="number" value={state.preferences.age ?? ""} onChange={(event) => patchPreferences({ age: Number(event.target.value) || null })} className="h-12 rounded-[1.15rem] text-right" placeholder="العمر" />
            <Select dir="rtl" value={state.preferences.sex} onValueChange={(value) => patchPreferences({ sex: value as SexType })}>
              <SelectTrigger className="h-12 rounded-[1.15rem] bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl"><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent>
            </Select>
            <Input type="number" value={state.preferences.heightCm ?? ""} onChange={(event) => patchPreferences({ heightCm: Number(event.target.value) || null })} className="h-12 rounded-[1.15rem] text-right" placeholder="الطول سم" />
            <Input type="number" value={state.preferences.weightKg ?? ""} onChange={(event) => patchPreferences({ weightKg: Number(event.target.value) || null })} className="h-12 rounded-[1.15rem] text-right" placeholder="الوزن كغ" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select dir="rtl" value={state.preferences.activityLevel} onValueChange={(value) => patchPreferences({ activityLevel: value as PlannerPreferences["activityLevel"] })}>
              <SelectTrigger className="h-12 rounded-[1.15rem] bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="rounded-[1.35rem] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <Switch checked={state.preferences.workout} onCheckedChange={(checked) => patchPreferences({ workout: checked })} />
                <div className="text-right"><p className="text-sm font-bold text-foreground">تمارين منتظمة</p><p className="text-xs text-muted-foreground">لتحسين توزيع البروتين والطاقة.</p></div>
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-primary/15 bg-primary/8 p-4 dark:border-primary/20 dark:bg-primary/12">
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-[1.2rem] bg-background px-4 py-3 text-2xl font-black text-foreground dark:bg-slate-950/60">{bmi ?? "--"}</div>
              <div className="text-right"><p className="text-sm font-bold text-foreground">مؤشر BMI</p><p className="text-xs leading-6 text-muted-foreground">{getBMIFeedback(bmi)}</p></div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-5 text-right">
          <SectionLead title="أسلوب التنفيذ" description="اضبط سرعة الطبخ وتكرار المكونات حتى تبقى الخطة واقعية." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select dir="rtl" value={state.preferences.cookingTime} onValueChange={(value) => patchPreferences({ cookingTime: value as PlannerPreferences["cookingTime"] })}>
              <SelectTrigger className="h-12 rounded-[1.15rem] bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">{Object.entries(COOKING_TIME_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <Select dir="rtl" value={state.preferences.skillLevel} onValueChange={(value) => patchPreferences({ skillLevel: value as PlannerPreferences["skillLevel"] })}>
              <SelectTrigger className="h-12 rounded-[1.15rem] bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent dir="rtl">{Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "تكرار الوجبات", description: "لتقليل القرارات.", checked: state.preferences.repeatMeals, key: "repeatMeals" },
              { title: "إعادة استخدام البواقي", description: "لتقليل الهدر.", checked: state.preferences.leftovers, key: "leftovers" },
              { title: "أفضلية الوجبات السريعة", description: "للأيام العملية.", checked: state.preferences.quickMealsPreference, key: "quickMealsPreference" },
            ].map((item) => (
              <div key={item.key} className="rounded-[1.35rem] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <Switch checked={item.checked} onCheckedChange={(checked) => patchPreferences({ [item.key]: checked } as Partial<PlannerPreferences>)} />
                  <div className="text-right"><p className="text-sm font-bold text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.description}</p></div>
                </div>
              </div>
            ))}
            <Input type="number" value={state.preferences.maxIngredients} onChange={(event) => patchPreferences({ maxIngredients: Number(event.target.value) || 8 })} className="h-12 rounded-[1.15rem] text-right" placeholder="أقصى عدد مكونات" />
          </div>
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="space-y-5 text-right">
          <SectionLead title="الأيام المزدحمة" description="سنخفف تعقيد الوجبات في الأيام الأعلى ضغطًا." />
          <div className="flex flex-wrap justify-end gap-2">
            {BUSY_DAYS.map(([value, label]) => (
              <InteractiveButton
                key={value}
                type="button"
                variant={state.preferences.busyDays.includes(value) ? "default" : "outline"}
                active={state.preferences.busyDays.includes(value)}
                className="rounded-full px-4"
                onClick={() => patchPreferences({
                  busyDays: state.preferences.busyDays.includes(value)
                    ? state.preferences.busyDays.filter((item) => item !== value)
                    : [...state.preferences.busyDays, value],
                })}
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
        <div className="space-y-5 text-right">
          <SectionLead title="الصيام المتقطع" description="عند تفعيله سنبني الخطة داخل نافذة الأكل فقط." />
          <div className="rounded-[1.35rem] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/60">
            <div className="flex items-center justify-between">
              <Switch checked={state.preferences.fastingEnabled} onCheckedChange={(checked) => patchPreferences({ fastingEnabled: checked })} />
              <div className="text-right"><p className="text-sm font-bold text-foreground">تفعيل الصيام</p><p className="text-xs text-muted-foreground">نافذة أكل واضحة ومباشرة.</p></div>
            </div>
          </div>
          {state.preferences.fastingEnabled ? <Input value={state.preferences.fastingWindow} onChange={(event) => patchPreferences({ fastingWindow: event.target.value })} className="h-12 rounded-[1.15rem] text-right" placeholder="12:00 - 20:00" /> : null}
        </div>
      );
    }

    return (
      <div className="space-y-4 text-right">
        <SectionLead title="مراجعة الخطة" description="هذه نظرة نهائية قبل إنشاء النسخة الذكية الجديدة." />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["النظام", DIET_LABELS[state.preferences.dietType]],
            ["السعرات", `${state.preferences.caloriesTarget} kcal`],
            ["الهدف", GOAL_LABELS[state.preferences.goal]],
            ["BMI", bmi ?? "غير مكتمل"],
            ["الوجبات", `${state.preferences.mealsPerDay} يوميًا`],
            ["الأيام المزدحمة", state.preferences.busyDays.length ? `${state.preferences.busyDays.length} أيام` : "غير محددة"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.35rem] border border-border/60 bg-background/72 p-4 dark:bg-slate-950/60">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-base font-black text-foreground">{value}</p>
            </div>
          ))}
        </div>
        {plan ? <div className="rounded-[1.35rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-800 dark:text-amber-200">سيتم إنشاء نسخة جديدة نشطة لهذا الأسبوع مع الحفاظ على النسخ السابقة داخليًا فقط.</div> : null}
      </div>
    );
  };

  const onboardingView = (
    <motion.section key="onboarding" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={shellClass} dir="rtl">
      <div className="rounded-[1.85rem] border border-white/60 bg-white/72 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/70 md:p-6">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <PlannerMetaBadge icon={Sparkles} label="الإعداد الذكي" tone="accent" />
            <div className="text-right"><p className="text-3xl font-black tracking-tight text-foreground">{STEPS[step]}</p><p className="text-sm text-muted-foreground">خطوة {step + 1} من {STEPS.length}</p></div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border/70">
            <motion.div initial={{ width: 0 }} animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.35, ease: "easeOut" }} className="h-full rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.92),rgba(14,165,233,0.82))]" />
          </div>
          <StepRail step={step} onJump={setStep} />
          <Separator className="bg-border/60" />
          <div className="rounded-[1.9rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,250,252,0.9))] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(2,6,23,0.82))] md:p-6">
            <AnimatePresence mode="wait">
              <motion.div key={`step_${step}`} initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -22 }} transition={{ duration: 0.22, ease: "easeOut" }} className="min-h-[22rem]">
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {step === STEPS.length - 1 ? (
              <InteractiveButton type="button" className="min-h-12 rounded-[1.2rem] px-5 shadow-[0_16px_36px_rgba(99,102,241,0.24)]" loading={generating} onClick={() => handleGenerate(Boolean(plan))}>
                توليد الخطة الأسبوعية
                <Sparkles className="h-4 w-4" />
              </InteractiveButton>
            ) : (
              <InteractiveButton type="button" className="min-h-12 rounded-[1.2rem] px-5 shadow-[0_16px_36px_rgba(99,102,241,0.24)]" disabled={!nextEnabled} onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}>
                المتابعة إلى {nextStepTitle}
                <ChevronLeft className="h-4 w-4" />
              </InteractiveButton>
            )}
            {step > 0 ? (
              <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem] px-5" onClick={() => setStep((value) => Math.max(0, value - 1))}>
                <ChevronRight className="h-4 w-4" />
                العودة إلى {previousStepTitle}
              </InteractiveButton>
            ) : <div />}
          </div>
        </div>
      </div>
    </motion.section>
  );

  const loadingView = (
    <motion.section key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={shellClass} dir="rtl">
      <div className="grid min-h-[24rem] place-items-center rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.92))] p-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.92))]">
        <div className="max-w-md space-y-6 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-[0_18px_38px_rgba(99,102,241,0.18)]">
            <Waves className="h-8 w-8" />
          </motion.div>
          <div className="space-y-2">
            <p className="text-2xl font-black text-foreground">نبني مخطط الأسبوع الآن</p>
            <p className="text-sm leading-7 text-muted-foreground">{LOADING_MESSAGES[loadingIndex]}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );

  const plannerView = plan ? (
    <motion.section key="planner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={shellClass} dir="rtl">
      <PlannerHeroOverview plan={plan} summary={dashboardSummary} usage={usage} generating={generating} onRegenerateWeek={() => setReplaceDialog(true)} />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <InteractiveButton type="button" variant="outline" className="rounded-[1.2rem] px-4" onClick={() => setSettingsOpen(true)}>
            إدارة الخطة
            <Settings2 className="h-4 w-4" />
          </InteractiveButton>
          <div className="text-right"><p className="text-xl font-black text-foreground">أيام الأسبوع الحالية</p><p className="text-sm text-muted-foreground">بطاقات مضغوطة للقراءة السريعة وتفاصيل أعمق داخل السحب الجانبي.</p></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plannerDays.map((day) => (
            <PlannerDayCard key={day.dateISO} day={day} selected={selectedDay?.dateISO === day.dateISO && dayOpen} onOpen={() => openDay(day)} onRegenerate={() => handleRegenerateDay(day.dateISO)} regenerating={workingAction === "regenerate"} />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <PlannerGroceryModule grocery={plan.grocery} open={groceryOpen} onOpenChange={setGroceryOpen} />
        <PlannerSuggestionModule suggestions={plan.suggestions} />
      </div>
      {isAdmin ? (
        <div className="rounded-[1.85rem] border border-dashed border-border/60 bg-background/55 p-5 dark:bg-slate-950/45">
          <button type="button" className="flex w-full items-center justify-between gap-3 text-right" onClick={() => setDebugOpen((value) => !value)}>
            <InteractiveButton type="button" variant="ghost" size="sm" className="rounded-2xl">{debugOpen ? "إخفاء" : "عرض"}</InteractiveButton>
            <div className="text-right"><p className="text-lg font-black text-foreground">لوحة تشخيص الإدارة</p><p className="text-xs text-muted-foreground">لأخطاء الذكاء الاصطناعي أو التحميل فقط.</p></div>
          </button>
          <AnimatePresence initial={false}>
            {debugOpen ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 grid gap-3">
                  {adminDebug.length ? adminDebug.map((entry) => (
                    <div key={entry.id} className="rounded-[1.25rem] border border-border/60 bg-background/75 p-3 text-right dark:bg-slate-950/60">
                      <div className="flex items-center justify-between gap-3">
                        <PlannerMetaBadge icon={DatabaseZap} label={entry.kind} />
                        <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-GB")}</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-foreground">{entry.message}</p>
                    </div>
                  )) : <div className="rounded-[1.25rem] border border-border/60 bg-background/75 p-4 text-sm text-muted-foreground dark:bg-slate-950/60">لا توجد رسائل تشخيص حالية.</div>}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </motion.section>
  ) : (
    <section className={shellClass}>
      <EmptyState icon={Sparkles} title="لا توجد خطة نشطة بعد" description="ابدأ الإعداد السريع لننشئ خطة ذكية قابلة للتعديل طوال الأسبوع." actionLabel="بدء الإعداد" onAction={() => setStep(0)} />
    </section>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.12),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] pb-14 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)]" dir="rtl">
      <PlannerTopBar title="مخطط الوجبات الذكي" subtitle={plan ? "نطاق الأيام الحالية حتى نهاية الأسبوع" : "إعداد موجّه ثم لوحة تحكم تفاعلية"} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="px-4 pt-6 md:px-6">{hydrating ? <PlannerSkeleton /> : generating ? loadingView : plan ? plannerView : onboardingView}</main>

      <PlannerDayDrawer
        day={currentDay}
        open={dayOpen}
        onOpenChange={setDayOpen}
        expandedMealId={expandedMealId}
        onToggleMeal={(mealId) => setExpandedMealId((current) => (current === mealId ? null : mealId))}
        onRegenerateDay={handleRegenerateDay}
        onSwapMeal={handleSwapMeal}
        onRegenerateMeal={(dateISO, mealType) => handleSwapMeal(dateISO, mealType, "refresh")}
        workingAction={workingAction}
      />

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] p-0 sm:max-w-lg dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))]" dir="rtl">
          <div className="space-y-5 p-5">
            <SheetHeader className="text-right"><SheetTitle className="text-right text-2xl font-black">إدارة الخطة</SheetTitle></SheetHeader>
            <div className="rounded-[1.5rem] border border-border/60 bg-background/70 p-4 dark:bg-slate-950/60">
              <p className="text-sm font-bold text-foreground">رصيد الشهر الحالي</p>
              <div className="mt-3 grid gap-3">
                <div className="flex items-center justify-between rounded-[1rem] bg-background/70 px-3 py-2 dark:bg-slate-950/60"><span className="font-black text-foreground">{usage.generationsLeft ?? "∞"}</span><span className="text-sm text-muted-foreground">توليد الأسبوع</span></div>
                <div className="flex items-center justify-between rounded-[1rem] bg-background/70 px-3 py-2 dark:bg-slate-950/60"><span className="font-black text-foreground">{usage.dayRegenerationsLeft ?? "∞"}</span><span className="text-sm text-muted-foreground">إعادة الأيام</span></div>
                <div className="flex items-center justify-between rounded-[1rem] bg-background/70 px-3 py-2 dark:bg-slate-950/60"><span className="font-black text-foreground">{usage.swapsLeft ?? "∞"}</span><span className="text-sm text-muted-foreground">تبديل الوجبات</span></div>
              </div>
            </div>
            <div className="grid gap-3">
              <InteractiveButton type="button" className="min-h-12 rounded-[1.2rem]" onClick={() => { setSettingsOpen(false); setReplaceDialog(true); }}>
                توليد نسخة جديدة
                <RefreshCcw className="h-4 w-4" />
              </InteractiveButton>
              <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem]" onClick={() => setDeleteMode("meals")}>
                حذف الخطة الحالية فقط
                <Trash2 className="h-4 w-4" />
              </InteractiveButton>
              <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem] border-rose-500/25 text-rose-700 dark:text-rose-300" onClick={() => setDeleteMode("all")}>
                إعادة ضبط الوجبات والتفضيلات
                <AlertTriangle className="h-4 w-4" />
              </InteractiveButton>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={replaceDialog} onOpenChange={setReplaceDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-right">استبدال النسخة الحالية؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">سننشئ نسخة جديدة لهذا الأسبوع ونبقيها هي النسخة النشطة فقط.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleGenerate(true)}>متابعة التوليد</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteMode)} onOpenChange={(open) => (!open ? setDeleteMode(null) : null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">{deleteMode === "all" ? "سيتم حذف الخطة الحالية وإعادة التفضيلات إلى الإعدادات الافتراضية." : "سيتم حذف الخطة الحالية مع الاحتفاظ بالتفضيلات المحفوظة."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>تأكيد</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
