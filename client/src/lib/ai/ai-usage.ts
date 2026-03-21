import { fetchMealPlannerQuota } from "./meal-planner-ai";

export async function getMealPlannerAiUsageSnapshot() {
  return fetchMealPlannerQuota();
}
