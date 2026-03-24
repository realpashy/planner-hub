import type { Express, Request, Response } from "express";
import type { Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { dbPool, initializeDatabase } from "./db";
import { doesUserExistByEmail, getSessionUserId, getUserById, loginUser, registerUser } from "./auth";
import {
  getAdminUsageSummary,
  getCloudData,
  recordOverLimitAttempt,
  saveCloudData,
} from "./persistence";
import { parseReceiptWithAI } from "./ai";
import {
  editMealForUser,
  generateWeekForUser,
  getAiQuotaStatus,
  regenerateDayForUser,
} from "./meal-planner/service";

const PgSessionStore = connectPgSimple(session);

function requireAuth(req: Request, res: Response) {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ message: "غير مصرح" });
    return null;
  }
  return userId;
}

function requireAdmin(req: Request, res: Response) {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ message: "غير مصرح" });
    return null;
  }
  const role = req.session?.role;
  if (role !== "admin" && role !== "super_admin") {
    res.status(403).json({ message: "غير مصرح بهذه العملية" });
    return null;
  }
  return userId;
}

let initPromise: Promise<void> | null = null;
async function ensureInit() {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  return initPromise;
}

function extractCountryFromHeaders(req: Request) {
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

function extractClientIp(req: Request) {
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

let configured = false;
export async function configureApiApp(app: Express) {
  if (configured) return app;
  configured = true;

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

  app.get(api.health.path, async (_req, res) => {
    const status = await storage.getHealth();
    res.json({ status });
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

  app.get("/api/auth/me", async (req, res) => {
    const userId = getSessionUserId(req);
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

    const exists = await doesUserExistByEmail(email);
    if (!exists) {
      return res.status(404).json({ message: "هذا البريد غير مسجل. قم بإنشاء حساب جديد." });
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
    const userId = requireAuth(req, res);
    if (!userId) return;
    const data = await getCloudData(userId);
    return res.json(data);
  });

  app.put("/api/data", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    await saveCloudData(userId, {
      plannerData: req.body?.plannerData,
      budgetData: req.body?.budgetData,
      mealData: req.body?.mealData,
      cashflowData: req.body?.cashflowData,
    });
    return res.json({ ok: true });
  });

  app.post("/api/cashflow/attachments", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const fileName = String(req.body?.fileName || "").trim();
    const mimeType = String(req.body?.mimeType || "").trim();
    const dataBase64 = String(req.body?.dataBase64 || "").trim();
    const sizeBytes = Number(req.body?.sizeBytes || 0);

    if (!fileName || !mimeType || !dataBase64) {
      return res.status(400).json({ message: "חסר קובץ תקין" });
    }

    if (!/^image\/|^application\/pdf$/.test(mimeType)) {
      return res.status(400).json({ message: "ניתן לצרף תמונה או PDF בלבד" });
    }

    if (sizeBytes > 6 * 1024 * 1024) {
      return res.status(400).json({ message: "הקובץ גדול מדי" });
    }

    const inserted = await dbPool.query(
      `INSERT INTO cashflow_attachments (user_id, file_name, mime_type, size_bytes, data_base64, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, file_name as "fileName", mime_type as "mimeType", size_bytes as "sizeBytes", created_at as "createdAt"`,
      [userId, fileName, mimeType, sizeBytes, dataBase64],
    );

    return res.status(201).json(inserted.rows[0]);
  });

  app.get("/api/cashflow/attachments/:id", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const result = await dbPool.query(
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

  app.get("/api/cashflow/attachments/:id/file", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const result = await dbPool.query(
      `SELECT file_name as "fileName", mime_type as "mimeType", data_base64 as "dataBase64"
       FROM cashflow_attachments
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [req.params.id, userId],
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "הקובץ לא נמצא" });
    }

    const row = result.rows[0] as {
      fileName: string;
      mimeType: string;
      dataBase64: string;
    };

    const download = String(req.query.download ?? "") === "1";
    const disposition = download ? "attachment" : "inline";
    const fileBuffer = Buffer.from(row.dataBase64, "base64");

    res.setHeader("Content-Type", row.mimeType);
    res.setHeader("Content-Length", String(fileBuffer.length));
    res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(row.fileName)}`);
    return res.send(fileBuffer);
  });

  app.get("/api/meal/catalog", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const result = await dbPool.query("SELECT meal_json FROM meal_catalog ORDER BY id ASC");
    return res.json({ meals: result.rows.map((row) => row.meal_json) });
  });

  app.get("/api/meal-planner/quota", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const quota = await getAiQuotaStatus(userId);
    return res.json(quota);
  });

  app.post("/api/meal-planner/generate-week", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const result = await generateWeekForUser(userId, req.body);
      return res.json(result);
    } catch (error) {
      if ((error as { code?: string }).code === "AI_LIMIT_REACHED") {
        await recordOverLimitAttempt(userId);
        return res.status(429).json({
          message: "تم الوصول إلى حد الذكاء الاصطناعي اليومي أو الشهري",
          code: "AI_LIMIT_REACHED",
          quota: (error as { quota?: unknown }).quota,
        });
      }
      throw error;
    }
  });

  app.post("/api/meal-planner/edit-meal", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const result = await editMealForUser(userId, req.body);
      return res.json(result);
    } catch (error) {
      if ((error as { code?: string }).code === "AI_LIMIT_REACHED") {
        await recordOverLimitAttempt(userId);
        return res.status(429).json({
          message: "تم الوصول إلى حد تعديلات الذكاء الاصطناعي",
          code: "AI_LIMIT_REACHED",
          quota: (error as { quota?: unknown }).quota,
        });
      }
      throw error;
    }
  });

  app.post("/api/meal-planner/regenerate-day", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    try {
      const result = await regenerateDayForUser(userId, req.body);
      return res.json(result);
    } catch (error) {
      if ((error as { code?: string }).code === "AI_LIMIT_REACHED") {
        await recordOverLimitAttempt(userId);
        return res.status(429).json({
          message: "تم الوصول إلى حد تعديلات الذكاء الاصطناعي",
          code: "AI_LIMIT_REACHED",
          quota: (error as { quota?: unknown }).quota,
        });
      }
      throw error;
    }
  });

  app.post("/api/meal-planner/delete-plan", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const mode = req.body?.mode === "all" ? "all" : "meals";
    const cloud = await getCloudData(userId);
    const currentMealData = (cloud.mealData && typeof cloud.mealData === "object") ? { ...(cloud.mealData as Record<string, unknown>) } : {};
    if (mode === "all") {
      await saveCloudData(userId, { mealData: {} });
    } else {
      await saveCloudData(userId, {
        mealData: {
          ...currentMealData,
          plansByDate: {},
          hasGeneratedPlan: false,
        },
      });
    }
    return res.json({ ok: true, mode });
  });

  app.get("/api/admin/ai-usage", async (req, res) => {
    const userId = requireAdmin(req, res);
    if (!userId) return;
    const summary = await getAdminUsageSummary();
    return res.json(summary);
  });

  app.post("/api/ai/receipt", async (req, res) => {
    const userId = requireAuth(req, res);
    if (!userId) return;
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

  return app;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await configureApiApp(app);
  return httpServer;
}
