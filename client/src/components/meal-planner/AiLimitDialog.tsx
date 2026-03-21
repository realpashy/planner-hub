import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UpgradeCta } from "./UpgradeCta";
import type { MealPlannerQuotaResponse } from "@/lib/ai/meal-planner-ai";

export function AiLimitDialog({
  open,
  onOpenChange,
  quota,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: MealPlannerQuotaResponse | null;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle>تم الوصول إلى حد الذكاء الاصطناعي</AlertDialogTitle>
          <AlertDialogDescription>
            ما يزال بإمكانك تعديل الأسبوع يدويًا، نسخ الأيام والوجبات، واستخدام التوليد المحلي بدون تكلفة إضافية.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-right text-sm text-muted-foreground">
          <p>المتبقي اليوم: توليد كامل {quota?.remainingFullGenerationsToday ?? "غير محدود"}، وتعديلات سريعة {quota?.remainingLightEditsToday ?? "غير محدود"}.</p>
        </div>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>إغلاق</AlertDialogCancel>
          <div>
            <UpgradeCta />
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
