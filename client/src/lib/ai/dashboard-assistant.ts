import { apiRequest } from "@/lib/queryClient";
import {
  dashboardAssistantRequestSchema,
  dashboardAssistantResultSchema,
  type DashboardAssistantAction,
  type DashboardAssistantContext,
  type DashboardAssistantResult,
} from "@shared/ai/dashboard-assistant";

const DASHBOARD_AI_CACHE_KEY = "planner_hub_dashboard_ai_cache_v1";

type CachedBrief = {
  date: string;
  contextHash: string;
  result: DashboardAssistantResult;
};

function safeWindow() {
  return typeof window === "undefined" ? null : window;
}

export function getDashboardContextHash(context: DashboardAssistantContext) {
  return JSON.stringify({
    isoDate: context.isoDate,
    planner: context.planner,
    habits: context.habits,
    meals: context.meals,
    budget: context.budget,
    cashflow: context.cashflow,
  });
}

export function loadCachedDashboardBrief(date: string, contextHash: string) {
  const win = safeWindow();
  if (!win) return null;

  try {
    const raw = win.localStorage.getItem(DASHBOARD_AI_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBrief;
    if (parsed.date !== date || parsed.contextHash !== contextHash) return null;
    return dashboardAssistantResultSchema.parse(parsed.result);
  } catch {
    return null;
  }
}

export function saveCachedDashboardBrief(date: string, contextHash: string, result: DashboardAssistantResult) {
  const win = safeWindow();
  if (!win) return;
  const payload: CachedBrief = { date, contextHash, result };
  win.localStorage.setItem(DASHBOARD_AI_CACHE_KEY, JSON.stringify(payload));
}

export async function requestDashboardAssistant(
  action: DashboardAssistantAction,
  context: DashboardAssistantContext,
) {
  const payload = dashboardAssistantRequestSchema.parse({ action, context });
  const response = await apiRequest("POST", "/api/dashboard/ai", payload);
  const body = (await response.json()) as { result: DashboardAssistantResult };
  return dashboardAssistantResultSchema.parse(body.result);
}
