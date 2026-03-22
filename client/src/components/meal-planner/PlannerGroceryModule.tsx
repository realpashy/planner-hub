import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Carrot, ChevronDown, ChefHat, Fish, Milk, Package, Send, Snowflake, Store, Wheat, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { GroceryGroup } from "@/lib/meal-planner";

interface PlannerGroceryModuleProps {
  grocery: GroceryGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveItem: (itemKey: string) => Promise<void>;
}

const GROUP_ICONS = {
  produce: Carrot,
  dairy_fridge: Milk,
  meats: Fish,
  pantry: Package,
  bakery: Wheat,
  frozen: Snowflake,
  snacks: Store,
  spices: ChefHat,
} as const;

function normalizeWhatsappNumber(countryCode: string, phoneNumber: string) {
  const code = countryCode.replace(/[^\d+]/g, "");
  const number = phoneNumber.replace(/\D/g, "");
  const normalizedCode = code.startsWith("+") ? code.slice(1) : code;
  const trimmedLocal = normalizedCode === "972" && number.startsWith("0") ? number.slice(1) : number;
  return `${normalizedCode}${trimmedLocal}`;
}

function buildWhatsappMessage(groups: GroceryGroup[]) {
  const lines = ["🛒 قائمة التسوق الأسبوعية", ""];

  for (const group of groups) {
    if (!group.items.length) continue;
    lines.push(`*${group.title}*`);
    for (const item of group.items) {
      lines.push(`• ${item.label} — ${item.quantity}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function PlannerGroceryModule({ grocery, open, onOpenChange, onRemoveItem }: PlannerGroceryModuleProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("+972");
  const [phoneNumber, setPhoneNumber] = useState("");
  const totalItems = useMemo(() => grocery.reduce((sum, group) => sum + group.items.length, 0), [grocery]);
  const normalizedPhone = useMemo(() => normalizeWhatsappNumber(countryCode, phoneNumber), [countryCode, phoneNumber]);
  const whatsappHref = normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildWhatsappMessage(grocery))}` : "#";

  return (
    <>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <section
          className="rounded-[1.5rem] border border-white/60 bg-white/82 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_18px_46px_rgba(2,6,23,0.42)]"
          dir="rtl"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 text-right">
                <h3 className="text-lg font-bold text-foreground">قائمة التسوق</h3>
                <p className="text-sm text-muted-foreground">مرتبة لتناسب التسوق الأسبوعي بشكل سريع وواضح.</p>
              </div>
              <div className="flex items-center gap-2">
                <InteractiveButton type="button" variant="outline" className="rounded-full px-4" onClick={() => setShareOpen(true)}>
                  إرسال القائمة إلى واتساب
                  <Send className="h-4 w-4" />
                </InteractiveButton>
                <div className="rounded-full border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground dark:bg-white/5">
                  {grocery.length} فئات • {totalItems} عناصر
                </div>
              </div>
            </div>

            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-[1rem] bg-slate-900/[0.025] px-4 py-3 text-right dark:bg-white/[0.04]">
              <div className="text-sm font-semibold text-muted-foreground">{open ? "إخفاء التفاصيل" : "عرض التفاصيل"}</div>
              <div className="flex items-center gap-2 text-foreground">
                <span className="text-sm font-semibold">{open ? "القائمة مفتوحة" : "القائمة مطوية"}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-4 space-y-5">
                {grocery.map((group) => {
                  const Icon = GROUP_ICONS[group.key as keyof typeof GROUP_ICONS] ?? Store;
                  return (
                    <section key={group.key} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-muted-foreground">{group.items.length} عناصر</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{group.title}</span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-[1rem] border border-border/60 bg-background/75 dark:bg-white/[0.04]">
                        {group.items.map((item, index) => (
                          <div
                            key={item.key}
                            className={`group flex items-center justify-between gap-3 px-4 py-3 ${index !== group.items.length - 1 ? "border-b border-dashed border-border/60" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-muted-foreground">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.key)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
                                aria-label={`حذف ${item.label}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="text-right text-sm font-medium text-foreground">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </CollapsibleContent>
          </div>
        </section>
      </Collapsible>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent dir="rtl" className="rounded-[1.5rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] shadow-[0_24px_70px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right text-xl font-black">إرسال القائمة إلى واتساب</DialogTitle>
            <DialogDescription className="text-right leading-7">
              أضف رقم الهاتف وسنفتح واتساب برسالة مرتبة وجاهزة للإرسال.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-2 text-right">
                <label className="text-sm font-semibold text-foreground">رقم الهاتف</label>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="0502242816"
                  className="h-12 rounded-xl text-right"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 text-right">
                <label className="text-sm font-semibold text-foreground">مفتاح الدولة</label>
                <div className="flex h-12 items-center gap-2 rounded-xl border border-input bg-background px-3">
                  <Input
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="h-full border-0 bg-transparent px-0 text-left shadow-none focus-visible:ring-0"
                    dir="ltr"
                  />
                  <span className="text-xl">🇮🇱</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/75 p-4 text-right dark:bg-white/[0.04]">
              <p className="text-xs font-semibold text-muted-foreground">المعاينة بعد التطبيع</p>
              <p className="mt-1 text-sm font-bold text-foreground" dir="ltr">{normalizedPhone || "972..."}</p>
            </div>
          </div>

          <DialogFooter className="sm:justify-start">
            <InteractiveButton
              type="button"
              asChild
              className="min-h-12 rounded-[1rem] px-5"
              disabled={!normalizedPhone}
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                إرسال القائمة
                <Send className="h-4 w-4" />
              </a>
            </InteractiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
