import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const [, setLocation] = useLocation();
  const auth = useAuth();

  const submitLabel = useMemo(() => {
    if (loading) return "جاري المعالجة...";
    return mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب";
  }, [loading, mode]);

  useEffect(() => {
    if (auth.user) setLocation("/");
  }, [auth.user, setLocation]);

  const validate = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return "يرجى إدخال البريد الإلكتروني وكلمة المرور";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      return "صيغة البريد الإلكتروني غير صحيحة";
    }

    if (mode === "register") {
      if (password.length < 8) {
        return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
      }
      if (password !== confirmPassword) {
        return "تأكيد كلمة المرور غير مطابق";
      }
    }

    return "";
  };

  function normalizeAuthError(err: unknown, currentMode: "login" | "register") {
    const raw = err instanceof Error ? err.message : "حدث خطأ غير متوقع";

    let status = 0;
    let apiMessage = raw;

    const prefixMatch = raw.match(/^(\d+)\s*:\s*(.*)$/);
    if (prefixMatch) {
      status = Number(prefixMatch[1]);
      apiMessage = prefixMatch[2] || raw;
    }

    const trimmed = apiMessage.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as { message?: string };
        if (parsed?.message) apiMessage = parsed.message;
      } catch {
        // keep original text
      }
    }

    if (currentMode === "login") {
      if (status === 404 || /غير مسجل|not found|user not found/i.test(apiMessage)) {
        return "هذا البريد غير مسجل. قم بإنشاء حساب جديد.";
      }
      if (status === 401 || /بيانات الدخول غير صحيحة/.test(apiMessage)) {
        return "بيانات الدخول غير صحيحة. إذا لم يكن لديك حساب، قم بإنشاء حساب جديد.";
      }
    }

    if (currentMode === "register" && /مستخدم بالفعل|already exists|duplicate|unique/i.test(apiMessage)) {
      return "هذا البريد مستخدم بالفعل. جرّب تسجيل الدخول أو استخدم بريدًا آخر.";
    }

    return apiMessage || "حدث خطأ غير متوقع";
  }
  const submit = async () => {
    setError("");
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await auth.login(email.trim(), password);
      } else {
        await auth.register(email.trim(), password, displayName.trim() || undefined);
      }
      setLocation("/");
    } catch (e) {
      setError(normalizeAuthError(e, mode));
      try {
        const debugRes = await fetch("/api/debug/startup", { credentials: "include" });
        const debugBody = await debugRes.json();
        if (!debugRes.ok && debugBody?.startupError) {
          setDebugInfo(`Debug: ${debugBody.startupError}`);
        } else if (debugBody?.debug?.startupError) {
          setDebugInfo(`Debug: ${debugBody.debug.startupError}`);
        } else if (debugBody?.message) {
          setDebugInfo(`Debug: ${debugBody.message}`);
        } else {
          setDebugInfo("");
        }
      } catch {
        setDebugInfo("Debug: Unable to fetch backend startup diagnostics.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loading) {
      await submit();
    }
  };

  return (
    <div
      className="page-bg-premium flex items-center justify-center p-4"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.98))] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_18%),linear-gradient(180deg,rgba(2,6,23,0.88),rgba(15,23,42,0.96))] dark:shadow-[0_24px_64px_rgba(2,6,23,0.45)]"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">Planner Hub</h1>
            <p className="text-sm text-muted-foreground">
              حسابك يحفظ كل بياناتك بأمان
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-background/70 p-1.5">
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-xl py-2.5 text-sm font-bold transition-all ${mode === "login" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-xl py-2.5 text-sm font-bold transition-all ${mode === "register" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            إنشاء حساب
          </button>
        </div>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          {mode === "register" && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="الاسم (اختياري)"
              className="w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          )}

          <input
            type="email"
            dir="ltr"
            style={{ direction: "ltr", textAlign: "left" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-left text-sm [direction:ltr] outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 ps-10 text-left text-sm [direction:ltr] outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode === "register" && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                dir="ltr"
                style={{ direction: "ltr", textAlign: "left" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 ps-10 text-left text-sm [direction:ltr] outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-rose-600 dark:text-rose-400 text-center">{error}</p>}
          {debugInfo ? (
            <p className="rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
              {debugInfo}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </form>
      </motion.div>
    </div>
  );
}


