import { useEffect, useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getCountryDataList, getEmojiFlag } from "countries-list";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type AppLanguage = "ar" | "he" | "en";

type CountryOption = {
  iso2: string;
  code: string;
  flag: string;
  label: string;
};

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.05 4.94A9.86 9.86 0 0 0 12.02 2C6.58 2 2.15 6.4 2.15 11.82c0 1.73.45 3.42 1.32 4.91L2 22l5.45-1.42a9.9 9.9 0 0 0 4.57 1.16h.01c5.44 0 9.87-4.4 9.87-9.82 0-2.62-1.02-5.08-2.85-6.98Zm-7.03 15.2h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.23.84.87-3.14-.2-.32a8.08 8.08 0 0 1-1.25-4.34c0-4.48 3.67-8.13 8.18-8.13 2.18 0 4.21.84 5.75 2.37a8.02 8.02 0 0 1 2.4 5.76c0 4.48-3.67 8.13-8.03 8.13Zm4.46-6.08c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.23-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.36-1.91-1.15-.7-.61-1.17-1.36-1.31-1.59-.14-.23-.01-.36.11-.47.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.54-1.29-.74-1.76-.2-.48-.4-.41-.54-.42l-.46-.01c-.16 0-.42.06-.63.29-.22.23-.83.81-.83 1.98s.85 2.3.97 2.46c.12.16 1.67 2.54 4.04 3.56.56.24 1 .38 1.34.49.56.18 1.07.16 1.47.1.45-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.27Z" />
    </svg>
  );
}

function buildCountryOptions(language: AppLanguage) {
  const displayNames =
    typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
      ? new Intl.DisplayNames([language], { type: "region" })
      : null;

  return getCountryDataList()
    .filter((country) => Array.isArray(country.phone) && country.phone.length > 0)
    .map((country) => ({
      iso2: country.iso2,
      code: `+${country.phone[0]}`,
      flag: getEmojiFlag(country.iso2),
      label: displayNames?.of(country.iso2) || country.native || country.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, language));
}

function detectCountryIso2(countryOptions: CountryOption[]) {
  if (typeof navigator === "undefined") return countryOptions[0]?.iso2 ?? "IL";
  const localeCandidates = [
    ...navigator.languages,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ].filter(Boolean);

  const upperCandidates = localeCandidates.map((value) => value.toUpperCase());
  const matched = countryOptions.find((country) =>
    upperCandidates.some((candidate) => candidate.includes(`-${country.iso2}`) || candidate.endsWith(country.iso2)),
  );
  if (matched?.iso2) return matched.iso2;

  const htmlLang = typeof document !== "undefined" ? document.documentElement.lang?.toLowerCase() : "";
  const timeZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() : "";
  if (htmlLang?.startsWith("ar") || htmlLang?.startsWith("he") || timeZone?.includes("jerusalem")) {
    return countryOptions.find((country) => country.iso2 === "IL")?.iso2 ?? "IL";
  }

  return countryOptions.find((country) => country.iso2 === "IL")?.iso2
    ?? countryOptions.find((country) => country.code === "+972")?.iso2
    ?? countryOptions[0]?.iso2
    ?? "IL";
}

async function detectCountryIso2ByIp(signal?: AbortSignal) {
  try {
    const response = await fetch("/api/geo/country", { signal, credentials: "include" });
    if (!response.ok) return null;
    const data = await response.json() as { countryIso2?: string | null };
    return data.countryIso2?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

function normalizeWhatsappNumber(countryCode: string, phoneNumber: string) {
  const code = countryCode.replace(/[^\d+]/g, "");
  const number = phoneNumber.replace(/\D/g, "");
  const normalizedCode = code.startsWith("+") ? code.slice(1) : code;
  const trimmedLocal = normalizedCode === "972" && number.startsWith("0") ? number.slice(1) : number;
  return `${normalizedCode}${trimmedLocal}`;
}

function detectAppLanguage(): AppLanguage {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.toLowerCase();
    if (htmlLang?.startsWith("he")) return "he";
    if (htmlLang?.startsWith("en")) return "en";
    if (htmlLang?.startsWith("ar")) return "ar";
  }
  if (typeof navigator !== "undefined") {
    const locale = (navigator.language || "").toLowerCase();
    if (locale.startsWith("he")) return "he";
    if (locale.startsWith("en")) return "en";
  }
  return "ar";
}

function buildWhatsappMessage(groups: GroceryGroup[], language: "ar" | "he" | "en") {
  const copy =
    language === "he"
      ? {
          title: "🛒 רשימת קניות שבועית",
          subtitle: "מסודרת לפי מחלקות הסופר",
        }
      : language === "en"
        ? {
            title: "🛒 Weekly shopping list",
            subtitle: "Organized by supermarket sections",
          }
        : {
            title: "🛒 قائمة التسوق الأسبوعية",
            subtitle: "مرتبة حسب أقسام السوبرماركت",
          };
  const lines = [copy.title, copy.subtitle, ""];

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
  const [selectedCountryIso2, setSelectedCountryIso2] = useState("IL");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("ar");
  const countryOptions = useMemo(() => buildCountryOptions(appLanguage), [appLanguage]);
  const filteredCountryOptions = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return countryOptions;
    return countryOptions.filter((country) =>
      country.label.toLowerCase().includes(query)
      || country.code.toLowerCase().includes(query)
      || country.iso2.toLowerCase().includes(query),
    );
  }, [countryOptions, countrySearch]);
  const totalItems = useMemo(() => grocery.reduce((sum, group) => sum + group.items.length, 0), [grocery]);
  const selectedCountry = useMemo(
    () => countryOptions.find((country) => country.iso2 === selectedCountryIso2) ?? countryOptions.find((country) => country.code === "+972") ?? countryOptions[0],
    [countryOptions, selectedCountryIso2],
  );
  const normalizedPhone = useMemo(() => normalizeWhatsappNumber(selectedCountry?.code ?? "+972", phoneNumber), [selectedCountry, phoneNumber]);
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildWhatsappMessage(grocery, appLanguage))}`
    : "#";

  useEffect(() => {
    const detectedLanguage = detectAppLanguage();
    setAppLanguage(detectedLanguage);
  }, []);

  useEffect(() => {
    if (!countryOptions.length) return;
    setSelectedCountryIso2(detectCountryIso2(countryOptions));
  }, [countryOptions]);

  useEffect(() => {
    if (!countryOptions.length) return;
    const controller = new AbortController();

    void detectCountryIso2ByIp(controller.signal).then((iso2) => {
      if (!iso2) return;
      const found = countryOptions.find((country) => country.iso2 === iso2);
      if (found) {
        setSelectedCountryIso2(found.iso2);
      }
    });

    return () => controller.abort();
  }, [countryOptions]);

  return (
    <>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <section
          className="meal-surface-grocery rounded-[calc(var(--radius)+0.9rem)] p-5 shadow-xl"
          dir="rtl"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 text-right lg:flex-row lg:items-start lg:justify-between">
              <div className="meal-header-cluster lg:max-w-[34rem]">
                <h3 className="text-lg font-black text-foreground">قائمة التسوق</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  قائمة موحدة ونظيفة مبنية على نموذج تسوق منظم، لا على أسطر المكونات الخام.
                </p>
              </div>
              <div className="inline-flex shrink-0 items-center gap-2 lg:self-start">
                <div className="meal-label-surface text-primary">
                  {grocery.length} فئات • {totalItems} عناصر
                </div>
                <InteractiveButton
                  type="button"
                  className="rounded-full border-0 bg-[#25D366] px-4 text-white shadow-[0_16px_34px_rgba(37,211,102,0.28)] hover:bg-[#1ebe5b]"
                  onClick={() => setShareOpen(true)}
                >
                  <WhatsappIcon className="h-4 w-4" />
                  <span>إرسال القائمة إلى واتساب</span>
                </InteractiveButton>
              </div>
            </div>

            <CollapsibleTrigger className="flex w-full flex-col gap-3 rounded-[5px] border border-primary/15 bg-background/45 px-4 py-3 text-right shadow-[var(--app-shadow)] transition hover:border-primary/25 sm:flex-row sm:items-center sm:justify-start">
              <span className="meal-label-surface inline-flex items-center gap-2 text-primary">
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
                      className="space-y-3 rounded-[5px] border border-primary/15 bg-background/38 p-4 shadow-[var(--app-shadow)]"
                    >
                      <div className="meal-leading-row">
                        <span className="icon-chip h-10 w-10 rounded-[5px] border-primary/25 bg-primary text-primary-foreground dark:border-primary/20 dark:bg-primary/[0.12] dark:text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="meal-header-cluster space-y-1">
                          <h4 className="text-sm font-black text-foreground">{group.title}</h4>
                          <p className="text-xs text-muted-foreground">{group.items.length} عناصر مجمعة بقراءة أوضح</p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[5px] border border-primary/15 bg-card/[0.68]">
                        {group.items.map((item, index) => (
                          <div
                            key={item.key}
                            className={`meal-grocery-row px-4 py-3 ${index !== group.items.length - 1 ? "border-b border-dashed border-primary/15" : ""}`}
                          >
                            <div className="min-w-0 flex-1 text-right">
                              <div className="inline-flex max-w-full items-center gap-2">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                              </div>
                            </div>
                            <div className="meal-grocery-quantity">
                              <span className="text-xs font-black">×</span>
                              <span className="text-xs font-bold">{item.quantity}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.key)}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/75 text-muted-foreground transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                              aria-label={`حذف ${item.label}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
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
          className="dark premium-scrollbar meal-surface-popup rounded-[calc(var(--radius)+0.85rem)] border-primary/15 shadow-[0_30px_72px_rgba(0,0,0,0.3)]"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="inline-flex items-center justify-start gap-2 text-right text-xl font-black">
              <WhatsappIcon className="h-5 w-5 text-[#25D366]" />
              <span>إرسال القائمة إلى واتساب</span>
            </DialogTitle>
            <DialogDescription className="text-right leading-7">
              حدّد الدولة وأدخل الرقم بصيغته المحلية، وسنجهز لك رابط واتساب جاهزًا بالقائمة المجمعة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,2.2fr)] gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)]">
              <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-foreground">مفتاح الدولة</label>
                <Select
                  value={selectedCountry?.iso2 ?? ""}
                  onValueChange={(value) => {
                    setSelectedCountryIso2(value);
                    setCountrySearch("");
                  }}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) setCountrySearch("");
                  }}
                >
                  <SelectTrigger className="h-12 rounded-[5px] border-primary/15 bg-background/75 px-3 text-left text-foreground shadow-[var(--app-shadow)] [&>span]:text-left" dir="ltr">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[5px] border-primary/15 bg-card text-card-foreground">
                    <div className="p-1.5">
                      <Input
                        value={countrySearch}
                        onChange={(event) => setCountrySearch(event.target.value)}
                        placeholder="Search country"
                        className="h-10 rounded-[5px] border-border/80 bg-background/75 text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        onKeyDown={(event) => event.stopPropagation()}
                      />
                    </div>
                    {filteredCountryOptions.map((country) => (
                      <SelectItem key={country.iso2} value={country.iso2} className="rounded-[5px] text-left" dir="ltr">
                        {country.flag} {country.code} {country.label}
                      </SelectItem>
                    ))}
                    {!filteredCountryOptions.length ? (
                      <div className="px-3 py-2 text-left text-sm text-muted-foreground" dir="ltr">
                        No matching countries
                      </div>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-foreground">رقم الهاتف</label>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="000 000 0000"
                  className="h-12 rounded-[5px] border-primary/15 bg-background/75 text-left placeholder:text-muted-foreground/70"
                  dir="ltr"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="rounded-[5px] border border-primary/15 bg-background/55 p-4 text-right shadow-[var(--app-shadow)]">
              <p className="text-xs font-semibold text-muted-foreground">المعاينة بعد التطبيع</p>
              <p className="mt-1 text-base font-black text-foreground" dir="ltr">
                {normalizedPhone || `${(selectedCountry?.code ?? "+972").replace("+", "")}...`}
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                إذا كان الرقم المحلي يبدأ بصفر، سنحوّله تلقائيًا لصيغة مناسبة للرابط.
              </p>
            </div>
          </div>

          <DialogFooter className="items-stretch justify-stretch sm:flex-row-reverse sm:justify-stretch">
            <InteractiveButton
              type="button"
              asChild
              className="min-h-12 w-full justify-center rounded-[1rem] border-0 bg-[#25D366] px-5 text-white shadow-[0_16px_34px_rgba(37,211,102,0.28)] hover:bg-[#1ebe5b] [&>span]:w-full [&>span]:justify-center [&>span>span]:inline-flex [&>span>span]:items-center [&>span>span]:justify-center"
              disabled={!normalizedPhone}
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2">
                <WhatsappIcon className="h-4 w-4" />
                <span>فتح واتساب وإرسال القائمة</span>
              </a>
            </InteractiveButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
