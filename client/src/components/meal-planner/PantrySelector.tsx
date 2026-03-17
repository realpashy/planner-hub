import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { PantryItem, MealPlannerSettings } from "@/lib/meal-planner";

interface PantrySelectorProps {
  pantry: PantryItem[];
  settings: MealPlannerSettings;
  onToggleItem: (id: string, isEnabled: boolean) => void;
  onToggleExcludeByDefault: (value: boolean) => void;
}

export function PantrySelector({
  pantry,
  settings,
  onToggleItem,
  onToggleExcludeByDefault,
}: PantrySelectorProps) {
  const hasItems = pantry.length > 0;

  return (
    <section className="space-y-4" dir="rtl">
      <Card className="rounded-2xl border border-slate-200/80 bg-card/90 px-4 py-3 shadow-sm">
        <div className="space-y-1 text-right">
          <p className="text-sm font-semibold text-foreground">
            عناصر المخزن الأساسية
          </p>
          <p className="text-xs text-muted-foreground leading-6">
            حدّد المكوّنات التي تتوفّر غالباً في منزلك حتى يتم استثناؤها تلقائياً من
            قائمة التسوّق. يمكنك تغيير ذلك في أي وقت.
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">
              استبعاد عناصر المخزن تلقائياً
            </p>
            <p className="text-[11px] text-muted-foreground">
              عند تفعيل هذا الخيار، لن تُضاف العناصر المعلّمة كمخزون إلى قائمة
              التسوّق.
            </p>
          </div>
          <Switch
            checked={settings.excludeStaplesByDefault}
            onCheckedChange={(value) => onToggleExcludeByDefault(Boolean(value))}
          />
        </div>
      </Card>

      {!hasItems ? (
        <Card className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-6 text-center text-xs text-muted-foreground">
          لم تتم إضافة عناصر مخزن بعد. يمكن إضافة عناصر أساسية مثل الزيت، الملح،
          السكر، الأرز، المعكرونة، البيض، الخبز والحليب لاحقاً.
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {pantry.map((item) => (
            <Card
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-card/90 px-3 py-2.5 shadow-sm"
            >
              <div className="text-right space-y-0.5">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  فئة التسوّق: {item.defaultCategory}
                </p>
              </div>
              <Switch
                checked={item.isEnabled}
                onCheckedChange={(value) =>
                  onToggleItem(item.id, Boolean(value))
                }
              />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

