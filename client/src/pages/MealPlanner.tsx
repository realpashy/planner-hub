import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Edit3,
  GlassWater,
  LayoutDashboard,
  Sparkles,
  Utensils,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { MealPlannerHeader } from "@/components/meal-planner/MealPlannerHeader";
import { MealPlannerProfileSheet } from "@/components/meal-planner/MealPlannerProfileSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import { MEAL_TYPE_LABELS, cupsToLiters, formatLiters } from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

const chartConfig = {
  completedMeals: {
    label: "الوجبات المكتملة",
    color: "hsl(172 78% 33%)",
  },
  waterCups: {
    label: "الماء",
    color: "hsl(158 84% 45%)",
  },
} as const;

function formatPercent(value: number) {
  return `${value}%`;
}

function formatDayStatus(planned: number, completed: number) {
  if (completed === 3) return "اليوم مضبوط بالكامل";
  if (planned === 0) return "ابدئي بإضافة الخطة";
  if (completed > 0) return `${completed} وجبات منجزة`;
  return `${planned} وجبات مخططة`;
}

function SummaryStat({
  title,
  value,
  note,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof Sparkles;
  iconClass: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-white/60 bg-card/90 shadow-lg dark:border-white/10">
      <CardContent className="p-4 text-right">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">{title}</p>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className="text-xs leading-5 text-muted-foreground">{note}</p>
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", iconClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MealPlanner() {
  const {
    state,
    todayISO,
    rollingDays,
    waterTargetCups,
    waterTargetLiters,
    guidanceItems,
    dashboardSeries,
    viewSummary,
    getPlan,
    updateProfile,
  } = useMealPlanner();

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(todayISO);

  const emptyMeals = viewSummary.totalMeals - viewSummary.plannedMeals;
  const weekWaterLiters = cupsToLiters(viewSummary.weeklyWaterTotal);
  const weekTargetLiters = cupsToLiters(viewSummary.weeklyWaterTarget);
  const todayPlan = getPlan(todayISO);
  const todayCompletedMeals = todayPlan.meals.filter((meal) => meal.status === "done").length;
  const todayPlannedMeals = todayPlan.meals.filter((meal) => meal.title.trim() || meal.note.trim() || meal.status !== "planned").length;
  const todayWaterPercent = Math.min(100, Math.round((todayPlan.waterCups / waterTargetCups) * 100));

  const activeDayData = useMemo(() => {
    const matched = rollingDays.find((day) => day.dateISO === activeDay) ?? rollingDays[0];
    const plan = getPlan(matched.dateISO);
    return {
      day: matched,
      plan,
      plannedMeals: plan.meals.filter((meal) => meal.title.trim() || meal.note.trim() || meal.status !== "planned").length,
      completedMeals: plan.meals.filter((meal) => meal.status === "done").length,
    };
  }, [activeDay, getPlan, rollingDays]);

  return (
    <div className="min-h-screen bg-background pb-10" dir="rtl">
      <MealPlannerHeader
        title="مخطط الوجبات"
        subtitle="عرض سريع يبدأ من اليوم مع متابعة مرئية أوضح"
        onOpenSettings={() => setProfileOpen(true)}
      />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.24),transparent_52%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_44%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-5 md:px-6 md:pt-6">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="overflow-hidden rounded-[2rem] border-white/60 bg-card/95 shadow-2xl dark:border-white/10">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.25fr,0.9fr] lg:items-stretch lg:p-6">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(17,94,89,0.98),rgba(5,150,105,0.95))] p-5 text-white shadow-xl">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_62%)] md:block" />
                    <div className="relative space-y-5 text-right">
                      <div className="flex flex-wrap justify-start gap-2">
                        <Badge className="rounded-full border-0 bg-white/15 px-3 py-1 text-white">
                          <Sparkles className="h-3.5 w-3.5" />
                          اليوم أولًا
                        </Badge>
                        <Badge className="rounded-full border-0 bg-white/10 px-3 py-1 text-white/90">
                          {rollingDays[0]?.fullLabel}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
                          تابعي خطة يومك بوضوح
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-white/80 md:text-base">
                          الواجهة الآن تبدأ من يومك الحالي، ثم تعرض بقية الأيام السبعة بشكل أخف وأوضح بدل شاشة إدخال طويلة ومربكة.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                          <p className="text-xs text-white/70">وجبات اليوم</p>
                          <p className="mt-1 text-2xl font-extrabold">{todayPlannedMeals}/3</p>
                          <p className="text-xs text-white/75">{formatDayStatus(todayPlannedMeals, todayCompletedMeals)}</p>
                        </div>
                        <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                          <p className="text-xs text-white/70">ماء اليوم</p>
                          <p className="mt-1 text-2xl font-extrabold">{todayPlan.waterCups} أكواب</p>
                          <p className="text-xs text-white/75">{formatLiters(todayPlan.waterCups)} من {waterTargetLiters.toLocaleString("en-US")} لتر</p>
                        </div>
                        <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                          <p className="text-xs text-white/70">إيقاع الأسبوع</p>
                          <p className="mt-1 text-2xl font-extrabold">{formatPercent(viewSummary.completionPercent)}</p>
                          <p className="text-xs text-white/75">{viewSummary.completedDays} أيام مكتملة من 7</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-start gap-3">
                        <Button
                          asChild
                          className="h-12 rounded-2xl border-0 bg-white px-5 text-sm font-bold text-teal-800 hover:bg-white/90"
                        >
                          <Link href={`/meal/setup?day=${todayISO}`}>
                            <Edit3 className="h-4 w-4" />
                            تعديل اليوم
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="h-12 rounded-2xl border-white/20 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/15"
                        >
                          <Link href="/meal/setup">
                            <CalendarDays className="h-4 w-4" />
                            التخطيط خطوة بخطوة
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <SummaryStat
                    title="الخطة المعبأة"
                    value={`${viewSummary.plannedMeals}/${viewSummary.totalMeals}`}
                    note={`${emptyMeals} خانات ما زالت بحاجة لترتيب`}
                    icon={Utensils}
                    iconClass="border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  />
                  <SummaryStat
                    title="الوجبات المكتملة"
                    value={`${viewSummary.completedMeals}`}
                    note={`${viewSummary.skippedMeals} تم تخطيها • ${viewSummary.eatingOutMeals} خارج البيت`}
                    icon={CheckCircle2}
                    iconClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  />
                  <SummaryStat
                    title="الماء هذا الأسبوع"
                    value={`${viewSummary.weeklyWaterTotal} كوب`}
                    note={`${weekWaterLiters.toLocaleString("en-US")} لتر من ${weekTargetLiters.toLocaleString("en-US")} لتر`}
                    icon={Droplets}
                    iconClass="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr,0.9fr]">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                <CardHeader className="pb-2 text-right">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">نظرة مرئية على الأيام السبعة القادمة</CardTitle>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        الأعمدة توضح الوجبات المكتملة، والخط يعرض الماء بالأكواب مع متابعة أسهل من شاشة واحدة.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/80 p-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <ChartContainer config={chartConfig} className="h-[18rem] w-full md:h-[20rem]">
                    <ComposedChart data={dashboardSeries} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="meals" tickLine={false} axisLine={false} domain={[0, 3]} allowDecimals={false} />
                      <YAxis yAxisId="water" orientation="left" tickLine={false} axisLine={false} domain={[0, Math.max(waterTargetCups + 1, 10)]} allowDecimals={false} hide />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) => {
                              const point = payload?.[0]?.payload as { dateISO?: string; waterLiters?: number } | undefined;
                              if (!point?.dateISO) return "";
                              return new Date(`${point.dateISO}T00:00:00`).toLocaleDateString("ar", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                              });
                            }}
                            formatter={(value, name, item) => {
                              if (name === "waterCups") {
                                const point = item.payload as { waterLiters: number };
                                return (
                                  <div className="flex flex-1 items-center justify-between gap-3">
                                    <span className="text-muted-foreground">الماء</span>
                                    <span className="font-medium text-foreground">
                                      {value} أكواب • {point.waterLiters.toLocaleString("en-US")} لتر
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex flex-1 items-center justify-between gap-3">
                                  <span className="text-muted-foreground">الوجبات المكتملة</span>
                                  <span className="font-medium text-foreground">{value}</span>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <Bar yAxisId="meals" dataKey="completedMeals" radius={[12, 12, 0, 0]} fill="var(--color-completedMeals)" barSize={28} />
                      <Line
                        yAxisId="water"
                        type="monotone"
                        dataKey="waterCups"
                        stroke="var(--color-waterCups)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 0, fill: "var(--color-waterCups)" }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="grid gap-4"
            >
              <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                <CardHeader className="pb-2 text-right">
                  <CardTitle className="text-lg">نبضة اليوم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">إكمال اليوم</p>
                        <p className="text-xs text-muted-foreground">{todayCompletedMeals} من 3 وجبات مكتملة</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-teal-500/10 px-3 py-1 text-teal-700 dark:text-teal-300">
                        {formatPercent(Math.round((todayCompletedMeals / 3) * 100))}
                      </Badge>
                    </div>
                    <Progress value={(todayCompletedMeals / 3) * 100} className="mt-3 h-2.5" />
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">الماء اليومي</p>
                        <p className="text-xs text-muted-foreground">
                          {todayPlan.waterCups} أكواب • {cupsToLiters(todayPlan.waterCups).toLocaleString("en-US")} لتر
                        </p>
                      </div>
                      <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-700 dark:text-sky-300">
                        <GlassWater className="h-5 w-5" />
                      </div>
                    </div>
                    <Progress value={todayWaterPercent} className="mt-3 h-2.5" />
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                    <p className="text-sm font-bold text-foreground">توجيهات خفيفة</p>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                      {guidanceItems.slice(0, 3).map((item) => (
                        <div key={item} className="rounded-2xl bg-card px-3 py-2">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </div>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-right">
                <h2 className="text-xl font-extrabold text-foreground">الأيام القادمة</h2>
                <p className="text-sm text-muted-foreground">اسحبي أفقيًا على الجوال، وافتحي أي يوم للتعديل بخطوة واحدة.</p>
              </div>
              <Button asChild variant="outline" className="rounded-2xl bg-card/80">
                <Link href="/meal/setup">
                  <ArrowLeft className="h-4 w-4" />
                  إدارة الخطة
                </Link>
              </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x-mandatory">
              {rollingDays.map((day, index) => {
                const plan = getPlan(day.dateISO);
                const plannedMeals = plan.meals.filter((meal) => meal.title.trim() || meal.note.trim() || meal.status !== "planned").length;
                const completedMeals = plan.meals.filter((meal) => meal.status === "done").length;
                const isActive = activeDayData.day.dateISO === day.dateISO;

                return (
                  <motion.button
                    key={day.dateISO}
                    type="button"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      "snap-center min-w-[18rem] shrink-0 rounded-[1.85rem] border p-4 text-right shadow-lg transition-all md:min-w-[20rem]",
                      isActive
                        ? "border-teal-500/25 bg-[linear-gradient(135deg,rgba(15,118,110,0.14),rgba(5,150,105,0.08))]"
                        : "border-white/60 bg-card/90 dark:border-white/10",
                    )}
                    onClick={() => setActiveDay(day.dateISO)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-foreground">{day.weekdayLabel}</p>
                        <p className="text-xs text-muted-foreground">{day.fullLabel}</p>
                      </div>
                      {day.dateISO === todayISO ? (
                        <Badge className="rounded-full border-0 bg-teal-500/10 px-3 py-1 text-teal-700 dark:text-teal-300">
                          اليوم
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {day.dayLabel}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/70 bg-background/75 p-3">
                        <p className="text-xs text-muted-foreground">الوجبات</p>
                        <p className="mt-1 text-xl font-extrabold text-foreground">{plannedMeals}/3</p>
                        <p className="text-xs text-muted-foreground">{formatDayStatus(plannedMeals, completedMeals)}</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/75 p-3">
                        <p className="text-xs text-muted-foreground">الماء</p>
                        <p className="mt-1 text-xl font-extrabold text-foreground">{plan.waterCups} كوب</p>
                        <p className="text-xs text-muted-foreground">{cupsToLiters(plan.waterCups).toLocaleString("en-US")} لتر</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {plan.meals.map((meal) => (
                        <div key={`${day.dateISO}-${meal.mealType}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/75 px-3 py-2">
                          <span className="text-xs text-muted-foreground">{MEAL_TYPE_LABELS[meal.mealType]}</span>
                          <span className="truncate text-sm font-medium text-foreground">
                            {meal.title.trim() || "غير محددة بعد"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {plan.snackNote ? <Badge variant="secondary" className="rounded-full px-2 py-0.5">سناك</Badge> : null}
                        {plan.prepNote ? <Badge variant="secondary" className="rounded-full px-2 py-0.5">تحضير</Badge> : null}
                      </div>
                      <Button asChild size="sm" variant="ghost" className="rounded-xl px-3 text-foreground">
                        <Link href={`/meal/setup?day=${day.dateISO}`}>
                          تعديل
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <AnimatePresence mode="wait">
            <motion.section
              key={activeDayData.day.dateISO}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="mt-5"
            >
              <Card className="rounded-[2rem] border-white/60 bg-card/95 shadow-xl dark:border-white/10">
                <CardHeader className="pb-2 text-right">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{activeDayData.day.fullLabel}</CardTitle>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        عرض منظم لليوم المحدد مع إمكانية الرجوع إلى شاشة الإعداد متى أردت.
                      </p>
                    </div>
                    <Button asChild className="rounded-2xl">
                      <Link href={`/meal/setup?day=${activeDayData.day.dateISO}`}>
                        <Edit3 className="h-4 w-4" />
                        تعديل هذا اليوم
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                  <div className="grid gap-3">
                    {activeDayData.plan.meals.map((meal) => (
                      <div key={`${activeDayData.day.dateISO}-${meal.mealType}`} className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{MEAL_TYPE_LABELS[meal.mealType]}</p>
                            <p className="mt-1 text-base font-semibold text-foreground">{meal.title.trim() || "غير محددة بعد"}</p>
                            {meal.note.trim() ? (
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">{meal.note}</p>
                            ) : (
                              <p className="mt-2 text-sm text-muted-foreground">لا توجد ملاحظة إضافية</p>
                            )}
                          </div>
                          <Badge
                            className={cn(
                              "rounded-full border-0 px-3 py-1",
                              meal.status === "done"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : meal.status === "eating_out"
                                  ? "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                                  : meal.status === "skipped"
                                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                    : "bg-primary/10 text-primary",
                            )}
                          >
                            {meal.status === "done"
                              ? "تمت"
                              : meal.status === "eating_out"
                                ? "خارج البيت"
                                : meal.status === "skipped"
                                  ? "تم التخطي"
                                  : meal.status === "leftover"
                                    ? "بقايا"
                                    : "مخططة"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                      <p className="text-sm font-bold text-foreground">السناك</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {activeDayData.plan.snackNote.trim() || "لا يوجد سناك محدد لهذا اليوم"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                      <p className="text-sm font-bold text-foreground">ملاحظات التحضير</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {activeDayData.plan.prepNote.trim() || "لا توجد ملاحظات تحضير مسجلة"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
                      <p className="text-sm font-bold text-foreground">الماء</p>
                      <p className="mt-2 text-lg font-extrabold text-foreground">
                        {activeDayData.plan.waterCups} أكواب
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cupsToLiters(activeDayData.plan.waterCups).toLocaleString("en-US")} لتر من {waterTargetLiters.toLocaleString("en-US")} لتر
                      </p>
                      <Progress value={Math.min(100, Math.round((activeDayData.plan.waterCups / waterTargetCups) * 100))} className="mt-3 h-2.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </AnimatePresence>

          <footer className="mt-6 text-center text-xs leading-6 text-muted-foreground">
            إشعار مهم: هذه التوجيهات عامة لتنظيم الوجبات والماء داخل التطبيق وليست نصيحة طبية أو غذائية متخصصة.
          </footer>
        </div>
      </main>

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
