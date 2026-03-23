import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="app-shell auth-page relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(149,223,30,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.03),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-shell relative z-10 w-full max-w-md rounded-[calc(var(--radius)+0.95rem)] p-6 shadow-xl"
      >
        <div className="text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.1] px-3 py-1 text-xs font-semibold text-primary shadow-[var(--app-shadow)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            دخول آمن إلى Planner Hub
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">Planner Hub</h1>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            حسابك يحفظ كل بياناتك بأمان على السحابة داخل واجهة عربية واضحة ومريحة.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-[calc(var(--radius)+0.375rem)] border border-border/70 bg-background/60 p-1">
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-[calc(var(--radius)+0.25rem)] py-2 text-sm font-semibold transition-colors ${mode === "login" ? "bg-primary text-primary-foreground shadow-[var(--app-shadow)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-[calc(var(--radius)+0.25rem)] py-2 text-sm font-semibold transition-colors ${mode === "register" ? "bg-primary text-primary-foreground shadow-[var(--app-shadow)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            إنشاء حساب
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          {mode === "register" && (
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="الاسم (اختياري)"
              className="h-12 rounded-[calc(var(--radius)+0.375rem)] border-border/80 bg-background/70 text-right"
            />
          )}

          <Input
            type="email"
            dir="ltr"
            style={{ direction: "ltr", textAlign: "left" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="h-12 rounded-[calc(var(--radius)+0.375rem)] border-border/80 bg-background/70 text-left [direction:ltr]"
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="h-12 rounded-[calc(var(--radius)+0.375rem)] border-border/80 bg-background/70 ps-10 text-left [direction:ltr]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode === "register" && (
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                dir="ltr"
                style={{ direction: "ltr", textAlign: "left" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                className="h-12 rounded-[calc(var(--radius)+0.375rem)] border-border/80 bg-background/70 ps-10 text-left [direction:ltr]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-rose-400">{error}</p>}
          {debugInfo ? (
            <p className="rounded-[calc(var(--radius)+0.375rem)] border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2 text-xs text-amber-200">
              {debugInfo}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-[calc(var(--radius)+0.4rem)]"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}


