import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Utensils, CalendarDays, ShoppingBasket, Settings2, BookOpen, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useMealPlanner } from "@/hooks/use-meal-planner";
import { MealPlannerOverview } from "@/components/meal-planner/MealPlannerOverview";
import { WeeklyMealBoard } from "@/components/meal-planner/WeeklyMealBoard";
import { RecipePickerSheet } from "@/components/meal-planner/RecipePickerSheet";
import { RecipeLibrary } from "@/components/meal-planner/RecipeLibrary";
import { ShoppingListPanel } from "@/components/meal-planner/ShoppingListPanel";
import { PantrySelector } from "@/components/meal-planner/PantrySelector";
import { RecipeDetailView } from "@/components/meal-planner/RecipeDetailView";
import type { MealType } from "@/lib/meal-planner";

export default function MealPlanner() {
  const {
    state,
    summary,
    quickAddMeal,
    addRecipeMeal,
    markMealAsLeftover,
    markMealAsEatingOut,
    markMealAsSkipped,
    copyDay,
    toggleFavoriteRecipe,
    addShoppingItem,
    toggleShoppingItemChecked,
    removeShoppingItem,
    regenerateShoppingList,
    updatePantryItem,
    updateSettings,
  } = useMealPlanner();
  const [activeTab, setActiveTab] = useState<"overview" | "week" | "recipes" | "shopping" | "pantry">("overview");
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    dateISO: string | null;
    mealType: MealType | null;
    dayLabel: string;
  }>({
    open: false,
    dateISO: null,
    mealType: null,
    dayLabel: "",
  });

  const [detailPicker, setDetailPicker] = useState<{
    open: boolean;
    recipeId: string | null;
  }>({
    open: false,
    recipeId: null,
  });

  const favoritesCount = useMemo(() => state.favorites.length, [state.favorites]);

  return (
    <div className="min-h-screen bg-background pb-10" dir="rtl">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/" data-testid="link-back-dashboard">
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </Link>
                </Button>
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-background/75 px-4 py-4 text-right shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-300">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">تخطيط الوجبات</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      خطّطي الأسبوع، الوصفات، والتسوّق من مساحة واحدة.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-start gap-2">
                  <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground">
                    {summary.plannedMeals}/{summary.totalSlots} خانة مخططة
                  </div>
                  <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground">
                    {summary.shoppingItemsCount} عناصر تسوّق
                  </div>
                  <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground">
                    {favoritesCount} وصفات مفضلة
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Tabs
                dir="rtl"
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as typeof activeTab)
                }
              >
                <TabsList className="grid w-full grid-cols-5 rounded-[1.5rem] bg-muted/80 p-1.5">
                  <TabsTrigger value="overview" className="min-h-11 rounded-xl">نظرة عامة</TabsTrigger>
                  <TabsTrigger value="week" className="min-h-11 rounded-xl">الأسبوع</TabsTrigger>
                  <TabsTrigger value="recipes" className="min-h-11 rounded-xl">الوصفات</TabsTrigger>
                  <TabsTrigger value="shopping" className="min-h-11 rounded-xl">التسوّق</TabsTrigger>
                  <TabsTrigger value="pantry" className="min-h-11 rounded-xl">المخزن</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-6 space-y-6">
        <Tabs dir="rtl" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsContent value="overview" className="space-y-6">
            <MealPlannerOverview
              summary={summary}
              recentMeals={state.recentMeals}
              favoritesCount={favoritesCount}
              settings={state.settings}
              onStartWeek={() => setActiveTab("week")}
              onOpenShopping={() => setActiveTab("shopping")}
            />
            <OnboardingHint />
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <OnboardingHint compact />
            <WeeklyMealBoard
              weekStartISO={state.weekPlan.weekStartISO}
              meals={state.weekPlan.meals}
              summary={summary}
              onCopyDay={copyDay}
              onSlotAction={(dateISO, mealType, action) => {
                if (
                  action === "pick" ||
                  action === "quickText" ||
                  action === "leftover" ||
                  action === "eatingOut" ||
                  action === "skip"
                ) {
                  if (action === "pick") {
                    setPickerState({
                      open: true,
                      dateISO,
                      mealType,
                      dayLabel: "",
                    });
                  } else {
                    if (action === "quickText") {
                      setPickerState({
                        open: true,
                        dateISO,
                        mealType,
                        dayLabel: "",
                      });
                      return;
                    }
                    if (action === "leftover") {
                      markMealAsLeftover(dateISO, mealType);
                    } else if (action === "eatingOut") {
                      markMealAsEatingOut(dateISO, mealType);
                    } else if (action === "skip") {
                      markMealAsSkipped(dateISO, mealType);
                    }
                  }
                }
                if (action === "clear") {
                  // handled via clearMeal at slot-level later if needed
                }
              }}
            />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeLibrary
              recipes={state.recipes}
              favorites={state.favorites}
              onToggleFavorite={(id) => toggleFavoriteRecipe(id)}
              onAddRecipeToPlan={(recipeId) => {
                setDetailPicker({ open: true, recipeId });
              }}
            />
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingListPanel
              items={state.shoppingList}
              excludePantryStaples={state.settings.excludeStaplesByDefault}
              onToggleExcludePantry={(value) => {
                updateSettings({ excludeStaplesByDefault: value });
                regenerateShoppingList();
              }}
              onRegenerate={regenerateShoppingList}
              onToggleChecked={toggleShoppingItemChecked}
              onRemoveItem={removeShoppingItem}
              onAddManualItem={(name) => addShoppingItem(name)}
            />
          </TabsContent>

          <TabsContent value="pantry">
            <PantrySelector
              pantry={state.pantry}
              settings={state.settings}
              onToggleItem={(id, isEnabled) => {
                updatePantryItem(id, { isEnabled });
                regenerateShoppingList();
              }}
              onToggleExcludeByDefault={(value) => {
                updateSettings({ excludeStaplesByDefault: value });
                regenerateShoppingList();
              }}
            />
          </TabsContent>
        </Tabs>

        <RecipePickerSheet
          open={pickerState.open}
          onOpenChange={(open) =>
            setPickerState((prev) => ({ ...prev, open }))
          }
          dayLabel={pickerState.dateISO || ""}
          mealLabel={
            pickerState.mealType === "breakfast"
              ? "فطور"
              : pickerState.mealType === "lunch"
              ? "غداء"
              : pickerState.mealType === "dinner"
              ? "عشاء"
              : pickerState.mealType === "snack"
              ? "سناك"
              : ""
          }
          recipes={state.recipes}
          onSelectRecipe={(recipeId) => {
            if (!pickerState.dateISO || !pickerState.mealType) return;
            addRecipeMeal(pickerState.dateISO, pickerState.mealType, recipeId);
            setPickerState((prev) => ({ ...prev, open: false }));
          }}
          onQuickAdd={(title) => {
            if (!pickerState.dateISO || !pickerState.mealType) return;
            quickAddMeal(pickerState.dateISO, pickerState.mealType, title);
            setPickerState((prev) => ({ ...prev, open: false }));
          }}
        />

        <RecipeDetailView
          open={detailPicker.open}
          onOpenChange={(openValue: boolean) =>
            setDetailPicker((prev) => ({ ...prev, open: openValue }))
          }
          recipe={state.recipes.find((r) => r.id === detailPicker.recipeId) || null}
          onAddToPlan={() => {
            if (!detailPicker.recipeId) return;
            setActiveTab("week");
            setPickerState((prev) => ({
              ...prev,
              open: true,
            }));
          }}
        />
      </main>
    </div>
  );
}

function OnboardingHint({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-dashed border-amber-200/70 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5">
      <div className="flex items-start gap-3 p-4" dir="rtl">
        <div className="mt-1 h-7 w-7 rounded-full bg-amber-400/90 text-amber-950 flex items-center justify-center text-sm font-bold">
          ١
        </div>
        <div className="flex-1 text-right space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {compact ? "ابدأ من اليوم الحالي." : "ابدأ بتعبئة عشاء كل يوم، ثم أضف الفطور والسناك لاحقاً."}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground leading-6">
              يمكنك دائماً تعديل الخطة أو نسخ يوم كامل لأيام أخرى. جرّب تعبئة أسبوع واحد فقط الآن.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

