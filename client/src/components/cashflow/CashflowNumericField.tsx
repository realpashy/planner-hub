import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CashflowNumericFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  suffix?: "₪" | "%";
  className?: string;
  step?: number;
  disabled?: boolean;
}

function parseEditableNumber(value: string) {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return cleaned;
}

function stepValue(current: string, step: number) {
  const parsed = Number.parseFloat(current || "0");
  const next = Math.max(0, (Number.isFinite(parsed) ? parsed : 0) + step);
  return `${Math.round(next * 100) / 100}`;
}

export function CashflowNumericField({
  value,
  onChange,
  label,
  description,
  placeholder = "0",
  suffix = "₪",
  className,
  step = 1,
  disabled = false,
}: CashflowNumericFieldProps) {
  return (
    <div className={cn("space-y-1.5 text-right", className)}>
      {label ? <label className="text-sm font-semibold text-foreground">{label}</label> : null}
      {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(parseEditableNumber(event.target.value))}
          className={cn(
            "h-14 rounded-[calc(var(--radius)+0.375rem)] border-border/70 bg-muted/40 pe-14 ps-14 text-right text-[22px] font-black tracking-tight focus:border-primary/50",
            "text-base md:text-[22px]",
            disabled && "opacity-70",
          )}
          style={{ direction: "ltr", textAlign: "right" }}
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[25px] font-black leading-none text-muted-foreground">
          {suffix}
        </span>

        <div className="absolute left-0 top-0 flex h-full w-10 flex-col overflow-hidden rounded-l-[calc(var(--radius)+0.375rem)] border-r border-border/60">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(stepValue(value, step))}
            className="flex flex-1 items-center justify-center bg-background/65 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label="הגדל"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(stepValue(value, -step))}
            className="flex flex-1 items-center justify-center border-t border-border/60 bg-background/65 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label="הקטן"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
