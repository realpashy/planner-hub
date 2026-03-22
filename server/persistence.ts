import { dbPool } from "./db";
import { isFullGenerationAction, isLightEditAction } from "../shared/ai/ai-limits";
import type { AiActionType } from "../shared/ai/ai-types";
import { DEFAULT_AI_FEATURE_FLAGS } from "../shared/ai/ai-feature-flags";
import { type ProductPlanTier } from "../shared/plans/plan-tiers";
import { resolvePlanTier } from "../shared/plans/feature-access";

export interface CloudDataPayload {
  plannerData?: unknown;
  budgetData?: unknown;
  mealData?: unknown;
}

export interface ProfileRow {
  id: string;
  role: string;
  planTier: ProductPlanTier;
  aiEnabled: boolean;
  timezone: string;
}

export interface MealPlanRecordRow {
  id: string;
  userId: string;
  weekStart: string;
  version: number;
  isActive: boolean;
  preferences: Record<string, unknown>;
  planData: Record<string, unknown>;
  usageData: Record<string, unknown>;
  source: string;
  createdAt: string;
  updatedAt: string;
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

export async function getOrCreateProfile(userId: string, fallbackRole: string) {
  const existing = await dbPool.query(
    'SELECT id, role, plan_tier as "planTier", ai_enabled as "aiEnabled", timezone FROM profiles WHERE id = $1 LIMIT 1',
    [userId],
  );
  if (existing.rowCount) {
    const row = existing.rows[0] as ProfileRow;
    return {
      ...row,
      planTier: resolvePlanTier(row.planTier),
    };
  }

  await dbPool.query(
    "INSERT INTO profiles (id, role, plan_tier, ai_enabled, timezone) VALUES ($1, $2, $3, TRUE, 'Asia/Jerusalem')",
    [userId, fallbackRole === "super_admin" ? "super_admin" : fallbackRole === "admin" ? "admin" : "user", fallbackRole === "super_admin" || fallbackRole === "admin" ? "admin" : "free"],
  );

  return {
    id: userId,
    role: fallbackRole,
    planTier: fallbackRole === "super_admin" || fallbackRole === "admin" ? "admin" : "free",
    aiEnabled: true,
    timezone: "Asia/Jerusalem",
  } satisfies ProfileRow;
}

export async function getFeatureFlags() {
  const result = await dbPool.query("SELECT key, value FROM feature_flags");
  const flags = { ...DEFAULT_AI_FEATURE_FLAGS } as Record<string, unknown>;
  for (const row of result.rows) {
    flags[String(row.key)] = row.value;
  }
  return flags;
}

export async function getOrCreateAiUsageRows(userId: string, dateKey: string, monthKey: string) {
  await dbPool.query(
    "INSERT INTO ai_usage_daily (user_id, date_key) VALUES ($1, $2) ON CONFLICT (user_id, date_key) DO NOTHING",
    [userId, dateKey],
  );
  await dbPool.query(
    "INSERT INTO ai_usage_monthly (user_id, month_key) VALUES ($1, $2) ON CONFLICT (user_id, month_key) DO NOTHING",
    [userId, monthKey],
  );

  const [daily, monthly] = await Promise.all([
    dbPool.query(
      `SELECT full_generations_used as "fullGenerationsUsed", light_edits_used as "lightEditsUsed",
        estimated_input_tokens as "estimatedInputTokens", estimated_output_tokens as "estimatedOutputTokens",
        estimated_cost_usd as "estimatedCostUsd", over_limit_attempts as "overLimitAttempts"
       FROM ai_usage_daily WHERE user_id = $1 AND date_key = $2 LIMIT 1`,
      [userId, dateKey],
    ),
    dbPool.query(
      `SELECT full_generations_used as "fullGenerationsUsed", light_edits_used as "lightEditsUsed",
        estimated_input_tokens as "estimatedInputTokens", estimated_output_tokens as "estimatedOutputTokens",
        estimated_cost_usd as "estimatedCostUsd", over_limit_attempts as "overLimitAttempts"
       FROM ai_usage_monthly WHERE user_id = $1 AND month_key = $2 LIMIT 1`,
      [userId, monthKey],
    ),
  ]);

  return {
    daily: daily.rows[0] as {
      fullGenerationsUsed: number;
      lightEditsUsed: number;
      estimatedInputTokens: number;
      estimatedOutputTokens: number;
      estimatedCostUsd: number;
      overLimitAttempts: number;
    },
    monthly: monthly.rows[0] as {
      fullGenerationsUsed: number;
      lightEditsUsed: number;
      estimatedInputTokens: number;
      estimatedOutputTokens: number;
      estimatedCostUsd: number;
      overLimitAttempts: number;
    },
  };
}

export async function consumeAiCreditPack(userId: string, mode: "peek" | "consume", actionType?: AiActionType) {
  const result = await dbPool.query(
    `SELECT id, extra_full_generations as "extraFullGenerations", extra_light_edits as "extraLightEdits", expires_at as "expiresAt"
     FROM ai_credit_packs
     WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at ASC`,
    [userId],
  );
  const packs = result.rows as Array<{ id: string; extraFullGenerations: number; extraLightEdits: number; expiresAt: string | null }>;
  const totals = packs.reduce(
    (acc, pack) => {
      acc.extraFullGenerations += pack.extraFullGenerations;
      acc.extraLightEdits += pack.extraLightEdits;
      return acc;
    },
    { extraFullGenerations: 0, extraLightEdits: 0 },
  );

  if (mode === "peek" || !actionType) return totals;

  const consumeField = isFullGenerationAction(actionType) ? "extra_full_generations" : "extra_light_edits";
  const hasAvailable = packs.find((pack) =>
    isFullGenerationAction(actionType) ? pack.extraFullGenerations > 0 : pack.extraLightEdits > 0,
  );

  if (hasAvailable) {
    await dbPool.query(
      `UPDATE ai_credit_packs SET ${consumeField} = GREATEST(${consumeField} - 1, 0), updated_at = NOW() WHERE id = $1`,
      [hasAvailable.id],
    );
  }

  return totals;
}

export async function incrementAiUsage(input: {
  userId: string;
  actionType: AiActionType;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  useCreditPack: boolean;
}) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const monthKey = new Date().toISOString().slice(0, 7);
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO ai_usage_daily (user_id, date_key) VALUES ($1, $2) ON CONFLICT (user_id, date_key) DO NOTHING",
      [input.userId, dateKey],
    );
    await client.query(
      "INSERT INTO ai_usage_monthly (user_id, month_key) VALUES ($1, $2) ON CONFLICT (user_id, month_key) DO NOTHING",
      [input.userId, monthKey],
    );

    const fullInc = isFullGenerationAction(input.actionType) ? 1 : 0;
    const lightInc = isLightEditAction(input.actionType) ? 1 : 0;
    await client.query(
      `UPDATE ai_usage_daily
       SET full_generations_used = full_generations_used + $3,
           light_edits_used = light_edits_used + $4,
           estimated_input_tokens = estimated_input_tokens + $5,
           estimated_output_tokens = estimated_output_tokens + $6,
           estimated_cost_usd = estimated_cost_usd + $7,
           updated_at = NOW()
       WHERE user_id = $1 AND date_key = $2`,
      [input.userId, dateKey, fullInc, lightInc, input.inputTokens, input.outputTokens, input.estimatedCostUsd],
    );
    await client.query(
      `UPDATE ai_usage_monthly
       SET full_generations_used = full_generations_used + $3,
           light_edits_used = light_edits_used + $4,
           estimated_input_tokens = estimated_input_tokens + $5,
           estimated_output_tokens = estimated_output_tokens + $6,
           estimated_cost_usd = estimated_cost_usd + $7,
           updated_at = NOW()
       WHERE user_id = $1 AND month_key = $2`,
      [input.userId, monthKey, fullInc, lightInc, input.inputTokens, input.outputTokens, input.estimatedCostUsd],
    );

    if (input.useCreditPack) {
      await consumeAiCreditPack(input.userId, "consume", input.actionType);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function recordOverLimitAttempt(userId: string) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const monthKey = new Date().toISOString().slice(0, 7);
  await getOrCreateAiUsageRows(userId, dateKey, monthKey);
  await Promise.all([
    dbPool.query("UPDATE ai_usage_daily SET over_limit_attempts = over_limit_attempts + 1, updated_at = NOW() WHERE user_id = $1 AND date_key = $2", [userId, dateKey]),
    dbPool.query("UPDATE ai_usage_monthly SET over_limit_attempts = over_limit_attempts + 1, updated_at = NOW() WHERE user_id = $1 AND month_key = $2", [userId, monthKey]),
  ]);
}

export async function saveSavedMealPlan(userId: string, payload: {
  weekKey: string;
  preferences: unknown;
  planData: unknown;
  source: string;
}) {
  await dbPool.query(
    `INSERT INTO saved_meal_plans (user_id, week_key, preferences, plan_data, source, updated_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, NOW())`,
    [userId, payload.weekKey, JSON.stringify(payload.preferences), JSON.stringify(payload.planData), payload.source],
  );
}

export async function getSavedMealPlanContext(userId: string) {
  const result = await dbPool.query(
    `SELECT week_key as "weekKey", source
     FROM saved_meal_plans
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 6`,
    [userId],
  );
  return result.rows as Array<{ weekKey: string; source: string }>;
}

export async function saveMealPlannerPreferences(userId: string, preferences: unknown) {
  const cloud = await getCloudData(userId);
  const currentMealData =
    cloud.mealData && typeof cloud.mealData === "object" ? { ...(cloud.mealData as Record<string, unknown>) } : {};

  await saveCloudData(userId, {
    mealData: {
      ...currentMealData,
      preferences,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function getMealPlannerPreferences(userId: string) {
  const cloud = await getCloudData(userId);
  const mealData =
    cloud.mealData && typeof cloud.mealData === "object" ? (cloud.mealData as Record<string, unknown>) : {};
  const preferences =
    mealData.preferences && typeof mealData.preferences === "object" ? (mealData.preferences as Record<string, unknown>) : null;
  return preferences;
}

function mapMealPlanRow(row: Record<string, unknown>): MealPlanRecordRow {
  return {
    id: String(row.id),
    userId: String(row.userId),
    weekStart: String(row.weekStart),
    version: Number(row.version),
    isActive: Boolean(row.isActive),
    preferences: (row.preferences as Record<string, unknown>) ?? {},
    planData: (row.planData as Record<string, unknown>) ?? {},
    usageData: (row.usageData as Record<string, unknown>) ?? {},
    source: String(row.source ?? "basic"),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export async function getActiveMealPlan(userId: string, weekStart: string) {
  const result = await dbPool.query(
    `SELECT
      id,
      user_id as "userId",
      week_start as "weekStart",
      version,
      is_active as "isActive",
      preferences,
      plan_data as "planData",
      usage_data as "usageData",
      source,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM meal_plans
    WHERE user_id = $1 AND week_start = $2 AND is_active = TRUE
    ORDER BY version DESC
    LIMIT 1`,
    [userId, weekStart],
  );

  return result.rowCount ? mapMealPlanRow(result.rows[0] as Record<string, unknown>) : null;
}

export async function getLatestMealPlan(userId: string) {
  const result = await dbPool.query(
    `SELECT
      id,
      user_id as "userId",
      week_start as "weekStart",
      version,
      is_active as "isActive",
      preferences,
      plan_data as "planData",
      usage_data as "usageData",
      source,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM meal_plans
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT 1`,
    [userId],
  );

  return result.rowCount ? mapMealPlanRow(result.rows[0] as Record<string, unknown>) : null;
}

export async function countMealPlanVersionsForWeek(userId: string, weekStart: string) {
  const result = await dbPool.query(
    "SELECT COUNT(*)::int AS count, COALESCE(MAX(version), 0)::int AS max_version FROM meal_plans WHERE user_id = $1 AND week_start = $2",
    [userId, weekStart],
  );
  return {
    count: Number(result.rows[0]?.count ?? 0),
    maxVersion: Number(result.rows[0]?.max_version ?? 0),
  };
}

export async function createMealPlanVersion(userId: string, payload: {
  weekStart: string;
  preferences: unknown;
  planData: unknown;
  usageData: unknown;
  source: string;
}) {
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    const versionInfo = await client.query(
      "SELECT COALESCE(MAX(version), 0)::int AS max_version FROM meal_plans WHERE user_id = $1 AND week_start = $2",
      [userId, payload.weekStart],
    );
    const version = Number(versionInfo.rows[0]?.max_version ?? 0) + 1;
    await client.query("UPDATE meal_plans SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1 AND week_start = $2 AND is_active = TRUE", [userId, payload.weekStart]);
    const inserted = await client.query(
      `INSERT INTO meal_plans (user_id, week_start, version, is_active, preferences, plan_data, usage_data, source, created_at, updated_at)
       VALUES ($1, $2, $3, TRUE, $4::jsonb, $5::jsonb, $6::jsonb, $7, NOW(), NOW())
       RETURNING
         id,
         user_id as "userId",
         week_start as "weekStart",
         version,
         is_active as "isActive",
         preferences,
         plan_data as "planData",
         usage_data as "usageData",
         source,
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [userId, payload.weekStart, version, JSON.stringify(payload.preferences), JSON.stringify(payload.planData), JSON.stringify(payload.usageData), payload.source],
    );
    await client.query("COMMIT");
    return mapMealPlanRow(inserted.rows[0] as Record<string, unknown>);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateMealPlanVersion(planId: string, payload: {
  planData: unknown;
  usageData: unknown;
}) {
  const result = await dbPool.query(
    `UPDATE meal_plans
     SET plan_data = $2::jsonb,
         usage_data = $3::jsonb,
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       user_id as "userId",
       week_start as "weekStart",
       version,
       is_active as "isActive",
       preferences,
       plan_data as "planData",
       usage_data as "usageData",
       source,
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    [planId, JSON.stringify(payload.planData), JSON.stringify(payload.usageData)],
  );
  return result.rowCount ? mapMealPlanRow(result.rows[0] as Record<string, unknown>) : null;
}

export async function deactivateActiveMealPlan(userId: string, weekStart?: string) {
  if (weekStart) {
    await dbPool.query("UPDATE meal_plans SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1 AND week_start = $2 AND is_active = TRUE", [userId, weekStart]);
    return;
  }
  await dbPool.query("UPDATE meal_plans SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1 AND is_active = TRUE", [userId]);
}

export async function getAdminUsageSummary() {
  const [monthlyCost, topUsers, tierCounts, aggregates, flags] = await Promise.all([
    dbPool.query("SELECT COALESCE(SUM(estimated_cost_usd), 0) AS total FROM ai_usage_monthly WHERE month_key = $1", [new Date().toISOString().slice(0, 7)]),
    dbPool.query(
      `SELECT p.id, u.email, p.plan_tier as "planTier", COALESCE(m.estimated_cost_usd, 0) as "estimatedCostUsd"
       FROM profiles p
       JOIN app_users u ON u.id = p.id
       LEFT JOIN ai_usage_monthly m ON m.user_id = p.id AND m.month_key = $1
       ORDER BY "estimatedCostUsd" DESC
       LIMIT 10`,
      [new Date().toISOString().slice(0, 7)],
    ),
    dbPool.query(`SELECT plan_tier as "planTier", COUNT(*)::int as count FROM profiles GROUP BY plan_tier`),
    dbPool.query(
      `SELECT
        COALESCE(SUM(full_generations_used), 0) as "fullGenerationsUsed",
        COALESCE(SUM(light_edits_used), 0) as "lightEditsUsed",
        COALESCE(SUM(over_limit_attempts), 0) as "overLimitAttempts"
       FROM ai_usage_monthly
       WHERE month_key = $1`,
      [new Date().toISOString().slice(0, 7)],
    ),
    getFeatureFlags(),
  ]);

  return {
    totalEstimatedCostUsd: Number(monthlyCost.rows[0]?.total ?? 0),
    topUsers: topUsers.rows,
    activeUsersByTier: tierCounts.rows,
    aggregates: aggregates.rows[0] ?? { fullGenerationsUsed: 0, lightEditsUsed: 0, overLimitAttempts: 0 },
    featureFlags: flags,
  };
}
