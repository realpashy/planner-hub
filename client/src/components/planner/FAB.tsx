import { useState } from "react";
import { Plus, CheckSquare, Clock, Crosshair, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="fixed bottom-6 left-6 rtl:left-auto rtl:right-6 z-40 md:hidden" data-testid="fab-container">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 left-0 rtl:left-auto rtl:right-0 flex flex-col gap-2.5 pb-2 z-40"
            >
              {actions.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-end gap-2.5"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-md whitespace-nowrap"
                    onClick={() => { onAction(act.id); setIsOpen(false); }}
                    data-testid={`fab-action-${act.id}`}
                  >
                    {act.label}
                  </Button>
                  <div className={cn("w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg", act.color)}>
                    {act.icon}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative z-40 w-13 h-13 rounded-full shadow-lg transition-colors duration-200",
          isOpen ? "bg-muted-foreground" : "bg-primary shadow-primary/30"
        )}
        style={{ width: "52px", height: "52px" }}
        data-testid="button-fab"
      >
        <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-6 h-6 text-primary-foreground" />
        </motion.span>
      </Button>
    </div>
  );
}
