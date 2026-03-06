import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResponsiveConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

export function ResponsiveConfirm({
  isOpen, onClose, onConfirm, title, description, confirmText = "حذف", cancelText = "إلغاء"
}: ResponsiveConfirmProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[24px] h-[35vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[24px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 mb-8" />
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/15 text-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <Drawer.Title className="font-bold text-xl text-slate-900 dark:text-slate-50">{title}</Drawer.Title>
                <Drawer.Description className="text-slate-500 dark:text-slate-400 mb-6">{description}</Drawer.Description>
              </div>
              <div className="flex gap-3 px-4">
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="flex-1 bg-red-500 text-white font-semibold py-3.5 rounded-xl hover:bg-red-600 transition-colors"
                  data-testid="button-confirm-delete"
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  data-testid="button-cancel-delete"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10"
          >
            <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors" data-testid="button-close-dialog">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/15 text-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2" data-testid="text-confirm-title">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{description}</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    data-testid="button-cancel-delete"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => { onConfirm(); onClose(); }}
                    className="px-5 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                    data-testid="button-confirm-delete"
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
