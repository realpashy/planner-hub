import { CalendarRange, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CashflowDateField } from "@/components/cashflow/CashflowDateField";

interface CashflowDateRangeFilterProps {
  from?: string;
  to?: string;
  onChange: (next: { from?: string; to?: string }) => void;
}

export function CashflowDateRangeFilter({ from, to, onChange }: CashflowDateRangeFilterProps) {
  const hasValue = Boolean(from || to);

  return (
    <div className="surface-subtle rounded-[calc(var(--radius)+0.5rem)] p-3">
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs font-semibold text-muted-foreground">סינון לפי תאריכים</p>
        </div>
        <CalendarRange className="h-4 w-4 shrink-0 text-primary" />
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <CashflowDateField
          value={from ?? ""}
          placeholder="מתאריך"
          onChange={(value) => onChange({ from: value || undefined, to })}
        />
        <CashflowDateField
          value={to ?? ""}
          placeholder="עד תאריך"
          onChange={(value) => onChange({ from, to: value || undefined })}
        />
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-[calc(var(--radius)+0.25rem)]"
          disabled={!hasValue}
          onClick={() => onChange({})}
        >
          <X className="h-4 w-4" />
          נקה
        </Button>
      </div>
    </div>
  );
}
