import React, { useState } from "react";
import { Plus, CheckSquare, Clock, Hash, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FAB({ onAction }: { onAction: (action: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'task', label: 'مهمة جديدة', icon: <CheckSquare className="w-5 h-5" />, color: 'bg-success' },
    { id: 'event', label: 'موعد جديد', icon: <Clock className="w-5 h-5" />, color: 'bg-warning' },
    { id: 'tag', label: 'هدف اليوم', icon: <Hash className="w-5 h-5" />, color: 'bg-indigo-500' },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-40 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 left-0 flex flex-col gap-3 pb-2"
          >
            {actions.map((act) => (
              <button
                key={act.id}
                onClick={() => { onAction(act.id); setIsOpen(false); }}
                className="flex items-center justify-end gap-3 w-40"
              >
                <span className="bg-white text-slate-800 text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                  {act.label}
                </span>
                <div className={`w-12 h-12 rounded-full ${act.color} text-white flex items-center justify-center shadow-lg`}>
                  {act.icon}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-transform duration-300 ${isOpen ? 'bg-slate-800 rotate-45' : 'bg-primary'}`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
      </button>
    </div>
  );
}
