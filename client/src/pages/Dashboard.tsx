import { Link } from "wouter";
import { Calendar, Wallet, Activity, Heart, CalendarDays, Target, ListTodo, Map, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";

const modules = [
  { id: "planner", title: "المخطط الأسبوعي", desc: "خطط أسبوعك بذكاء", icon: <Calendar className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-primary/10 text-primary", active: true },
  { id: "budget", title: "الميزانيّة الشهرية", desc: "إدارة مالية شهرية واضحة", icon: <Wallet className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", active: true },
  { id: "habits", title: "العادات", desc: "ابنِ عادات إيجابية", icon: <Activity className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", active: false },
  { id: "life", title: "منظم الحياة", desc: "نظّم حياتك", icon: <Heart className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", active: false },
  { id: "monthly", title: "التخطيط الشهري", desc: "خطط شهرك", icon: <CalendarDays className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", active: false },
  { id: "goals", title: "أهداف السنة", desc: "حقق أهدافك", icon: <Target className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", active: false },
  { id: "tasks", title: "تتبع المهام", desc: "تابع مهامك", icon: <ListTodo className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", active: false },
  { id: "travel", title: "مخطط السفر", desc: "خطط رحلاتك", icon: <Map className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", active: false },
  { id: "meal", title: "وجبات الأسبوع", desc: "خطط وجباتك", icon: <Utensils className="w-7 h-7 md:w-8 md:h-8" />, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400", active: false },
];

export default function Dashboard() {
  const auth = useAuth();

  return (
    <div className="dashboard-page min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center relative">
          <div className="absolute top-0 left-0 flex items-center gap-2">
            <button onClick={() => auth.logout()} className="px-3 py-1.5 rounded-lg text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300">
              خروج
            </button>
            <ThemeToggle />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-2"
          >
            مرحبا بك في <span className="text-primary">Planner Hub</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-slate-400 dark:text-slate-500 font-medium"
          >
            اختر الأداة التي ترغب في استخدامها
          </motion.p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5" data-testid="modules-grid">
          {modules.map((mod, index) => {
            const inner = (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`
                  relative rounded-2xl p-4 md:p-6 flex flex-col gap-3 md:gap-4 transition-all duration-200
                  ${mod.active
                    ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                    : "bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 opacity-50 cursor-default"}
                `}
                data-testid={`module-card-${mod.id}`}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${mod.color} flex items-center justify-center`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg mb-0.5">{mod.title}</h3>
                  <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium">{mod.active ? mod.desc : "قريبا"}</p>
                </div>
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



