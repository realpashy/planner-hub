import { Pool } from "pg";
import crypto from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { DEFAULT_AI_FEATURE_FLAGS } from "../shared/ai/ai-feature-flags.ts";

const DEFAULT_SUPABASE_URL = "https://bachcdysktiyjewwrpmr.supabase.co";

function getSupabaseProjectHost() {
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  try {
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split(".")[0];
    return `db.${projectRef}.supabase.co`;
  } catch {
    return "";
  }
}

function toConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.PGHOST || getSupabaseProjectHost();
  const port = process.env.PGPORT || "5432";
  const database = process.env.PGDATABASE || "postgres";
  const user = process.env.PGUSER || process.env.SUPABASE_DB_USER || "postgres";
  const password = process.env.PGPASSWORD || process.env.SUPABASE_DB_PASSWORD;

  if (!host || !password) return "";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

let dbPoolInstance: Pool | null = null;

export function getDbPool() {
  if (dbPoolInstance) return dbPoolInstance;

  const connectionString = toConnectionString();
  if (!connectionString) {
    throw new Error("Missing database configuration: set DATABASE_URL or SUPABASE_DB_PASSWORD (with optional SUPABASE_URL / PGHOST overrides)");
  }

  const connectionStringForPool = connectionString.replace(/([?&])sslmode=require(&|$)/i, (_m, p1, p2) => (p1 === "?" && p2 ? "?" : ""));
  dbPoolInstance = new Pool({
    connectionString: connectionStringForPool,
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });

  return dbPoolInstance;
}

export const dbPool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const pool = getDbPool() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(pool, prop, receiver);
    return typeof value === "function" ? (value as Function).bind(pool) : value;
  },
}) as Pool;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey as Buffer);
    });
  });
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [salt, keyHex] = encoded.split(":");
  if (!salt || !keyHex) return false;

  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey as Buffer);
    });
  });

  const incoming = Buffer.from(keyHex, "hex");
  if (incoming.length !== key.length) return false;
  return crypto.timingSafeEqual(incoming, key);
}

export async function initializeDatabase() {
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'super_admin', 'user')),
      plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'admin')),
      ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_daily (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      date_key TEXT NOT NULL,
      full_generations_used INT NOT NULL DEFAULT 0,
      light_edits_used INT NOT NULL DEFAULT 0,
      day_regenerations_used INT NOT NULL DEFAULT 0,
      meal_swaps_used INT NOT NULL DEFAULT 0,
      estimated_input_tokens BIGINT NOT NULL DEFAULT 0,
      estimated_output_tokens BIGINT NOT NULL DEFAULT 0,
      estimated_cost_usd NUMERIC NOT NULL DEFAULT 0,
      over_limit_attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, date_key)
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_monthly (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      month_key TEXT NOT NULL,
      full_generations_used INT NOT NULL DEFAULT 0,
      light_edits_used INT NOT NULL DEFAULT 0,
      day_regenerations_used INT NOT NULL DEFAULT 0,
      meal_swaps_used INT NOT NULL DEFAULT 0,
      estimated_input_tokens BIGINT NOT NULL DEFAULT 0,
      estimated_output_tokens BIGINT NOT NULL DEFAULT 0,
      estimated_cost_usd NUMERIC NOT NULL DEFAULT 0,
      over_limit_attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, month_key)
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS ai_credit_packs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      extra_full_generations INT NOT NULL DEFAULT 0,
      extra_light_edits INT NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    ALTER TABLE ai_usage_daily
    ADD COLUMN IF NOT EXISTS day_regenerations_used INT NOT NULL DEFAULT 0;
  `);

  await dbPool.query(`
    ALTER TABLE ai_usage_daily
    ADD COLUMN IF NOT EXISTS meal_swaps_used INT NOT NULL DEFAULT 0;
  `);

  await dbPool.query(`
    ALTER TABLE ai_usage_monthly
    ADD COLUMN IF NOT EXISTS day_regenerations_used INT NOT NULL DEFAULT 0;
  `);

  await dbPool.query(`
    ALTER TABLE ai_usage_monthly
    ADD COLUMN IF NOT EXISTS meal_swaps_used INT NOT NULL DEFAULT 0;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT 'null'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS saved_meal_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      week_key TEXT NOT NULL,
      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
      plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      source TEXT NOT NULL DEFAULT 'local',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      week_start TEXT NOT NULL,
      version INT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
      plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      usage_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      source TEXT NOT NULL DEFAULT 'basic',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, week_start, version)
    );
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS app_user_data (
      user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      planner_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      budget_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      meal_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    ALTER TABLE app_user_data
    ADD COLUMN IF NOT EXISTS meal_json JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS meal_catalog (
      id TEXT PRIMARY KEY,
      meal_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const catalogCount = await dbPool.query("SELECT COUNT(*)::int AS count FROM meal_catalog");
  if ((catalogCount.rows[0]?.count ?? 0) === 0) {
    const raw = await readFile(path.resolve(process.cwd(), "data", "meal-dataset.json"), "utf8");
    const meals = JSON.parse(raw) as Array<{ id: string }>;
    for (const meal of meals) {
      await dbPool.query(
        `
        INSERT INTO meal_catalog (id, meal_json, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET meal_json = EXCLUDED.meal_json, updated_at = NOW();
        `,
        [meal.id, JSON.stringify(meal)],
      );
    }
  }

  const adminEmail = normalizeEmail(process.env.SUPER_ADMIN_EMAIL || "realpashy@gmail.com");
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "@Adidas2026...";

  for (const [key, value] of Object.entries(DEFAULT_AI_FEATURE_FLAGS)) {
    await dbPool.query(
      `
      INSERT INTO feature_flags (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO NOTHING;
      `,
      [key, JSON.stringify(value)],
    );
  }

  await dbPool.query(`
    INSERT INTO profiles (id, role, plan_tier, ai_enabled, timezone, updated_at)
    SELECT
      app_users.id,
      CASE
        WHEN app_users.role IN ('super_admin', 'admin') THEN app_users.role
        ELSE 'user'
      END,
      CASE
        WHEN app_users.role IN ('super_admin', 'admin') THEN 'admin'
        ELSE 'free'
      END,
      TRUE,
      'Asia/Jerusalem',
      NOW()
    FROM app_users
    ON CONFLICT (id)
    DO UPDATE SET
      role = EXCLUDED.role,
      plan_tier = CASE WHEN profiles.plan_tier = 'pro' THEN profiles.plan_tier ELSE EXCLUDED.plan_tier END,
      updated_at = NOW();
  `);

  const existing = await dbPool.query("SELECT id FROM app_users WHERE email = $1 LIMIT 1", [adminEmail]);
  if (existing.rowCount === 0) {
    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const passwordHash = await hashPassword(adminPassword);

    await dbPool.query(
      "INSERT INTO app_users (id, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, $5)",
      [id, adminEmail, passwordHash, "Admin", "super_admin"],
    );

    await dbPool.query(
      "INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)",
      [id],
    );

    await dbPool.query(
      "INSERT INTO profiles (id, role, plan_tier, ai_enabled, timezone) VALUES ($1, 'super_admin', 'admin', TRUE, 'Asia/Jerusalem') ON CONFLICT (id) DO NOTHING",
      [id],
    );
  }
}


