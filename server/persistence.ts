import { dbPool } from "./db";

export interface CloudDataPayload {
  plannerData?: unknown;
  budgetData?: unknown;
  mealData?: unknown;
}

export async function getCloudData(userId: string) {
  const result = await dbPool.query(
    "SELECT planner_json as \"plannerData\", budget_json as \"budgetData\", meal_json as \"mealData\" FROM app_user_data WHERE user_id = $1 LIMIT 1",
    [userId],
  );

  if (!result.rowCount) {
    await dbPool.query(
      "INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)",
      [userId],
    );
    return { plannerData: null, budgetData: null, mealData: null };
  }

  return result.rows[0] as { plannerData: unknown; budgetData: unknown; mealData: unknown };
}

export async function saveCloudData(userId: string, payload: CloudDataPayload) {
  await dbPool.query(
    `
    INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json, updated_at)
    VALUES ($1, COALESCE($2::jsonb, '{}'::jsonb), COALESCE($3::jsonb, '{}'::jsonb), COALESCE($4::jsonb, '{}'::jsonb), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      planner_json = COALESCE($2::jsonb, app_user_data.planner_json),
      budget_json = COALESCE($3::jsonb, app_user_data.budget_json),
      meal_json = COALESCE($4::jsonb, app_user_data.meal_json),
      updated_at = NOW();
    `,
    [
      userId,
      payload.plannerData ? JSON.stringify(payload.plannerData) : null,
      payload.budgetData ? JSON.stringify(payload.budgetData) : null,
      payload.mealData ? JSON.stringify(payload.mealData) : null,
    ],
  );
}
