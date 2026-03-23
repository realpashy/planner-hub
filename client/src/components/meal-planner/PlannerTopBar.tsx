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
        <div className="surface-shell rounded-[calc(var(--radius)+0.9rem)] px-4 py-3 backdrop-blur-xl">
          <div className="rtl-meta-row gap-4">
            <Link
              href={backHref}
              data-testid="link-back-dashboard"
              className="flex min-w-0 flex-1 items-center gap-4 rounded-[5px] px-1 py-1 text-right transition-colors hover:bg-background/45"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-transparent text-foreground">
                  <ChevronRight className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1 text-right">
                <p className="truncate text-xl font-black tracking-tight text-foreground">{title}</p>
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </Link>

            <div className="rtl-actions-inline shrink-0 rounded-[5px] bg-transparent px-0 py-0 shadow-none">
              <InteractiveButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-[5px] border-0 bg-transparent text-muted-foreground shadow-none hover:bg-background/70 hover:text-foreground"
                onClick={onOpenSettings}
              >
                <Settings2 className="h-5 w-5" />
              </InteractiveButton>
              <ThemeToggle className="rounded-[5px] border-0 bg-transparent shadow-none hover:bg-background/70" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
