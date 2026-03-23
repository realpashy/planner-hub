import { useEffect, useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Carrot, ChevronDown, ChefHat, Fish, Milk, Package, Snowflake, Store, Wheat, X } from "lucide-react";
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

const COUNTRY_PRESETS = [
  { code: "+972", flag: "🇮🇱", label: "إسرائيل / فلسطين", regions: ["IL", "PS"] },
  { code: "+966", flag: "🇸🇦", label: "السعودية", regions: ["SA"] },
  { code: "+971", flag: "🇦🇪", label: "الإمارات", regions: ["AE"] },
  { code: "+20", flag: "🇪🇬", label: "مصر", regions: ["EG"] },
  { code: "+962", flag: "🇯🇴", label: "الأردن", regions: ["JO"] },
  { code: "+965", flag: "🇰🇼", label: "الكويت", regions: ["KW"] },
] as const;

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.05 4.94A9.86 9.86 0 0 0 12.02 2C6.58 2 2.15 6.4 2.15 11.82c0 1.73.45 3.42 1.32 4.91L2 22l5.45-1.42a9.9 9.9 0 0 0 4.57 1.16h.01c5.44 0 9.87-4.4 9.87-9.82 0-2.62-1.02-5.08-2.85-6.98Zm-7.03 15.2h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.23.84.87-3.14-.2-.32a8.08 8.08 0 0 1-1.25-4.34c0-4.48 3.67-8.13 8.18-8.13 2.18 0 4.21.84 5.75 2.37a8.02 8.02 0 0 1 2.4 5.76c0 4.48-3.67 8.13-8.03 8.13Zm4.46-6.08c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.23-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.36-1.91-1.15-.7-.61-1.17-1.36-1.31-1.59-.14-.23-.01-.36.11-.47.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.54-1.29-.74-1.76-.2-.48-.4-.41-.54-.42l-.46-.01c-.16 0-.42.06-.63.29-.22.23-.83.81-.83 1.98s.85 2.3.97 2.46c.12.16 1.67 2.54 4.04 3.56.56.24 1 .38 1.34.49.56.18 1.07.16 1.47.1.45-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.27Z" />
    </svg>
  );
}

function resolveCountryByCode(countryCode: string) {
  return COUNTRY_PRESETS.find((item) => item.code === countryCode) ?? COUNTRY_PRESETS[0];
}

function detectCountryCode() {
  if (typeof navigator === "undefined") return COUNTRY_PRESETS[0].code;
  const localeCandidates = [
    ...navigator.languages,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ].filter(Boolean);

  const upperCandidates = localeCandidates.map((value) => value.toUpperCase());
  const matched = COUNTRY_PRESETS.find((preset) =>
    preset.regions.some((region) => upperCandidates.some((candidate) => candidate.includes(`-${region}`) || candidate.endsWith(region))),
  );
  return matched?.code ?? COUNTRY_PRESETS[0].code;
}

function normalizeWhatsappNumber(countryCode: string, phoneNumber: string) {
  const code = countryCode.replace(/[^\d+]/g, "");
  const number = phoneNumber.replace(/\D/g, "");
  const normalizedCode = code.startsWith("+") ? code.slice(1) : code;
  const trimmedLocal = normalizedCode === "972" && number.startsWith("0") ? number.slice(1) : number;
  return `${normalizedCode}${trimmedLocal}`;
}

function buildWhatsappMessage(groups: GroceryGroup[]) {
  const lines = ["🛒 قائمة التسوق الأسبوعية", "مرتبة حسب أقسام السوبرماركت", ""];

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
  const [countryCode, setCountryCode] = useState<string>(COUNTRY_PRESETS[0].code);
  const [phoneNumber, setPhoneNumber] = useState("");
  const totalItems = useMemo(() => grocery.reduce((sum, group) => sum + group.items.length, 0), [grocery]);
  const selectedCountry = useMemo(() => resolveCountryByCode(countryCode), [countryCode]);
  const normalizedPhone = useMemo(() => normalizeWhatsappNumber(countryCode, phoneNumber), [countryCode, phoneNumber]);
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildWhatsappMessage(grocery))}`
    : "#";

  useEffect(() => {
    setCountryCode(detectCountryCode());
  }, []);

  return (
    <>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <section
          className="meal-surface-grocery rounded-[calc(var(--radius)+0.9rem)] p-5 shadow-xl"
          dir="rtl"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 text-right lg:flex-row lg:items-start lg:justify-start">
              <div className="inline-flex shrink-0 items-center gap-2 lg:order-1">
                <div className="meal-label-surface text-emerald-400 dark:text-emerald-300">
                  {grocery.length} فئات • {totalItems} عناصر
                </div>
                <InteractiveButton
                  type="button"
                  className="rounded-full border-0 bg-[#25D366] px-4 text-white shadow-[0_16px_34px_rgba(37,211,102,0.28)] hover:bg-[#1ebe5b]"
                  onClick={() => setShareOpen(true)}
                >
                  <span>إرسال القائمة إلى واتساب</span>
                  <WhatsappIcon className="h-4 w-4" />
                </InteractiveButton>
              </div>
              <div className="space-y-2 text-right flex-1 lg:order-2">
                <h3 className="text-lg font-black text-foreground">قائمة التسوق</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  قائمة موحدة ونظيفة مبنية على نموذج تسوق منظم، لا على أسطر المكونات الخام.
                </p>
              </div>
            </div>

            <CollapsibleTrigger className="flex w-full flex-col gap-3 rounded-[5px] border border-emerald-500/15 bg-background/45 px-4 py-3 text-right shadow-[var(--app-shadow)] transition hover:border-emerald-500/25 sm:flex-row sm:items-center sm:justify-start">
              <span className="meal-label-surface inline-flex items-center gap-2 text-emerald-400 dark:text-emerald-300">
                {open ? "إخفاء" : "عرض"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </span>
              <div className="space-y-1 text-right flex-1">
                <p className="text-sm font-bold text-foreground">{open ? "تفاصيل المشتريات مفتوحة" : "افتح القائمة لمراجعة العناصر"}</p>
                <p className="text-xs text-muted-foreground">{open ? "يمكن حذف أي عنصر غير مطلوب لهذا الأسبوع." : "القائمة مرتبة بأسلوب قريب من أقسام السوبرماركت."}</p>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-4 space-y-5">
                {grocery.map((group) => {
                  const Icon = GROUP_ICONS[group.key as keyof typeof GROUP_ICONS] ?? Store;
                  return (
                    <section
                      key={group.key}
                      className="space-y-3 rounded-[5px] border border-emerald-500/15 bg-background/38 p-4 shadow-[var(--app-shadow)]"
                    >
                      <div className="flex items-center justify-start gap-3 text-right">
                        <span className="icon-chip h-10 w-10 rounded-[5px] border-primary/25 bg-primary text-primary-foreground dark:border-primary/20 dark:bg-primary/[0.12] dark:text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="space-y-1 text-right flex-1">
                          <h4 className="text-sm font-black text-foreground">{group.title}</h4>
                          <p className="text-xs text-muted-foreground">{group.items.length} عناصر مجمعة بقراءة أوضح</p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[5px] border border-emerald-500/15 bg-card/[0.68]">
                        {group.items.map((item, index) => (
                          <div
                            key={item.key}
                            className={`group flex items-center justify-start gap-3 px-4 py-3 text-right ${index !== group.items.length - 1 ? "border-b border-dashed border-emerald-500/15" : ""}`}
                          >
                            <div className="inline-flex shrink-0 items-center gap-3">
                              <span className="text-xs font-bold text-emerald-400 dark:text-emerald-300">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.key)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                                aria-label={`حذف ${item.label}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="min-w-0 flex-1 text-right">
                              <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                            </div>
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
        <DialogContent
          dir="rtl"
          className="premium-scrollbar meal-surface-popup rounded-[calc(var(--radius)+0.85rem)] border-emerald-500/15 shadow-[0_30px_72px_rgba(0,0,0,0.3)]"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="inline-flex items-center justify-start gap-2 text-right text-xl font-black">
              <span>إرسال القائمة إلى واتساب</span>
              <WhatsappIcon className="h-5 w-5 text-[#25D366]" />
            </DialogTitle>
            <DialogDescription className="text-right leading-7">
              حدّد الدولة وأدخل الرقم بصيغته المحلية، وسنجهز لك رابط واتساب جاهزًا بالقائمة المجمعة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
              <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-foreground">مفتاح الدولة</label>
                <div className="flex h-12 items-center gap-3 rounded-[5px] border border-emerald-500/15 bg-background/55 px-3 shadow-[var(--app-shadow)]">
                  <select
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="h-full flex-1 bg-transparent text-left text-sm font-semibold text-foreground outline-none"
                    dir="ltr"
                  >
                    {COUNTRY_PRESETS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.code} {country.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xl leading-none">{selectedCountry.flag}</span>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-foreground">رقم الهاتف</label>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="أدخل رقمًا محليًا"
                  className="h-12 rounded-[5px] border-emerald-500/15 bg-background/55 text-right"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="rounded-[5px] border border-emerald-500/15 bg-background/55 p-4 text-right shadow-[var(--app-shadow)]">
              <p className="text-xs font-semibold text-muted-foreground">المعاينة بعد التطبيع</p>
              <p className="mt-1 text-base font-black text-foreground" dir="ltr">
                {normalizedPhone || `${selectedCountry.code.replace("+", "")}...`}
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                إذا كان الرقم المحلي يبدأ بصفر، سنحوّله تلقائيًا لصيغة مناسبة للرابط.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-start">
            <InteractiveButton
              type="button"
              asChild
              className="min-h-12 rounded-[1rem] border-0 bg-[#25D366] px-5 text-white shadow-[0_16px_34px_rgba(37,211,102,0.28)] hover:bg-[#1ebe5b]"
              disabled={!normalizedPhone}
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <span>فتح واتساب وإرسال القائمة</span>
                <WhatsappIcon className="h-4 w-4" />
              </a>
            </InteractiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
