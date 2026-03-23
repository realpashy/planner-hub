import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

const THEME_EVENT = "planner-theme-change";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('planner_hub_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('planner_hub_theme', isDark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: isDark ? 'dark' : 'light' } }));
  }, [isDark]);

  useEffect(() => {
    const syncTheme = (theme?: string) => {
      if (theme === 'dark' || theme === 'light') {
        setIsDark(theme === 'dark');
        return;
      }
      const stored = localStorage.getItem('planner_hub_theme');
      setIsDark(stored === 'dark');
    };

    const handleStorage = () => syncTheme();
    const handleThemeEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: string }>).detail;
      syncTheme(detail?.theme);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT, handleThemeEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT, handleThemeEvent);
    };
  }, []);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-card/[0.88] text-muted-foreground shadow-[var(--app-shadow)] transition-all duration-200 hover:border-primary/20 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-testid="button-theme-toggle"
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.div>
    </button>
  );
}
