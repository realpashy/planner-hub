import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [, setLocation] = useLocation();
  const auth = useAuth();

  useEffect(() => {
    if (auth.user) setLocation("/");
  }, [auth.user, setLocation]);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, displayName);
      }
      setLocation("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center">Planner Hub</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">تسجيل الدخول أو إنشاء حساب جديد</p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setMode("login")}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === "login" ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            دخول
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === "register" ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            إنشاء حساب
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {mode === "register" && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="الاسم (اختياري)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 disabled:opacity-60"
          >
            {loading ? "جاري المعالجة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


