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
  if (path.startsWith("/meal")) return "مخطط الوجبات";
  return NAV_ITEMS.find((item) => item.match(path))?.label ?? "الرئيسية";
}

function getPageSubtitle(path: string) {
  if (path === "/") return "واجهة تشغيل يومية تربط كل الوحدات وتبرز الأولوية التالية بسرعة.";
  if (path.startsWith("/weekly-planner") || path.startsWith("/planner")) return "إدارة الأسبوع، الأولويات، والمشاهد التنفيذية القادمة.";
  if (path.startsWith("/budget")) return "رؤية مالية أهدأ مع مؤشرات أسرع ووضوح أعلى.";
  if (path.startsWith("/habits")) return "عادات اليوم وسلاسل الاستمرارية داخل سطح واضح وقابل للمسح.";
  if (path.startsWith("/meal")) return "تخطيط الوجبات والتحضير الأسبوعي من دون إظهاره في تنقل السطح العام.";
  if (path.startsWith("/cashflow")) return "السيولة، الدفعات، وحركة النقد في طبقة متابعة مركزة.";
  if (path.startsWith("/settings")) return "تخصيص الواجهة والتفضيلات العامة والحساب.";
  return "Planner Hub";
}

function getPageIcon(path: string) {
  if (path.startsWith("/meal")) return CalendarDays;
  return NAV_ITEMS.find((item) => item.match(path))?.icon ?? LayoutGrid;
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

function getUserInitial(displayName?: string | null, email?: string | null) {
  const source = displayName?.trim() || email?.trim() || "P";
  return source.charAt(0).toUpperCase();
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
      className={cn("shell-nav-link", active && "shell-nav-link-active", collapsed ? "justify-center px-2.5" : "justify-start")}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("shell-nav-icon", active && "shell-nav-icon-active")}>
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
  const userInitial = getUserInitial(auth.user?.displayName, auth.user?.email);

  return (
    <motion.aside
      data-testid="desktop-shell-sidebar"
      data-collapsed={collapsed ? "true" : "false"}
      animate={{ width: collapsed ? 108 : 318 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 self-start px-4 py-4 lg:flex"
    >
      <div className="sidebar-shell flex h-full w-full flex-col overflow-hidden rounded-[1.9rem] px-4 py-4">
        <div className={cn("mb-6 flex items-start", collapsed ? "justify-center" : "justify-between gap-3")}>
          {!collapsed ? (
            <div className="min-w-0 flex-1 text-right">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/[0.14] px-3 py-1 text-[11px] font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Lumina Noir
              </div>
              <p className="text-[1.8rem] font-black leading-none text-foreground">Planner Hub</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                تشغيل يومي هادئ بسطح عربي واضح ومسارات عمل أسرع.
              </p>
            </div>
          ) : (
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-primary text-black shadow-[0_0_24px_rgba(195,255,77,0.22)]">
              <LayoutGrid className="h-5 w-5" />
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
            className="shell-utility-button h-11 w-11 rounded-[1rem]"
            onClick={onToggle}
          >
            {collapsed ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
          </Button>
        </div>

        {!collapsed ? (
          <div className="mb-3 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">التنقل</p>
          </div>
        ) : null}

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={item.match(path)} collapsed={collapsed} />
          ))}
        </nav>

        <div className="space-y-3 pt-4">
          {!collapsed ? (
            <div className="shell-upgrade-panel rounded-[1.5rem] p-4 text-right">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-sm font-black text-foreground">Lumina Pro</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    موجزات أذكى ولوحات قيادة أكثر تخصيصًا بدون تشتيت.
                  </p>
                  <Button className="mt-4 w-full justify-center rounded-[1rem]" size="sm">
                    الترقية الآن
                  </Button>
                </div>
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary text-black shadow-[0_0_18px_rgba(195,255,77,0.2)]">
                  <Crown className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary/15 text-primary shadow-[0_0_18px_rgba(195,255,77,0.12)]">
                  <Crown className="h-4.5 w-4.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">Lumina Pro</TooltipContent>
            </Tooltip>
          )}

          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-start")} dir="rtl">
            <ThemeToggle className="shell-utility-button rounded-[1rem]" />
            {!collapsed ? (
              <div className="shell-account-card min-w-0 flex-1 rounded-[1.25rem] px-3 py-3">
                <div className="flex items-center gap-3" dir="rtl">
                  <div className="shell-avatar h-11 w-11 text-sm font-black">{userInitial}</div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-semibold text-foreground">{auth.user?.displayName || "حسابك"}</p>
                    <p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p>
                  </div>
                </div>
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
  const PageIcon = getPageIcon(path);
  const userInitial = getUserInitial(auth.user?.displayName, auth.user?.email);

  return (
    <header className="topbar-shell sticky top-4 z-40 mx-auto mb-6 rounded-[1.9rem] px-4 py-4 md:px-5 md:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5" dir="rtl">
        <div className="flex min-w-0 items-start gap-3 lg:w-[24rem] lg:shrink-0">
          <div className="shell-avatar h-12 w-12 rounded-[1.15rem] text-primary">
            <PageIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/[0.12] px-3 py-1 text-[11px] font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              طبقة تشغيل ذكية
            </div>
            <p className="truncate text-lg font-black text-foreground md:text-[1.35rem]">{getPageTitle(path)}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">{getPageSubtitle(path)}</p>
          </div>
        </div>

        <form
          className="relative w-full lg:max-w-[38rem] lg:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query);
          }}
        >
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="global-topbar-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="shell-search w-full px-4 py-3 pr-12"
            placeholder="ابحث عن صفحة أو سير عمل أو إعداد..."
          />
        </form>

        <div className="flex items-center justify-start gap-2 lg:w-[24rem] lg:shrink-0 lg:justify-end">
          <div className="hidden items-center gap-2 rounded-full bg-primary/[0.14] px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_20px_rgba(195,255,77,0.08)] md:inline-flex">
            <Crown className="h-4 w-4" />
            ترقية Lumina Pro
          </div>
          <button type="button" className="shell-utility-button" aria-label="الإشعارات">
            <Bell className="h-4.5 w-4.5" />
          </button>
          <ThemeToggle className="shell-utility-button" />
          <button type="button" className="shell-account-card flex items-center gap-3 rounded-[1.15rem] px-3 py-2.5" dir="rtl" aria-label="الحساب">
            <div className="shell-avatar h-10 w-10 text-sm font-black">{userInitial}</div>
            <div className="hidden min-w-0 text-right md:block">
              <p className="truncate text-sm font-semibold text-foreground">{auth.user?.displayName || "حسابك"}</p>
              <p className="truncate text-xs text-muted-foreground">{auth.user?.email || "إعدادات الحساب"}</p>
            </div>
            <UserCircle2 className="h-4.5 w-4.5 text-muted-foreground md:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({ path }: { path: string }) {
  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="mobile-nav-shell safe-area-bottom fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-[1.65rem] px-2 py-2 lg:hidden"
    >
      <div className="premium-scrollbar flex items-stretch gap-2 overflow-x-auto pb-1" dir="rtl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(path);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("shell-mobile-link min-w-[6.4rem] shrink-0 rounded-[1.2rem] px-3 py-2.5 text-center transition-all duration-200", active && "shell-mobile-link-active")}
              aria-current={active ? "page" : undefined}
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

  const contentPadding = useMemo(() => "px-4 pb-28 pt-2 md:px-6 md:pb-8 lg:px-8 lg:pb-8", []);

  return (
    <AppShellContext.Provider value={{ hasShell: true }}>
      <div className="app-shell min-h-screen" dir="rtl">
        <div className="flex min-h-screen flex-row-reverse gap-0 lg:gap-2 xl:gap-4">
          <DesktopSidebar path={path} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

          <div className="min-w-0 flex-1 px-4 py-4 lg:px-0 lg:py-4">
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
