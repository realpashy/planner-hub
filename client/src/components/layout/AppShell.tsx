import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  PiggyBank,
  Settings2,
  Sparkles,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { trackDashboardRoute } from "@/lib/dashboard";

type ShellNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  match: (path: string) => boolean;
};

const NAV_ITEMS: ShellNavItem[] = [
  { href: "/", label: "الرئيسية", icon: LayoutGrid, match: (path) => path === "/" },
  { href: "/weekly-planner", label: "المخطط الأسبوعي", icon: CalendarDays, match: (path) => path.startsWith("/weekly-planner") || path.startsWith("/planner") },
  { href: "/budget", label: "الميزانية الشهرية", icon: PiggyBank, match: (path) => path.startsWith("/budget") },
  { href: "/habits", label: "متتبع العادات", icon: Bot, match: (path) => path.startsWith("/habits") },
  { href: "/meal", label: "مخطط الوجبات", icon: UtensilsCrossed, match: (path) => path.startsWith("/meal") },
  { href: "/cashflow", label: "التدفق النقدي", icon: Wallet, match: (path) => path.startsWith("/cashflow") },
  { href: "/settings", label: "الإعدادات", icon: Settings2, match: (path) => path.startsWith("/settings") },
];

const SIDEBAR_STORAGE_KEY = "planner_hub_sidebar_collapsed_v1";

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
  return NAV_ITEMS.find((item) => item.match(path))?.label ?? "Planner Hub";
}

function SidebarLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: ShellNavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[calc(var(--radius)+0.5rem)] border px-3 py-3 text-right transition-all duration-200",
        active
          ? "border-primary/30 bg-primary/[0.12] text-foreground shadow-[0_0_0_1px_rgba(149,223,30,0.12),0_18px_40px_rgba(149,223,30,0.06)]"
          : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/70 hover:text-foreground",
        collapsed ? "justify-center px-2" : "justify-start",
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border transition-all duration-200",
          active
            ? "border-primary/30 bg-primary text-primary-foreground"
            : "border-border/70 bg-background/70 text-primary",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      {!collapsed ? (
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm font-bold">{item.label}</p>
        </div>
      ) : null}
    </Link>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="left">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarBody({
  path,
  collapsed,
  onNavigate,
}: {
  path: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const auth = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("space-y-5 border-b border-border/70 pb-5", collapsed && "items-center")}>
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-start")}>
          <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.45rem)] border-primary/30 bg-primary/[0.12] text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1 text-right">
              <p className="text-sm font-black text-foreground">Planner Hub</p>
              <p className="text-xs leading-5 text-muted-foreground">لوحة قيادة يومية تربط كل وحداتك.</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-2 py-5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={item.match(path)}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-3 border-t border-border/70 pt-4">
        {!collapsed ? (
          <div className="rounded-[calc(var(--radius)+0.55rem)] border border-primary/20 bg-primary/[0.08] p-3 text-right">
            <div className="flex items-center justify-between gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-foreground">Plus قريبًا</p>
                <p className="text-xs leading-5 text-muted-foreground">ذكاء أعمق وتخصيص أعلى.</p>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-primary/30 bg-background/70 text-primary">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border border-primary/25 bg-primary/[0.08] text-primary">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">Plus قريبًا</TooltipContent>
          </Tooltip>
        )}

        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-start")}>
          <ThemeToggle />
          {!collapsed ? (
            <div className="min-w-0 flex-1 rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/60 px-3 py-2 text-right">
              <p className="truncate text-sm font-bold text-foreground">{auth.user?.displayName || "حسابك"}</p>
              <p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  useEffect(() => {
    trackDashboardRoute(location.split("?")[0], getPageTitle(location.split("?")[0]));
  }, [location]);

  const title = useMemo(() => getPageTitle(location.split("?")[0]), [location]);

  return (
    <AppShellContext.Provider value={{ hasShell: true }}>
      <div className="app-shell min-h-screen">
        <div className="flex min-h-screen">
          <motion.aside
            data-testid="app-sidebar"
            data-collapsed={collapsed ? "true" : "false"}
            animate={{ width: collapsed ? 104 : 292 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="sticky top-0 hidden h-screen shrink-0 border-l border-border/70 bg-[linear-gradient(180deg,rgba(24,24,24,0.96),rgba(19,19,19,0.98))] px-4 py-5 lg:block"
          >
            <div className="flex h-full flex-col">
              <div className={cn("mb-4 flex", collapsed ? "justify-center" : "justify-start")}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={collapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
                  className="h-11 rounded-[calc(var(--radius)+0.35rem)] border border-border/70 bg-background/60 px-3"
                  onClick={() => setCollapsed((value) => !value)}
                >
                  {collapsed ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                </Button>
              </div>

              <SidebarBody path={location.split("?")[0]} collapsed={collapsed} />
            </div>
          </motion.aside>

          <div className="min-w-0 flex-1">
            <div className="sticky top-0 z-40 border-b border-border/60 bg-background/88 backdrop-blur-xl lg:hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="فتح التنقل"
                  onClick={() => setMobileOpen(true)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-sm font-black text-foreground">{title}</p>
                  <p className="truncate text-xs text-muted-foreground">Planner Hub</p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <main className="min-w-0 px-4 py-4 md:px-6 md:py-6">{children}</main>
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="right"
            dir="rtl"
            data-testid="app-sidebar-drawer"
            className="w-[88vw] max-w-[24rem] border-l border-border/80 bg-[linear-gradient(180deg,rgba(24,24,24,0.98),rgba(19,19,19,0.99))] p-5"
          >
            <SheetHeader className="pb-4 text-right">
              <SheetTitle>Planner Hub</SheetTitle>
            </SheetHeader>
            <SidebarBody path={location.split("?")[0]} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </AppShellContext.Provider>
  );
}
