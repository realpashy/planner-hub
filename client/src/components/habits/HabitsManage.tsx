import { useState } from "react";
import { Plus, MoreVertical, Pencil, Archive, Trash2, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import {
  type Habit,
  type HabitsData,
  type HabitCategory,
  HABIT_CATEGORY_LABELS,
  HABIT_CATEGORY_ICONS,
  HABIT_CATEGORY_COLORS,
  HABIT_TYPE_LABELS,
  FREQUENCY_LABELS,
  getHabitStreak,
} from "@/lib/habits";

interface HabitsManageProps {
  data: HabitsData;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onArchiveHabit: (habitId: string) => void;
  onUnarchiveHabit: (habitId: string) => void;
}

const ALL_FILTER = "__all__";
const ARCHIVE_FILTER = "__archived__";

const FILTER_CHIPS: { key: string; label: string }[] = [
  { key: ALL_FILTER, label: "الكل" },
  { key: "health", label: "صحة" },
  { key: "fitness", label: "لياقة" },
  { key: "mindfulness", label: "ذهنية" },
  { key: "learning", label: "تعلّم" },
  { key: "productivity", label: "إنتاجية" },
  { key: "social", label: "اجتماعي" },
  { key: "creative", label: "إبداع" },
  { key: ARCHIVE_FILTER, label: "مؤرشف" },
];

export function HabitsManage({
  data,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onArchiveHabit,
  onUnarchiveHabit,
}: HabitsManageProps) {
  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = data.habits.filter((h) => {
    if (filter === ARCHIVE_FILTER) return h.isArchived;
    if (filter === ALL_FILTER) return !h.isArchived;
    return !h.isArchived && h.category === filter;
  });

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setFilter(chip.key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
              filter === chip.key
                ? "border-violet-500/40 bg-violet-500/[0.15] text-violet-700 dark:text-violet-300"
                : "border-border/60 bg-muted/50 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Habit list */}
      <AnimatePresence mode="popLayout" initial={false}>
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <span className="text-4xl">🌱</span>
            <div>
              <p className="font-bold text-foreground">لا توجد عادات</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {filter === ARCHIVE_FILTER ? "لا توجد عادات مؤرشفة" : "أضف عادتك الأولى الآن"}
              </p>
            </div>
            {filter !== ARCHIVE_FILTER && (
              <button
                type="button"
                onClick={onAddHabit}
                className="mt-1 rounded-full border border-violet-500/30 bg-violet-500/[0.1] px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-500/[0.15]"
              >
                + إضافة عادة
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2.5"
          >
            {filtered.map((habit, index) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                data={data}
                index={index}
                onEdit={() => onEditHabit(habit)}
                onArchive={() => onArchiveHabit(habit.id)}
                onUnarchive={() => onUnarchiveHabit(habit.id)}
                onDelete={() => setPendingDelete(habit.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm dialog */}
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العادة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه العادة؟ سيتم حذف جميع سجلات التتبع نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  onDeleteHabit(pendingDelete);
                  setPendingDelete(null);
                }
              }}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FAB */}
      <button
        type="button"
        onClick={onAddHabit}
        className={cn(
          "fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full",
          "bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all",
          "hover:bg-violet-700 active:bg-violet-800 hover:shadow-xl",
          "border border-violet-500/50",
        )}
      >
        <Plus className="h-4 w-4" />
        إضافة عادة
      </button>
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  data: HabitsData;
  index: number;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}

function HabitRow({ habit, data, index, onEdit, onArchive, onUnarchive, onDelete }: HabitRowProps) {
  const streak = getHabitStreak(habit.id, data);
  const catColor = HABIT_CATEGORY_COLORS[habit.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <div
        className={cn(
          "surface-shell flex items-center gap-3 overflow-hidden rounded-[calc(var(--radius)+0.625rem)] p-4",
          habit.isArchived && "opacity-60",
        )}
      >
        {/* Category color bar */}
        <div
          className="h-10 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: catColor }}
        />

        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] bg-muted/60 text-xl">
          {habit.icon ?? HABIT_CATEGORY_ICONS[habit.category]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-right">
          <p className="truncate font-bold text-foreground">{habit.name}</p>
          <div className="mt-0.5 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">{FREQUENCY_LABELS[habit.frequency]}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">{HABIT_TYPE_LABELS[habit.type]}</span>
            {streak >= 3 && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="text-xs font-bold text-orange-500">🔥 {streak}</span>
              </>
            )}
          </div>
        </div>

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </DropdownMenuItem>
            {habit.isArchived ? (
              <DropdownMenuItem onClick={onUnarchive} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                إلغاء الأرشفة
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onArchive} className="gap-2">
                <Archive className="h-3.5 w-3.5" />
                أرشفة
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
