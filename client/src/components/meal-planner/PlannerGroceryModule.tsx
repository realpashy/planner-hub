import { useMemo } from "react";
import { Carrot, ChevronDown, CookingPot, Package, ShoppingBasket } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlannerMetaBadge } from "@/components/meal-planner/PlannerMetaBadge";
import type { GroceryGroup } from "@/lib/meal-planner";

interface PlannerGroceryModuleProps {
  grocery: GroceryGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_ICONS = {
  proteins: Package,
  produce: Carrot,
  pantry: CookingPot,
  dairy: ShoppingBasket,
  other: ShoppingBasket,
} as const;

export function PlannerGroceryModule({ grocery, open, onOpenChange }: PlannerGroceryModuleProps) {
  const totalItems = useMemo(() => grocery.reduce((sum, group) => sum + group.items.length, 0), [grocery]);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <section className="rounded-[1.85rem] border border-white/60 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/70" dir="rtl">
        <CollapsibleTrigger className="w-full text-right">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-foreground">قائمة التسوق</p>
              <p className="text-xs text-muted-foreground">{grocery.length} فئات، {totalItems} عنصرًا</p>
            </div>
            <PlannerMetaBadge icon={ShoppingBasket} label={open ? "مفتوحة" : "مطوية"} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 grid gap-3">
            {grocery.map((group) => {
              const Icon = GROUP_ICONS[group.key as keyof typeof GROUP_ICONS] ?? ShoppingBasket;
              return (
                <div key={group.key} className="rounded-[1.35rem] border border-border/55 bg-background/70 p-4 dark:bg-white/5">
                  <div className="mb-3 flex items-center justify-between">
                    <PlannerMetaBadge icon={Icon} label={`${group.items.length} عناصر`} />
                    <p className="text-sm font-bold text-foreground">{group.title}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {group.items.map((item) => (
                      <span key={item.key} className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground dark:bg-slate-950/60">
                        {item.label}
                        <span className="me-2 text-muted-foreground">{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
