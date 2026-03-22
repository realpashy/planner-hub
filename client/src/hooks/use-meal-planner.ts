import { useEffect, useMemo, useState } from "react";
import {
  applyServerState,
  createDefaultMealPlannerState,
  getActiveWeekDates,
  getDashboardSummary,
  getDefaultLimitsForTier,
  getJerusalemTodayISO,
  getUsageSummary,
  loadMealPlannerState,
  normalizePreferences,
  saveMealPlannerState,
  type MealPlannerState,
  type MealSwapMode,
  type PlannerLimits,
  type PlannerPreferences,
} from "@/lib/meal-planner";
import {
  deleteMealPlanRemote,
  editMealWithAi,
  fetchMealPlannerState,
  generateWeekWithAi,
  regenerateDayWithAi,
  saveMealPlannerPreferences,
} from "@/lib/ai/meal-planner-ai";

type AdminDebugEntry = {
  id: string;
  kind: "load" | "generate" | "swap" | "regenerate" | "delete";
  message: string;
  createdAt: string;
};

function createDebugEntry(kind: AdminDebugEntry["kind"], message: string): AdminDebugEntry {
  return {
    id: `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message,
    createdAt: new Date().toISOString(),
  };
}

export function useMealPlanner() {
  const [state, setState] = useState<MealPlannerState>(() => loadMealPlannerState());
  const [limits, setLimits] = useState<PlannerLimits>(() => getDefaultLimitsForTier(loadMealPlannerState().tier));
  const [hydrating, setHydrating] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [workingAction, setWorkingAction] = useState<"swap" | "regenerate" | "delete" | null>(null);
  const [adminDebug, setAdminDebug] = useState<AdminDebugEntry[]>([]);

  useEffect(() => {
    saveMealPlannerState(state);
  }, [state]);

  useEffect(() => {
    let mounted = true;
    setHydrating(true);
    fetchMealPlannerState()
      .then((serverState) => {
        if (!mounted) return;
        const nextState = applyServerState(serverState);
        setState(nextState);
        setLimits(serverState.limits);
      })
      .catch((error) => {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          dataStatus: "error",
          lastError: error instanceof Error ? error.message : "تعذر تحميل البيانات الحالية.",
        }));
        if (state.role === "admin" || state.role === "super_admin") {
          setAdminDebug((prev) => [createDebugEntry("load", error instanceof Error ? error.message : String(error)), ...prev].slice(0, 12));
        }
      })
      .finally(() => {
        if (mounted) setHydrating(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const weekDays = useMemo(() => getActiveWeekDates(getJerusalemTodayISO()), []);
  const dashboardSummary = useMemo(() => getDashboardSummary(state.activePlan), [state.activePlan]);
  const usage = useMemo(() => getUsageSummary(state.activePlan, limits), [state.activePlan, limits]);
  const isAdmin = state.role === "admin" || state.role === "super_admin";

  const patchPreferences = (patch: Partial<PlannerPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: normalizePreferences({
        ...prev.preferences,
        ...patch,
      }),
      lastError: null,
    }));
  };

  const usePreviousPreferences = () => {
    if (!state.savedPreferences) return;
    setState((prev) => ({
      ...prev,
      preferences: normalizePreferences(state.savedPreferences ?? prev.preferences),
    }));
  };

  const persistPreferences = async () => {
    await saveMealPlannerPreferences(state.preferences);
    setState((prev) => ({ ...prev, savedPreferences: prev.preferences }));
  };

  const pushDebug = (kind: AdminDebugEntry["kind"], message: string | null | undefined) => {
    if (!isAdmin || !message) return;
    setAdminDebug((prev) => [createDebugEntry(kind, message), ...prev].slice(0, 16));
  };

  const refreshFromServer = async () => {
    const serverState = await fetchMealPlannerState();
    setState(applyServerState(serverState));
    setLimits(serverState.limits);
  };

  const generatePlan = async (replaceCurrent = false) => {
    setGenerating(true);
    setState((prev) => ({ ...prev, viewState: "loading", lastError: null }));
    try {
      await persistPreferences();
      const result = await generateWeekWithAi(state.preferences, replaceCurrent);
      setState(applyServerState(result.state));
      setLimits(result.state.limits);
      pushDebug("generate", result.debug);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر توليد الخطة الآن.";
      setState((prev) => ({
        ...prev,
        viewState: prev.activePlan ? "planner" : "onboarding",
        lastError: message,
      }));
      pushDebug("generate", message);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const regenerateDay = async (dateISO: string) => {
    const day = state.activePlan?.days.find((entry) => entry.dateISO === dateISO);
    if (!day) return null;
    setWorkingAction("regenerate");
    try {
      const result = await regenerateDayWithAi({
        dateISO,
        existingDay: day as unknown as Record<string, unknown>,
        preferences: state.preferences,
      });
      await refreshFromServer();
      pushDebug("regenerate", result.debug);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر إعادة توليد اليوم.";
      setState((prev) => ({ ...prev, lastError: message }));
      pushDebug("regenerate", message);
      throw error;
    } finally {
      setWorkingAction(null);
    }
  };

  const swapMeal = async (dateISO: string, mealType: string, mode: MealSwapMode) => {
    const day = state.activePlan?.days.find((entry) => entry.dateISO === dateISO);
    const meal = day?.meals.find((entry) => entry.mealType === mealType);
    if (!meal) return null;
    setWorkingAction("swap");
    const prompts: Record<MealSwapMode, string> = {
      similar: "Replace this meal with similar calories.",
      higher_protein: "Replace this meal with a higher protein option.",
      faster: "Replace this meal with a faster preparation option.",
      vegetarian: "Replace this meal with a vegetarian option.",
      refresh: "Regenerate this meal from scratch while keeping the day balanced.",
    };
    try {
      const result = await editMealWithAi({
        dateISO,
        mealType: meal.mealType,
        existingMeal: meal as unknown as Record<string, unknown>,
        editRequest: prompts[mode],
      });
      await refreshFromServer();
      pushDebug("swap", result.debug);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تبديل الوجبة.";
      setState((prev) => ({ ...prev, lastError: message }));
      pushDebug("swap", message);
      throw error;
    } finally {
      setWorkingAction(null);
    }
  };

  const deletePlan = async (mode: "meals" | "all") => {
    setWorkingAction("delete");
    try {
      const result = await deleteMealPlanRemote(mode);
      setState(applyServerState(result.state));
      setLimits(result.state.limits);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر حذف الخطة الحالية.";
      setState((prev) => ({ ...prev, lastError: message }));
      pushDebug("delete", message);
      throw error;
    } finally {
      setWorkingAction(null);
    }
  };

  return {
    state,
    setState,
    limits,
    usage,
    dashboardSummary,
    weekDays,
    hydrating,
    generating,
    workingAction,
    isAdmin,
    adminDebug,
    patchPreferences,
    usePreviousPreferences,
    generatePlan,
    regenerateDay,
    swapMeal,
    deletePlan,
    refreshFromServer,
  };
}
