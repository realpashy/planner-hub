import { useState } from "react";
import { Plus, CheckSquare, Clock, Crosshair, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export function FAB({ onAction }: { onAction: (action: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: FABAction[] = [
    { id: 'task', label: 'مهمة جديدة', icon: <CheckSquare className="w-4.5 h-4.5" />, color: 'bg-emerald-500' },
    { id: 'event', label: 'موعد جديد', icon: <Clock className="w-4.5 h-4.5" />, color: 'bg-amber-500' },
    { id: 'tag', label: 'هدف اليوم', icon: <Crosshair className="w-4.5 h-4.5" />, color: 'bg-violet-500' },
    { id: 'note', label: 'ملاحظة', icon: <FileText className="w-4.5 h-4.5" />, color: 'bg-blue-500' },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-40 md:hidden" data-testid="fab-container">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 left-0 flex flex-col gap-2.5 pb-2 z-40"
            >
              {actions.map((act, i) => (
                <motion.button
                  key={act.id}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { onAction(act.id); setIsOpen(false); }}
                  className="flex items-center justify-end gap-2.5"
                  data-testid={`fab-action-${act.id}`}
                >
                  <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
                    {act.label}
                  </span>
                  <div className={`w-11 h-11 rounded-full ${act.color} text-white flex items-center justify-center shadow-lg`}>
                    {act.icon}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        className={`relative z-40 w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${isOpen ? 'bg-slate-800' : 'bg-primary shadow-primary/30'}`}
        style={{ width: '52px', height: '52px' }}
        data-testid="button-fab"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
