import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingListItem } from "@/lib/meal-planner";
import { ShoppingCategorySection } from "./ShoppingCategorySection";

interface ShoppingListPanelProps {
  items: ShoppingListItem[];
  excludePantryStaples: boolean;
  onToggleExcludePantry: (value: boolean) => void;
  onRegenerate: () => void;
  onToggleChecked: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onAddManualItem: (name: string) => void;
}

export function ShoppingListPanel({
  items,
  excludePantryStaples,
  onToggleExcludePantry,
  onRegenerate,
  onToggleChecked,
  onRemoveItem,
  onAddManualItem,
}: ShoppingListPanelProps) {
  const [manualName, setManualName] = useState("");

  const { total, completed, grouped } = useMemo(() => {
    const totalCount = items.length;
    const completedCount = items.filter((i) => i.checked).length;
    const map = new Map<string, ShoppingListItem[]>();
    items.forEach((item) => {
      const key = item.category || "أخرى";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return { total: totalCount, completed: completedCount, grouped: map };
  }, [items]);

  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleAddManual = () => {
    if (!manualName.trim()) return;
    onAddManualItem(manualName.trim());
    setManualName("");
  };

  if (items.length === 0) {
    return (
      <Card
        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200/70 bg-emerald-50/40 px-4 py-10 text-center text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/5 dark:text-emerald-200"
        dir="rtl"
      >
        <p className="mb-1 text-base font-semibold">لا توجد عناصر في قائمة التسوّق بعد</p>
        <p className="text-xs leading-6">
          ابدأ بتخطيط وجبات الأسبوع من تبويب "الأسبوع"، ثم اضغط "تحديث من الخطة" هنا
          لإنشاء قائمة تسوّق ذكية تلقائيًا.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4" dir="rtl">
      <Card className="rounded-2xl border border-slate-200/80 bg-card/90 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5 text-right">
            <p className="text-sm font-semibold text-foreground">
              قائمة التسوّق لهذا الأسبوع
            </p>
            <p className="text-[11px] text-muted-foreground">
              {total} عنصر • {completed} مكتملة • نسبة الإنجاز {progress}%
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-muted-foreground"
              onClick={() => onToggleExcludePantry(!excludePantryStaples)}
            >
              <Checkbox checked={excludePantryStaples} />
              <span className="whitespace-nowrap">استبعاد عناصر المخزن</span>
            </button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex items-center gap-1 rounded-2xl px-3 text-xs"
              onClick={onRegenerate}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              تحديث من الخطة
            </Button>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="أضف عنصراً يدوياً (مثال: فواكه للأطفال)..."
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            className="budget-rtl-input text-sm"
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0 rounded-2xl px-3 text-xs"
            onClick={handleAddManual}
          >
            إضافة
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-right">
          العناصر اليدوية تبقى محفوظة حتى بعد تحديث القائمة من الخطة.
        </p>
      </div>

      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([category, catItems]) => (
          <ShoppingCategorySection
            key={category}
            category={category}
            items={catItems}
            onToggleChecked={onToggleChecked}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </section>
  );
}

