import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RecipeCard } from "./RecipeCard";
import { RecipeDetailView } from "./RecipeDetailView";
import type { MealRecipe } from "@/lib/meal-planner";

interface RecipeLibraryProps {
  recipes: MealRecipe[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddRecipeToPlan: (recipeId: string) => void;
}

const CATEGORIES = ["الكل", "فطور", "غداء", "عشاء"] as const;

export function RecipeLibrary({
  recipes,
  favorites,
  onToggleFavorite,
  onAddRecipeToPlan,
}: RecipeLibraryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("الكل");
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);

  const filtered = recipes.filter((r) => {
    const inCategory = category === "الكل" || r.category === category;
    const term = search.trim().toLowerCase();
    const inSearch =
      !term ||
      r.title.toLowerCase().includes(term) ||
      (r.description || "").toLowerCase().includes(term);
    return inCategory && inSearch;
  });

  const activeRecipe = filtered.find((r) => r.id === activeRecipeId) || null;

  return (
    <section className="space-y-4" dir="rtl">
      <Card className="border border-slate-200/80 bg-slate-50/70 px-3 py-3 text-right">
        <p className="text-xs text-muted-foreground">
          ابحث عن وصفة، صفِّ حسب نوع الوجبة، أو أضف وصفاتك الخاصة لاحقًا.
        </p>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            placeholder="ابحث عن وصفة بالعربية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="budget-rtl-input text-sm"
          />
        </div>
        <Tabs
          dir="rtl"
          value={category}
          onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}
          className="md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4 md:w-auto">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="text-[11px]">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          لا توجد وصفات مطابقة حاليًا. يمكنك البدء بإضافة وصفاتك المفضّلة لاحقًا.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={favorites.includes(recipe.id)}
              onToggleFavorite={() => onToggleFavorite(recipe.id)}
              onOpenDetail={() => {
                setActiveRecipeId(recipe.id);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <RecipeDetailView
        open={detailOpen}
        onOpenChange={setDetailOpen}
        recipe={activeRecipe}
        onAddToPlan={() => {
          if (activeRecipeId) {
            onAddRecipeToPlan(activeRecipeId);
            setDetailOpen(false);
          }
        }}
      />
    </section>
  );
}

