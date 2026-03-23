import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoonStar,
  RefreshCcw,
  Sparkles,
  SunMedium,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import { showFeedbackToast } from "@/components/ui/feedback-toast";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTIVITY_LABELS,
  COOKING_TIME_LABELS,
  DIET_LABELS,
  GOAL_LABELS,
  SKILL_LEVEL_LABELS,
  calculateBMI,
  getBMIFeedback,
  normalizePreferences,
  type PlannerPreferences,
  type SexType,
} from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

const BOOLEAN_QUESTION_IDS = ["snacks", "workout", "repeatMeals", "leftovers", "quickMealsPreference", "fastingEnabled"] as const;
const TAG_INPUT_QUESTION_IDS = ["allergies", "dislikedIngredients", "dislikedMeals", "foodRules", "ingredientsAtHome"] as const;
const NUMERIC_QUESTION_IDS = ["caloriesTarget", "age", "heightCm", "weightKg", "maxIngredients"] as const;
const BOOLEAN_QUESTION_SET = new Set<QuestionId>(BOOLEAN_QUESTION_IDS);
const TAG_INPUT_QUESTION_SET = new Set<QuestionId>(TAG_INPUT_QUESTION_IDS);
const NUMERIC_QUESTION_SET = new Set<QuestionId>(NUMERIC_QUESTION_IDS);
const ONBOARDING_SESSION_STORAGE_KEY = "planner_hub_meal_onboarding_session_v1";

type QuestionType =
  | "choice-single"
  | "choice-multi"
  | "yes-no"
  | "number"
  | "tag-input";

type QuestionId =
  | "dietType"
  | "mealsPerDay"
  | "snacks"
  | "cuisinePreferences"
  | "allergies"
  | "dislikedIngredients"
  | "dislikedMeals"
  | "foodRules"
  | "ingredientsAtHome"
  | "goal"
  | "caloriesTarget"
  | "age"
  | "sex"
  | "heightCm"
  | "weightKg"
  | "activityLevel"
  | "workout"
  | "cookingTime"
  | "skillLevel"
  | "repeatMeals"
  | "leftovers"
  | "quickMealsPreference"
  | "maxIngredients"
  | "busyDays"
  | "fastingEnabled"
  | "fastingWindow";

type DraftState = Record<string, string>;
type HistoryEntry = {
  id: QuestionId;
  step: number;
  title: string;
  prompt: string;
  answer: string;
};

type OnboardingSessionSnapshot = {
  started: boolean;
  mode: "welcome" | "question" | "review";
  activeQuestionId: QuestionId;
  committedPreferences: PlannerPreferences;
  drafts: DraftState;
  historyOrder: QuestionId[];
  returnToReviewAfterAnswer: boolean;
};

type QuestionConfig = {
  id: QuestionId;
  step: number;
  stepTitle: string;
  title: string;
  prompt: string;
  helper?: string;
  type: QuestionType;
  optional?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  stepValue?: number;
  placeholder?: string;
  showWhen?: (preferences: PlannerPreferences) => boolean;
  acknowledge?: (preferences: PlannerPreferences) => string;
};

const STEP_TITLES = ["مرحبًا", "أسلوب الأكل", "القيود", "الهدف", "بيانات الجسم", "التفضيلات", "الأيام المزدحمة", "الصيام", "المراجعة"];
const BUSY_DAYS = [
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الاثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
  { value: "saturday", label: "السبت" },
] as const;
const CUISINE_OPTIONS = ["شرقي", "متوسطي", "إيطالي", "آسيوي", "خليجي", "شامي", "مكسيكي", "هندي"];
const GENERATION_LINES = ["نراجع تفضيلاتك النهائية", "نوازن الأسبوع بشكل عملي", "نربط الوجبات بإيقاع أيامك", "نصيغ أول نسخة قابلة للتعديل"];
const TAG_SUGGESTIONS = {
  allergies: ["لاكتوز", "جلوتين", "مكسرات", "بيض"],
  dislikedIngredients: ["فطر", "بصل نيء", "سمك", "فلفل حار"],
  dislikedMeals: ["سلطات باردة", "شوربات ثقيلة", "أطباق حارة جدًا"],
  foodRules: ["بدون سكر مضاف", "حلال فقط", "بدون مقليات"],
  ingredientsAtHome: ["أرز", "بيض", "شوفان", "دجاج"],
} satisfies Record<Extract<QuestionId, "allergies" | "dislikedIngredients" | "dislikedMeals" | "foodRules" | "ingredientsAtHome">, string[]>;

const QUESTIONS: QuestionConfig[] = [
  { id: "dietType", step: 2, stepTitle: "أسلوب الأكل", title: "ما النمط الأقرب لك؟", prompt: "اختر أسلوب الأكل الذي تريد أن أبني عليه الأسبوع.", type: "choice-single", options: Object.entries(DIET_LABELS).map(([value, label]) => ({ value, label })), acknowledge: (preferences) => `ممتاز. سنبدأ من نمط ${DIET_LABELS[preferences.dietType]}.` },
  { id: "mealsPerDay", step: 2, stepTitle: "أسلوب الأكل", title: "كم وجبة تريد يوميًا؟", prompt: "هذا يساعدني على توزيع اليوم بشكل مريح.", type: "choice-single", options: [{ value: "2", label: "وجبتان" }, { value: "3", label: "3 وجبات" }, { value: "4", label: "4 وجبات" }], acknowledge: (preferences) => `${preferences.mealsPerDay} وجبات يوميًا خيار واضح وسهل البناء عليه.` },
  { id: "snacks", step: 2, stepTitle: "أسلوب الأكل", title: "هل تريد إضافة سناك؟", prompt: "إن كانت الإجابة نعم، سأترك مساحة مرنة خلال اليوم.", type: "yes-no", acknowledge: (preferences) => preferences.snacks ? "تم. سأترك مساحة ذكية لسناك عند الحاجة." : "واضح. سنبقي اليوم أبسط من دون سناك." },
  { id: "cuisinePreferences", step: 2, stepTitle: "أسلوب الأكل", title: "هل لديك مطابخ مفضلة؟", prompt: "اختر ما تحبه، أو اتركها مفتوحة لنطاق أوسع.", type: "choice-multi", options: CUISINE_OPTIONS.map((value) => ({ value, label: value })), optional: true, acknowledge: (preferences) => preferences.cuisinePreferences.length ? "رائع. هذا يجعل نكهة الخطة أقرب لذوقك من البداية." : "ممتاز. سأبقي التنوع مفتوحًا." },
  { id: "allergies", step: 3, stepTitle: "القيود", title: "هل لديك حساسيات يجب أن أعرفها؟", prompt: "اكتب فقط ما يجب تجنبه فعليًا.", helper: "يمكنك إضافة أكثر من عنصر واحد.", type: "tag-input", optional: true, placeholder: "مثال: لاكتوز، مكسرات", acknowledge: (preferences) => preferences.allergies.length ? "تم تسجيل الحساسيات وسأتعامل معها بصرامة." : "جيد، لا توجد حساسيات مسجلة." },
  { id: "dislikedIngredients", step: 3, stepTitle: "القيود", title: "ما المكونات التي لا تحبها؟", prompt: "أدخل فقط ما تريد استبعاده من التجربة.", type: "tag-input", optional: true, placeholder: "مثال: فطر، بصل نيء", acknowledge: (preferences) => preferences.dislikedIngredients.length ? "واضح. سأستبعد هذه المكونات من الخطة." : "ممتاز، سأحافظ على نطاق مكونات مرن." },
  { id: "dislikedMeals", step: 3, stepTitle: "القيود", title: "هل هناك وجبات كاملة لا تناسبك؟", prompt: "مثال: سلطات باردة أو شوربات ثقيلة.", type: "tag-input", optional: true, placeholder: "اكتب الوجبات التي لا ترغب بها", acknowledge: (preferences) => preferences.dislikedMeals.length ? "تم، سأبتعد عن هذه الوجبات." : "تمام، لن أقيّد نوع الأطباق من هذه الجهة." },
  { id: "foodRules", step: 3, stepTitle: "القيود", title: "هل لديك قاعدة غذائية إضافية؟", prompt: "مثل: بدون سكر مضاف، حلال فقط، تقليل المقليات.", type: "tag-input", optional: true, placeholder: "اكتب القواعد المهمة فقط", acknowledge: (preferences) => preferences.foodRules.length ? "جميل. هذه القواعد ستدخل مباشرة في التوليد." : "واضح، لا توجد قواعد إضافية الآن." },
  { id: "ingredientsAtHome", step: 3, stepTitle: "القيود", title: "هل هناك مكونات موجودة لديك بالفعل؟", prompt: "هذا يساعدني على تقليل الهدر وجعل البداية أسهل.", type: "tag-input", optional: true, placeholder: "مثال: أرز، شوفان، بيض", acknowledge: (preferences) => preferences.ingredientsAtHome.length ? "ممتاز. سأحاول إعادة استخدام ما لديك بذكاء." : "لا مشكلة، سأبني الخطة من الصفر." },
  { id: "goal", step: 4, stepTitle: "الهدف", title: "ما الهدف الأساسي الآن؟", prompt: "اختر الاتجاه العام للخطة قبل ضبط السعرات.", type: "choice-single", options: Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label })), acknowledge: (preferences) => GOAL_LABELS[preferences.goal] },
  { id: "caloriesTarget", step: 4, stepTitle: "الهدف", title: "كم هدفك اليومي للسعرات؟", prompt: "اكتب الرقم مباشرة أو عدّله بالسهمين.", type: "number", min: 1200, max: 4000, stepValue: 50 },
  { id: "age", step: 5, stepTitle: "بيانات الجسم", title: "كم عمرك؟", prompt: "رقم تقريبي دقيق يكفي.", type: "number", min: 13, max: 90, stepValue: 1 },
  { id: "sex", step: 5, stepTitle: "بيانات الجسم", title: "ما الجنس الذي تريد أن أبني عليه الحسابات؟", prompt: "هذا لتحسين التقدير فقط.", type: "choice-single", options: [{ value: "male", label: "ذكر" }, { value: "female", label: "أنثى" }] },
  { id: "heightCm", step: 5, stepTitle: "بيانات الجسم", title: "كم طولك؟", prompt: "بالسنتيمتر.", type: "number", min: 120, max: 230, stepValue: 1 },
  { id: "weightKg", step: 5, stepTitle: "بيانات الجسم", title: "وكم وزنك الحالي؟", prompt: "بالكيلوغرام.", type: "number", min: 35, max: 250, stepValue: 1 },
  { id: "activityLevel", step: 5, stepTitle: "بيانات الجسم", title: "كيف يبدو نشاطك اليومي غالبًا؟", prompt: "اختر الوصف الأقرب لروتينك.", type: "choice-single", options: Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label })) },
  { id: "workout", step: 5, stepTitle: "بيانات الجسم", title: "هل تتمرن بانتظام؟", prompt: "هذا يساعدني على توزيع البروتين والطاقة.", type: "yes-no" },
  { id: "cookingTime", step: 6, stepTitle: "التفضيلات", title: "كم وقتًا تريد أن تمنحه للطبخ؟", prompt: "أختار الوقت المناسب حتى لا تصبح الخطة عبئًا.", type: "choice-single", options: Object.entries(COOKING_TIME_LABELS).map(([value, label]) => ({ value, label })) },
  { id: "skillLevel", step: 6, stepTitle: "التفضيلات", title: "ما مستوى راحتك في المطبخ؟", prompt: "سأحافظ على الوصفات ضمن حدودك العملية.", type: "choice-single", options: Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
  { id: "repeatMeals", step: 6, stepTitle: "التفضيلات", title: "هل يناسبك تكرار بعض الوجبات؟", prompt: "التكرار يخفف القرارات ويجعل التطبيق أسهل.", type: "yes-no" },
  { id: "leftovers", step: 6, stepTitle: "التفضيلات", title: "هل تريد إعادة استخدام البواقي؟", prompt: "هذا مفيد جدًا لتقليل الجهد والهدر.", type: "yes-no" },
  { id: "quickMealsPreference", step: 6, stepTitle: "التفضيلات", title: "هل تريد أن تميل الخطة للوجبات السريعة؟", prompt: "مفيد إذا كانت أيامك مزدحمة غالبًا.", type: "yes-no" },
  { id: "maxIngredients", step: 6, stepTitle: "التفضيلات", title: "ما الحد الأقصى المقبول لعدد المكونات؟", prompt: "كلما كان الرقم أقل، أصبحت الوصفات أبسط.", type: "number", min: 4, max: 12, stepValue: 1 },
  { id: "busyDays", step: 7, stepTitle: "الأيام المزدحمة", title: "ما الأيام التي تحتاج فيها وجبات أسهل؟", prompt: "اختر كل الأيام التي تريد فيها حملًا أخف.", type: "choice-multi", options: BUSY_DAYS.map((item) => ({ value: item.value, label: item.label })), optional: true },
  { id: "fastingEnabled", step: 8, stepTitle: "الصيام", title: "هل تريد أن تتكيّف الخطة مع الصيام المتقطع؟", prompt: "إذا نعم، سأرتب الوجبات داخل نافذة الأكل.", type: "yes-no" },
  { id: "fastingWindow", step: 8, stepTitle: "الصيام", title: "ما نافذة الأكل المناسبة لك؟", prompt: "اكتبها كما تفضّل، مثل 12:00 - 20:00.", type: "tag-input", optional: false, placeholder: "12:00 - 20:00", showWhen: (preferences) => preferences.fastingEnabled, acknowledge: (preferences) => `تم. سأرتب اليوم داخل نافذة ${preferences.fastingWindow}.` },
];

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
      preferences.fastingWindow !== "12:00 - 20:00" ||
      Boolean(preferences.additionalNotes?.trim())
  );
}

function answerGridClass(optionCount: number, centered = false) {
  if (optionCount <= 3) {
    return cn("grid gap-3", optionCount === 2 ? "grid-cols-2" : "grid-cols-3");
  }
  return cn("flex flex-wrap gap-3", centered ? "justify-center" : "justify-start");
}

function answerButtonClass(active: boolean, fillWidth = false) {
  return cn(
    "inline-flex min-h-12 items-center justify-center rounded-[1.25rem] border px-4 py-3 text-sm font-bold text-center transition",
    fillWidth && "w-full",
    active
      ? "border-slate-500/35 bg-[linear-gradient(180deg,rgba(15,23,42,0.07),rgba(15,23,42,0.02))] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.52),0_8px_20px_rgba(15,23,42,0.04)] dark:border-white/15 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]"
      : "border-border/70 bg-white/82 text-foreground hover:border-slate-400/35 hover:bg-slate-900/[0.03] dark:bg-slate-950/55 dark:hover:bg-white/[0.04]",
  );
}

function parseFastingWindow(windowValue: string) {
  const [start = "12:00", end = "20:00"] = windowValue
    .split("-")
    .map((value) => value.trim())
    .filter(Boolean);
  return { start, end };
}

function answerSummary(question: QuestionConfig, preferences: PlannerPreferences) {
  switch (question.id) {
    case "dietType":
      return DIET_LABELS[preferences.dietType];
    case "mealsPerDay":
      return `${preferences.mealsPerDay} وجبات`;
    case "snacks":
    case "workout":
    case "repeatMeals":
    case "leftovers":
    case "quickMealsPreference":
    case "fastingEnabled":
      return preferences[question.id] ? "نعم" : "لا";
    case "cuisinePreferences":
      return preferences.cuisinePreferences.length ? preferences.cuisinePreferences.join(" • ") : "بدون تفضيل محدد";
    case "allergies":
    case "dislikedIngredients":
    case "dislikedMeals":
    case "foodRules":
    case "ingredientsAtHome": {
      const value = preferences[question.id];
      return value.length ? value.join(" • ") : "لا شيء إضافي";
    }
    case "goal":
      return GOAL_LABELS[preferences.goal];
    case "activityLevel":
      return ACTIVITY_LABELS[preferences.activityLevel];
    case "cookingTime":
      return COOKING_TIME_LABELS[preferences.cookingTime];
    case "skillLevel":
      return SKILL_LEVEL_LABELS[preferences.skillLevel];
    case "busyDays":
      return preferences.busyDays.length
        ? preferences.busyDays.map((day) => BUSY_DAYS.find((item) => item.value === day)?.label ?? day).join(" • ")
        : "لا أيام محددة";
    case "sex":
      return preferences.sex === "male" ? "ذكر" : "أنثى";
    case "caloriesTarget":
      return `${preferences.caloriesTarget} kcal`;
    case "age":
    case "heightCm":
    case "weightKg":
    case "maxIngredients":
      return String(preferences[question.id] ?? "—");
    case "fastingWindow":
      return preferences.fastingWindow;
    default:
      return "";
  }
}

function nextQuestionId(questions: QuestionConfig[], currentId: QuestionId, preferences: PlannerPreferences) {
  const visible = questions.filter((question) => !question.showWhen || question.showWhen(preferences));
  const index = visible.findIndex((question) => question.id === currentId);
  return visible[index + 1]?.id ?? null;
}

function previousQuestionId(questions: QuestionConfig[], currentId: QuestionId, preferences: PlannerPreferences) {
  const visible = questions.filter((question) => !question.showWhen || question.showWhen(preferences));
  const index = visible.findIndex((question) => question.id === currentId);
  return index > 0 ? visible[index - 1]?.id ?? null : null;
}

function isQuestionAnswered(question: QuestionConfig, preferences: PlannerPreferences) {
  const value = preferences[question.id as keyof PlannerPreferences];
  if (Array.isArray(value)) return value.length > 0 || Boolean(question.optional);
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0 || Boolean(question.optional);
  return value !== null && value !== undefined;
}

function splitTagDraft(value: string) {
  return value
    .split(/[،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function valueToDraft(question: QuestionConfig, preferences: PlannerPreferences) {
  const value = preferences[question.id as keyof PlannerPreferences];
  if (Array.isArray(value)) return value.join("، ");
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "";
}

function normalizeQuestionPatch(question: QuestionConfig, rawValue: string | string[] | boolean, current: PlannerPreferences): Partial<PlannerPreferences> {
  if (question.id === "mealsPerDay") return { mealsPerDay: Number(rawValue) as 2 | 3 | 4 };
  if (question.id === "dietType") return { dietType: rawValue as PlannerPreferences["dietType"] };
  if (question.id === "goal") return { goal: rawValue as PlannerPreferences["goal"] };
  if (question.id === "sex") return { sex: rawValue as SexType };
  if (question.id === "activityLevel") return { activityLevel: rawValue as PlannerPreferences["activityLevel"] };
  if (question.id === "cookingTime") return { cookingTime: rawValue as PlannerPreferences["cookingTime"] };
  if (question.id === "skillLevel") return { skillLevel: rawValue as PlannerPreferences["skillLevel"] };
  if (BOOLEAN_QUESTION_SET.has(question.id)) {
    return { [question.id]: Boolean(rawValue) } as Partial<PlannerPreferences>;
  }
  if (question.id === "cuisinePreferences" || question.id === "busyDays") {
    return { [question.id]: rawValue as string[] } as Partial<PlannerPreferences>;
  }
  if (TAG_INPUT_QUESTION_SET.has(question.id)) {
    return { [question.id]: rawValue as string[] } as Partial<PlannerPreferences>;
  }
  if (question.id === "fastingWindow") {
    return { [question.id]: String(rawValue) } as Partial<PlannerPreferences>;
  }
  if (NUMERIC_QUESTION_SET.has(question.id)) {
    const numeric = typeof rawValue === "string" ? Number(rawValue || 0) : Number(rawValue);
    return { [question.id]: numeric || (question.id === "age" || question.id === "heightCm" || question.id === "weightKg" ? null : current[question.id]) } as Partial<PlannerPreferences>;
  }
  return {};
}

interface ConversationalMealOnboardingProps {
  initialPreferences: PlannerPreferences;
  savedPreferences: PlannerPreferences | null;
  generating: boolean;
  errorMessage: string | null;
  hasActivePlan: boolean;
  onPreferencesSync: (preferences: PlannerPreferences) => void;
  onGenerate: (preferences: PlannerPreferences, replaceCurrent?: boolean) => Promise<unknown>;
}

export function ConversationalMealOnboarding({
  initialPreferences,
  savedPreferences,
  generating,
  errorMessage,
  hasActivePlan,
  onPreferencesSync,
  onGenerate,
}: ConversationalMealOnboardingProps) {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"welcome" | "question" | "review">("welcome");
  const [activeQuestionId, setActiveQuestionId] = useState<QuestionId>(QUESTIONS[0].id);
  const [committedPreferences, setCommittedPreferences] = useState<PlannerPreferences>(initialPreferences);
  const [drafts, setDrafts] = useState<DraftState>({});
  const [historyOrder, setHistoryOrder] = useState<QuestionId[]>([]);
  const [returnToReviewAfterAnswer, setReturnToReviewAfterAnswer] = useState(false);
  const [microFeedback, setMicroFeedback] = useState<string | null>(null);
  const [loadingLineIndex, setLoadingLineIndex] = useState(0);
  const [cuisineSearch, setCuisineSearch] = useState("");

  useEffect(() => {
    if (started) return;
    setCommittedPreferences(initialPreferences);
  }, [initialPreferences, started]);

  useEffect(() => {
    if (typeof window === "undefined" || started) return;
    try {
      const raw = window.localStorage.getItem(ONBOARDING_SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<OnboardingSessionSnapshot>;
      if (!parsed.started || !parsed.activeQuestionId || !parsed.committedPreferences) return;
      setStarted(true);
      setMode(parsed.mode === "review" ? "review" : parsed.mode === "question" ? "question" : "welcome");
      setActiveQuestionId(parsed.activeQuestionId);
      setCommittedPreferences(normalizePreferences(parsed.committedPreferences as PlannerPreferences));
      setDrafts(typeof parsed.drafts === "object" && parsed.drafts ? (parsed.drafts as DraftState) : {});
      setHistoryOrder(Array.isArray(parsed.historyOrder) ? (parsed.historyOrder as QuestionId[]) : []);
      setReturnToReviewAfterAnswer(Boolean(parsed.returnToReviewAfterAnswer));
    } catch {
      window.localStorage.removeItem(ONBOARDING_SESSION_STORAGE_KEY);
    }
  }, [started]);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setLoadingLineIndex((current) => (current + 1) % GENERATION_LINES.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    if (typeof window === "undefined" || !started) return;
    const snapshot: OnboardingSessionSnapshot = {
      started,
      mode,
      activeQuestionId,
      committedPreferences,
      drafts,
      historyOrder,
      returnToReviewAfterAnswer,
    };
    window.localStorage.setItem(ONBOARDING_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  }, [activeQuestionId, committedPreferences, drafts, historyOrder, mode, returnToReviewAfterAnswer, started]);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((question) => !question.showWhen || question.showWhen(committedPreferences)),
    [committedPreferences],
  );

  const activeQuestion =
    visibleQuestions.find((question) => question.id === activeQuestionId) ??
    visibleQuestions[0];

  const currentStep = mode === "welcome" ? 1 : mode === "review" ? 9 : activeQuestion?.step ?? 1;
  const currentStepTitle = mode === "welcome" ? "مرحبًا" : mode === "review" ? "المراجعة" : activeQuestion?.stepTitle ?? STEP_TITLES[0];

  const historyEntries = useMemo(() => {
    const visibleIds = new Set(visibleQuestions.map((question) => question.id));
    return historyOrder
      .map((questionId) => QUESTIONS.find((question) => question.id === questionId))
      .filter((question): question is QuestionConfig => Boolean(question))
      .filter((question) => visibleIds.has(question.id))
      .filter((question) => question.id !== activeQuestion?.id)
      .map((question) => ({
        id: question.id,
        step: question.step,
        title: question.title,
        prompt: question.prompt,
        answer: answerSummary(question, committedPreferences),
      }))
      .slice(-10)
      .reverse();
  }, [activeQuestion?.id, committedPreferences, historyOrder, visibleQuestions]);

  const bmi = useMemo(
    () => calculateBMI(committedPreferences.heightCm, committedPreferences.weightKg),
    [committedPreferences.heightCm, committedPreferences.weightKg],
  );
  const canUseSavedPreferences = useMemo(() => hasMeaningfulSavedPreferences(savedPreferences), [savedPreferences]);
  const shouldShowCurrentSelection = Boolean(
    activeQuestion &&
      (historyOrder.includes(activeQuestion.id) || returnToReviewAfterAnswer || mode === "review"),
  );

  const updateCommitted = (patch: Partial<PlannerPreferences>) => {
    const nextPreferences = normalizePreferences({
      ...committedPreferences,
      ...patch,
    });
    setCommittedPreferences(nextPreferences);
    onPreferencesSync(nextPreferences);
    return nextPreferences;
  };

  const beginQuestionFlow = (useSaved = false) => {
    const source = useSaved && savedPreferences ? normalizePreferences(savedPreferences) : normalizePreferences(initialPreferences);
    const sourceVisibleQuestions = QUESTIONS.filter((question) => !question.showWhen || question.showWhen(source));
    setStarted(true);
    setCommittedPreferences(source);
    onPreferencesSync(source);
    setMode(useSaved ? "review" : "question");
    setActiveQuestionId(QUESTIONS[0].id);
    setHistoryOrder(useSaved ? sourceVisibleQuestions.filter((question) => isQuestionAnswered(question, source)).map((question) => question.id) : []);
    setReturnToReviewAfterAnswer(false);
    setDrafts({});
    setCuisineSearch("");
  };

  const proceedAfterCommit = (question: QuestionConfig, nextPreferences: PlannerPreferences, skipFeedback = false) => {
    const nextId = nextQuestionId(QUESTIONS, question.id, nextPreferences);
    const shouldReturnToReview = returnToReviewAfterAnswer;
    const feedback = skipFeedback ? null : question.acknowledge?.(nextPreferences) ?? null;
    const finalize = () => {
      setMicroFeedback(null);
      setHistoryOrder((current) => (current.includes(question.id) ? current : [...current, question.id]));
      if (shouldReturnToReview || !nextId) {
        setMode("review");
        setReturnToReviewAfterAnswer(false);
        return;
      }
      setActiveQuestionId(nextId);
    };

    if (feedback) {
      setMicroFeedback(feedback);
      window.setTimeout(finalize, 360);
      return;
    }

    finalize();
  };

  const commitStructuredAnswer = (question: QuestionConfig, value: string | string[] | boolean, skipFeedback = false) => {
    const nextPreferences = updateCommitted(normalizeQuestionPatch(question, value, committedPreferences));
    proceedAfterCommit(question, nextPreferences, skipFeedback);
  };

  const commitDraftAnswer = (question: QuestionConfig) => {
    const rawDraft = drafts[question.id] ?? valueToDraft(question, committedPreferences);
    if (question.id === "fastingWindow") {
      const nextPreferences = updateCommitted({ fastingWindow: rawDraft.trim() || committedPreferences.fastingWindow });
      proceedAfterCommit(question, nextPreferences);
      return;
    }
    const nextPreferences = updateCommitted(normalizeQuestionPatch(question, splitTagDraft(rawDraft), committedPreferences));
    setDrafts((current) => ({ ...current, [question.id]: "" }));
    proceedAfterCommit(question, nextPreferences);
  };

  const updateDraft = (questionId: string, value: string) => {
    setDrafts((current) => ({ ...current, [questionId]: value }));
  };

  const jumpToQuestion = (questionId: QuestionId) => {
    setMode("question");
    setActiveQuestionId(questionId);
    setReturnToReviewAfterAnswer(true);
  };

  const goBack = () => {
    if (mode === "review") {
      setMode("question");
      setActiveQuestionId(activeQuestion?.id ?? QUESTIONS[0].id);
      return;
    }
    if (returnToReviewAfterAnswer) {
      setMode("review");
      setReturnToReviewAfterAnswer(false);
      return;
    }
    const previousId = activeQuestion ? previousQuestionId(QUESTIONS, activeQuestion.id, committedPreferences) : null;
    if (!previousId) {
      setMode("welcome");
      return;
    }
    setActiveQuestionId(previousId);
  };

  const submitPlan = async (replaceCurrent = false) => {
    const normalized = normalizePreferences(committedPreferences);
    setCommittedPreferences(normalized);
    onPreferencesSync(normalized);
    try {
      await onGenerate(normalized, replaceCurrent);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ONBOARDING_SESSION_STORAGE_KEY);
      }
    } catch (error) {
      showFeedbackToast({
        title: "تعذر توليد الخطة",
        description: error instanceof Error ? error.message : "حاول مرة أخرى.",
        tone: "error",
      });
    }
  };

  const renderHistory = () => (
    <div className="space-y-3">
      {historyEntries.map((entry, index) => {
        const faded = index > 5;
        return (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, x: 18, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className={cn(
              "rounded-[1.4rem] border border-white/50 bg-white/74 p-3 text-right shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/55",
              faded && "opacity-45 blur-[0.3px]",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">الخطوة {entry.step}</span>
              {index === 0 ? <span className="text-[10px] font-bold text-primary/80">الأحدث</span> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{entry.prompt}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{entry.answer}</p>
          </motion.div>
        );
      })}
    </div>
  );

  const renderQuestionBody = () => {
    if (!activeQuestion) return null;
    const rawDraft = drafts[activeQuestion.id] ?? valueToDraft(activeQuestion, committedPreferences);
    const numericValue = rawDraft || valueToDraft(activeQuestion, committedPreferences);

    if (activeQuestion.type === "choice-single") {
      const options = activeQuestion.options ?? [];
      const fillWidth = options.length <= 3;
      return (
        <div className={answerGridClass(options.length || 4, true)}>
          {options.map((option) => {
            const active = shouldShowCurrentSelection && String(committedPreferences[activeQuestion.id as keyof PlannerPreferences]) === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => commitStructuredAnswer(activeQuestion, option.value)}
                className={answerButtonClass(active, fillWidth)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }

    if (activeQuestion.type === "yes-no") {
      const currentValue = shouldShowCurrentSelection ? Boolean(committedPreferences[activeQuestion.id as keyof PlannerPreferences]) : null;
      return (
        <div className={answerGridClass(2, true)}>
          {[
            { value: true, label: "نعم" },
            { value: false, label: "لا" },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => commitStructuredAnswer(activeQuestion, option.value)}
              className={answerButtonClass(currentValue === option.value, true)}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    if (activeQuestion.type === "choice-multi") {
      const selectedValues = (committedPreferences[activeQuestion.id as keyof PlannerPreferences] as string[]) ?? [];
      const saveAndContinue = () => proceedAfterCommit(activeQuestion, committedPreferences, true);
      if (activeQuestion.id === "cuisinePreferences") {
        const filteredOptions = activeQuestion.options?.filter((option) => option.label.toLowerCase().includes(cuisineSearch.trim().toLowerCase())) ?? [];
        return (
          <div className="space-y-4">
            <Input
              value={cuisineSearch}
              onChange={(event) => setCuisineSearch(event.target.value)}
              placeholder="ابحث عن مطبخ أو اختر من الاقتراحات"
              className="h-12 rounded-[1.35rem] border-white/60 bg-white/75 text-right shadow-[0_18px_36px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/55"
              dir="rtl"
            />
            <div className="flex min-h-10 flex-wrap justify-start gap-2">
              {selectedValues.length ? (
                selectedValues.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      updateCommitted({
                        cuisinePreferences: selectedValues.filter((item) => item !== value),
                      })
                    }
                    className="relative inline-flex min-h-11 items-center rounded-[1.05rem] border border-slate-400/35 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.03))] px-4 py-2 text-xs font-semibold text-foreground shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:border-slate-500/45 dark:border-white/15 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]"
                  >
                    <span className="pointer-events-none absolute -top-2 left-2 grid h-5 w-5 place-items-center rounded-full border border-slate-300/70 bg-white text-[10px] text-muted-foreground shadow-sm dark:border-white/15 dark:bg-slate-900">
                      <X className="h-3 w-3" />
                    </span>
                    {value}
                  </button>
                ))
              ) : (
                <p className="text-xs leading-6 text-muted-foreground">اختر مطابخك المفضلة إن وُجدت، أو اتركها مفتوحة لنطاق أوسع.</p>
              )}
            </div>
            <div className="flex flex-wrap justify-start gap-3">
              {filteredOptions.map((option) => {
                const active = shouldShowCurrentSelection && selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setCuisineSearch("");
                      updateCommitted({
                        cuisinePreferences: active
                          ? selectedValues.filter((item) => item !== option.value)
                          : [...selectedValues, option.value],
                      });
                    }}
                    className={answerButtonClass(active)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-6 text-muted-foreground">{selectedValues.length ? `${selectedValues.length} اختيار` : "يمكنك المتابعة بدون اختيار إذا رغبت."}</p>
              <InteractiveButton type="button" className="rounded-full px-4" onClick={saveAndContinue}>
                متابعة
                <ChevronLeft className="h-4 w-4" />
              </InteractiveButton>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <div className={answerGridClass((activeQuestion.options ?? []).length || 4)}>
            {activeQuestion.options?.map((option) => {
              const active = shouldShowCurrentSelection && selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateCommitted({
                    [activeQuestion.id]: active ? selectedValues.filter((item) => item !== option.value) : [...selectedValues, option.value],
                  } as Partial<PlannerPreferences>)}
                  className={answerButtonClass(active, (activeQuestion.options?.length ?? 0) <= 3)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-6 text-muted-foreground">{selectedValues.length ? `${selectedValues.length} اختيار` : "يمكنك المتابعة بدون اختيار إذا رغبت."}</p>
            <InteractiveButton type="button" className="rounded-full px-4" onClick={saveAndContinue}>
              {returnToReviewAfterAnswer ? "حفظ والعودة للمراجعة" : "متابعة"}
              <ChevronLeft className="h-4 w-4" />
            </InteractiveButton>
          </div>
        </div>
      );
    }

    if (activeQuestion.type === "number") {
      const stepValue = activeQuestion.stepValue ?? 1;
      const currentNumeric = Number(numericValue || committedPreferences[activeQuestion.id as keyof PlannerPreferences] || activeQuestion.min || 0);
      const applyNumber = (nextValue: number) => updateDraft(activeQuestion.id, String(nextValue));
      const commitNumber = () => commitStructuredAnswer(activeQuestion, numericValue || String(currentNumeric), true);
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[1.7rem] border border-white/60 bg-white/75 p-3 shadow-[0_18px_36px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/55">
            <button type="button" className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/15" onClick={() => applyNumber(Math.max(activeQuestion.min ?? 0, currentNumeric - stepValue))}>
              -
            </button>
            <Input
              type="text"
              inputMode="numeric"
              value={numericValue}
              onChange={(event) => updateDraft(activeQuestion.id, event.target.value.replace(/[^\d]/g, ""))}
              onBlur={commitNumber}
              className="h-14 flex-1 rounded-[1.35rem] border-0 bg-transparent text-center text-2xl font-black shadow-none focus-visible:ring-0"
            />
            <button type="button" className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/15" onClick={() => applyNumber(Math.min(activeQuestion.max ?? 9999, currentNumeric + stepValue))}>
              +
            </button>
          </div>
          <div className="flex justify-start">
            <InteractiveButton type="button" className="rounded-full px-4" onClick={commitNumber}>
              {returnToReviewAfterAnswer ? "حفظ والعودة للمراجعة" : "متابعة"}
              <ChevronLeft className="h-4 w-4" />
            </InteractiveButton>
          </div>
        </div>
      );
    }

    if (activeQuestion.id === "fastingWindow") {
      const parsedWindow = parseFastingWindow(rawDraft || committedPreferences.fastingWindow);
      const updateWindowPart = (part: "start" | "end", value: string) => {
        const next = {
          ...parsedWindow,
          [part]: value,
        };
        updateDraft(activeQuestion.id, `${next.start} - ${next.end}`);
      };
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ConversationTimeField
              label="بداية نافذة الأكل"
              value={parsedWindow.start}
              onChange={(value) => updateWindowPart("start", value)}
            />
            <ConversationTimeField
              label="نهاية نافذة الأكل"
              value={parsedWindow.end}
              onChange={(value) => updateWindowPart("end", value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-6 text-muted-foreground">اختر وقت البداية والنهاية وسأرتب الوجبات داخل هذه النافذة تلقائيًا.</p>
            <InteractiveButton type="button" className="rounded-full px-4" onClick={() => commitDraftAnswer(activeQuestion)}>
              {returnToReviewAfterAnswer ? "حفظ والعودة للمراجعة" : "متابعة"}
              <ChevronLeft className="h-4 w-4" />
            </InteractiveButton>
          </div>
        </div>
      );
    }

    const chips = activeQuestion.id in TAG_SUGGESTIONS ? TAG_SUGGESTIONS[activeQuestion.id as keyof typeof TAG_SUGGESTIONS] : [];
    const committedItems = (committedPreferences[activeQuestion.id as keyof PlannerPreferences] as string[]) ?? [];

    return (
      <div className="space-y-4">
        <Textarea
          value={rawDraft}
          onChange={(event) => updateDraft(activeQuestion.id, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              commitDraftAnswer(activeQuestion);
            }
          }}
          placeholder={activeQuestion.placeholder}
          className="min-h-[120px] rounded-[1.6rem] border-white/60 bg-white/75 text-right leading-8 shadow-[0_18px_36px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/55"
          dir="rtl"
        />
        {chips.length ? (
          <div className="flex flex-wrap justify-start gap-2">
            {chips.map((chip) => (
              <button key={chip} type="button" onClick={() => updateDraft(activeQuestion.id, rawDraft ? `${rawDraft}${rawDraft.endsWith(" ") ? "" : " "}${chip}` : chip)} className="rounded-full border border-border/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/20 hover:text-primary dark:bg-slate-950/55">
                {chip}
              </button>
            ))}
          </div>
        ) : null}
        {committedItems.length ? (
          <div className="flex flex-wrap justify-start gap-2">
            {committedItems.map((item) => (
              <span key={item} className="rounded-full border border-slate-300/60 bg-slate-900/[0.04] px-3 py-1.5 text-xs font-semibold text-foreground dark:border-white/10 dark:bg-white/[0.05]">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-6 text-muted-foreground">اكتب بحرية، ثم تابع عندما تنتهي.</p>
          <InteractiveButton type="button" className="rounded-full px-4" onClick={() => commitDraftAnswer(activeQuestion)}>
            {returnToReviewAfterAnswer ? "حفظ والعودة للمراجعة" : "متابعة"}
            <ChevronLeft className="h-4 w-4" />
          </InteractiveButton>
        </div>
      </div>
    );
  };

  const reviewSections = [
    {
      title: "أسلوب الأكل",
      rows: [
        { label: "النمط", value: DIET_LABELS[committedPreferences.dietType], questionId: "dietType" as QuestionId },
        { label: "عدد الوجبات", value: `${committedPreferences.mealsPerDay} وجبات`, questionId: "mealsPerDay" as QuestionId },
        { label: "سناك", value: committedPreferences.snacks ? "نعم" : "لا", questionId: "snacks" as QuestionId },
        { label: "المطابخ", value: committedPreferences.cuisinePreferences.length ? committedPreferences.cuisinePreferences.join(" • ") : "بدون تفضيل محدد", questionId: "cuisinePreferences" as QuestionId },
      ],
    },
    {
      title: "القيود",
      rows: [
        { label: "الحساسيات", value: committedPreferences.allergies.join(" • ") || "لا شيء", questionId: "allergies" as QuestionId },
        { label: "المكونات غير المفضلة", value: committedPreferences.dislikedIngredients.join(" • ") || "لا شيء", questionId: "dislikedIngredients" as QuestionId },
        { label: "وجبات لا تريدها", value: committedPreferences.dislikedMeals.join(" • ") || "لا شيء", questionId: "dislikedMeals" as QuestionId },
        { label: "قواعد إضافية", value: committedPreferences.foodRules.join(" • ") || "لا شيء", questionId: "foodRules" as QuestionId },
      ],
    },
    {
      title: "الهدف والصحة",
      rows: [
        { label: "الهدف", value: GOAL_LABELS[committedPreferences.goal], questionId: "goal" as QuestionId },
        { label: "السعرات", value: `${committedPreferences.caloriesTarget} kcal`, questionId: "caloriesTarget" as QuestionId },
        { label: "الطول / الوزن", value: `${committedPreferences.heightCm ?? "—"} سم • ${committedPreferences.weightKg ?? "—"} كغ`, questionId: "heightCm" as QuestionId },
        { label: "BMI", value: bmi ? String(bmi) : "غير مكتمل", questionId: "weightKg" as QuestionId },
      ],
    },
    {
      title: "التنفيذ",
      rows: [
        { label: "الوقت", value: COOKING_TIME_LABELS[committedPreferences.cookingTime], questionId: "cookingTime" as QuestionId },
        { label: "المهارة", value: SKILL_LEVEL_LABELS[committedPreferences.skillLevel], questionId: "skillLevel" as QuestionId },
        { label: "أيام الضغط", value: committedPreferences.busyDays.length ? committedPreferences.busyDays.map((day) => BUSY_DAYS.find((item) => item.value === day)?.label ?? day).join(" • ") : "لا شيء", questionId: "busyDays" as QuestionId },
        { label: "الصيام", value: committedPreferences.fastingEnabled ? committedPreferences.fastingWindow : "غير مفعّل", questionId: committedPreferences.fastingEnabled ? ("fastingWindow" as QuestionId) : ("fastingEnabled" as QuestionId) },
      ],
    },
  ];

  if (generating) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.18),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_22%),linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)]" dir="rtl">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="w-full max-w-xl rounded-[2.4rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,255,0.92))] p-8 text-center shadow-[0_36px_120px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.92))]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/12 text-primary shadow-[0_18px_38px_rgba(99,102,241,0.18)]">
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h2 className="mt-6 text-3xl font-black tracking-tight text-foreground">نبني الخطة الأولى الآن</h2>
            <div className="mt-4 space-y-3 text-right">
              <p className="text-sm font-bold text-primary/85">{GENERATION_LINES[loadingLineIndex]}</p>
              <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  initial={{ x: "-120%" }}
                  animate={{ x: ["-120%", "260%"] }}
                  transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-[42%] rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.92),rgba(56,189,248,0.88))]"
                />
              </div>
              <p className="text-xs leading-6 text-muted-foreground">نحاول إنهاء الطلب بسرعة ومن دون فقدان إجاباتك الحالية.</p>
            </div>
            {errorMessage ? <p className="mt-5 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-300">{errorMessage}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.18),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_52%,#f8fafc_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_22%),linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)]" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1 text-right">
            <p className="text-xs font-bold tracking-[0.24em] text-primary">MEAL PLANNER</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground md:text-3xl">{mode === "review" ? "المراجعة النهائية" : currentStepTitle}</h1>
            <p className="text-sm text-muted-foreground">الخطوة {currentStep} من 9</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <InteractiveButton type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white/70 dark:bg-slate-950/55" asChild>
              <Link href="/">
                <ArrowUpLeft className="h-5 w-5" />
              </Link>
            </InteractiveButton>
          </div>
        </header>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
          <motion.div animate={{ width: `${(currentStep / 9) * 100}%` }} transition={{ duration: 0.22, ease: "easeOut" }} className="h-full rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.92),rgba(56,189,248,0.88))]" />
        </div>

        <div className="flex flex-1 flex-col gap-6 xl:flex-row">
          <main className="order-1 flex-1 xl:basis-[64%]">
            <div className="rounded-[2.4rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,255,0.92))] p-6 shadow-[0_36px_120px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.92))] md:p-8">
              {errorMessage ? <div className="mb-5 rounded-[1.2rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-right text-sm leading-7 text-rose-700 dark:text-rose-300">{errorMessage}</div> : null}

              {mode === "welcome" ? (
                <div className="space-y-8 text-right">
                  <AssistantPrompt title="لنحوّل أسبوعك الغذائي إلى خطة شخصية واضحة" prompt="تخيلها كمحادثة قصيرة مع أخصائية تغذية. سؤال واحد في كل مرة، وإجابات سريعة، ثم أنا أتولى الباقي." helper="أغلب المستخدمين ينهون هذا الإعداد خلال 3 إلى 5 دقائق فقط." />
                  <div className="flex flex-col items-start gap-3">
                    <InteractiveButton type="button" className="min-h-12 rounded-full px-6 shadow-[0_18px_34px_rgba(99,102,241,0.24)]" onClick={() => beginQuestionFlow(false)}>
                      ابدأ الآن
                      <ChevronLeft className="h-4 w-4" />
                    </InteractiveButton>
                    {canUseSavedPreferences ? (
                      <button type="button" className="text-sm font-semibold text-primary transition hover:text-primary/80" onClick={() => beginQuestionFlow(true)}>
                        استخدام التفضيلات السابقة
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : mode === "review" ? (
                <div className="space-y-6 text-right">
                  <AssistantPrompt title="راجع الخطة الأولية قبل التوليد" prompt="يمكنك تعديل أي جزء مباشرة من هنا، ثم العودة للمراجعة بدون الرجوع خلال كل الأسئلة." helper="أضف أي ملاحظة أخيرة فقط إذا ستغيّر نوعية الخطة فعلًا." />
                  <div className="grid gap-4 lg:grid-cols-2">
                    {reviewSections.map((section) => (
                      <div key={section.title} className="rounded-[1.7rem] border border-white/60 bg-white/72 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/52">
                        <p className="text-sm font-black text-foreground">{section.title}</p>
                        <div className="mt-3 space-y-3">
                          {section.rows.map((row) => (
                            <div key={`${section.title}_${row.label}`} className="flex items-start justify-between gap-3">
                              <div className="flex-1 text-right">
                                <p className="text-xs text-muted-foreground">{row.label}</p>
                                <p className="mt-1 text-sm font-semibold text-foreground">{row.value}</p>
                              </div>
                              <InteractiveButton type="button" variant="outline" size="sm" className="rounded-full px-3" onClick={() => jumpToQuestion(row.questionId)}>
                                تعديل
                              </InteractiveButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.8rem] border border-white/60 bg-white/72 p-4 dark:border-white/10 dark:bg-slate-950/52">
                    <p className="text-sm font-black text-foreground">أي شيء إضافي تحب تضيفه قبل توليد الخطة؟</p>
                    <Textarea value={committedPreferences.additionalNotes ?? ""} onChange={(event) => updateCommitted({ additionalNotes: event.target.value })} placeholder="اكتب ملاحظة أخيرة فقط إذا كانت ستؤثر فعلاً على الخطة." className="mt-3 min-h-[110px] rounded-[1.4rem] border-white/60 bg-white/78 text-right shadow-none dark:border-white/10 dark:bg-slate-950/60" dir="rtl" />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {hasActivePlan ? (
                      <InteractiveButton type="button" variant="outline" className="rounded-full px-5" onClick={() => submitPlan(true)}>
                        <RefreshCcw className="h-4 w-4" />
                        استبدال الخطة الحالية
                      </InteractiveButton>
                    ) : <span />}
                    <InteractiveButton type="button" className="min-h-12 rounded-full px-6 shadow-[0_18px_34px_rgba(99,102,241,0.24)]" onClick={() => submitPlan(Boolean(hasActivePlan))}>
                      توليد الخطة الأسبوعية
                      <Sparkles className="h-4 w-4" />
                    </InteractiveButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-right">
                  <AssistantPrompt title={activeQuestion?.title ?? ""} prompt={activeQuestion?.prompt ?? ""} helper={activeQuestion?.helper} />
                  <div className="rounded-[1.8rem] border border-white/60 bg-white/72 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/52">
                    {renderQuestionBody()}
                  </div>
                  <AnimatePresence initial={false}>
                    {microFeedback ? (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary dark:border-primary/20 dark:bg-primary/12">
                        <Sparkles className="h-4 w-4" />
                        {microFeedback}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      {activeQuestion?.optional ? (
                        <button type="button" className="text-sm font-semibold text-muted-foreground transition hover:text-foreground" onClick={() => {
                          const nextId = activeQuestion ? nextQuestionId(QUESTIONS, activeQuestion.id, committedPreferences) : null;
                          if (returnToReviewAfterAnswer || !nextId) {
                            setMode("review");
                            setReturnToReviewAfterAnswer(false);
                          } else {
                            setActiveQuestionId(nextId);
                          }
                        }}>
                          تخطي
                        </button>
                      ) : null}
                      <InteractiveButton type="button" variant="outline" className="rounded-full px-4" onClick={goBack}>
                        <ChevronRight className="h-4 w-4" />
                        {returnToReviewAfterAnswer ? "العودة إلى المراجعة" : currentStep === 2 && activeQuestion?.id === "dietType" ? "العودة إلى الرئيسية" : "السؤال السابق"}
                      </InteractiveButton>
                    </div>
                    <PlannerMetaBadge icon={SunMedium} label={`${currentStepTitle} • سؤال واحد في التركيز`} />
                  </div>
                </div>
              )}
            </div>
          </main>

          <aside className="order-2 xl:w-[24rem] xl:min-w-[24rem]">
            <div className="rounded-[2rem] border border-white/60 bg-white/62 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/48">
              <div className="mb-3 flex items-center justify-between">
                <PlannerMetaBadge icon={MoonStar} label="السياق الحديث" tone="accent" />
                <span className="text-xs text-muted-foreground">آخر {Math.min(historyEntries.length, 10)} إجابات</span>
              </div>
              {historyEntries.length ? renderHistory() : <p className="text-sm leading-7 text-muted-foreground">سنحتفظ هنا بآخر الإجابات حتى تشعر أن المحادثة تتقدم فعلاً، من دون ازدحام بصري.</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AssistantPrompt({ title, prompt, helper }: { title: string; prompt: string; helper?: string }) {
  return (
    <div className="space-y-3 text-right">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
        <Bot className="h-3.5 w-3.5" />
        مساعدك الغذائي
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{title}</h2>
        <p className="max-w-2xl text-sm leading-8 text-muted-foreground">{prompt}</p>
        {helper ? <p className="text-xs leading-6 text-muted-foreground">{helper}</p> : null}
      </div>
    </div>
  );
}

function ConversationTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/60 bg-white/78 p-4 text-right shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/55">
      <p className="mb-3 text-sm font-black text-foreground">{label}</p>
      <div className="relative">
        <Input
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-[1.1rem] border-border/70 bg-background/85 pl-11 pr-4 text-right shadow-none [direction:ltr] [appearance:textfield] [&::-webkit-calendar-picker-indicator]:opacity-0"
          dir="ltr"
        />
        <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
