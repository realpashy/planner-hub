import { ArrowUpLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeCta({ compact = false }: { compact?: boolean }) {
  return (
    <Button variant="outline" className={compact ? "h-9 rounded-2xl px-3" : "h-11 rounded-2xl"} type="button">
      <Sparkles className="me-2 h-4 w-4" />
      ترقية إلى Pro
      <ArrowUpLeft className="ms-2 h-4 w-4" />
    </Button>
  );
}
