import type { ReactNode } from "react";
import { Droplets, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROFILE_ACTIVITY_OPTIONS,
  PROFILE_GOAL_OPTIONS,
  PROFILE_SNACK_OPTIONS,
  type MealPlannerProfile,
} from "@/lib/meal-planner";

interface MealPlannerProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MealPlannerProfile;
  guidanceItems: string[];
  waterTargetCups: number;
  waterTargetLiters: number;
  onUpdateProfile: (partial: Partial<MealPlannerProfile>) => void;
}

export function MealPlannerProfileSheet({
  open,
  onOpenChange,
  profile,
  guidanceItems,
  waterTargetCups,
  waterTargetLiters,
  onUpdateProfile,
}: MealPlannerProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        dir="rtl"
        className="w-[96vw] max-w-[34rem] overflow-y-auto border-l border-border/70 bg-background p-0 [&>button]:right-5 [&>button]:left-auto [&>button]:top-5 [&>button]:rounded-full"
      >
        <div className="flex min-h-full flex-col">
          <SheetHeader className="border-b border-border/70 px-6 pb-5 pt-6 text-right">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                تخصيص خفيف
              </Badge>
              <Settings2 className="h-4 w-4 text-primary" />
            </div>
            <SheetTitle className="text-right text-2xl font-extrabold">إعدادات التخطيط</SheetTitle>
            <SheetDescription className="text-right text-sm leading-6">
              تعديلات بسيطة لتجعل التوجيهات اليومية والماء والسناك أقرب إلى روتينك.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 px-6 py-6">
            <div className="grid gap-4">
              <Field title="هدفك العام">
                <Select dir="rtl" value={profile.goal} onValueChange={(value) => onUpdateProfile({ goal: value as MealPlannerProfile["goal"] })}>
                  <SelectTrigger className="meal-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="meal-select-content">
                    {PROFILE_GOAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="meal-select-item">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field title="مستوى النشاط">
                <Select dir="rtl" value={profile.activityLevel} onValueChange={(value) => onUpdateProfile({ activityLevel: value as MealPlannerProfile["activityLevel"] })}>
                  <SelectTrigger className="meal-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="meal-select-content">
                    {PROFILE_ACTIVITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="meal-select-item">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field title="تفضيل السناك">
                <Select dir="rtl" value={profile.snackPreference} onValueChange={(value) => onUpdateProfile({ snackPreference: value as MealPlannerProfile["snackPreference"] })}>
                  <SelectTrigger className="meal-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="meal-select-content">
                    {PROFILE_SNACK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="meal-select-item">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field title="هدف الماء الأساسي">
                <div className="space-y-3">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={profile.waterTargetCups}
                    onChange={(event) => onUpdateProfile({ waterTargetCups: Number(event.target.value) || 1 })}
                    className="meal-input"
                  />
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-right text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">{waterTargetCups} أكواب</span>
                      <div className="flex items-center gap-1 text-sky-600 dark:text-sky-300">
                        <Droplets className="h-4 w-4" />
                        <span>{waterTargetLiters.toLocaleString("en-US")} لتر</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      يتم عرض الماء دائمًا بالأكواب واللترات معًا داخل التخطيط والواجهة.
                    </p>
                  </div>
                </div>
              </Field>

              <Field title="ملاحظات غذائية">
                <Textarea
                  value={profile.dietaryNotes}
                  onChange={(event) => onUpdateProfile({ dietaryNotes: event.target.value })}
                  placeholder="مثال: أفضل الوجبات السريعة في منتصف الأسبوع أو أفضّل عشاء أخف"
                  className="meal-textarea min-h-[92px]"
                />
              </Field>

              <Field title="مكونات أتجنبها">
                <Textarea
                  value={profile.avoidIngredients}
                  onChange={(event) => onUpdateProfile({ avoidIngredients: event.target.value })}
                  placeholder="مثال: المقليات الثقيلة أو مكونات لا تناسب الروتين"
                  className="meal-textarea min-h-[92px]"
                />
              </Field>
            </div>

            <Card className="rounded-[1.5rem] border-border/70 bg-card/90">
              <CardContent className="space-y-4 p-4 text-right">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-foreground">توجيهات سريعة</p>
                    <p className="text-sm text-muted-foreground">اقتراحات خفيفة لتحسين الإيقاع اليومي بدون تعقيد.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-3">
                  {guidanceItems.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 text-right">
      <Label className="text-sm font-semibold text-foreground">{title}</Label>
      {children}
    </div>
  );
}
