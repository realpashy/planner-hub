import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Copy, Sparkles, Wand2 } from "lucide-react";
import { MealPlannerHeader } from "@/components/meal-planner/MealPlannerHeader";
import { MealPlannerProfileSheet } from "@/components/meal-planner/MealPlannerProfileSheet";
import { MealSetupDayEditor } from "@/components/meal-planner/MealSetupDayEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import { MEAL_PRESETS, MEAL_TYPE_LABELS, type MealType } from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

const ALL_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

function getQueryDay() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("day");
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function updateSetupUrl(dayISO: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.pathname = "/meal/setup";
  url.searchParams.set("day", dayISO);
  window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
}

export default function MealPlannerSetup() {
  const [, navigate] = useLocation();
  const {
    state,
    planningDays,
    selectedSetupDay,
    recentMeals,
    waterTargetCups,
    waterTargetLiters,
    guidanceItems,
    setupProgress,
    getPlan,
    setSelectedSetupDay,
    setMealTitle,
    setMealStatus,
    setMealNote,
    updateDayFields,
    saveDayPlan,
    markDayComplete,
    copyDay,
    copyMeals,
    applyPreset,
    updateProfile,
  } = useMealPlanner();

  const [profileOpen, setProfileOpen] = useState(false);
  const [nextStepOpen, setNextStepOpen] = useState(false);
  const [selectedMealsToCopy, setSelectedMealsToCopy] = useState<Record<MealType, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  useEffect(() => {
    const queryDay = getQueryDay();
    if (queryDay && planningDays.some((day) => day.dateISO === queryDay) && queryDay !== selectedSetupDay) {
      setSelectedSetupDay(queryDay);
      return;
    }

    updateSetupUrl(selectedSetupDay);
  }, [planningDays, selectedSetupDay, setSelectedSetupDay]);

  const currentDay = useMemo(
    () => planningDays.find((day) => day.dateISO === selectedSetupDay) ?? planningDays[0],
    [planningDays, selectedSetupDay],
  );
  const currentPlan = getPlan(currentDay.dateISO);
  const currentIndex = planningDays.findIndex((day) => day.dateISO === currentDay.dateISO);
  const nextDay = currentIndex >= 0 ? planningDays[currentIndex + 1] : null;

  const selectedMealsCount = ALL_MEAL_TYPES.filter((mealType) => selectedMealsToCopy[mealType]).length;

  const handleDaySelection = (dateISO: string) => {
    setSelectedSetupDay(dateISO);
    updateSetupUrl(dateISO);
  };

  const handleFinishDay = () => {
    saveDayPlan(currentDay.dateISO);
    markDayComplete(currentDay.dateISO, true);
    setNextStepOpen(true);
  };

  const moveToDay = (dateISO: string) => {
    setSelectedSetupDay(dateISO);
    updateSetupUrl(dateISO);
  };

  const handleStartNextFromScratch = () => {
    if (!nextDay) {
      setNextStepOpen(false);
      navigate("/meal");
      return;
    }

    markDayComplete(nextDay.dateISO, false);
    moveToDay(nextDay.dateISO);
    setNextStepOpen(false);
  };

  const handleCopyFullDay = () => {
    if (!nextDay) {
      setNextStepOpen(false);
      return;
    }

    copyDay(currentDay.dateISO, nextDay.dateISO);
    moveToDay(nextDay.dateISO);
    setNextStepOpen(false);
  };

  const handleCopySelectedMeals = () => {
    if (!nextDay || selectedMealsCount === 0) return;

    copyMeals(
      currentDay.dateISO,
      nextDay.dateISO,
      ALL_MEAL_TYPES.filter((mealType) => selectedMealsToCopy[mealType]),
    );
    moveToDay(nextDay.dateISO);
    setNextStepOpen(false);
  };

  const handleApplyPreset = (presetId: string) => {
    if (!nextDay) return;
    applyPreset(nextDay.dateISO, presetId);
    moveToDay(nextDay.dateISO);
    setNextStepOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-10" dir="rtl">
      <MealPlannerHeader
        title="إعداد خطة الوجبات"
        subtitle="خطوة بخطوة، يوم واحد في كل مرة"
        onOpenSettings={() => setProfileOpen(true)}
      />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.22),transparent_52%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_44%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-5 md:px-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.15fr,0.95fr] lg:items-center">
                <div className="space-y-4 text-right">
                  <div className="flex flex-wrap justify-start gap-2">
                    <Badge className="rounded-full border-0 bg-teal-500/10 px-3 py-1 text-teal-700 dark:text-teal-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      تدفق إعداد أسهل
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      يبدأ من اليوم الحالي
                    </Badge>
                  </div>

                  <div>
                    <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
                      عبّئي اليوم أولًا ثم انتقلي لليوم التالي بذكاء
                    </h1>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">
                      بدل أسبوع طويل ومزدحم، صارت التجربة مقسومة إلى شاشة إعداد مركزة ثم شاشة عرض أجمل للمتابعة اليومية.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                      <p className="text-xs text-muted-foreground">أيام مكتملة</p>
                      <p className="mt-1 text-2xl font-extrabold text-foreground">{setupProgress.completedDays}</p>
                      <p className="text-xs text-muted-foreground">من {setupProgress.totalDays} يومًا</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                      <p className="text-xs text-muted-foreground">هدف الماء</p>
                      <p className="mt-1 text-2xl font-extrabold text-foreground">{waterTargetCups} أكواب</p>
                      <p className="text-xs text-muted-foreground">{waterTargetLiters.toLocaleString("en-US")} لتر يوميًا</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                      <p className="text-xs text-muted-foreground">نمط الإعداد</p>
                      <p className="mt-1 text-lg font-extrabold text-foreground">يوم واحد</p>
                      <p className="text-xs text-muted-foreground">بدون تشتيت أو تمرير طويل</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-border/70 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(5,150,105,0.05))] p-4 text-right">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">تقدم نافذة التخطيط</p>
                      <p className="text-xs text-muted-foreground">
                        {setupProgress.percent}% من الأيام ضمن الأفق الحالي تم تجهيزها
                      </p>
                    </div>
                    <Badge className="rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                      {setupProgress.percent}%
                    </Badge>
                  </div>
                  <Progress value={setupProgress.percent} className="mt-4 h-2.5" />

                  <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                    {guidanceItems.slice(0, 2).map((item) => (
                      <div key={item} className="rounded-2xl border border-border/70 bg-card/90 px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-start gap-3">
                    <Button asChild className="rounded-2xl">
                      <Link href="/meal">
                        <ArrowLeft className="h-4 w-4" />
                        العودة للعرض
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => setProfileOpen(true)}
                    >
                      <Wand2 className="h-4 w-4" />
                      الإعدادات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-right">
                <h2 className="text-lg font-extrabold text-foreground">أيام الإعداد القادمة</h2>
                <p className="text-sm text-muted-foreground">اختاري يومًا واحدًا، وركزي عليه، ثم انتقلي لليوم الذي يليه.</p>
              </div>
              {nextDay ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  التالي {nextDay.weekdayLabel}
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  نهاية الأفق الحالي
                </Badge>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x-mandatory">
              {planningDays.map((day, index) => {
                const plan = getPlan(day.dateISO);
                const plannedMeals = plan.meals.filter((meal) => meal.title.trim() || meal.note.trim() || meal.status !== "planned").length;
                const isActive = day.dateISO === currentDay.dateISO;

                return (
                  <motion.button
                    key={day.dateISO}
                    type="button"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "snap-center min-w-[9.75rem] shrink-0 rounded-[1.55rem] border px-4 py-3 text-right shadow-sm transition-all md:min-w-[10.5rem]",
                      isActive
                        ? "border-teal-500/25 bg-[linear-gradient(135deg,rgba(15,118,110,0.14),rgba(5,150,105,0.08))] shadow-lg"
                        : "border-white/60 bg-card/90 dark:border-white/10",
                    )}
                    onClick={() => handleDaySelection(day.dateISO)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-foreground">{day.weekdayLabel}</p>
                        <p className="text-xs text-muted-foreground">{day.dayLabel}</p>
                      </div>
                      {plan.isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{plannedMeals}/3 وجبات مهيأة</p>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <AnimatePresence mode="wait">
            <motion.section
              key={currentDay.dateISO}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="mt-5"
            >
              <MealSetupDayEditor
                day={currentDay}
                plan={currentPlan}
                waterTargetCups={waterTargetCups}
                waterTargetLiters={waterTargetLiters}
                recentMeals={recentMeals}
                onSetMealTitle={(mealType, title) => setMealTitle(currentDay.dateISO, mealType, title)}
                onSetMealStatus={(mealType, status) => setMealStatus(currentDay.dateISO, mealType, status)}
                onSetMealNote={(mealType, note) => setMealNote(currentDay.dateISO, mealType, note)}
                onUpdateDayFields={(patch) => updateDayFields(currentDay.dateISO, patch)}
                onFinishDay={handleFinishDay}
              />
            </motion.section>
          </AnimatePresence>

          <footer className="mt-6 text-center text-xs leading-6 text-muted-foreground">
            إشعار مهم: هذه التوجيهات عامة لتنظيم الوجبات والماء داخل التطبيق وليست نصيحة طبية أو غذائية متخصصة.
          </footer>
        </div>
      </main>

      <Drawer open={nextStepOpen} onOpenChange={setNextStepOpen}>
        <DrawerContent className="rounded-t-[2rem] border-white/60 bg-card/98" dir="rtl">
          <div className="mx-auto w-full max-w-3xl px-4 pb-6">
            <DrawerHeader className="px-0 text-right">
              <DrawerTitle className="text-2xl font-extrabold">ماذا تريدين لليوم التالي؟</DrawerTitle>
              <DrawerDescription className="leading-6 text-right">
                تم حفظ {currentDay.fullLabel}. الآن يمكنك بدء اليوم التالي من الصفر أو استخدام النسخ والتجهيز السريع.
              </DrawerDescription>
            </DrawerHeader>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className="rounded-[1.6rem] border border-border/70 bg-background/80 p-4 text-right shadow-sm transition hover:border-primary/25"
                onClick={handleStartNextFromScratch}
              >
                <p className="text-sm font-extrabold text-foreground">ابدئي اليوم التالي من الصفر</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  افتحي بطاقة اليوم التالي فارغة واملئيها بهدوء خطوة بخطوة.
                </p>
              </button>

              <button
                type="button"
                disabled={!nextDay}
                className="rounded-[1.6rem] border border-border/70 bg-background/80 p-4 text-right shadow-sm transition hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCopyFullDay}
              >
                <p className="text-sm font-extrabold text-foreground">انسخي اليوم بالكامل</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  خيار سريع عندما يكون جدول الغد قريبًا من اليوم الحالي.
                </p>
              </button>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-border/70 bg-background/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-foreground">انسخي بعض الوجبات فقط</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    اختاري ما الذي ينتقل تلقائيًا إلى اليوم التالي بدل نسخ اليوم كله.
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <Copy className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {ALL_MEAL_TYPES.map((mealType) => (
                  <label key={mealType} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/85 px-3 py-3">
                    <span className="text-sm font-medium text-foreground">{MEAL_TYPE_LABELS[mealType]}</span>
                    <Checkbox
                      checked={selectedMealsToCopy[mealType]}
                      onCheckedChange={(checked) =>
                        setSelectedMealsToCopy((prev) => ({
                          ...prev,
                          [mealType]: checked === true,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <Button
                type="button"
                className="mt-4 h-11 w-full rounded-2xl"
                disabled={!nextDay || selectedMealsCount === 0}
                onClick={handleCopySelectedMeals}
              >
                نسخ {selectedMealsCount} وجبات إلى اليوم التالي
              </Button>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-border/70 bg-background/80 p-4">
              <div className="text-right">
                <p className="text-sm font-extrabold text-foreground">استخدمي قالبًا جاهزًا</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  قوالب بسيطة محلية لتسريع الأيام المتكررة بدون أي ذكاء اصطناعي أو بيانات خارجية.
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {MEAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={!nextDay}
                    className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 text-right shadow-sm transition hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleApplyPreset(preset.id)}
                  >
                    <p className="text-sm font-extrabold text-foreground">{preset.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <DrawerFooter className="px-0">
              <Button asChild variant="outline" className="h-11 rounded-2xl">
                <Link href="/meal">الذهاب إلى شاشة العرض</Link>
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <MealPlannerProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={state.profile}
        guidanceItems={guidanceItems}
        waterTargetCups={waterTargetCups}
        waterTargetLiters={waterTargetLiters}
        onUpdateProfile={updateProfile}
      />
    </div>
  );
}
