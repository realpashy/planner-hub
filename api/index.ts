import crypto from "crypto";
import express from "express";
import { Pool } from "pg";
import { readFile } from "fs/promises";
import path from "path";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
};

const DEFAULT_SUPABASE_URL = "https://bachcdysktiyjewwrpmr.supabase.co";
const app = express();

let startupError: string | null = null;
let initPromise: Promise<void> | null = null;
let mealPlannerInitPromise: Promise<void> | null = null;
let dbPoolInstance: Pool | null = null;

type MealPlannerRuntime = {
  initializeSharedDatabase: () => Promise<void>;
  getAdminUsageSummary: () => Promise<unknown>;
  recordOverLimitAttempt: (userId: string) => Promise<unknown>;
  getAiQuotaStatus: (userId: string) => Promise<unknown>;
  getMealPlannerStateForUser: (userId: string) => Promise<unknown>;
  saveMealPlannerPreferencesForUser: (userId: string, preferences: unknown) => Promise<unknown>;
  generateWeekForUser: (userId: string, body: unknown) => Promise<unknown>;
  editMealForUser: (userId: string, body: unknown) => Promise<unknown>;
  regenerateDayForUser: (userId: string, body: unknown) => Promise<unknown>;
  updateGroceryItemForUser: (userId: string, body: unknown) => Promise<unknown>;
  deleteMealPlanForUser: (userId: string, mode: "meals" | "all") => Promise<unknown>;
};

let mealPlannerRuntimePromise: Promise<MealPlannerRuntime> | null = null;

function getDebugPayload() {
  return {
    ok: startupError === null,
    startupError,
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasSupabaseDbPassword: Boolean(process.env.SUPABASE_DB_PASSWORD),
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      mealModel: process.env.OPENAI_MEAL_MODEL || null,
      nodeEnv: process.env.NODE_ENV || null,
    },
  };
}

function extractCountryFromHeaders(req: express.Request) {
  const candidates = [
    req.headers["x-vercel-ip-country"],
    req.headers["cf-ipcountry"],
    req.headers["x-country-code"],
  ];

  for (const candidate of candidates) {
    const value = Array.isArray(candidate) ? candidate[0] : candidate;
    if (typeof value === "string" && /^[A-Za-z]{2}$/.test(value.trim())) {
      return value.trim().toUpperCase();
    }
  }

  return null;
}

function extractClientIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstForwarded = forwardedValue?.split(",")[0]?.trim();
  if (firstForwarded) return firstForwarded.replace(/^::ffff:/, "");

  const realIpHeader = req.headers["x-real-ip"];
  const realIp = Array.isArray(realIpHeader) ? realIpHeader[0] : realIpHeader;
  if (realIp) return realIp.replace(/^::ffff:/, "");

  return req.socket.remoteAddress?.replace(/^::ffff:/, "") ?? null;
}

function isPublicIp(ip: string | null) {
  if (!ip) return false;
  const normalized = ip.toLowerCase();
  if (normalized === "127.0.0.1" || normalized === "::1" || normalized.startsWith("10.") || normalized.startsWith("192.168.") || normalized.startsWith("169.254.")) {
    return false;
  }
  if (normalized.startsWith("172.")) {
    const second = Number(normalized.split(".")[1]);
    if (second >= 16 && second <= 31) return false;
  }
  return true;
}

async function detectCountryFromIp(ip: string | null, signal?: AbortSignal) {
  if (!isPublicIp(ip)) return null;

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip!)}/json/`, { signal });
    if (!response.ok) return null;
    const data = await response.json() as { country_code?: string; error?: boolean };
    if (data.error) return null;
    const code = data.country_code?.toUpperCase();
    return code && /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || "planner-hub-dev-session";
}

function signSessionValue(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function serializeAuthCookie(user: { id: string; role: string }) {
  const payload = `${user.id}.${user.role}`;
  const signature = signSessionValue(payload);
  return `${payload}.${signature}`;
}

function parseCookies(cookieHeader: string | undefined) {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  cookieHeader.split(";").forEach((part) => {
    const index = part.indexOf("=");
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    result[key] = decodeURIComponent(value);
  });
  return result;
}

function readAuthFromRequest(req: express.Request) {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies["planner_hub_auth"];
  if (!raw) return null;
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  if (signSessionValue(payload) !== signature) return null;
  const [userId, role] = payload.split(".");
  if (!userId || !role) return null;
  return { userId, role };
}

function setAuthCookie(res: express.Response, user: { id: string; role: string }) {
  res.cookie("planner_hub_auth", serializeAuthCookie(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });
}

function getSupabaseProjectHost() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
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

function getDbPool() {
  if (dbPoolInstance) return dbPoolInstance;
  const connectionString = toConnectionString();
  if (!connectionString) {
    throw new Error("Missing database configuration: set DATABASE_URL or SUPABASE_DB_PASSWORD.");
  }

  const connectionStringForPool = connectionString.replace(
    /([?&])sslmode=require(&|$)/i,
    (_m, p1, p2) => (p1 === "?" && p2 ? "?" : ""),
  );

  dbPoolInstance = new Pool({
    connectionString: connectionStringForPool,
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });

  return dbPoolInstance;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey as Buffer);
    });
  });
  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string) {
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

async function initializeDatabase() {
  const dbPool = getDbPool();

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
      cashflow_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await dbPool.query(`
    ALTER TABLE app_user_data
    ADD COLUMN IF NOT EXISTS meal_json JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await dbPool.query(`
    ALTER TABLE app_user_data
    ADD COLUMN IF NOT EXISTS cashflow_json JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS cashflow_attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INT NOT NULL DEFAULT 0,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
}

async function ensureInit() {
  if (!initPromise) {
    initPromise = initializeDatabase().then(() => {
      startupError = null;
    }).catch((error) => {
      startupError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      throw error;
    });
  }
  return initPromise;
}

async function loadMealPlannerRuntime(): Promise<MealPlannerRuntime> {
  if (!mealPlannerRuntimePromise) {
    mealPlannerRuntimePromise = (async () => {
      const [{ initializeDatabase }, persistenceModule, serviceModule] = await Promise.all([
        import("../server/db.ts"),
        import("../server/persistence.ts"),
        import("../server/meal-planner/service.ts"),
      ]);

      return {
        initializeSharedDatabase: initializeDatabase,
        getAdminUsageSummary: persistenceModule.getAdminUsageSummary,
        recordOverLimitAttempt: persistenceModule.recordOverLimitAttempt,
        getAiQuotaStatus: serviceModule.getAiQuotaStatus,
        getMealPlannerStateForUser: serviceModule.getMealPlannerStateForUser,
        saveMealPlannerPreferencesForUser: serviceModule.saveMealPlannerPreferencesForUser,
        generateWeekForUser: serviceModule.generateWeekForUser,
        editMealForUser: serviceModule.editMealForUser,
        regenerateDayForUser: serviceModule.regenerateDayForUser,
        updateGroceryItemForUser: serviceModule.updateGroceryItemForUser,
        deleteMealPlanForUser: serviceModule.deleteMealPlanForUser,
      };
    })().catch((error) => {
      mealPlannerRuntimePromise = null;
      throw error;
    });
  }

  return mealPlannerRuntimePromise;
}

async function ensureMealPlannerInit() {
  if (!mealPlannerInitPromise) {
    mealPlannerInitPromise = loadMealPlannerRuntime()
      .then((runtime) => runtime.initializeSharedDatabase())
      .catch((error) => {
      mealPlannerInitPromise = null;
      throw error;
      });
  }
  return mealPlannerInitPromise;
}

async function getUserById(id: string): Promise<AuthUser | null> {
  const result = await getDbPool().query(
    'SELECT id, email, display_name as "displayName", role FROM app_users WHERE id = $1 LIMIT 1',
    [id],
  );
  return result.rowCount ? (result.rows[0] as AuthUser) : null;
}

async function doesUserExistByEmail(emailRaw: string): Promise<boolean> {
  const email = normalizeEmail(emailRaw);
  const result = await getDbPool().query("SELECT 1 FROM app_users WHERE email = $1 LIMIT 1", [email]);
  return Boolean(result.rowCount);
}

async function registerUser(input: { email: string; password: string; displayName?: string }) {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName?.trim() || null;
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(input.password);

  await getDbPool().query(
    "INSERT INTO app_users (id, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, 'user')",
    [id, email, passwordHash, displayName],
  );

  await getDbPool().query(
    "INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json, cashflow_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)",
    [id],
  );

  return getUserById(id);
}

async function loginUser(emailRaw: string, password: string): Promise<AuthUser | null> {
  const email = normalizeEmail(emailRaw);
  const result = await getDbPool().query(
    'SELECT id, email, password_hash, display_name as "displayName", role FROM app_users WHERE email = $1 LIMIT 1',
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

async function getCloudData(userId: string) {
  const result = await getDbPool().query(
    'SELECT planner_json as "plannerData", budget_json as "budgetData", meal_json as "mealData", cashflow_json as "cashflowData" FROM app_user_data WHERE user_id = $1 LIMIT 1',
    [userId],
  );

  if (!result.rowCount) {
    await getDbPool().query(
      "INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json, cashflow_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)",
      [userId],
    );
    return { plannerData: null, budgetData: null, mealData: null, cashflowData: null };
  }

  return result.rows[0] as { plannerData: unknown; budgetData: unknown; mealData: unknown; cashflowData: unknown };
}

async function saveCloudData(userId: string, payload: { plannerData?: unknown; budgetData?: unknown; mealData?: unknown; cashflowData?: unknown }) {
  await getDbPool().query(
    `
    INSERT INTO app_user_data (user_id, planner_json, budget_json, meal_json, cashflow_json, updated_at)
    VALUES ($1, COALESCE($2::jsonb, '{}'::jsonb), COALESCE($3::jsonb, '{}'::jsonb), COALESCE($4::jsonb, '{}'::jsonb), COALESCE($5::jsonb, '{}'::jsonb), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      planner_json = COALESCE($2::jsonb, app_user_data.planner_json),
      budget_json = COALESCE($3::jsonb, app_user_data.budget_json),
      meal_json = COALESCE($4::jsonb, app_user_data.meal_json),
      cashflow_json = COALESCE($5::jsonb, app_user_data.cashflow_json),
      updated_at = NOW();
    `,
    [
      userId,
      payload.plannerData ? JSON.stringify(payload.plannerData) : null,
      payload.budgetData ? JSON.stringify(payload.budgetData) : null,
      payload.mealData ? JSON.stringify(payload.mealData) : null,
      payload.cashflowData ? JSON.stringify(payload.cashflowData) : null,
    ],
  );
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.get("/api/debug/startup", (_req, res) => {
  const payload = getDebugPayload();
  res.status(payload.ok ? 200 : 500).json(payload);
});

app.get("/api/health", (_req, res) => {
  const payload = getDebugPayload();
  res.status(payload.ok ? 200 : 503).json({ status: payload.ok ? "ok" : "boot_error", ...payload });
});

app.get("/api/geo/country", async (req, res) => {
  const headerCountry = extractCountryFromHeaders(req);
  if (headerCountry) {
    return res.json({ countryIso2: headerCountry, source: "header" });
  }

  const ipCountry = await detectCountryFromIp(extractClientIp(req));
  if (ipCountry) {
    return res.json({ countryIso2: ipCountry, source: "ipapi" });
  }

  return res.json({ countryIso2: null, source: "unknown" });
});

app.use(async (req, res, next) => {
  if (req.path === "/api/debug/startup" || req.path === "/api/health" || req.path === "/api/geo/country") {
    return next();
  }

  try {
    await ensureInit();
    next();
  } catch {
    res.status(500).json({
      message: "Backend startup failed",
      debug: getDebugPayload(),
    });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const auth = readAuthFromRequest(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ message: "غير مسجل" });
  const user = await getUserById(userId);
  if (!user) return res.status(401).json({ message: "غير مسجل" });
  return res.json({ user });
});

app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || "").trim();

  if (!email || !password) {
    return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
  }

  try {
    const user = await registerUser({ email, password, displayName });
    if (!user) return res.status(500).json({ message: "تعذر إنشاء الحساب" });
    setAuthCookie(res, { id: user.id, role: user.role });
    return res.status(201).json({ user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "تعذر إنشاء الحساب";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return res.status(409).json({ message: "هذا البريد مستخدم بالفعل" });
    }
    return res.status(500).json({ message: msg });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
  }

  const exists = await doesUserExistByEmail(email);
  if (!exists) {
    return res.status(404).json({ message: "هذا البريد غير مسجل. قم بإنشاء حساب جديد." });
  }

  const user = await loginUser(email, password);
  if (!user) {
    return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
  }

  setAuthCookie(res, { id: user.id, role: user.role });
  return res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("planner_hub_auth", { path: "/" });
  res.json({ ok: true });
});

app.get("/api/data", async (req, res) => {
  const userId = readAuthFromRequest(req)?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });
  const data = await getCloudData(userId);
  return res.json(data);
});

app.put("/api/data", async (req, res) => {
  const userId = readAuthFromRequest(req)?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });
  await saveCloudData(userId, {
    plannerData: req.body?.plannerData,
    budgetData: req.body?.budgetData,
    mealData: req.body?.mealData,
    cashflowData: req.body?.cashflowData,
  });
  return res.json({ ok: true });
});

app.post("/api/cashflow/attachments", async (req, res) => {
  const userId = readAuthFromRequest(req)?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });

  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
  const mimeType = typeof req.body?.mimeType === "string" ? req.body.mimeType.trim() : "";
  const dataBase64 = typeof req.body?.dataBase64 === "string" ? req.body.dataBase64.trim() : "";
  const sizeBytes = Number(req.body?.sizeBytes ?? 0);

  if (!fileName || !mimeType || !dataBase64 || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return res.status(400).json({ message: "קובץ קבלה חסר או לא תקין" });
  }

  if (!/^image\/|^application\/pdf$/i.test(mimeType)) {
    return res.status(400).json({ message: "ניתן לצרף רק תמונה או PDF" });
  }

  if (sizeBytes > 6 * 1024 * 1024) {
    return res.status(400).json({ message: "הקובץ גדול מדי. עד 6MB" });
  }

  const insert = await getDbPool().query(
    `INSERT INTO cashflow_attachments (user_id, file_name, mime_type, size_bytes, data_base64, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, file_name as "fileName", mime_type as "mimeType", size_bytes as "sizeBytes", created_at as "createdAt"`,
    [userId, fileName, mimeType, sizeBytes, dataBase64],
  );

  return res.status(201).json(insert.rows[0]);
});

app.get("/api/cashflow/attachments/:id", async (req, res) => {
  const userId = readAuthFromRequest(req)?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });

  const result = await getDbPool().query(
    `SELECT id, file_name as "fileName", mime_type as "mimeType", size_bytes as "sizeBytes", data_base64 as "dataBase64"
     FROM cashflow_attachments
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [req.params.id, userId],
  );

  if (!result.rowCount) {
    return res.status(404).json({ message: "הקובץ לא נמצא" });
  }

  const row = result.rows[0] as {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataBase64: string;
  };

  return res.json({
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    dataUrl: `data:${row.mimeType};base64,${row.dataBase64}`,
  });
});

app.get("/api/meal/catalog", async (req, res) => {
  const userId = readAuthFromRequest(req)?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });
  const result = await getDbPool().query("SELECT meal_json FROM meal_catalog ORDER BY id ASC");
  return res.json({ meals: result.rows.map((row) => row.meal_json) });
});

app.get("/api/meal-planner/quota", async (req, res) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  await ensureMealPlannerInit();
  const runtime = await loadMealPlannerRuntime();
  const quota = await runtime.getAiQuotaStatus(auth.userId);
  return res.json(quota);
});

app.get("/api/meal-planner/state", async (req, res) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  await ensureMealPlannerInit();
  const runtime = await loadMealPlannerRuntime();
  const state = await runtime.getMealPlannerStateForUser(auth.userId);
  return res.json(state);
});

app.post("/api/meal-planner/preferences", async (req, res) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  await ensureMealPlannerInit();
  const runtime = await loadMealPlannerRuntime();
  const state = await runtime.saveMealPlannerPreferencesForUser(auth.userId, req.body?.preferences ?? {});
  return res.json({ ok: true, preferences: (state as any).preferences ?? {} });
});

app.post("/api/meal-planner/generate-week", async (req, res, next) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  try {
    await ensureMealPlannerInit();
    const runtime = await loadMealPlannerRuntime();
    const result = await runtime.generateWeekForUser(auth.userId, req.body);
    return res.json(result);
  } catch (error) {
    if ((error as { code?: string }).code === "AI_LIMIT_REACHED") {
      const runtime = await loadMealPlannerRuntime();
      await runtime.recordOverLimitAttempt(auth.userId);
      return res.status(429).json({
        message: "تم الوصول إلى حد الذكاء الاصطناعي اليومي أو الشهري",
        code: "AI_LIMIT_REACHED",
        quota: (error as { quota?: unknown }).quota,
      });
    }
    return next(error);
  }
});

app.post("/api/meal-planner/edit-meal", async (req, res, next) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  try {
    await ensureMealPlannerInit();
    const runtime = await loadMealPlannerRuntime();
    const result = await runtime.editMealForUser(auth.userId, req.body);
    return res.json(result);
  } catch (error) {
    if ((error as { code?: string }).code === "AI_LIMIT_REACHED") {
      const runtime = await loadMealPlannerRuntime();
      await runtime.recordOverLimitAttempt(auth.userId);
      return res.status(429).json({
        message: "تم الوصول إلى حد تعديلات الذكاء الاصطناعي",
        code: "AI_LIMIT_REACHED",
        quota: (error as { quota?: unknown }).quota,
      });
    }
    return next(error);
  }
});

app.post("/api/meal-planner/regenerate-day", async (req, res, next) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  try {
    await ensureMealPlannerInit();
    const runtime = await loadMealPlannerRuntime();
    const result = await runtime.regenerateDayForUser(auth.userId, req.body);
    return res.json(result);
  } catch (error) {
    if ((error as { code?: string }).code === "AI_LIMIT_REACHED") {
      const runtime = await loadMealPlannerRuntime();
      await runtime.recordOverLimitAttempt(auth.userId);
      return res.status(429).json({
        message: "تم الوصول إلى حد تعديلات الذكاء الاصطناعي",
        code: "AI_LIMIT_REACHED",
        quota: (error as { quota?: unknown }).quota,
      });
    }
    return next(error);
  }
});

app.post("/api/meal-planner/grocery-item", async (req, res, next) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  try {
    await ensureMealPlannerInit();
    const runtime = await loadMealPlannerRuntime();
    const result = await runtime.updateGroceryItemForUser(auth.userId, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/meal-planner/delete-plan", async (req, res) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  await ensureMealPlannerInit();
  const mode = req.body?.mode === "all" ? "all" : "meals";
  const runtime = await loadMealPlannerRuntime();
  const state = await runtime.deleteMealPlanForUser(auth.userId, mode);
  return res.json({ ok: true, mode, state });
});

app.get("/api/admin/ai-usage", async (req, res) => {
  const auth = readAuthFromRequest(req);
  if (!auth?.userId) return res.status(401).json({ message: "غير مصرح" });
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return res.status(403).json({ message: "غير مصرح بهذه العملية" });
  }
  await ensureMealPlannerInit();
  const runtime = await loadMealPlannerRuntime();
  const summary = await runtime.getAdminUsageSummary();
  return res.json(summary);
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});

export default app;
