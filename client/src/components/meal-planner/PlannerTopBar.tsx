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
        <div className="rounded-[1.8rem] border border-white/60 bg-white/80 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_18px_70px_rgba(2,6,23,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <InteractiveButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10"
                onClick={onOpenSettings}
              >
                <Settings2 className="h-5 w-5" />
              </InteractiveButton>
            </div>

            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-lg font-black tracking-tight text-foreground">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>

            <InteractiveButton variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10" asChild>
              <Link href={backHref} data-testid="link-back-dashboard">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </InteractiveButton>
          </div>
        </div>
      </div>
    </header>
  );
}
