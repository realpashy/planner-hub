import { AI_LockedCard } from "@/modules/habits/components/AI_LockedCard";

export function AIScreen() {
  return (
    <div className="space-y-5">
      <div className="surface-shell rounded-[calc(var(--radius)+0.9rem)] p-5 text-right">
        <h2 className="text-2xl font-black text-foreground">المدرب الذكي</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          هذه الشاشة موجودة لإظهار اتجاه المنتج المدفوع بوضوح. لا توجد وظائف ذكاء اصطناعي مفعّلة الآن،
          لكن الواجهة توضّح القيمة التي ستُفتح لاحقًا بشكل صريح ومحترم.
        </p>
      </div>

      <AI_LockedCard />
    </div>
  );
}
