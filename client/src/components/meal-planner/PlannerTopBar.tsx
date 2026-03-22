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
        <div className="rounded-[1.5rem] border border-white/60 bg-white/85 px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_18px_48px_rgba(2,6,23,0.45)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <InteractiveButton variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10" asChild>
                <Link href={backHref} data-testid="link-back-dashboard">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </InteractiveButton>
              <div className="min-w-0 text-right">
                <p className="truncate text-xl font-black tracking-tight text-foreground">{title}</p>
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <InteractiveButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-slate-900/[0.04] dark:bg-white/10"
                onClick={onOpenSettings}
              >
                <Settings2 className="h-5 w-5" />
              </InteractiveButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
