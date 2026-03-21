import express from "express";
import { configureApiApp } from "../server/routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const app = express();
let startupError: string | null = null;
let configuredPromise: Promise<void> | null = null;

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

async function ensureConfigured() {
  if (!configuredPromise) {
    configuredPromise = (async () => {
      await configureApiApp(app);
      startupError = null;
    })().catch((error) => {
      startupError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      throw error;
    });
  }
  return configuredPromise;
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

app.use(async (req, res, next) => {
  if (req.path === "/api/debug/startup" || req.path === "/api/health") {
    return next();
  }
  try {
    await ensureConfigured();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Backend startup failed",
      debug: getDebugPayload(),
    });
  }
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});

export default app;




