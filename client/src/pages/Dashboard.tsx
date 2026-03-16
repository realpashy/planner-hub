import { Link } from "wouter";
import { Calendar, Wallet, Activity, Heart, CalendarDays, Target, ListTodo, Map, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const modules = [
  { id: "planner", title: "المخطط الأسبوعي", desc: "خطط أسبوعك بذكاء", icon: Calendar, color: "bg-primary/10 text-primary", active: true },
  { id: "budget", title: "الميزانيّة الشهرية", desc: "إدارة مالية شهرية واضحة", icon: Wallet, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", active: true },
  { id: "habits", title: "العادات", desc: "ابنِ عادات إيجابية", icon: Activity, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", active: false },
  { id: "life", title: "منظم الحياة", desc: "نظّم حياتك", icon: Heart, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", active: false },
  { id: "monthly", title: "التخطيط الشهري", desc: "خطط شهرك", icon: CalendarDays, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", active: false },
  { id: "goals", title: "أهداف السنة", desc: "حقق أهدافك", icon: Target, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", active: false },
  { id: "tasks", title: "تتبع المهام", desc: "تابع مهامك", icon: ListTodo, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", active: false },
  { id: "travel", title: "مخطط السفر", desc: "خطط رحلاتك", icon: Map, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", active: false },
  { id: "meal", title: "وجبات الأسبوع", desc: "خطط وجباتك", icon: Utensils, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400", active: false },
];

export default function Dashboard() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center relative">
          <div className="absolute top-0 left-0 rtl:left-auto rtl:right-0 flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={() => auth.logout()}>
              خروج
            </Button>
            <ThemeToggle />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-foreground mb-2"
          >
            مرحبا بك في <span className="text-primary">Planner Hub</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-muted-foreground font-medium"
          >
            اختر الأداة التي ترغب في استخدامها
          </motion.p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5" data-testid="modules-grid">
          {modules.map((mod, index) => {
            const Icon = mod.icon;
            const inner = (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="h-full"
              >
                <Card
                  className={cn(
                    "h-full transition-all duration-200",
                    mod.active
                      ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer border-border"
                      : "opacity-60 cursor-default border-muted"
                  )}
                  data-testid={`module-card-${mod.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center", mod.color)}>
                      <Icon className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    <h3 className="font-bold text-foreground text-base md:text-lg">{mod.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs md:text-sm text-muted-foreground font-medium">
                        {mod.active ? mod.desc : "قريبا"}
                      </p>
                      {!mod.active && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          قريبا
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );

            if (mod.active) {
              const href = mod.id === "planner" ? "/weekly-planner" : `/${mod.id}`;
              return (
                <Link key={mod.id} href={href} className="block outline-none" data-testid={`link-module-${mod.id}`}>
                  {inner}
                </Link>
              );
            }
            return <div key={mod.id}>{inner}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
