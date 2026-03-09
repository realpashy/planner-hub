import crypto from "crypto";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
};

function toConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.PGHOST;
  const port = process.env.PGPORT || "5432";
  const database = process.env.PGDATABASE || "postgres";
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD;

  if (!host || !password) return "";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

const connectionString = toConnectionString();
if (!connectionString) {
  throw new Error("Missing database configuration: set DATABASE_URL (or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD)");
}

const connectionStringForPool = connectionString.replace(
  /([?&])sslmode=require(&|$)/i,
  (_m, p1, p2) => (p1 === "?" && p2 ? "?" : ""),
);

const dbPool = new Pool({
  connectionString: connectionStringForPool,
  ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

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
      "INSERT INTO app_user_data (user_id, planner_json, budget_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb)",
      [id],
    );
  }
}

async function getUserById(id: string): Promise<AuthUser | null> {
  const result = await dbPool.query(
    "SELECT id, email, display_name as \"displayName\", role FROM app_users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rowCount ? (result.rows[0] as AuthUser) : null;
}

async function registerUser(input: { email: string; password: string; displayName?: string }) {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName?.trim() || null;
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(input.password);

  await dbPool.query(
    "INSERT INTO app_users (id, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, 'user')",
    [id, email, passwordHash, displayName],
  );

  await dbPool.query(
    "INSERT INTO app_user_data (user_id, planner_json, budget_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb)",
    [id],
  );

  return getUserById(id);
}

async function loginUser(emailRaw: string, password: string): Promise<AuthUser | null> {
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

async function getCloudData(userId: string) {
  const result = await dbPool.query(
    "SELECT planner_json as \"plannerData\", budget_json as \"budgetData\" FROM app_user_data WHERE user_id = $1 LIMIT 1",
    [userId],
  );

  if (!result.rowCount) {
    await dbPool.query(
      "INSERT INTO app_user_data (user_id, planner_json, budget_json) VALUES ($1, '{}'::jsonb, '{}'::jsonb)",
      [userId],
    );
    return { plannerData: null, budgetData: null };
  }

  return result.rows[0] as { plannerData: unknown; budgetData: unknown };
}

async function saveCloudData(userId: string, payload: { plannerData?: unknown; budgetData?: unknown }) {
  await dbPool.query(
    `
    INSERT INTO app_user_data (user_id, planner_json, budget_json, updated_at)
    VALUES ($1, COALESCE($2::jsonb, '{}'::jsonb), COALESCE($3::jsonb, '{}'::jsonb), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      planner_json = COALESCE($2::jsonb, app_user_data.planner_json),
      budget_json = COALESCE($3::jsonb, app_user_data.budget_json),
      updated_at = NOW();
    `,
    [
      userId,
      payload.plannerData ? JSON.stringify(payload.plannerData) : null,
      payload.budgetData ? JSON.stringify(payload.budgetData) : null,
    ],
  );
}

async function parseReceiptWithAI(imageDataUrl: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your server environment.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this receipt/invoice image. Return strict JSON only with keys: type (income|expense|bill_payment|debt_payment), amount (number), date (YYYY-MM-DD), note (short Arabic summary), suggestedCategoryName (Arabic category). If uncertain choose expense and amount 0.",
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI parsing failed: ${text}`);
  }

  const body = (await response.json()) as { output_text?: string };
  const raw = body.output_text || "";

  try {
    const parsed = JSON.parse(raw) as {
      type: "income" | "expense" | "bill_payment" | "debt_payment";
      amount: number;
      date: string;
      note: string;
      suggestedCategoryName: string;
    };

    return {
      type: parsed.type,
      amount: Number(parsed.amount) || 0,
      date: parsed.date || new Date().toISOString().slice(0, 10),
      note: parsed.note || "",
      suggestedCategoryName: parsed.suggestedCategoryName || "مصروفات عامة",
    };
  } catch {
    return {
      type: "expense",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: "",
      suggestedCategoryName: "مصروفات عامة",
    };
  }
}

const app = express();
const PgSessionStore = connectPgSimple(session);

app.set("trust proxy", 1);
app.use(
  session({
    store: new PgSessionStore({
      pool: dbPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "planner-hub-dev-session",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

let initPromise: Promise<void> | null = null;
async function ensureInit() {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  return initPromise;
}

app.use(async (_req, res, next) => {
  try {
    await ensureInit();
    next();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Server initialization failed";
    console.error("API init failed:", error);
    res.status(500).json({ message: "تعذر تهيئة الخادم", details: msg });
  }
});

app.get("/api/health", async (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/auth/me", async (req, res) => {
  const userId = req.session?.userId;
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
    req.session.userId = user.id;
    req.session.role = user.role;
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

  const user = await loginUser(email, password);
  if (!user) {
    return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  return res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

app.get("/api/data", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });

  const data = await getCloudData(userId);
  return res.json(data);
});

app.put("/api/data", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });

  await saveCloudData(userId, {
    plannerData: req.body?.plannerData,
    budgetData: req.body?.budgetData,
  });

  return res.json({ ok: true });
});

app.post("/api/ai/receipt", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: "غير مصرح" });

  const imageDataUrl = String(req.body?.imageDataUrl || "");
  if (!imageDataUrl.startsWith("data:image/")) {
    return res.status(400).json({ message: "صورة غير صالحة" });
  }

  try {
    const result = await parseReceiptWithAI(imageDataUrl);
    return res.json({ result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "فشل تحليل الصورة";
    return res.status(500).json({ message: msg });
  }
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});

export default app;

