import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DatabaseZap,
  Dumbbell,
  Flame,
  HeartPulse,
  ListChecks,
  RefreshCcw,
  Settings2,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  Waves,
  WheatOff,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
const LOADING_MESSAGES = ["نحلل تفضيلاتك", "نوازن المغذيات", "نرتب أيامك النشطة", "نجهز خطة يمكن الوثوق بها"];
const BUSY_DAYS = [
  ["sunday", "الأحد"],
  ["monday", "الاثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
  ["saturday", "السبت"],
] as const;
const CUISINE_OPTIONS = ["شرقي", "متوسطي", "إيطالي", "آسيوي", "خليجي", "شامي", "مكسيكي", "هندي"];
const ARRAY_FIELD_SUGGESTIONS = {
  allergies: ["لاكتوز", "مكسرات", "غلوتين", "بيض"],
  dislikedIngredients: ["فطر", "كوسا", "سمك", "بصل نيء"],
  dislikedMeals: ["شوربة ثقيلة", "سلطات باردة", "وجبات حارة جدًا"],
  foodRules: ["حلال فقط", "بدون مقليات", "بدون سكر مضاف"],
  ingredientsAtHome: ["أرز", "بيض", "شوفان", "دجاج"],
} as const;

type ArrayDraftFieldKey = keyof Pick<
  PlannerPreferences,
  "allergies" | "dislikedIngredients" | "dislikedMeals" | "foodRules" | "ingredientsAtHome"
>;

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
      preferences.fastingWindow !== "12:00 - 20:00"
  );
}

function splitDraftEntries(raw: string) {
  return raw
    .split(/[،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function getDietFeedback(preferences: PlannerPreferences) {
  const label = DIET_LABELS[preferences.dietType];
  if (preferences.snacks) return `ممتاز. سأبني نمط ${label} مع مساحة مرنة لسناك عند الحاجة.`;
  return `واضح. سأثبت نمط ${label} بخطة مركزة من دون تشتيت زائد.`;
}

function getRestrictionFeedback(preferences: PlannerPreferences) {
  const total =
    preferences.allergies.length +
    preferences.dislikedIngredients.length +
    preferences.dislikedMeals.length +
    preferences.foodRules.length;
  if (!total) return "إذا لم تكن لديك قيود محددة، سأركز على البساطة والتوازن.";
  return `تم التقاط ${total} نقطة مهمة، وسأتعامل معها مباشرة داخل التوليد.`;
}

function getGoalFeedback(preferences: PlannerPreferences) {
  if (preferences.goal === "lose_weight") return "سنُبقي الوجبات مشبعة مع ضبط الطاقة بشكل أكثر ذكاءً.";
  if (preferences.goal === "gain") return "سنرفع الكثافة الغذائية مع بروتين أوضح وتدرج مريح.";
  if (preferences.goal === "maintain") return "سنحافظ على إيقاع ثابت وواضح يناسب أيامك الحالية.";
  return "سنُعطي الأولوية لجودة الاختيارات وسهولة الاستمرار.";
}

function getExecutionFeedback(preferences: PlannerPreferences) {
  if (preferences.quickMealsPreference) return "سأعطي الأفضلية لوصفات أسرع مع خطوات قليلة وواضحة.";
  if (preferences.repeatMeals) return "ممتاز. يمكنني إعادة استخدام نفس المنطق في الأيام المتشابهة لتخفيف القرارات.";
  return "واضح. سأحافظ على تنوع أكبر مع إبقاء التنفيذ واقعيًا.";
}

function getBusyDaysFeedback(preferences: PlannerPreferences) {
  if (!preferences.busyDays.length) return "إن لم تحدد أيام ضغط، سأوزع الجهد الغذائي بشكل متوازن على الأسبوع.";
  return `سأخفف الحمل في ${preferences.busyDays.length} ${preferences.busyDays.length === 1 ? "يوم" : "أيام"} حتى تبقى الخطة مريحة.`;
}

function getFastingFeedback(preferences: PlannerPreferences) {
  if (!preferences.fastingEnabled) return "رائع. سنبقي الوجبات مرنة خلال اليوم من دون نافذة صارمة.";
  return `تم. سأرتب الوجبات داخل نافذة ${preferences.fastingWindow}.`;
}

function StepRail({ step, onJump }: { step: number; onJump: (index: number) => void }) {
  return (
    <div className="overflow-x-auto pb-1" dir="rtl">
      <div className="inline-flex min-w-max items-center gap-3 pe-1">
        {STEPS.map((title, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <div key={title} className="inline-flex items-center gap-3">
              {index > 0 ? <div className={cn("h-px w-8 rounded-full md:w-10", done ? "bg-primary/45" : "bg-border/70")} /> : null}
              <button
                type="button"
                disabled={!done}
                onClick={() => done && onJump(index)}
                className={cn("inline-flex items-center gap-2 rounded-full transition", done ? "hover:opacity-90" : "cursor-default")}
              >
                {current ? (
                  <motion.div layout className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-3 py-2 text-right shadow-[0_12px_28px_rgba(99,102,241,0.16)]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">{index + 1}</div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-sm font-black text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground">الخطوة {index + 1}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition", done ? "bg-emerald-500 text-white" : "bg-muted/90 text-muted-foreground")}>
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

function AssistantBubble({
  icon: Icon,
  eyebrow,
  title,
  description,
  feedback,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  feedback?: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,247,255,0.92))] p-5 text-right shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.72),rgba(15,23,42,0.86))]">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2 text-right">
          {eyebrow ? <p className="text-xs font-bold tracking-wide text-primary">{eyebrow}</p> : null}
          <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">{title}</h2>
          <p className="text-sm leading-8 text-muted-foreground">{description}</p>
          {feedback ? (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary dark:border-primary/20 dark:bg-primary/12">
              <Sparkles className="h-3.5 w-3.5" />
              {feedback}
            </motion.div>
          ) : null}
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:bg-primary/18">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ConversationBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-[1.7rem] border border-border/60 bg-background/78 p-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-slate-950/55">
      <div className="space-y-1">
        <p className="text-sm font-black text-foreground">{label}</p>
        {hint ? <p className="text-xs leading-6 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function DraftComposer({
  label,
  hint,
  items,
  draft,
  onDraftChange,
  onCommit,
  onRemove,
  placeholder,
  suggestions,
}: {
  label: string;
  hint: string;
  items: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onCommit: () => void;
  onRemove: (value: string) => void;
  placeholder: string;
  suggestions: readonly string[];
}) {
  return (
    <ConversationBlock label={label} hint={hint}>
      <div className="space-y-3">
        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onCommit();
            }
          }}
          placeholder={placeholder}
          className="min-h-[96px] rounded-[1.3rem] border-border/60 bg-background/80 text-right leading-7 shadow-none dark:bg-slate-950/55"
          dir="rtl"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <InteractiveButton type="button" variant="outline" className="rounded-full px-4" onClick={onCommit}>
            إضافة
            <Check className="h-4 w-4" />
          </InteractiveButton>
          <p className="text-xs leading-6 text-muted-foreground">اكتب بحرية، ثم اضغط Enter أو أضفها يدويًا.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onDraftChange(draft ? `${draft}${draft.endsWith(" ") ? "" : " "}${suggestion}` : suggestion)}
              className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/25 hover:text-primary dark:bg-slate-950/55"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="flex min-h-10 flex-wrap justify-end gap-2">
          {items.length ? (
            items.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onRemove(item)}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
              >
                {item}
                <span className="text-[11px] text-primary/70">إزالة</span>
              </button>
            ))
          ) : (
            <p className="text-xs leading-6 text-muted-foreground">لم تُضف شيئًا هنا بعد، ويمكنك الاكتفاء بذلك إذا لا توجد ملاحظات.</p>
          )}
        </div>
      </div>
    </ConversationBlock>
  );
}

function ToggleQuestionCard({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:bg-slate-950/55">
      <div className="flex items-center gap-4">
        <div className="flex-1 text-right">
          <p className="text-sm font-black text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function ChoiceGrid({
  values,
  current,
  onSelect,
  centered = false,
}: {
  values: Array<{ value: string; label: string }>;
  current: string;
  onSelect: (value: string) => void;
  centered?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", centered ? "justify-center" : "justify-end")}>
      {values.map((item) => (
        <InteractiveButton
          key={item.value}
          type="button"
          variant={current === item.value ? "default" : "outline"}
          active={current === item.value}
          className="rounded-full px-4"
          onClick={() => onSelect(item.value)}
        >
          {item.label}
        </InteractiveButton>
      ))}
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
  const [cuisineSelectValue, setCuisineSelectValue] = useState<string | undefined>(undefined);
  const [drafts, setDrafts] = useState<Record<ArrayDraftFieldKey, string>>({
    allergies: "",
    dislikedIngredients: "",
    dislikedMeals: "",
    foodRules: "",
    ingredientsAtHome: "",
  });

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

  const updateDraft = (field: ArrayDraftFieldKey, value: string) => {
    setDrafts((current) => ({ ...current, [field]: value }));
  };

  const commitDraft = (field: ArrayDraftFieldKey) => {
    const pending = splitDraftEntries(drafts[field]);
    if (!pending.length) return;
    const current = state.preferences[field] as string[];
    patchPreferences({
      [field]: Array.from(new Set([...current, ...pending])).slice(0, 10),
    } as Partial<PlannerPreferences>);
    setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: "" }));
  };

  const removeArrayItem = (field: ArrayDraftFieldKey, value: string) => {
    const current = state.preferences[field] as string[];
    patchPreferences({
      [field]: current.filter((item) => item !== value),
    } as Partial<PlannerPreferences>);
  };

  const addCuisine = (value: string) => {
    if (!value) return;
    patchPreferences({
      cuisinePreferences: Array.from(new Set([...state.preferences.cuisinePreferences, value])).slice(0, 6),
    });
    setCuisineSelectValue(undefined);
  };

  const removeCuisine = (value: string) => {
    patchPreferences({
      cuisinePreferences: state.preferences.cuisinePreferences.filter((item) => item !== value),
    });
  };

  const commitCalories = () => {
    const digitsOnly = caloriesInput.replace(/[^\d]/g, "").trim();
    const value = digitsOnly ? Number(digitsOnly) : 1900;
    patchPreferences({ caloriesTarget: value });
    setCaloriesInput(String(value));
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
          <AssistantBubble
            icon={Bot}
            eyebrow="محادثة تمهيدية سريعة"
            title="مرحبًا، سأرتب أسبوعك الغذائي خطوة بخطوة"
            description="فكر بالأمر كأنك تتحدث مع أخصائية تغذية: إجابات قصيرة، ثم أنا أتولى تحويلها إلى خطة أسبوعية واضحة."
            feedback="لن نُظهر إلا السؤال الحالي، حتى تبقى القرارات بسيطة وواضحة."
          />
          <div className="flex flex-col items-end gap-3 text-right">
            <InteractiveButton type="button" className="min-h-12 rounded-[1.2rem] px-6 shadow-[0_16px_36px_rgba(99,102,241,0.24)]" onClick={() => setStep(1)}>
              ابدأ الآن
              <ChevronLeft className="h-4 w-4" />
            </InteractiveButton>
            {canUsePreviousPreferences ? (
              <button
                type="button"
                className="text-sm font-semibold text-primary transition hover:text-primary/80"
                onClick={() => {
                  usePreviousPreferences();
                  setStep(8);
                }}
              >
                استخدام التفضيلات السابقة
              </button>
            ) : null}
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-5 text-right">
          <AssistantBubble
            icon={UtensilsCrossed}
            eyebrow="الخطوة الثانية"
            title="كيف تفضّل أن يبدو نمط أكلك اليومي؟"
            description="اختر النمط الأقرب لك، ثم أخبرني بعدد الوجبات وما إذا كنت تريد سناك، وبعدها أضف المطابخ التي تحبها."
            feedback={getDietFeedback(state.preferences)}
          />
          <ConversationBlock label="اختر أسلوب الأكل" hint="يمكنك تغييره لاحقًا إذا أردت.">
            <ChoiceGrid
              values={Object.entries(DIET_LABELS).map(([value, label]) => ({ value, label }))}
              current={state.preferences.dietType}
              onSelect={(value) => patchPreferences({ dietType: value as PlannerPreferences["dietType"] })}
            />
          </ConversationBlock>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <ConversationBlock label="كم وجبة تريد يوميًا؟" hint="سأستخدمها لتوزيع اليوم بشكل مريح.">
              <Select dir="rtl" value={String(state.preferences.mealsPerDay)} onValueChange={(value) => patchPreferences({ mealsPerDay: Number(value) as 2 | 3 | 4 })}>
                <SelectTrigger className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right">
                  <SelectValue placeholder="اختر عدد الوجبات" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="2">وجبتان</SelectItem>
                  <SelectItem value="3">3 وجبات</SelectItem>
                  <SelectItem value="4">4 وجبات</SelectItem>
                </SelectContent>
              </Select>
            </ConversationBlock>
            <ToggleQuestionCard title="سناك" description="أضفه عند الحاجة فقط، حتى تبقى الخطة أبسط وأسهل في التنفيذ." checked={state.preferences.snacks} onCheckedChange={(checked) => patchPreferences({ snacks: checked })} />
          </div>
          <ConversationBlock label="مطابخ مفضلة" hint="اختر من القائمة أو اتركها فارغة إذا تريد تنوعًا مفتوحًا.">
            <div className="space-y-3">
              <Select dir="rtl" value={cuisineSelectValue} onValueChange={(value) => addCuisine(value)}>
                <SelectTrigger className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right">
                  <SelectValue placeholder="اختر مطبخًا مفضلًا" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {CUISINE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex min-h-10 flex-wrap justify-end gap-2">
                {state.preferences.cuisinePreferences.length ? (
                  state.preferences.cuisinePreferences.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeCuisine(item)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                    >
                      {item}
                      <span className="text-[11px] text-primary/70">إزالة</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs leading-6 text-muted-foreground">لم تحدد مطابخًا مفضلة بعد، وهذا يمنحني حرية أوسع في التوليد.</p>
                )}
              </div>
            </div>
          </ConversationBlock>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4 text-right">
          <AssistantBubble
            icon={WheatOff}
            eyebrow="الخطوة الثالثة"
            title="حدثني عما يجب أن أستبعده أو أراعيه"
            description="اكتب بحرية وكأنك تشرح ما يناسبك وما لا يناسبك، وسأحوّل ذلك إلى قواعد واضحة داخل التوليد."
            feedback={getRestrictionFeedback(state.preferences)}
          />
          <DraftComposer label="الحساسيات" hint="مثال: لاكتوز، جلوتين، مكسرات." items={state.preferences.allergies} draft={drafts.allergies} onDraftChange={(value) => updateDraft("allergies", value)} onCommit={() => commitDraft("allergies")} onRemove={(value) => removeArrayItem("allergies", value)} placeholder="اكتب ما يجب تجنبه طبيًا أو غذائيًا" suggestions={ARRAY_FIELD_SUGGESTIONS.allergies} />
          <DraftComposer label="مكونات لا ترغب بها" hint="مثال: فطر، كوسا، بصل نيء." items={state.preferences.dislikedIngredients} draft={drafts.dislikedIngredients} onDraftChange={(value) => updateDraft("dislikedIngredients", value)} onCommit={() => commitDraft("dislikedIngredients")} onRemove={(value) => removeArrayItem("dislikedIngredients", value)} placeholder="اكتب المكونات التي تفضل استبعادها" suggestions={ARRAY_FIELD_SUGGESTIONS.dislikedIngredients} />
          <DraftComposer label="وجبات لا تناسبك" hint="إن كانت هناك أطباق كاملة لا ترتاح لها، اذكرها هنا." items={state.preferences.dislikedMeals} draft={drafts.dislikedMeals} onDraftChange={(value) => updateDraft("dislikedMeals", value)} onCommit={() => commitDraft("dislikedMeals")} onRemove={(value) => removeArrayItem("dislikedMeals", value)} placeholder="مثال: سلطات باردة، شوربات ثقيلة" suggestions={ARRAY_FIELD_SUGGESTIONS.dislikedMeals} />
          <DraftComposer label="قواعد غذائية إضافية" hint="مثل: بدون سكر مضاف، حلال فقط، أو تقليل المقليات." items={state.preferences.foodRules} draft={drafts.foodRules} onDraftChange={(value) => updateDraft("foodRules", value)} onCommit={() => commitDraft("foodRules")} onRemove={(value) => removeArrayItem("foodRules", value)} placeholder="اكتب أي قاعدة تريد أن ألتزم بها" suggestions={ARRAY_FIELD_SUGGESTIONS.foodRules} />
          <DraftComposer label="مكونات متوفرة في المنزل" hint="هذا يساعدني على إعادة استخدام ما لديك وتقليل الهدر." items={state.preferences.ingredientsAtHome} draft={drafts.ingredientsAtHome} onDraftChange={(value) => updateDraft("ingredientsAtHome", value)} onCommit={() => commitDraft("ingredientsAtHome")} onRemove={(value) => removeArrayItem("ingredientsAtHome", value)} placeholder="مثال: أرز، شوفان، بيض، دجاج" suggestions={ARRAY_FIELD_SUGGESTIONS.ingredientsAtHome} />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-5 text-right">
          <AssistantBubble icon={Flame} eyebrow="الخطوة الرابعة" title="ما الهدف الذي تريد أن تخدمه الخطة؟" description="اختر الاتجاه العام أولًا، ثم عدّل هدف السعرات بالطريقة التي تناسبك." feedback={getGoalFeedback(state.preferences)} />
          <ConversationBlock label="هدف الخطة" hint="هذا يوجه توزيع الوجبات، وليس فقط عدد السعرات.">
            <ChoiceGrid values={Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label }))} current={state.preferences.goal} onSelect={(value) => patchPreferences({ goal: value as GoalType })} centered />
          </ConversationBlock>
          <ConversationBlock label="هدف السعرات" hint="اكتب الرقم مباشرة، وسأحتفظ به كما تريده ثم أضبطه عند الحفظ.">
            <Input
              type="text"
              inputMode="numeric"
              value={caloriesInput}
              onChange={(event) => setCaloriesInput(event.target.value.replace(/[^\d]/g, ""))}
              onBlur={commitCalories}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitCalories();
                }
              }}
              className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right dark:bg-slate-950/55"
              placeholder="1900"
              dir="rtl"
            />
          </ConversationBlock>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-5 text-right">
          <AssistantBubble icon={HeartPulse} eyebrow="الخطوة الخامسة" title="دعنا نضبط صورة جسمك الحالية بشكل مبسط" description="لن أسألك إلا عما أحتاجه لتحسين توزيع الطاقة والبروتين. كل قيمة هنا تجعل الخطة أدق وأكثر راحة." feedback={getBMIFeedback(bmi)} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ConversationBlock label="العمر" hint="يكفي رقم تقريبي دقيق.">
              <Input type="number" value={state.preferences.age ?? ""} onChange={(event) => patchPreferences({ age: event.target.value ? Number(event.target.value) : null })} className="h-12 rounded-[1.2rem] border-border/60 text-right" placeholder="مثال: 29" dir="rtl" />
            </ConversationBlock>
            <ConversationBlock label="الجنس" hint="لتحسين المعادلات فقط.">
              <Select dir="rtl" value={state.preferences.sex} onValueChange={(value) => patchPreferences({ sex: value as SexType })}>
                <SelectTrigger className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right">
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </ConversationBlock>
            <ConversationBlock label="الطول" hint="بالسنتيمتر.">
              <Input type="number" value={state.preferences.heightCm ?? ""} onChange={(event) => patchPreferences({ heightCm: event.target.value ? Number(event.target.value) : null })} className="h-12 rounded-[1.2rem] border-border/60 text-right" placeholder="170" dir="rtl" />
            </ConversationBlock>
            <ConversationBlock label="الوزن" hint="بالكيلوغرام.">
              <Input type="number" value={state.preferences.weightKg ?? ""} onChange={(event) => patchPreferences({ weightKg: event.target.value ? Number(event.target.value) : null })} className="h-12 rounded-[1.2rem] border-border/60 text-right" placeholder="70" dir="rtl" />
            </ConversationBlock>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <ConversationBlock label="مستوى النشاط" hint="كيف يبدو يومك في المتوسط؟">
              <Select dir="rtl" value={state.preferences.activityLevel} onValueChange={(value) => patchPreferences({ activityLevel: value as PlannerPreferences["activityLevel"] })}>
                <SelectTrigger className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right">
                  <SelectValue placeholder="اختر مستوى النشاط" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ConversationBlock>
            <ToggleQuestionCard title="هل تتمرن بانتظام؟" description="سأرفع الانتباه للبروتين والتعافي إذا كانت الإجابة نعم." checked={state.preferences.workout} onCheckedChange={(checked) => patchPreferences({ workout: checked })} />
          </div>
          <div className="rounded-[1.7rem] border border-primary/15 bg-primary/8 p-4 dark:border-primary/20 dark:bg-primary/12">
            <div className="flex items-center gap-4">
              <div className="flex-1 text-right">
                <p className="text-sm font-black text-foreground">مؤشر BMI</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">{getBMIFeedback(bmi)}</p>
              </div>
              <div className="rounded-[1.2rem] bg-background px-4 py-3 text-2xl font-black text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:bg-slate-950/60">{bmi ?? "--"}</div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-5 text-right">
          <AssistantBubble icon={ListChecks} eyebrow="الخطوة السادسة" title="كيف تحب أن تُنفذ الخطة في مطبخك الحقيقي؟" description="هنا نضبط السرعة، مستوى الطبخ، التكرار، وعدد المكونات حتى تبدو الوجبات منطقية في الحياة اليومية." feedback={getExecutionFeedback(state.preferences)} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ConversationBlock label="الوقت المتاح للطبخ" hint="حتى أبقي الخطوات مناسبة لوقتك اليومي.">
              <Select dir="rtl" value={state.preferences.cookingTime} onValueChange={(value) => patchPreferences({ cookingTime: value as PlannerPreferences["cookingTime"] })}>
                <SelectTrigger className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right">
                  <SelectValue placeholder="اختر الوقت المناسب" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {Object.entries(COOKING_TIME_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ConversationBlock>
            <ConversationBlock label="مستوى مهارتك" hint="حتى لا أقترح وصفات مزعجة أو معقدة.">
              <Select dir="rtl" value={state.preferences.skillLevel} onValueChange={(value) => patchPreferences({ skillLevel: value as PlannerPreferences["skillLevel"] })}>
                <SelectTrigger className="h-12 rounded-[1.2rem] border-border/60 bg-background/80 text-right">
                  <SelectValue placeholder="اختر مستوى المهارة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ConversationBlock>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <ToggleQuestionCard title="تكرار الوجبات" description="مفيد لتخفيف القرارات الأسبوعية." checked={state.preferences.repeatMeals} onCheckedChange={(checked) => patchPreferences({ repeatMeals: checked })} />
            <ToggleQuestionCard title="إعادة استخدام البواقي" description="يساعد على تقليل الهدر وتسريع التحضير." checked={state.preferences.leftovers} onCheckedChange={(checked) => patchPreferences({ leftovers: checked })} />
            <ToggleQuestionCard title="أفضلية الوجبات السريعة" description="مفيد جدًا إذا أردت وصفات تُنجز بسرعة." checked={state.preferences.quickMealsPreference} onCheckedChange={(checked) => patchPreferences({ quickMealsPreference: checked })} />
            <ConversationBlock label="أقصى عدد مكونات في الوجبة" hint="حتى لا تصبح الوجبات طويلة أو مرهقة.">
              <Input type="number" value={state.preferences.maxIngredients} onChange={(event) => patchPreferences({ maxIngredients: Number(event.target.value) || 8 })} className="h-12 rounded-[1.2rem] border-border/60 text-right" placeholder="8" dir="rtl" />
            </ConversationBlock>
          </div>
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="space-y-5 text-right">
          <AssistantBubble icon={Dumbbell} eyebrow="الخطوة السابعة" title="ما الأيام التي تريد فيها وجبات أسهل وأخف؟" description="اختر الأيام الأكثر ضغطًا، وسأعطيها وصفات أبسط من دون أن أضعف جودة الخطة." feedback={getBusyDaysFeedback(state.preferences)} />
          <ConversationBlock label="اختر الأيام المزدحمة" hint="يمكنك اختيار أكثر من يوم بحسب جدولك.">
            <div className="flex flex-wrap justify-end gap-2">
              {BUSY_DAYS.map(([value, label]) => {
                const selected = state.preferences.busyDays.includes(value);
                return (
                  <InteractiveButton
                    key={value}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    active={selected}
                    className="rounded-full px-4"
                    onClick={() =>
                      patchPreferences({
                        busyDays: selected ? state.preferences.busyDays.filter((item) => item !== value) : [...state.preferences.busyDays, value],
                      })
                    }
                  >
                    {label}
                  </InteractiveButton>
                );
              })}
            </div>
          </ConversationBlock>
        </div>
      );
    }

    if (step === 7) {
      return (
        <div className="space-y-5 text-right">
          <AssistantBubble icon={ClipboardList} eyebrow="الخطوة الثامنة" title="هل تريد أن تتكيّف الخطة مع الصيام المتقطع؟" description="هذا سؤال سريع بنمط نعم أو لا. إذا فعلته، سأرتب الوجبات داخل نافذة الأكل فقط." feedback={getFastingFeedback(state.preferences)} />
          <ToggleQuestionCard title="الصيام المتقطع" description="فعّل هذا الخيار فقط إذا كنت تريد نافذة أكل محددة وواضحة." checked={state.preferences.fastingEnabled} onCheckedChange={(checked) => patchPreferences({ fastingEnabled: checked })} />
          {state.preferences.fastingEnabled ? (
            <ConversationBlock label="نافذة الأكل" hint="اكتبها بالطريقة الأسهل لك.">
              <Input value={state.preferences.fastingWindow} onChange={(event) => patchPreferences({ fastingWindow: event.target.value })} className="h-12 rounded-[1.2rem] border-border/60 text-right" placeholder="12:00 - 20:00" dir="rtl" />
            </ConversationBlock>
          ) : null}
        </div>
      );
    }

    const reviewSections = [
      {
        title: "أسلوب الأكل",
        value: `${DIET_LABELS[state.preferences.dietType]} • ${state.preferences.mealsPerDay} وجبات ${state.preferences.snacks ? "مع سناك" : "بدون سناك"}`,
        extra: state.preferences.cuisinePreferences.length ? state.preferences.cuisinePreferences.join(" • ") : "بدون مطابخ مفضلة محددة",
        editStep: 1,
      },
      {
        title: "القيود",
        value: state.preferences.allergies.length || state.preferences.dislikedIngredients.length || state.preferences.foodRules.length ? "تمت إضافة قيود وملاحظات" : "لا توجد قيود إضافية",
        extra: getRestrictionFeedback(state.preferences),
        editStep: 2,
      },
      {
        title: "الهدف والطاقة",
        value: `${GOAL_LABELS[state.preferences.goal]} • ${state.preferences.caloriesTarget} kcal`,
        extra: getGoalFeedback(state.preferences),
        editStep: 3,
      },
      {
        title: "بيانات الجسم",
        value: `${state.preferences.heightCm ?? "--"} سم • ${state.preferences.weightKg ?? "--"} كغ • BMI ${bmi ?? "--"}`,
        extra: getBMIFeedback(bmi),
        editStep: 4,
      },
      {
        title: "التنفيذ",
        value: `${COOKING_TIME_LABELS[state.preferences.cookingTime]} • ${SKILL_LEVEL_LABELS[state.preferences.skillLevel]}`,
        extra: getExecutionFeedback(state.preferences),
        editStep: 5,
      },
      {
        title: "الإيقاع الأسبوعي",
        value: state.preferences.busyDays.length ? state.preferences.busyDays.map((day) => BUSY_DAYS.find(([value]) => value === day)?.[1] ?? day).join(" • ") : "لا توجد أيام مزدحمة محددة",
        extra: getBusyDaysFeedback(state.preferences),
        editStep: 6,
      },
      {
        title: "الصيام",
        value: state.preferences.fastingEnabled ? `مفعّل • ${state.preferences.fastingWindow}` : "غير مفعّل",
        extra: getFastingFeedback(state.preferences),
        editStep: 7,
      },
    ];

    return (
      <div className="space-y-5 text-right">
        <AssistantBubble icon={ClipboardList} eyebrow="الخطوة الأخيرة" title="هذه هي الصورة النهائية قبل التوليد" description="راجع الأقسام بسرعة. إذا أردت تعديل أي جزء، استخدم زر التعديل السريع بدل الرجوع اليدوي بين الخطوات." feedback="بمجرد التوليد، سأحوّل هذه الإجابات إلى خطة أسبوعية نشطة وقابلة للتعديل." />
        <div className="grid gap-3 lg:grid-cols-2">
          {reviewSections.map((section) => (
            <div key={section.title} className="rounded-[1.6rem] border border-border/60 bg-background/80 p-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:bg-slate-950/55">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-black text-foreground">{section.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-7 text-foreground">{section.value}</p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{section.extra}</p>
                </div>
                <InteractiveButton type="button" variant="outline" size="sm" className="rounded-full px-3" onClick={() => setStep(section.editStep)}>
                  تعديل
                </InteractiveButton>
              </div>
            </div>
          ))}
        </div>
        {plan ? <div className="rounded-[1.45rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-800 dark:text-amber-200">سيتم إنشاء نسخة جديدة نشطة لهذا الأسبوع مع الحفاظ على النسخ السابقة داخليًا فقط.</div> : null}
      </div>
    );
  };

  const onboardingView = (
    <motion.section key="onboarding" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={shellClass} dir="rtl">
      <div className="rounded-[1.85rem] border border-white/60 bg-white/72 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/70 md:p-6">
        <div className="space-y-5">
          <div className="space-y-3 text-right">
            <div className="flex justify-end">
              <PlannerMetaBadge icon={Sparkles} label="الإعداد الذكي" tone="accent" />
            </div>
            <div className="space-y-1 text-right">
              <p className="text-3xl font-black tracking-tight text-foreground">{STEPS[step]}</p>
              <p className="text-sm text-muted-foreground">خطوة {step + 1} من {STEPS.length}</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border/70">
            <motion.div initial={{ width: 0 }} animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.35, ease: "easeOut" }} className="h-full rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.92),rgba(14,165,233,0.82))]" />
          </div>
          <StepRail step={step} onJump={setStep} />
          <Separator className="bg-border/60" />
          <div className="rounded-[1.9rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,250,252,0.9))] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(2,6,23,0.82))] md:p-6">
            <AnimatePresence mode="wait">
              <motion.div key={`step_${step}`} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22, ease: "easeOut" }} className={cn("min-h-[22rem]", step === 0 && "min-h-[14rem]")}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
          {step > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem] px-5" onClick={() => setStep((value) => Math.max(0, value - 1))}>
                <ChevronRight className="h-4 w-4" />
                {step === 1 ? "العودة إلى الرئيسية" : `العودة إلى ${STEPS[step - 1]}`}
              </InteractiveButton>
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
            </div>
          ) : null}
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
          <div className="text-right">
            <p className="text-xl font-black text-foreground">أيام الأسبوع الحالية</p>
            <p className="text-sm text-muted-foreground">بطاقات مضغوطة للقراءة السريعة وتفاصيل أعمق داخل السحب الجانبي.</p>
          </div>
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
            <InteractiveButton type="button" variant="ghost" size="sm" className="rounded-2xl">
              {debugOpen ? "إخفاء" : "عرض"}
            </InteractiveButton>
            <div className="text-right">
              <p className="text-lg font-black text-foreground">لوحة تشخيص الإدارة</p>
              <p className="text-xs text-muted-foreground">لأخطاء الذكاء الاصطناعي أو التحميل فقط.</p>
            </div>
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
            <SheetHeader className="text-right">
              <SheetTitle className="text-right text-2xl font-black">إدارة الخطة</SheetTitle>
            </SheetHeader>
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
