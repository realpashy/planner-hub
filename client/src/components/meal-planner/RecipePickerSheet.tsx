import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MealRecipe, MealType } from "@/lib/meal-planner";

interface RecipePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayLabel: string;
  mealLabel: string;
  recipes: MealRecipe[];
  onSelectRecipe: (recipeId: string) => void;
  onQuickAdd: (title: string) => void;
}

const FILTER_TAGS = [
  "سريع",
  "اقتصادي",
  "صحي",
  "نباتي",
  "دجاج",
  "لحم",
  "فطور",
  "عشاء",
  "مناسب للعائلة",
  "تحضير مسبق",
] as const;

export function RecipePickerSheet({
  open,
  onOpenChange,
  dayLabel,
  mealLabel,
  recipes,
  onSelectRecipe,
  onQuickAdd,
}: RecipePickerSheetProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || r.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    onQuickAdd(quickTitle.trim());
    setQuickTitle("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] rounded-t-3xl border-t bg-card/95 px-4 pb-4 pt-5 sm:max-w-xl sm:rounded-3xl sm:pb-5 sm:pt-6"
        dir="rtl"
      >
        <SheetHeader className="text-right space-y-1">
          <SheetTitle className="text-base">
            اختيار وجبة لـ {mealLabel} - {dayLabel}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            اختر وصفة جاهزة أو أضف وجبة نصّية سريعة تناسبك.
          </p>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <Input
            placeholder="ابحث عن وصفة أو مكوّن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="budget-rtl-input text-sm"
          />

          <div className="flex flex-wrap justify-end gap-1.5 text-[11px]">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
              >
                <Badge
                  variant={activeTag === tag ? "default" : "outline"}
                  className="cursor-pointer rounded-full px-2.5 py-1"
                >
                  {tag}
                </Badge>
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[32vh] overflow-y-auto pe-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                لا توجد وصفات مطابقة حاليًا. يمكنك إضافة وجبة نصّية في الأسفل.
              </p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelectRecipe(r.id);
                    onOpenChange(false);
                  }}
                  className="flex w-full flex-col items-stretch rounded-2xl border border-slate-200/70 bg-card px-3 py-2.5 text-right text-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-700 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.title}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {r.description || "وصفة محفوظة بدون وصف تفصيلي."}
                      </p>
                    </div>
                  </div>
                  {r.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-end gap-1 text-[10px] text-muted-foreground">
                      {r.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="space-y-1 border-t pt-3 mt-1">
            <p className="text-xs font-medium text-foreground text-right">
              أو أضف وجبة نصّية سريعة
            </p>
            <div className="flex items-center gap-2">
              <Input
                placeholder="مثال: شطائر جبن مع سلطة خفيفة"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="budget-rtl-input text-xs"
              />
              <Button size="sm" className="shrink-0 text-xs" onClick={handleQuickAdd}>
                إضافة
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

