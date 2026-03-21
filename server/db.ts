import { Pool } from "pg";
import crypto from "crypto";
import { readFile } from "fs/promises";
import path from "path";

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

const connectionString = toConnectionString();
const connectionStringForPool = connectionString.replace(/([?&])sslmode=require(&|$)/i, (_m, p1, p2) => (p1 === "?" && p2 ? "?" : ""));

if (!connectionString) {
  throw new Error("Missing database configuration: set DATABASE_URL or SUPABASE_DB_PASSWORD (with optional SUPABASE_URL / PGHOST overrides)");
}

export const dbPool = new Pool({
  connectionString: connectionStringForPool,
  ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

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
  }
}


