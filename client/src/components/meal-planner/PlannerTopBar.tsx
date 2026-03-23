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
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <InteractiveButton
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-[calc(var(--radius)+0.375rem)] border-border/80 bg-card/[0.88] text-foreground"
                asChild
              >
                <Link href={backHref} data-testid="link-back-dashboard">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </InteractiveButton>
              <div className="min-w-0 flex-1 space-y-1 text-right">
                <p className="truncate text-xl font-black tracking-tight text-foreground">{title}</p>
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>

            <div className="surface-subtle rtl-actions-inline shrink-0 rounded-full px-2 py-1">
              <InteractiveButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-[calc(var(--radius)+0.25rem)] bg-background/75 text-muted-foreground hover:text-foreground"
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
