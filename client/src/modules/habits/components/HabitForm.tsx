import { Info, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "@/modules/habits/components/CategorySelector";
import type { HabitDefinition, HabitFormValues, HabitType } from "@/modules/habits/types";
import {
  HABIT_TRACKING_MODE_OPTIONS,
  HABIT_TYPE_OPTIONS,
  getDefaultUnit,
} from "@/modules/habits/utils/habits";

interface HabitFormProps {
  values: HabitFormValues;
  editingHabit?: HabitDefinition | null;
  error?: string;
  onChange: (patch: Partial<HabitFormValues>) => void;
  onSubmit: () => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function HabitForm({
  values,
  editingHabit,
  error,
  onChange,
  onSubmit,
  onDelete,
  onCancel,
}: HabitFormProps) {
  const handleTypeChange = (nextType: HabitType) => {
    onChange({
      type: nextType,
      trackingMode: nextType === "count" ? "progress" : "check",
      target: values.target || "1",
      unit: nextType === "binary" ? "" : values.unit || getDefaultUnit(nextType),
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-right">
        <label className="text-xs font-semibold text-muted-foreground">اسم العادة</label>
        <Input
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="مثال: شرب 8 أكواب ماء"
          dir="rtl"
          className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right font-semibold"
        />
      </div>

      <div className="space-y-2 text-right">
        <label className="text-xs font-semibold text-muted-foreground">الفئة</label>
        <CategorySelector value={values.category} onChange={(category) => onChange({ category })} />
      </div>

      <div className={`grid gap-4 ${values.type === "binary" ? "" : "md:grid-cols-2"}`}>
        <div className="space-y-2 text-right">
          <label className="text-xs font-semibold text-muted-foreground">نوع القياس</label>
          <Select value={values.type} onValueChange={(value) => handleTypeChange(value as HabitType)}>
            <SelectTrigger className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {HABIT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col items-end text-right">
                    <span>{option.label}</span>
                    <span className="text-[11px] text-muted-foreground">{option.hint}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {values.type !== "binary" ? (
          <div className="space-y-2 text-right">
            <label className="text-xs font-semibold text-muted-foreground">الهدف اليومي</label>
            <Input
              type="number"
              min={1}
              value={values.target}
              onChange={(event) => onChange({ target: event.target.value })}
              inputMode="numeric"
              className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right font-black"
            />
          </div>
        ) : null}
      </div>

      {values.type !== "binary" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-right">
            <label className="text-xs font-semibold text-muted-foreground">طريقة الإنهاء</label>
            <Select
              value={values.trackingMode}
              onValueChange={(value) => onChange({ trackingMode: value as typeof values.trackingMode })}
            >
              <SelectTrigger className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {HABIT_TRACKING_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col items-end text-right">
                      <span>{option.label}</span>
                      <span className="text-[11px] text-muted-foreground">{option.hint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-xs font-semibold text-muted-foreground">الوحدة</label>
            <Input
              value={values.unit}
              onChange={(event) => onChange({ unit: event.target.value })}
              placeholder={getDefaultUnit(values.type)}
              className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right font-semibold"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-[calc(var(--radius)+0.35rem)] border border-border/70 bg-background/55 px-3.5 py-3 text-right text-xs leading-6 text-muted-foreground">
          <div className="mb-1 inline-flex items-center gap-2 font-semibold text-foreground">
            <Info className="h-4 w-4 text-primary" />
            عادة ثنائية
          </div>
          يكفي أن يضع المستخدم علامة واحدة لاحتساب العادة كمكتملة في هذا اليوم.
        </div>
      )}

      <div className="space-y-2 text-right">
        <label className="text-xs font-semibold text-muted-foreground">الإيموجي</label>
        <Input
          value={values.emoji}
          onChange={(event) => onChange({ emoji: event.target.value })}
          placeholder="✨"
          className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right font-semibold"
        />
      </div>

      <div className="space-y-2 text-right">
        <label className="text-xs font-semibold text-muted-foreground">وصف قصير</label>
        <Textarea
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="اختياري — تذكير صغير يجعل العادة أوضح"
          dir="rtl"
          className="min-h-[96px] rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right"
        />
      </div>

      <div className="rounded-[calc(var(--radius)+0.35rem)] border border-border/70 bg-background/55 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 text-right">
            <p className="text-sm font-bold text-foreground">تذكير داخل التطبيق</p>
            <p className="text-xs leading-6 text-muted-foreground">
              يظهر فقط داخل لوحة العادات، بدون إشعارات خارجية.
            </p>
          </div>
          <Switch
            checked={values.reminderEnabled}
            onCheckedChange={(checked) => onChange({ reminderEnabled: checked })}
          />
        </div>

        {values.reminderEnabled ? (
          <div className="mt-3 space-y-2 text-right">
            <label className="text-xs font-semibold text-muted-foreground">وقت التذكير</label>
            <Input
              type="time"
              value={values.reminderTime}
              onChange={(event) => onChange({ reminderTime: event.target.value })}
              dir="rtl"
              className="h-12 rounded-[calc(var(--radius)+0.35rem)] border-border/70 bg-background/70 text-right font-semibold"
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-[calc(var(--radius)+0.35rem)] border border-destructive/30 bg-destructive/[0.08] px-3.5 py-3 text-right text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-start">
        <Button className="rounded-[calc(var(--radius)+0.45rem)] px-5" onClick={onSubmit}>
          <TimerReset className="h-4 w-4" />
          {editingHabit ? "حفظ التعديلات" : "إضافة العادة"}
        </Button>
        <Button variant="outline" className="rounded-[calc(var(--radius)+0.45rem)]" onClick={onCancel}>
          إلغاء
        </Button>
      </div>

      {editingHabit && onDelete ? (
        <div className="border-t border-border/70 pt-4">
          <Button
            variant="destructive"
            className="w-full rounded-[calc(var(--radius)+0.45rem)]"
            onClick={onDelete}
          >
            حذف العادة
          </Button>
        </div>
      ) : null}
    </div>
  );
}
