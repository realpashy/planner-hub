import { Lock, Sparkles, Stars, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AI_FEATURES = [
  {
    title: "تعديل ذكي للعادات",
    description: "اقتراح تغييرات بسيطة عندما تبدأ عادة بالشعور بأنها ثقيلة.",
    icon: WandSparkles,
  },
  {
    title: "قراءة نمطك الأسبوعي",
    description: "ملخص سريع لأيام القوة، وأين تحتاج تخفيفًا أو إعادة ضبط.",
    icon: Stars,
  },
  {
    title: "دفعات استمرارية",
    description: "رسائل داخل التطبيق تساعدك على الحفاظ على السلسلة بدون ضغط زائد.",
    icon: Sparkles,
  },
];

export function AI_LockedCard() {
  return (
    <Card className="surface-shell overflow-hidden rounded-[calc(var(--radius)+0.85rem)] border-primary/20">
      <CardHeader className="relative gap-4 text-right">
        <div className="premium-header-glow premium-header-glow-primary" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
              <Lock className="h-3.5 w-3.5" />
              مزايا Plus القادمة
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black">ميزات أعمق ستُفتح لاحقًا</CardTitle>
              <CardDescription>
                القراءة اليومية أصبحت جاهزة، أمّا هذه الطبقة فتظل محجوبة الآن حتى لا نشحن المنتج بوعود غير مكتملة.
              </CardDescription>
            </div>
          </div>
          <div className="icon-chip h-12 w-12 rounded-[calc(var(--radius)+0.5rem)] border-primary/25 bg-primary/[0.14] text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {AI_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-[calc(var(--radius)+0.375rem)] border border-border/70 bg-background/55 px-4 py-3 text-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{feature.title}</p>
                  <p className="text-xs leading-6 text-muted-foreground">{feature.description}</p>
                </div>
                <div className="icon-chip h-10 w-10 rounded-[calc(var(--radius)+0.375rem)] border-primary/20 bg-background/70 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="outline" className="w-full rounded-[calc(var(--radius)+0.45rem)] border-primary/20 bg-primary/[0.05] text-primary hover:bg-primary/[0.1]">
          تُفتح مع Plus لاحقًا
        </Button>
      </CardContent>
    </Card>
  );
}
