import { Crown, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TierBadge({ tier }: { tier: "free" | "pro" | "admin" }) {
  if (tier === "admin") {
    return (
      <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300">
        <ShieldCheck className="me-1 h-3.5 w-3.5" />
        Admin
      </Badge>
    );
  }

  if (tier === "pro") {
    return (
      <Badge className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-700 dark:text-violet-300">
        <Crown className="me-1 h-3.5 w-3.5" />
        Pro
      </Badge>
    );
  }

  return (
    <Badge className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-300">
      <Sparkles className="me-1 h-3.5 w-3.5" />
      Free
    </Badge>
  );
}
