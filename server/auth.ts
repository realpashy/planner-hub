import type { Request } from "express";
import { dbPool, hashPassword, normalizeEmail, verifyPassword } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export function getSessionUserId(req: Request) {
  return req.session?.userId;
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const result = await dbPool.query(
    "SELECT id, email, display_name as \"displayName\", role FROM app_users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rowCount ? (result.rows[0] as AuthUser) : null;
}

export async function registerUser(input: { email: string; password: string; displayName?: string }) {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName?.trim() || null;
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(input.password);

  await dbPool.query(
    "INSERT INTO app_users (id, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, 'user')",
    [id, email, passwordHash, displayName],
  );

  await dbPool.query(
    "INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)",
    [id],
  );

  return getUserById(id);
}

export async function loginUser(emailRaw: string, password: string): Promise<AuthUser | null> {
  const email = normalizeEmail(emailRaw);
  const result = await dbPool.query(
    "SELECT id, email, password_hash, display_name as \"displayName\", role FROM app_users WHERE email = $1 LIMIT 1",
    [email],
  );

  if (!result.rowCount) return null;

  const row = result.rows[0] as {
    id: string;
    email: string;
    password_hash: string;
    displayName: string | null;
    role: string;
  };

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;

  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
  };
}
export async function doesUserExistByEmail(emailRaw: string): Promise<boolean> {
  const email = normalizeEmail(emailRaw);
  const result = await dbPool.query(
    "SELECT 1 FROM app_users WHERE email = $1 LIMIT 1",
    [email],
  );
  return Boolean(result.rowCount);
}
