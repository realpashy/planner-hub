import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarRange, ChevronRight, Settings2, Utensils } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MealPlannerProfileSheet } from "@/components/meal-planner/MealPlannerProfileSheet";
import { WeeklyMealBoard } from "@/components/meal-planner/WeeklyMealBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import { type MealType } from "@/lib/meal-planner";

type CopyDialogState =
  | { open: false; mode: "day"; fromDateISO: ""; mealType: null; targetDateISO: "" }
  | { open: true; mode: "day" | "meal"; fromDateISO: string; mealType: MealType | null; targetDateISO: string };

export default function MealPlanner() {
  const {
    state,
    summary,
    weekDates,
    recentMealTitles,
    waterTargetCups,
    guidanceItems,
    setMealTitle,
    setMealStatus,
    setMealNote,
    toggleMealDone,
    updateDayMeta,
    copyDay,
    copyMealToDay,
    clearMeal,
    clearDay,
    updateProfile,
  } = useMealPlanner();

  const [profileOpen, setProfileOpen] = useState(false);
  const [copyDialog, setCopyDialog] = useState<CopyDialogState>({
    open: false,
    mode: "day",
    fromDateISO: "",
    mealType: null,
    targetDateISO: "",
  });

  const weekLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];
    if (!first || !last) return "";
    return `${first.dateLabel} - ${last.dateLabel}`;
  }, [weekDates]);

  const waterPercent = summary.weeklyWaterTarget === 0 ? 0 : Math.min(100, Math.round((summary.weeklyWaterTotal / summary.weeklyWaterTarget) * 100));
  const completionPercent = summary.plannedMeals === 0 ? 0 : Math.round((summary.completedMeals / summary.plannedMeals) * 100);

  const openCopyDayDialog = (fromDateISO: string) => {
    const firstTarget = weekDates.find((day) => day.dateISO !== fromDateISO)?.dateISO ?? "";
    setCopyDialog({
      open: true,
      mode: "day",
      fromDateISO,
      mealType: null,
      targetDateISO: firstTarget,
    });
  };

  const openCopyMealDialog = (fromDateISO: string, mealType: MealType) => {
    const firstTarget = weekDates.find((day) => day.dateISO !== fromDateISO)?.dateISO ?? "";
    setCopyDialog({
      open: true,
      mode: "meal",
      fromDateISO,
      mealType,
      targetDateISO: firstTarget,
    });
  };

  const copyMealToNextDay = (fromDateISO: string, mealType: MealType) => {
    const currentIndex = weekDates.findIndex((day) => day.dateISO === fromDateISO);
    const nextDateISO = currentIndex >= 0 ? weekDates[currentIndex + 1]?.dateISO : undefined;
    if (!nextDateISO) return;
    copyMealToDay(fromDateISO, nextDateISO, mealType);
  };

  const submitCopyDialog = () => {
    if (!copyDialog.open || !copyDialog.targetDateISO) return;

    if (copyDialog.mode === "day") {
      copyDay(copyDialog.fromDateISO, copyDialog.targetDateISO);
    } else if (copyDialog.mealType) {
      copyMealToDay(copyDialog.fromDateISO, copyDialog.targetDateISO, copyDialog.mealType);
    }

    setCopyDialog({
      open: false,
      mode: "day",
      fromDateISO: "",
      mealType: null,
      targetDateISO: "",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/" data-testid="link-back-dashboard">
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </Link>
                </Button>
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-4 rounded-[1.9rem] border border-border/80 bg-background/80 px-4 py-4 shadow-sm sm:px-5 lg:min-w-[30rem]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-300">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-foreground">مخطط الوجبات الأسبوعي</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        واجهة أسهل لتعبئة 3 وجبات رئيسية، سناك خفيف، وملاحظات التحضير من شاشة واحدة.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-border/80 bg-background/80 px-4"
                    onClick={() => setProfileOpen(true)}
                  >
                    <Settings2 className="h-4 w-4" />
                    الملف والتوجيهات
                  </Button>
                </div>

                <div className="flex flex-wrap justify-start gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                    <CalendarRange className="h-3.5 w-3.5" />
                    الأسبوع الحالي {weekLabel}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                    {recentMealTitles.length} اقتراحات سريعة
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                    هدف الماء اليومي {waterTargetCups} أكواب
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <SummaryCard
                title="تغطية الأسبوع"
                value={`${summary.plannedMeals}/${summary.totalMeals}`}
                note={`${summary.emptyMeals} خانات ما زالت فارغة`}
                accent="from-primary/15 to-transparent text-primary"
              />
              <SummaryCard
                title="الوجبات المكتملة"
                value={`${summary.completedMeals}`}
                note={`نسبة الإنجاز ${completionPercent}% من الوجبات المخططة`}
                accent="from-emerald-500/15 to-transparent text-emerald-600 dark:text-emerald-300"
              />
              <SummaryCard
                title="الماء هذا الأسبوع"
                value={`${summary.weeklyWaterTotal}/${summary.weeklyWaterTarget}`}
                note={`${summary.daysWithWaterTarget}/7 أيام حققت الهدف • ${waterPercent}%`}
                accent="from-sky-500/15 to-transparent text-sky-600 dark:text-sky-300"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6 space-y-6">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/90 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-right">
              <p className="text-base font-bold text-foreground">توجيهات هذا الأسبوع</p>
              <p className="text-sm leading-6 text-muted-foreground">
                ملاحظات عامة لمساعدتك على ترتيب الوجبات بسهولة، مع الحفاظ على بساطة التخطيط.
              </p>
            </div>

            <div className="grid gap-3 lg:max-w-3xl lg:flex-1 lg:grid-cols-2">
              {guidanceItems.slice(0, 2).map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <WeeklyMealBoard
          settings={state.settings}
          weekDates={weekDates}
          meals={state.weekPlan.meals}
          dayMeta={state.dayMeta}
          recentMealTitles={recentMealTitles}
          waterTargetCups={waterTargetCups}
          onSetMealTitle={setMealTitle}
          onSetMealStatus={setMealStatus}
          onSetMealNote={setMealNote}
          onToggleMealDone={toggleMealDone}
          onUpdateDayMeta={updateDayMeta}
          onCopyDay={copyDay}
          onOpenCopyDay={openCopyDayDialog}
          onOpenCopyMeal={openCopyMealDialog}
          onCopyMealToNextDay={copyMealToNextDay}
          onClearMeal={clearMeal}
          onClearDay={clearDay}
        />
      </main>

      <MealPlannerProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={state.profile}
        guidanceItems={guidanceItems}
        waterTargetCups={waterTargetCups}
        onUpdateProfile={updateProfile}
      />

      <Dialog open={copyDialog.open} onOpenChange={(open) => !open && setCopyDialog({ open: false, mode: "day", fromDateISO: "", mealType: null, targetDateISO: "" })}>
        <DialogContent className="max-w-md rounded-[1.75rem] p-0" dir="rtl">
          <div className="p-6">
            <DialogHeader className="text-right">
              <DialogTitle className="text-xl font-extrabold text-foreground">
                {copyDialog.mode === "day" ? "نسخ اليوم إلى يوم آخر" : "نسخ الوجبة إلى يوم آخر"}
              </DialogTitle>
              <DialogDescription className="text-right leading-6">
                سيتم استبدال المحتوى في الوجهة المحددة فقط دون التأثير على بقية الأسبوع.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-3">
              <label className="block space-y-2 text-right">
                <span className="text-sm font-semibold text-foreground">اختر يوم الهدف</span>
                <Select
                  dir="rtl"
                  value={copyDialog.targetDateISO}
                  onValueChange={(targetDateISO) => setCopyDialog((prev) => prev.open ? { ...prev, targetDateISO } : prev)}
                >
                  <SelectTrigger className="meal-select-trigger">
                    <SelectValue placeholder="اختيار يوم" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="meal-select-content">
                    {weekDates
                      .filter((day) => day.dateISO !== copyDialog.fromDateISO)
                      .map((day) => (
                        <SelectItem key={day.dateISO} value={day.dateISO} className="meal-select-item">
                          {day.dateLabel}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setCopyDialog({ open: false, mode: "day", fromDateISO: "", mealType: null, targetDateISO: "" })}>
                إلغاء
              </Button>
              <Button type="button" className="rounded-2xl" onClick={submitCopyDialog}>
                تنفيذ النسخ
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  note,
  accent,
}: {
  title: string;
  value: string;
  note: string;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/90 shadow-sm">
      <CardContent className="relative p-4 text-right">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-l ${accent}`} />
        <div className="relative">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
