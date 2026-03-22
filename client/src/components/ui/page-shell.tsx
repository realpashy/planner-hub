import * as React from "react";
import { Link } from "wouter";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageShell: Main page wrapper with premium background gradients.
 * Provides consistent visual foundation across all modules.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-background",
        className
      )}
      dir="rtl"
    >
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_48%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-28 h-72 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.35),transparent)] dark:bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.18),transparent)]" />
      
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  backHref?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * PageHeader: Unified header component for all module pages.
 * Includes back navigation, title/subtitle, icon, and action slots.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  backHref = "/",
  actions,
  badge,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left section: Back button, theme toggle, and module info */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href={backHref}>
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </Link>
              </Button>
              <ThemeToggle />
              {actions}
            </div>

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-start gap-3 rounded-[1.75rem] border border-border/70 bg-background/75 px-4 py-3 text-right shadow-sm"
            >
              {Icon && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground md:text-base">{title}</p>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs leading-5 text-muted-foreground md:text-sm">{subtitle}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "6xl" | "7xl";
}

/**
 * PageContent: Main content area with consistent max-width and padding.
 */
export function PageContent({ children, className, maxWidth = "7xl" }: PageContentProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  };

  return (
    <main className={cn("relative mx-auto px-4 pb-24 pt-5 md:px-6 md:pb-8 md:pt-6", maxWidthClasses[maxWidth], className)}>
      {children}
    </main>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * SectionHeader: Unified section title with optional subtitle, badge, and actions.
 */
export function SectionHeader({ title, subtitle, badge, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="text-right">
        <h2 className="text-xl font-extrabold text-foreground md:text-2xl">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {badge}
        {actions}
      </div>
    </div>
  );
}

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * SectionCard: Premium section container with consistent styling.
 */
export function SectionCard({ children, className, noPadding }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-white/60 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.06),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] shadow-[0_24px_64px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_16%),linear-gradient(180deg,rgba(2,6,23,0.82),rgba(15,23,42,0.94))] dark:shadow-[0_24px_64px_rgba(2,6,23,0.42)]",
        !noPadding && "p-5 md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  note?: string;
  icon?: LucideIcon;
  iconClass?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

/**
 * StatCard: Premium stat display card with icon and optional trend.
 */
export function StatCard({ label, value, note, icon: Icon, iconClass, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-white/70 bg-background/80 p-4 text-right shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/60",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-extrabold text-foreground md:text-xl">{value}</p>
          {note && (
            <p className="text-xs leading-5 text-muted-foreground">{note}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
              iconClass || "border-primary/15 bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

interface InfoChipProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "info";
  className?: string;
}

/**
 * InfoChip: Small contextual badge for metadata and status.
 */
export function InfoChip({ children, variant = "default", className }: InfoChipProps) {
  const variantClasses = {
    default: "border-slate-200/70 bg-white/80 text-slate-600 dark:border-slate-600/50 dark:bg-white/10 dark:text-slate-300",
    primary: "border-indigo-200/70 bg-indigo-50/80 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-200",
    success: "border-emerald-200/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200",
    warning: "border-amber-200/70 bg-amber-50/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-200",
    info: "border-sky-200/70 bg-sky-50/80 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/15 dark:text-sky-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export { PageShell, PageHeader, PageContent, SectionHeader, SectionCard, StatCard, InfoChip };
