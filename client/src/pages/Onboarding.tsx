import { useState } from "react";
import { TEMPLATES, generateTemplateData } from "@/lib/templates";
import { savePlannerData, setOnboarded } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; ring: string; text: string; icon: string }> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-300 dark:border-emerald-500/40",
    ring: "ring-emerald-400/30",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "bg-emerald-500",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-300 dark:border-blue-500/40",
    ring: "ring-blue-400/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-300 dark:border-violet-500/40",
    ring: "ring-violet-400/30",
    text: "text-violet-700 dark:text-violet-300",
    icon: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-300 dark:border-amber-500/40",
    ring: "ring-amber-400/30",
    text: "text-amber-700 dark:text-amber-300",
    icon: "bg-amber-500",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-800/50",
    border: "border-slate-300 dark:border-slate-600",
    ring: "ring-slate-400/30",
    text: "text-slate-700 dark:text-slate-300",
    icon: "bg-slate-500",
  },
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    if (!selectedId) return;
    setIsTransitioning(true);

    const data = generateTemplateData(selectedId);
    savePlannerData(data);
    setOnboarded();

    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 md:p-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? -10 : 0, scale: isTransitioning ? 0.98 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5"
          >
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2" data-testid="text-onboarding-title">
            مرحبا بك في مخطط الأسبوع
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">
            اختر قالبا يناسب أسلوبك لتبدأ بسرعة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
          {TEMPLATES.map((template, i) => {
            const colors = COLOR_MAP[template.color] || COLOR_MAP.slate;
            const isSelected = selectedId === template.id;

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                onClick={() => setSelectedId(template.id)}
                className={`
                  relative cursor-pointer rounded-2xl border-2 p-4 md:p-5 transition-all duration-200
                  ${isSelected
                    ? `${colors.bg} ${colors.border} ring-2 ${colors.ring} shadow-md`
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'}
                  ${template.id === 'blank' ? 'sm:col-span-2' : ''}
                `}
                data-testid={`template-card-${template.id}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl md:text-3xl flex-shrink-0 mt-0.5">{template.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base md:text-lg mb-0.5 ${isSelected ? colors.text : 'text-slate-800 dark:text-slate-100'}`}>
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`w-6 h-6 rounded-full ${colors.icon} flex items-center justify-center flex-shrink-0`}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={handleStart}
            disabled={!selectedId}
            className="px-8 py-3.5 bg-primary text-white font-bold text-base md:text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            data-testid="button-start-planner"
          >
            ابدأ التخطيط
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
