import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  label: string;
  sublabel: string;
  size?: number;
  className?: string;
}

export function ProgressRing({
  value,
  label,
  sublabel,
  size = 128,
  className,
}: ProgressRingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(64,64,64,0.85)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#habits-progress-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="habits-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#95df1e" />
            <stop offset="55%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="cashflow-number text-3xl font-black text-foreground">{clamped}%</span>
        <span className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{sublabel}</span>
      </div>
    </div>
  );
}
