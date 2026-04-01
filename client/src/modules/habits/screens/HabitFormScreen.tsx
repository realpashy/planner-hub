import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HabitForm } from "@/modules/habits/components/HabitForm";
import type { HabitDefinition, HabitFormValues } from "@/modules/habits/types";
import { getDefaultUnit } from "@/modules/habits/utils/habits";

interface HabitFormScreenProps {
  open: boolean;
  habit?: HabitDefinition | null;
  onClose: () => void;
  onSave: (values: HabitFormValues, habit?: HabitDefinition) => void;
  onDelete?: (habitId: string) => void;
}

function createInitialValues(habit?: HabitDefinition | null): HabitFormValues {
  return {
    name: habit?.name ?? "",
    description: habit?.description ?? "",
    category: habit?.category ?? "health",
    type: habit?.type ?? "binary",
    trackingMode: habit?.trackingMode ?? (habit?.type === "count" ? "progress" : "check"),
    target: String(habit?.target ?? 1),
    unit: habit?.unit ?? getDefaultUnit(habit?.type ?? "binary"),
    emoji: habit?.emoji ?? "",
    reminderEnabled: Boolean(habit?.reminderTime),
    reminderTime: habit?.reminderTime ?? "",
  };
}

export function HabitFormScreen({
  open,
  habit,
  onClose,
  onSave,
  onDelete,
}: HabitFormScreenProps) {
  const [values, setValues] = useState<HabitFormValues>(createInitialValues(habit));
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(createInitialValues(habit));
    setError("");
    setConfirmDelete(false);
  }, [habit, open]);

  const title = useMemo(
    () => (habit ? "تعديل العادة" : "إضافة عادة جديدة"),
    [habit],
  );

  const handleSave = () => {
    if (!values.name.trim()) {
      setError("أضف اسمًا واضحًا للعادة.");
      return;
    }

    if (!values.target || Number.parseInt(values.target, 10) <= 0) {
      setError("حدد هدفًا يوميًا صالحًا.");
      return;
    }

    if (values.reminderEnabled && !values.reminderTime) {
      setError("اختر وقتًا للتذكير أو أوقف التذكير.");
      return;
    }

    setError("");
    onSave(values, habit ?? undefined);
    onClose();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <SheetContent
          side="bottom"
          dir="rtl"
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="max-h-[88dvh] overflow-y-auto rounded-t-[1.25rem] border-t border-border/60 bg-popover p-0 md:mx-auto md:mb-4 md:max-w-[46rem] md:rounded-[calc(var(--radius)+1rem)] md:border"
        >
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-border/60" />
          </div>
          <SheetHeader className="px-5 pb-2 text-right">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>إعداد سريع وواضح يبقي الاستخدام اليومي خفيفًا.</SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-6 pt-2">
            <HabitForm
              values={values}
              editingHabit={habit}
              error={error}
              onChange={(patch) => setValues((previous) => ({ ...previous, ...patch }))}
              onSubmit={handleSave}
              onCancel={onClose}
              onDelete={habit && onDelete ? () => setConfirmDelete(true) : undefined}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent
          dir="rtl"
          className="surface-shell max-w-md rounded-[calc(var(--radius)+0.85rem)] border-border/80 text-right"
        >
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="text-right">حذف العادة</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حذف هذه العادة وسجلها اليومي من هذه الوحدة فقط. لا يمكن التراجع بعد التأكيد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row-reverse sm:justify-start sm:space-x-reverse sm:space-x-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (habit && onDelete) onDelete(habit.id);
                setConfirmDelete(false);
                onClose();
              }}
            >
              حذف الآن
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
