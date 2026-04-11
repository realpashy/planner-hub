import { createContext, useContext, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  LayoutGrid,
  PiggyBank,
  Search,
  Settings2,
  Sparkles,
  UserCircle2,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { trackDashboardRoute } from "@/lib/dashboard";

type ShellNavItem = {
  href: string;
  label: string;
  icon: ElementType;
  aliases?: string[];
  match: (path: string) => boolean;
};

const NAV_ITEMS: ShellNavItem[] = [
  { href: "/", label: "الرئيسية", icon: LayoutGrid, aliases: ["الرئيسية", "الصفحة الرئيسية", "الرئيسيه"], match: (path) => path === "/" },
  { href: "/weekly-planner", label: "المخطط الأسبوعي", icon: CalendarDays, aliases: ["المخطط", "الأسبوع", "المهام", "planner"], match: (path) => path.startsWith("/weekly-planner") || path.startsWith("/planner") },
  { href: "/budget", label: "الميزانية الشهرية", icon: PiggyBank, aliases: ["الميزانية", "budget"], match: (path) => path.startsWith("/budget") },
  { href: "/habits", label: "متتبع العادات", icon: Bot, aliases: ["العادات", "habits"], match: (path) => path.startsWith("/habits") },
  { href: "/meal", label: "مخطط الوجبات", icon: UtensilsCrossed, aliases: ["الوجبات", "meal"], match: (path) => path.startsWith("/meal") },
  { href: "/cashflow", label: "التدفق النقدي", icon: Wallet, aliases: ["النقدي", "التدفق", "cashflow"], match: (path) => path.startsWith("/cashflow") },
  { href: "/settings", label: "الإعدادات", icon: Settings2, aliases: ["الإعدادات", "settings"], match: (path) => path.startsWith("/settings") },
];

const SIDEBAR_STORAGE_KEY = "planner_hub_sidebar_collapsed_v2";

type AppShellContextValue = {
  hasShell: boolean;
};

const AppShellContext = createContext<AppShellContextValue>({ hasShell: false });

export function useAppShell() {
  return useContext(AppShellContext);
}

function loadCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
}

function saveCollapsed(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "1" : "0");
}

function getPageTitle(path: string) {
  return NAV_ITEMS.find((item) => item.match(path))?.label ?? "الرئيسية";
}

function getPageSubtitle(path: string) {
  if (path === "/") return "واجهة تشغيل يومية تربط كل الوحدات.";
  if (path.startsWith("/weekly-planner") || path.startsWith("/planner")) return "إدارة الأسبوع، الأولويات، والزمن القادم.";
  if (path.startsWith("/budget")) return "نظرة مالية شهرية واضحة وسريعة.";
  if (path.startsWith("/habits")) return "عادات اليوم وسلاسل الاستمرارية.";
  if (path.startsWith("/meal")) return "تخطيط الوجبات والتحضير للأسبوع.";
  if (path.startsWith("/cashflow")) return "السيولة، الدفعات، وحركة النقد.";
  if (path.startsWith("/settings")) return "تخصيص الواجهة والتفضيلات العامة.";
  return "Planner Hub";
}

function resolveSearchTarget(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return "/";

  const match = NAV_ITEMS.find((item) =>
    item.label.toLowerCase().includes(normalized) ||
    item.aliases?.some((alias) => alias.toLowerCase().includes(normalized)),
  );

  return match?.href ?? "/";
}

function SidebarLink({
  item,
  active,
  collapsed,
}: {
  item: ShellNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      className={cn(
        "shell-nav-link",
        active && "shell-nav-link-active",
        collapsed ? "justify-center px-2.5" : "justify-start",
      )}
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.45rem)] border border-border/40 bg-black/[0.04] text-primary transition-all duration-200 dark:border-white/[0.05] dark:bg-white/[0.045]",
          active && "bg-primary text-black shadow-[0_0_0_1px_rgba(195,255,77,0.08),0_0_24px_rgba(195,255,77,0.18)]",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      {!collapsed ? (
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm font-semibold">{item.label}</p>
        </div>
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="left">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function DesktopSidebar({
  path,
  collapsed,
  onToggle,
}: {
  path: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const auth = useAuth();

  return (
    <motion.aside
      data-testid="desktop-shell-sidebar"
      data-collapsed={collapsed ? "true" : "false"}
      animate={{ width: collapsed ? 110 : 322 }}
      transition={{ type: "spring", stiffness: 230, damping: 28 }}
      className="sidebar-shell sticky top-0 hidden h-screen shrink-0 border-l border-black/[0.05] px-4 py-5 lg:flex dark:border-white/[0.04]"
    >
      <div className="flex h-full w-full flex-col">
        <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed ? (
            <div className="text-right">
              <p className="text-[2rem] font-black leading-none text-primary">PlannerHub</p>
              <p className="mt-1 text-xs tracking-[0.12em] text-muted-foreground/90">PREMIUM PRODUCTIVITY</p>
            </div>
          ) : (
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+0.55rem)] bg-primary text-black shadow-[0_0_24px_rgba(195,255,77,0.25)]">
              <LayoutGrid className="h-5 w-5" />
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
            className="h-11 w-11 rounded-[calc(var(--radius)+0.45rem)] border border-border/40 bg-black/[0.04] dark:border-white/[0.05] dark:bg-white/[0.045]"
            onClick={onToggle}
          >
            {collapsed ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={item.match(path)} collapsed={collapsed} />
          ))}
        </nav>

        <div className="space-y-3 pt-4">
          {!collapsed ? (
            <div className="rounded-[calc(var(--radius)+0.9rem)] bg-[linear-gradient(135deg,rgba(195,255,77,0.12),rgba(166,140,255,0.08))] p-4 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">Lumina Pro</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">ذكاء أعمق وتخصيص أعلى على نفس السطح.</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.45rem)] bg-primary text-black shadow-[0_0_18px_rgba(195,255,77,0.2)]">
                  <Crown className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.45rem)] bg-primary/15 text-primary shadow-[0_0_18px_rgba(195,255,77,0.12)]">
                  <Crown className="h-4.5 w-4.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">Lumina Pro</TooltipContent>
            </Tooltip>
          )}

          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-start")}>
            <ThemeToggle />
            {!collapsed ? (
              <div className="min-w-0 flex-1 rounded-[calc(var(--radius)+0.65rem)] bg-black/[0.04] px-3 py-2.5 text-right dark:bg-white/[0.045]">
                <p className="truncate text-sm font-semibold text-foreground">{auth.user?.displayName || "حسابك"}</p>
                <p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function GlobalTopBar({
  path,
  onSearch,
}: {
  path: string;
  onSearch: (query: string) => void;
}) {
  const auth = useAuth();
  const [query, setQuery] = useState("");

  return (
    <header className="topbar-shell sticky top-0 z-40 mx-auto mb-6 rounded-[calc(var(--radius)+1rem)] px-4 py-3 md:px-5">
      <div className="flex items-center gap-3">
        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.45rem)] border border-border/40 bg-black/[0.04] text-muted-foreground transition-colors hover:bg-black/[0.07] hover:text-foreground dark:border-white/[0.05] dark:bg-white/[0.045] dark:hover:bg-white/[0.08]"
            aria-label="الإشعارات"
          >
            <Bell className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.45rem)] border border-border/40 bg-black/[0.04] text-muted-foreground transition-colors hover:bg-black/[0.07] hover:text-foreground dark:border-white/[0.05] dark:bg-white/[0.045] dark:hover:bg-white/[0.08]"
            aria-label="الحساب"
          >
            <UserCircle2 className="h-4.5 w-4.5" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/18 px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_18px_rgba(195,255,77,0.12)]">
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </div>
        </div>

        <div className="min-w-0 flex-1 text-right lg:hidden">
          <p className="truncate text-base font-black text-foreground">{getPageTitle(path)}</p>
          <p className="truncate text-xs text-muted-foreground">Planner Hub</p>
        </div>

        <form
          className="relative w-full max-w-[34rem]"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query);
          }}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="global-topbar-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="shell-search w-full px-4 py-3 pl-12"
            placeholder="ابحث عن مهام، ميزانية، أو عادات..."
          />
        </form>

        <div className="hidden min-w-0 flex-1 text-right lg:block">
          <p className="truncate text-lg font-black text-foreground">{getPageTitle(path)}</p>
          <p className="truncate text-xs text-muted-foreground">{getPageSubtitle(path)}</p>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({ path }: { path: string }) {
  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="mobile-nav-shell fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-[calc(var(--radius)+1rem)] px-2 py-2 lg:hidden"
    >
      <div className="premium-scrollbar flex items-stretch gap-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(path);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "min-w-[6.15rem] shrink-0 rounded-[calc(var(--radius)+0.75rem)] px-3 py-2.5 text-center transition-all duration-200",
                active
                  ? "bg-primary text-black shadow-[0_0_20px_rgba(195,255,77,0.24)]"
                  : "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.045]",
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <Icon className="h-4.5 w-4.5" />
                <span className="text-[11px] font-semibold leading-none">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const path = location.split("?")[0];

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  useEffect(() => {
    trackDashboardRoute(path, getPageTitle(path));
  }, [path]);

  const contentPadding = useMemo(
    () => "px-4 pb-28 pt-2 md:px-6 md:pb-8 lg:px-8 lg:pb-8",
    [],
  );

  return (
    <AppShellContext.Provider value={{ hasShell: true }}>
      <div className="app-shell min-h-screen">
        <div className="flex min-h-screen">
          <DesktopSidebar path={path} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

          <div className="min-w-0 flex-1">
            <div className={cn("mx-auto max-w-[1700px]", contentPadding)}>
              <GlobalTopBar path={path} onSearch={(query) => setLocation(resolveSearchTarget(query))} />
              <main className="min-w-0">{children}</main>
            </div>
          </div>
        </div>

        <MobileBottomNav path={path} />
      </div>
    </AppShellContext.Provider>
  );
}
