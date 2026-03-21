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
    });
    return res.json({ ok: true });
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
