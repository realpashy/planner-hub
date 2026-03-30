const PLANNER_KEY = "planner_hub_data";
const BUDGET_KEY = "planner_hub_budget_v2";
const MEAL_KEY = "planner_hub_meal_planner_v5_mobile_weekly";
const CASHFLOW_KEY = "planner_hub_cashflow_v2";
const HABITS_KEY = "planner_hub_habits_v1";
let lastPushedSignature = "";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function pullCloudToLocal() {
  const res = await fetch("/api/data", { credentials: "include" });
  if (!res.ok) return;

  const body = (await res.json()) as { plannerData: unknown; budgetData: unknown; mealData: unknown; cashflowData: unknown; habitsData: unknown };

  if (body.plannerData && typeof body.plannerData === "object") {
    localStorage.setItem(PLANNER_KEY, JSON.stringify(body.plannerData));
  }

  if (body.budgetData && typeof body.budgetData === "object") {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(body.budgetData));
  }

  if (body.mealData && typeof body.mealData === "object") {
    localStorage.setItem(MEAL_KEY, JSON.stringify(body.mealData));
  }

  if (body.cashflowData && typeof body.cashflowData === "object") {
    localStorage.setItem(CASHFLOW_KEY, JSON.stringify(body.cashflowData));
  }

  if (body.habitsData && typeof body.habitsData === "object") {
    localStorage.setItem(HABITS_KEY, JSON.stringify(body.habitsData));
  }
}

export async function pushLocalToCloud() {
  const plannerData = safeParse(localStorage.getItem(PLANNER_KEY));
  const budgetData = safeParse(localStorage.getItem(BUDGET_KEY));
  const mealData = safeParse(localStorage.getItem(MEAL_KEY));
  const cashflowData = safeParse(localStorage.getItem(CASHFLOW_KEY));
  const habitsData = safeParse(localStorage.getItem(HABITS_KEY));
  const signature = JSON.stringify({ plannerData, budgetData, mealData, cashflowData, habitsData });

  if (signature === lastPushedSignature) return;

  await fetch("/api/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ plannerData, budgetData, mealData, cashflowData, habitsData }),
  });

  lastPushedSignature = signature;
}
