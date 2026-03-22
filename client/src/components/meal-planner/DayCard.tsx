import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Progress } from "@/components/ui/progress";
import { formatWater, type PlannerDay } from "@/lib/meal-planner";
import { cn } from "@/lib/utils";
import { CalendarDays, Sparkles, Zap } from "lucide-react";

interface DayCardProps {
  day: PlannerDay;
  selected?: boolean;
  onClick?: () => void;
}

export function DayCard({ day, selected = false, onClick }: DayCardProps) {
  const completion = day.meals.length ? Math.round((day.meals.filter((meal) => meal.title.trim()).length / day.meals.length) * 100) : 0;

  return (
    <motion.div layout>
      <InteractiveCard
        interactive
        selected={selected}
        onClick={onClick}
        className={cn(
          "h-full overflow-hidden border-border/70 bg-card/90",
          selected && "shadow-xl shadow-primary/10",
        )}
      >
        <div className="space-y-4 p-4 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-base font-extrabold text-foreground">{day.dayName}</p>
              <p className="text-xs text-muted-foreground">{day.dateLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              {day.busyDay ? (
                <Badge className="rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Zap className="me-1 h-3 w-3" />
                  يوم مزدحم
                </Badge>
              ) : null}
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {completion}%
              </Badge>
            </div>
          </div>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/75 p-3">
              <p className="font-semibold text-foreground">الوجبات</p>
              <p className="mt-1 text-muted-foreground">{day.meals.length} عناصر منظمة لليوم</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/75 p-3">
              <p className="font-semibold text-foreground">الماء</p>
              <p className="mt-1 text-muted-foreground">{formatWater(day.nutrition.waterCups)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {day.nutrition.calories} kcal</span>
              <span>{day.nutrition.protein}غ بروتين</span>
            </div>
            <Progress value={completion} className="h-2" />
          </div>

          <div className="space-y-2 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-3">
            <div className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <p>{day.aiTip}</p>
            </div>
          </div>
        </div>
      </InteractiveCard>
    </motion.div>
  );
}
