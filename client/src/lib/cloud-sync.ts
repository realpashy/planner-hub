const PLANNER_KEY = "planner_hub_data";
const BUDGET_KEY = "planner_hub_budget_v2";

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

  const body = (await res.json()) as { plannerData: unknown; budgetData: unknown };

  if (body.plannerData && typeof body.plannerData === "object") {
    localStorage.setItem(PLANNER_KEY, JSON.stringify(body.plannerData));
  }

  if (body.budgetData && typeof body.budgetData === "object") {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(body.budgetData));
  }
}

export async function pushLocalToCloud() {
  const plannerData = safeParse(localStorage.getItem(PLANNER_KEY));
  const budgetData = safeParse(localStorage.getItem(BUDGET_KEY));

  await fetch("/api/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ plannerData, budgetData }),
  });
}
