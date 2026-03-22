import { Link } from "wouter";
import { ChevronRight, Settings2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InteractiveButton } from "@/components/ui/interactive-button";

interface PlannerTopBarProps {
  title: string;
  subtitle: string;
  onOpenSettings: () => void;
  backHref?: string;
}

export function PlannerTopBar({
  title,
  subtitle,
  onOpenSettings,
  backHref = "/",
}: PlannerTopBarProps) {
  return (
    <header className="sticky top-0 z-40" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
        <div className="rounded-[1.75rem] border border-indigo-200/60 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.94))] px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-indigo-400/15 dark:bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_22%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.88))] dark:shadow-[0_20px_52px_rgba(2,6,23,0.45)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <InteractiveButton
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl border border-indigo-200/70 bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-indigo-400/20 dark:bg-white/10"
                asChild
              >
                <Link href={backHref} data-testid="link-back-dashboard">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </InteractiveButton>
              <div className="min-w-0 space-y-1 text-right">
                <p className="truncate text-xl font-black tracking-tight text-foreground">{title}</p>
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/70 bg-white/72 px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/[0.05]">
              <InteractiveButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10"
                onClick={onOpenSettings}
              >
                <Settings2 className="h-5 w-5" />
              </InteractiveButton>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
