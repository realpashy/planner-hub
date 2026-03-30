import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryBreakdownItem, TrendPoint } from "@/modules/habits/types";

interface InsightChartsProps {
  weeklyTrend: TrendPoint[];
  monthlyTrend: TrendPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
}

export function InsightCharts({
  weeklyTrend,
  monthlyTrend,
  categoryBreakdown,
}: InsightChartsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)]">
        <CardHeader className="text-right">
          <CardTitle className="text-xl">الاستمرارية خلال الأسبوع</CardTitle>
          <CardDescription>نسبة الإنجاز اليومية آخر 7 أيام.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[250px]"
            config={{
              percent: { label: "النسبة", color: "#95df1e" },
            }}
          >
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="habits-weekly-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#95df1e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#95df1e" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="percent"
                stroke="#95df1e"
                fill="url(#habits-weekly-fill)"
                strokeWidth={3}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="surface-shell rounded-[calc(var(--radius)+0.85rem)]">
        <CardHeader className="text-right">
          <CardTitle className="text-xl">ملخص الأسابيع الأخيرة</CardTitle>
          <CardDescription>صورة سريعة لآخر أربع دفعات أسبوعية.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[250px]"
            config={{
              completions: { label: "الإنجازات", color: "#38bdf8" },
            }}
          >
            <BarChart data={monthlyTrend}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completions" radius={[10, 10, 0, 0]} fill="#38bdf8" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="surface-subtle rounded-[calc(var(--radius)+0.85rem)] xl:col-span-2">
        <CardHeader className="text-right">
          <CardTitle className="text-xl">أداء الفئات</CardTitle>
          <CardDescription>أي الفئات تظهر أكثر في إنجازات هذا الأسبوع.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {categoryBreakdown.length ? (
            categoryBreakdown.map((item) => (
              <div
                key={item.key}
                className="rounded-[calc(var(--radius)+0.45rem)] border border-border/70 bg-background/60 p-4 text-right"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.totalHabits} عادات مفعّلة</p>
                  </div>
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius)+0.35rem)] border bg-background/70"
                    style={{
                      borderColor: `${item.color}55`,
                      boxShadow: `0 0 0 1px ${item.color}22, 0 0 16px ${item.color}22`,
                    }}
                  >
                    {item.completions}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-background/70">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        item.totalHabits
                          ? Math.round((item.completions / (item.totalHabits * 7)) * 100)
                          : 0,
                      )}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[calc(var(--radius)+0.45rem)] border border-dashed border-border/60 bg-background/55 p-5 text-right text-sm text-muted-foreground md:col-span-3">
              أضف بعض العادات أولًا ليظهر توزيع الفئات هنا.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
