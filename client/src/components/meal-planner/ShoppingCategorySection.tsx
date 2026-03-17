import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { ShoppingListItem } from "@/lib/meal-planner";

interface ShoppingCategorySectionProps {
  category: string;
  items: ShoppingListItem[];
  onToggleChecked: (id: string) => void;
  onRemoveItem: (id: string) => void;
}

export function ShoppingCategorySection({
  category,
  items,
  onToggleChecked,
  onRemoveItem,
}: ShoppingCategorySectionProps) {
  const [open, setOpen] = useState(true);

  if (items.length === 0) return null;

  const completed = items.filter((i) => i.checked).length;

  return (
    <Card
      className="rounded-2xl border border-slate-200/80 bg-card/90 px-3 py-2.5 shadow-sm"
      dir="rtl"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-right"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="space-y-0.5 text-right">
          <p className="text-sm font-semibold text-foreground">{category}</p>
          <p className="text-[11px] text-muted-foreground">
            {completed}/{items.length} عنصر مكتمل
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => onToggleChecked(item.id)}
                />
              </div>
              <div className="flex-1 min-w-0 text-right space-y-0.5">
                <p className="truncate text-xs font-medium text-foreground">
                  {item.displayName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.quantity} {item.unit || ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-xs text-muted-foreground hover:text-destructive"
                type="button"
                onClick={() => onRemoveItem(item.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

