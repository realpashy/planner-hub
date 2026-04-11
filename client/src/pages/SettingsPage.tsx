import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Globe2, LayoutGrid, Settings2, Sparkles, SlidersHorizontal, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadDashboardPreferences, saveDashboardPreferences, type DashboardWidgetKey } from "@/lib/dashboard";
import { useToast } from "@/hooks/use-toast";

const WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  hero: "قسم الترحيب",
  focus: "تركيز اليوم",
  timeline: "الجدول الموحد",
  modules: "بطاقات الوحدات",
  actions: "الإجراءات السريعة",
  assistant: "مساعد الذكاء",
  insights: "التقدم والرؤى",
  recent: "آخر ما فتحته",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(loadDashboardPreferences);
  const widgetEntries = useMemo(
    () => Object.entries(preferences.visibleWidgets) as Array<[DashboardWidgetKey, boolean]>,
    [preferences.visibleWidgets],
  );

  const updateWidget = (key: DashboardWidgetKey, value: boolean) => {
    const next = {
      ...preferences,
      visibleWidgets: {
        ...preferences.visibleWidgets,
        [key]: value,
      },
    };
    setPreferences(next);
    saveDashboardPreferences(next);
    toast({
      title: "تم تحديث التخصيص",
      description: "سيظهر التغيير مباشرة في الصفحة الرئيسية.",
      duration: 2500,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6" dir="rtl">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-shell overflow-hidden rounded-[calc(var(--radius)+1rem)] border-primary/15"
      >
        <CardHeader className="relative pb-4 text-right">
          <div className="premium-header-glow premium-header-glow-primary" />
          <div className="rtl-title-row relative">
            <div className="space-y-2 flex-1">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                تخصيص وتجهيز الصفحة الرئيسية
              </div>
              <h1 className="text-3xl font-black text-foreground">إعدادات Planner Hub</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                تحكم بما يظهر على الرئيسية، وما الذي يبقى ثابتًا في واجهة العمل اليومية، مع مساحة جاهزة لاحقًا لتفضيلات الذكاء واللغة.
              </p>
            </div>
            <div className="icon-chip h-14 w-14 rounded-[calc(var(--radius)+0.55rem)]">
              <Settings2 className="h-6 w-6" />
            </div>
          </div>
        </CardHeader>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="surface-shell rounded-[calc(var(--radius)+0.9rem)]">
          <CardHeader className="pb-3 text-right">
            <div className="rtl-title-row">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-xl">عناصر الصفحة الرئيسية</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">أظهر ما يخدمك يوميًا، وأخفِ ما تريد تأجيله.</p>
              </div>
              <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.4rem)]">
                <LayoutGrid className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {widgetEntries.map(([key, enabled]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-[calc(var(--radius)+0.5rem)] border border-border/70 bg-muted/45 px-4 py-3"
              >
                <Switch checked={enabled} onCheckedChange={(value) => updateWidget(key, value)} />
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{WIDGET_LABELS[key]}</p>
                  <p className="text-xs text-muted-foreground">يتحكم هذا الخيار في ظهور القسم على الرئيسية.</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="surface-shell rounded-[calc(var(--radius)+0.9rem)]">
            <CardHeader className="pb-3 text-right">
              <div className="rtl-title-row">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl">تفضيلات عامة</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">إعدادات خفيفة تبقي المنتج جاهزًا للتوسع لاحقًا.</p>
                </div>
                <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.4rem)]">
                  <Globe2 className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-right">
                <p className="text-sm font-bold text-foreground">لغة الواجهة</p>
                <Select defaultValue="ar">
                  <SelectTrigger className="h-12 rounded-[calc(var(--radius)+0.45rem)] border-border/70 bg-background/70 text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="he">עברית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-sm font-bold text-foreground">أسلوب الذكاء</p>
                <Select defaultValue="balanced">
                  <SelectTrigger className="h-12 rounded-[calc(var(--radius)+0.45rem)] border-border/70 bg-background/70 text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="balanced">متوازن</SelectItem>
                    <SelectItem value="direct">أكثر مباشرة</SelectItem>
                    <SelectItem value="gentle">أكثر هدوءًا</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-shell rounded-[calc(var(--radius)+0.9rem)]">
            <CardHeader className="pb-3 text-right">
              <div className="rtl-title-row">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl">إعدادات الوحدات</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">انتقل سريعًا إلى أماكن الضبط داخل الوحدات الحية.</p>
                </div>
                <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.4rem)]">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild variant="outline" className="h-12 justify-between rounded-[calc(var(--radius)+0.45rem)]">
                <Link href="/cashflow?screen=settings">إعدادات التدفق النقدي</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 justify-between rounded-[calc(var(--radius)+0.45rem)]">
                <Link href="/meal?panel=settings">إعدادات مخطط الوجبات</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 justify-between rounded-[calc(var(--radius)+0.45rem)]">
                <Link href="/budget">إعدادات الميزانية</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="surface-shell rounded-[calc(var(--radius)+0.9rem)] border-primary/20">
            <CardContent className="p-5">
              <div className="rtl-title-row">
                <div className="space-y-1 flex-1">
                  <p className="text-base font-black text-foreground">ذكاء وتخصيص أعمق لاحقًا</p>
                  <p className="text-sm leading-6 text-muted-foreground">المساحة جاهزة لخيارات ترتيب الودجات، أنماط المساعد، وأتمتة البداية اليومية.</p>
                </div>
                <div className="icon-chip h-11 w-11 rounded-[calc(var(--radius)+0.4rem)]">
                  <WandSparkles className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
