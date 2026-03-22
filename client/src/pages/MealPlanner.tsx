import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, DatabaseZap, RefreshCcw, Trash2 } from "lucide-react";
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
    swapMeal,
    updateGroceryItem,
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
    "mx-auto max-w-6xl space-y-8 rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.1),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.96))] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_16%),linear-gradient(180deg,rgba(2,6,23,0.86),rgba(15,23,42,0.96))] dark:shadow-[0_34px_90px_rgba(2,6,23,0.56)] md:p-6";

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

  const handleRemoveGroceryItem = async (itemKey: string) => {
    try {
      await updateGroceryItem(itemKey, true);
      showFeedbackToast({
        title: "تم تحديث القائمة",
        description: "أخفينا العنصر من قائمة هذا الأسبوع.",
        tone: "success",
      });
    } catch (error) {
      toastError("تعذر تحديث قائمة التسوق", error);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50 pb-14 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" dir="rtl">
      {/* Decorative backgrounds */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-gradient-to-l from-orange-300/20 to-transparent blur-3xl dark:from-orange-900/20" />
        <div className="absolute bottom-1/3 left-0 h-80 w-80 rounded-full bg-gradient-to-r from-amber-300/15 to-transparent blur-3xl dark:from-amber-900/20" />
      </div>

      {hydrating ? (
        <div className="h-1 w-full bg-orange-200">
          <motion.div
            initial={{ width: "20%" }}
            animate={{ width: ["20%", "52%", "20%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
          />
        </div>
      ) : null}
      <PlannerTopBar
        title="مخطط الوجبات الذكي"
        subtitle="خطط متوازنة وسهلة على الميزانية"
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="relative px-4 pt-6 md:px-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-6xl space-y-8 rounded-3xl border-2 border-orange-200/50 bg-white/80 p-4 shadow-2xl backdrop-blur dark:border-orange-900/30 dark:bg-slate-800/80 md:p-6"
          dir="rtl"
        >
          <PlannerHeroOverview plan={plan} summary={dashboardSummary} />

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right">
                <p className="text-xl font-black text-foreground">الخطة الأسبوعية</p>
                <p className="text-sm text-muted-foreground">تدفق عمودي واضح لقراءة أيام الأسبوع من الأعلى إلى الأسفل.</p>
              </div>
              <div className="rounded-full border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-indigo-400/20 dark:bg-white/10 dark:text-indigo-200">
                افتح أي يوم لمراجعة الوجبات والتعديل الخفيف
              </div>
            </div>
            <div className="space-y-4">
              {plannerDays.map((day) => (
                <PlannerDayCard key={day.dateISO} day={day} selected={selectedDayISO === day.dateISO && dayOpen} onOpen={() => openDay(day)} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right">
                <p className="text-xl font-black text-foreground">التسوق لهذا الأسبوع</p>
                <p className="text-sm text-muted-foreground">استخدم القائمة كما هي أو أرسلها مباشرة إلى واتساب.</p>
              </div>
              <div className="rounded-full border border-emerald-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-emerald-400/20 dark:bg-white/10 dark:text-emerald-200">
                مرتبة حسب أقسام السوبرماركت
              </div>
            </div>
            <PlannerGroceryModule grocery={plan.grocery} open={groceryOpen} onOpenChange={setGroceryOpen} onRemoveItem={handleRemoveGroceryItem} />
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right">
                <p className="text-xl font-black text-foreground">إرشادات الأسبوع</p>
                <p className="text-sm text-muted-foreground">تحسينات بسيطة تبقي الخطة واضحة وغير مزدحمة.</p>
              </div>
              <div className="rounded-full border border-amber-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-amber-400/20 dark:bg-white/10 dark:text-amber-200">
                ملاحظات خفيفة فقط
              </div>
            </div>
            <PlannerSuggestionModule suggestions={plan.suggestions} />
          </div>
        </motion.section>
      </main>

      <PlannerDayDrawer
        day={currentDay}
        open={dayOpen}
        onOpenChange={setDayOpen}
        expandedMealId={expandedMealId}
        onToggleMeal={(mealId) => setExpandedMealId((current) => (current === mealId ? null : mealId))}
        onSwapMeal={handleSwapMeal}
        onRegenerateMeal={(dateISO, mealType) => handleSwapMeal(dateISO, mealType, "refresh")}
        workingAction={workingAction}
      />

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.14),transparent_22%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] p-0 sm:max-w-lg dark:bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.2),transparent_20%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))]" dir="rtl">
          <div className="space-y-5 p-5">
            <SheetHeader className="text-right">
              <SheetTitle className="text-right text-2xl font-black">إعدادات المخطط</SheetTitle>
              <p className="text-sm leading-7 text-muted-foreground">كل الإجراءات الإدارية تبقى هنا حتى تظل شاشة الخطة نفسها هادئة وواضحة.</p>
            </SheetHeader>
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/72 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] dark:border-slate-700/70 dark:bg-slate-950/60">
              <p className="text-sm font-black text-foreground">رصيد الشهر الحالي</p>
              <div className="mt-3 grid gap-3">
                <div className="flex items-center justify-between rounded-[1rem] bg-background/70 px-3 py-2 dark:bg-slate-950/60"><span className="text-sm text-muted-foreground">توليد الأسبوع</span><span className="font-black text-foreground">{usage.generationsLeft ?? "∞"}</span></div>
                <div className="flex items-center justify-between rounded-[1rem] bg-background/70 px-3 py-2 dark:bg-slate-950/60"><span className="text-sm text-muted-foreground">إعادة الأيام</span><span className="font-black text-foreground">{usage.dayRegenerationsLeft ?? "∞"}</span></div>
                <div className="flex items-center justify-between rounded-[1rem] bg-background/70 px-3 py-2 dark:bg-slate-950/60"><span className="text-sm text-muted-foreground">تبديل الوجبات</span><span className="font-black text-foreground">{usage.swapsLeft ?? "∞"}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <section className="rounded-[1.5rem] border border-indigo-200/70 bg-white/72 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] dark:border-indigo-400/15 dark:bg-slate-950/60">
                <div className="mb-3 text-right">
                  <p className="text-sm font-black text-foreground">إجراءات التوليد</p>
                  <p className="text-xs leading-6 text-muted-foreground">استخدمها عندما تريد استبدال الأسبوع الحالي بنسخة جديدة.</p>
                </div>
                <InteractiveButton type="button" className="min-h-12 rounded-[1.2rem]" onClick={() => { setSettingsOpen(false); setReplaceDialog(true); }}>
                  توليد نسخة جديدة
                  <RefreshCcw className="h-4 w-4" />
                </InteractiveButton>
              </section>

              <section className="rounded-[1.5rem] border border-rose-200/70 bg-white/72 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] dark:border-rose-400/15 dark:bg-slate-950/60">
                <div className="mb-3 text-right">
                  <p className="text-sm font-black text-foreground">إجراءات الخطة</p>
                  <p className="text-xs leading-6 text-muted-foreground">إجراءات حساسة، لذلك أبقيناها هنا بعيدًا عن واجهة التخطيط اليومية.</p>
                </div>
                <div className="grid gap-3">
                  <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem]" onClick={() => setDeleteMode("meals")}>
                    حذف الخطة الحالية فقط
                    <Trash2 className="h-4 w-4" />
                  </InteractiveButton>
                  <InteractiveButton type="button" variant="outline" className="min-h-12 rounded-[1.2rem] border-rose-500/25 text-rose-700 dark:text-rose-300" onClick={() => setDeleteMode("all")}>
                    إعادة ضبط الوجبات والتفضيلات
                    <AlertTriangle className="h-4 w-4" />
                  </InteractiveButton>
                </div>
              </section>
            </div>
            {isAdmin ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/55 p-4 dark:border-slate-600/70 dark:bg-slate-950/45">
                <button type="button" className="flex w-full items-center justify-between gap-3 text-right" onClick={() => setDebugOpen((value) => !value)}>
                  <div className="text-right">
                    <p className="text-base font-black text-foreground">لوحة تشخيص الإدارة</p>
                    <p className="text-xs text-muted-foreground">أثر الخادم وأخطاء التوليد يظهر هنا فقط للمشرف.</p>
                  </div>
                  <InteractiveButton type="button" variant="ghost" size="sm" className="rounded-2xl">
                    {debugOpen ? "إخفاء" : "عرض"}
                  </InteractiveButton>
                </button>
                <AnimatePresence initial={false}>
                  {debugOpen ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 grid gap-3">
                        {adminDebug.length ? adminDebug.map((entry) => (
                          <div key={entry.id} className="rounded-[1rem] border border-border/60 bg-background/75 p-3 text-right dark:bg-slate-950/60">
                            <div className="flex items-center justify-between gap-3">
                              <PlannerMetaBadge icon={DatabaseZap} label={entry.kind} />
                              <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-GB")}</p>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-foreground">{entry.message}</p>
                          </div>
                        )) : <div className="rounded-[1rem] border border-border/60 bg-background/75 p-4 text-sm text-muted-foreground dark:bg-slate-950/60">لا توجد رسائل تشخيص حالية.</div>}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}
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
