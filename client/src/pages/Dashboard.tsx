import { Link } from "wouter";
import { Calendar, Wallet, Activity, Heart, CalendarDays, Target, ListTodo, Map, Utensils } from "lucide-react";
import { motion } from "framer-motion";

const modules = [
  { id: 'planner', title: 'المخطط الأسبوعي', desc: 'خطط أسبوعك بذكاء', icon: <Calendar className="w-7 h-7" />, color: 'bg-primary/10 text-primary', active: true },
  { id: 'budget', title: 'الميزانية', desc: 'تتبع مصاريفك', icon: <Wallet className="w-7 h-7" />, color: 'bg-emerald-500/10 text-emerald-600', active: false },
  { id: 'habits', title: 'العادات', desc: 'ابنِ عادات إيجابية', icon: <Activity className="w-7 h-7" />, color: 'bg-orange-500/10 text-orange-600', active: false },
  { id: 'life', title: 'منظم الحياة', desc: 'نظّم حياتك', icon: <Heart className="w-7 h-7" />, color: 'bg-rose-500/10 text-rose-600', active: false },
  { id: 'monthly', title: 'التخطيط الشهري', desc: 'خطط شهرك', icon: <CalendarDays className="w-7 h-7" />, color: 'bg-blue-500/10 text-blue-600', active: false },
  { id: 'goals', title: 'أهداف السنة', desc: 'حقق أهدافك', icon: <Target className="w-7 h-7" />, color: 'bg-purple-500/10 text-purple-600', active: false },
  { id: 'tasks', title: 'تتبع المهام', desc: 'تابع مهامك', icon: <ListTodo className="w-7 h-7" />, color: 'bg-cyan-500/10 text-cyan-600', active: false },
  { id: 'travel', title: 'مخطط السفر', desc: 'خطط رحلاتك', icon: <Map className="w-7 h-7" />, color: 'bg-amber-500/10 text-amber-600', active: false },
  { id: 'meal', title: 'وجبات الأسبوع', desc: 'خطط وجباتك', icon: <Utensils className="w-7 h-7" />, color: 'bg-pink-500/10 text-pink-600', active: false },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2"
          >
            مرحباً بك في <span className="text-primary">Planner Hub</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base text-slate-400 font-medium"
          >
            اختر الأداة التي ترغب في استخدامها
          </motion.p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4" data-testid="modules-grid">
          {modules.map((mod, index) => {
            const inner = (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`
                  relative rounded-2xl p-4 md:p-5 flex flex-col gap-3 transition-all duration-200
                  ${mod.active
                    ? 'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                    : 'bg-slate-100/60 border border-slate-200/50 opacity-50 cursor-default'}
                `}
                data-testid={`module-card-${mod.id}`}
              >
                <div className={`w-12 h-12 rounded-xl ${mod.color} flex items-center justify-center`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base mb-0.5">{mod.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">{mod.active ? mod.desc : 'قريباً'}</p>
                </div>
              </motion.div>
            );

            if (mod.active) {
              return (
                <Link key={mod.id} href={`/${mod.id}`} className="block outline-none" data-testid={`link-module-${mod.id}`}>
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
