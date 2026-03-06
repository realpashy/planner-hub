import React from "react";
import { Link } from "wouter";
import { Calendar, Wallet, Activity, Heart, CalendarDays, Target, ListTodo, Map, Utensils } from "lucide-react";
import { motion } from "framer-motion";

const modules = [
  { id: 'planner', title: 'المخطط الأسبوعي', icon: <Calendar className="w-8 h-8" />, color: 'from-primary/20 to-primary/5', text: 'text-primary', active: true },
  { id: 'budget', title: 'الميزانية', icon: <Wallet className="w-8 h-8" />, color: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-500', active: false },
  { id: 'habits', title: 'العادات', icon: <Activity className="w-8 h-8" />, color: 'from-orange-500/20 to-orange-500/5', text: 'text-orange-500', active: false },
  { id: 'life', title: 'منظم الحياة', icon: <Heart className="w-8 h-8" />, color: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-500', active: false },
  { id: 'monthly', title: 'التخطيط الشهري', icon: <CalendarDays className="w-8 h-8" />, color: 'from-blue-500/20 to-blue-500/5', text: 'text-blue-500', active: false },
  { id: 'goals', title: 'أهداف السنة', icon: <Target className="w-8 h-8" />, color: 'from-purple-500/20 to-purple-500/5', text: 'text-purple-500', active: false },
  { id: 'tasks', title: 'تتبع المهام', icon: <ListTodo className="w-8 h-8" />, color: 'from-cyan-500/20 to-cyan-500/5', text: 'text-cyan-500', active: false },
  { id: 'travel', title: 'مخطط السفر', icon: <Map className="w-8 h-8" />, color: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-500', active: false },
  { id: 'meal', title: 'وجبات الأسبوع', icon: <Utensils className="w-8 h-8" />, color: 'from-pink-500/20 to-pink-500/5', text: 'text-pink-500', active: false },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center md:text-right">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">مرحباً بك في <span className="text-primary">Planner Hub</span></h1>
          <p className="text-lg text-slate-500 font-medium">اختر الأداة التي ترغب في استخدامها اليوم.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {modules.map((mod, index) => {
            const CardContent = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative h-40 md:h-48 rounded-3xl p-5 flex flex-col justify-between overflow-hidden
                  ${mod.active ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-slate-100' 
                             : 'bg-slate-100/50 border border-slate-200/50 opacity-60'}
                `}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} ${mod.text} flex items-center justify-center mb-4`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{mod.title}</h3>
                  {!mod.active && <span className="text-xs font-semibold text-slate-400 mt-1 inline-block">قريباً</span>}
                </div>
                
                {mod.active && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
                )}
              </motion.div>
            );

            if (mod.active) {
              return (
                <Link key={mod.id} href={`/${mod.id}`} className="block outline-none">
                  {CardContent}
                </Link>
              );
            }
            return <div key={mod.id}>{CardContent}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
