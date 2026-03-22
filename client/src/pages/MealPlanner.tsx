import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, DatabaseZap, RefreshCcw, Settings2, Sparkles, Trash2 } from "lucide-react";
import { ConversationalMealOnboarding } from "@/components/meal-planner/ConversationalMealOnboarding";
import { PlannerDayCard } from "@/components/meal-planner/PlannerDayCard";
import { PlannerDayDrawer } from "@/components/meal-planner/PlannerDayDrawer";
import { PlannerGroceryModule } from "@/components/meal-planner/PlannerGroceryModule";
import { PlannerHeroOverview } from "@/components/meal-planner/PlannerHeroOverview";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import { PlannerSuggestionModule } from "@/components/meal-planner/PlannerSuggestionModule";
import { PlannerTopBar } from "@/components/meal-planner/PlannerTopBar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showFeedbackToast } from "@/components/ui/feedback-toast";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import { type MealSwapMode, type PlannerDay, type PlannerPreferences } from "@/lib/meal-planner";

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
    generatePlan,
    regenerateDay,
    swapMeal,
    deletePlan,
  } = useMealPlanner();

  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState<null | "meals" | "all">(null);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const plan = state.activePlan;
  const plannerDays = plan?.days ?? [];
  const currentDay = (selectedDayISO ? plannerDays.find((day) => day.dateISO === selectedDayISO) : null) ?? plannerDays[0] ?? null;
  const shellClass =
    "mx-auto max-w-7xl space-y-6 rounded-[2.25rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.92))] p-4 shadow-[0_36px_120px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82),rgba(15,23,42,0.94))] dark:shadow-[0_36px_120px_rgba(2,6,23,0.56)] md:p-6";

  const toastError = (title: string, error: unknown) =>
    showFeedbackToast({
      title,
      description: error instanceof Error ? error.message : "حاول مرة أخرى.",
      tone: "error",
    });

  const openDay = (day: PlannerDay) => {
    setSelectedDayISO(day.dateISO);
    setExpandedMealId(null);
    setDayOpen(true);
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

  if (hydrating) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.12),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)]" dir="rtl">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="w-full max-w-xl rounded-[2.3rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,255,0.92))] p-8 text-center shadow-[0_36px_120px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.92))]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/12 text-primary shadow-[0_18px_38px_rgba(99,102,241,0.18)]">
              <Sparkles className="h-8 w-8" />
            </motion.div>
            <h2 className="mt-6 text-3xl font-black tracking-tight text-foreground">نجهز مساحة التخطيط الآن</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">لحظة قصيرة فقط حتى نعرف هل لديك خطة نشطة أو نبدأ الإعداد من الصفر.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <ConversationalMealOnboarding
        initialPreferences={state.preferences}
        savedPreferences={state.savedPreferences}
        generating={generating}
        errorMessage={state.lastError}
        hasActivePlan={false}
        onPreferencesSync={(preferences: PlannerPreferences) => patchPreferences(preferences)}
        onGenerate={(preferences) => generatePlan(false, preferences)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.12),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] pb-14 dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)]" dir="rtl">
      <PlannerTopBar title="مخطط الوجبات الذكي" subtitle="نطاق الأيام الحالية حتى نهاية الأسبوع" onOpenSettings={() => setSettingsOpen(true)} />
      <main className="px-4 pt-6 md:px-6">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={shellClass} dir="rtl">
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
                <PlannerDayCard key={day.dateISO} day={day} selected={selectedDayISO === day.dateISO && dayOpen} onOpen={() => openDay(day)} onRegenerate={() => handleRegenerateDay(day.dateISO)} regenerating={workingAction === "regenerate"} />
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
      </main>

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
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => generatePlan(true, state.preferences)}>متابعة التوليد</AlertDialogAction></AlertDialogFooter>
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
