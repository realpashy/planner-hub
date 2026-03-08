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
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
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
      className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.16),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(14,165,233,0.13),_transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-6 shadow-xl"
      >
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center">Planner Hub</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
          حسابك يحفظ كل بياناتك بأمان على السحابة
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === "login" ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === "register" ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            إنشاء حساب
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          {mode === "register" && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="الاسم (اختياري)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 outline-none transition-all focus:ring-2 focus:ring-primary/35"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 outline-none transition-all focus:ring-2 focus:ring-primary/35"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 ps-10 text-left [direction:ltr] outline-none transition-all focus:ring-2 focus:ring-primary/35"
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 ps-10 text-left [direction:ltr] outline-none transition-all focus:ring-2 focus:ring-primary/35"
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

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

