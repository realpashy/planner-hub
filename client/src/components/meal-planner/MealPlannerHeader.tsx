import { Link } from "wouter";
import { ChevronRight, Settings2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InteractiveButton } from "@/components/ui/interactive-button";

interface MealPlannerHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onOpenSettings: () => void;
}

export function MealPlannerHeader({
  title,
  subtitle,
  backHref = "/",
  onOpenSettings,
}: MealPlannerHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="relative flex min-h-[3.5rem] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <InteractiveButton
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl bg-background/70"
              onClick={onOpenSettings}
            >
              <Settings2 className="h-5 w-5" />
            </InteractiveButton>
          </div>

          <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center text-center">
            <p className="text-base font-extrabold text-foreground md:text-lg">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">{subtitle}</p>
            ) : null}
          </div>

          <InteractiveButton variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-background/70" asChild>
            <Link href={backHref} data-testid="link-back-dashboard">
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </Link>
          </InteractiveButton>
        </div>
      </div>
    </header>
  );
}
