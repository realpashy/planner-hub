import { cn } from "@/lib/utils";

interface PlannerMiniChartProps {
  values: number[];
  className?: string;
  tone?: "accent" | "soft";
}

function buildPath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function PlannerMiniChart({ values, className, tone = "accent" }: PlannerMiniChartProps) {
  const width = 132;
  const height = 36;
  const path = buildPath(values, width, height);
  return (
    <div className={cn("rounded-[1.35rem] border border-border/50 p-3", tone === "accent" ? "bg-primary/8 dark:bg-primary/12" : "bg-background/70 dark:bg-white/5", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full">
        <defs>
          <linearGradient id="planner-mini-chart" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#planner-mini-chart)" strokeWidth="3.5" strokeLinecap="round" className="text-primary" />
      </svg>
    </div>
  );
}
