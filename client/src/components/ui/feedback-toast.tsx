import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FeedbackToastTone = "default" | "success" | "warning" | "error";

function toneIcon(tone: FeedbackToastTone) {
  if (tone === "success") return CheckCircle2;
  if (tone === "warning") return AlertCircle;
  if (tone === "error") return AlertCircle;
  return Sparkles;
}

function toneClasses(tone: FeedbackToastTone) {
  if (tone === "success") return "text-emerald-600 dark:text-emerald-300";
  if (tone === "warning") return "text-amber-600 dark:text-amber-300";
  if (tone === "error") return "text-rose-600 dark:text-rose-300";
  return "text-primary";
}

export function FeedbackToastContent({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description?: ReactNode;
  tone?: FeedbackToastTone;
}) {
  const Icon = toneIcon(tone) ?? Info;
  return (
    <div className="flex items-start gap-3 text-right" dir="rtl">
      <div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10", toneClasses(tone))}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {description ? <div className="text-xs leading-6 text-muted-foreground">{description}</div> : null}
      </div>
    </div>
  );
}

export function showFeedbackToast(input: {
  title: string;
  description?: ReactNode;
  tone?: FeedbackToastTone;
  duration?: number;
}) {
  toast({
    duration: input.duration ?? 2400,
    description: (
      <FeedbackToastContent
        title={input.title}
        description={input.description}
        tone={input.tone}
      />
    ),
  });
}
