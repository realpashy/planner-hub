import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
                <Button variant="destructive" className="flex-1" onClick={() => { onConfirm(); onClose(); }} data-testid="button-confirm-delete">
                  {confirmText}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={onClose} data-testid="button-cancel-delete">
                  {cancelText}
                </Button>
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
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="pt-1 flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-confirm-title">{title}</h3>
                <p className="text-muted-foreground mb-6">{description}</p>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={onClose} data-testid="button-cancel-delete">
                    {cancelText}
                  </Button>
                  <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }} data-testid="button-confirm-delete">
                    {confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
