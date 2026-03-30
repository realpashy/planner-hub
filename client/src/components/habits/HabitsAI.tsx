import { Lock, Sparkles, Brain, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Brain,
    title: "تحليل عاداتك",
    description: "يحلّل الذكاء الاصطناعي أنماط عاداتك ويكشف عن عوامل النجاح والإخفاق",
  },
  {
    icon: TrendingUp,
    title: "توصيات شخصية",
    description: "اقتراحات مخصّصة لتحسين عاداتك بناءً على بياناتك وأهدافك",
  },
  {
    icon: MessageCircle,
    title: "مدرب يومي",
    description: "رسائل تحفيزية ذكية تصلك في الوقت المناسب لتبقى على المسار",
  },
];

export function HabitsAI() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className={cn(
          "surface-shell relative overflow-hidden rounded-[calc(var(--radius)+1rem)] p-5 text-right",
          "bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_55%)]",
          "dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.28),transparent_55%)]",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center justify-end gap-2">
              <span className="text-xs font-bold tracking-wide text-violet-600 dark:text-violet-300">ميزة مميزة</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/[0.15]">
                <Lock className="h-2.5 w-2.5 text-violet-500" />
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">مدرب ذكي بالذكاء الاصطناعي</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              حوّل عاداتك العادية إلى نتائج استثنائية مع مدرب يفهمك ويتكيّف معك
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] border border-violet-500/20 bg-violet-500/[0.12]">
            <Sparkles className="h-7 w-7 text-violet-600 dark:text-violet-300" />
          </div>
        </div>
      </div>

      {/* Feature cards (locked) */}
      <div className="space-y-3">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="relative overflow-hidden rounded-[calc(var(--radius)+0.625rem)]">
              {/* Card content */}
              <div className="surface-subtle flex items-start gap-3 rounded-[calc(var(--radius)+0.625rem)] p-4 text-right">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{feature.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+0.25rem)] border border-violet-500/20 bg-violet-500/[0.1]">
                  <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-[calc(var(--radius)+0.625rem)] bg-background/60 backdrop-blur-[2px]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/[0.12]">
                  <Lock className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="h-13 w-full rounded-[calc(var(--radius)+0.5rem)] bg-violet-600 font-bold text-white hover:bg-violet-700 active:bg-violet-800 border-violet-500/50"
          disabled
        >
          <Sparkles className="h-4 w-4" />
          ترقية الآن — قريباً
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          سيتوفّر هذا القسم قريباً لجميع المستخدمين
        </p>
      </div>
    </div>
  );
}
