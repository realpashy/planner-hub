import {
  habitsCoachPayloadSchema,
  habitsCoachResponseSchema,
  type HabitsCoachPayload,
  type HabitsCoachResponse,
} from "../shared/ai/habits-coach";
import {
  dashboardAssistantRequestSchema,
  dashboardAssistantResultSchema,
  type DashboardAssistantRequest,
  type DashboardAssistantResult,
} from "../shared/ai/dashboard-assistant";

interface ParsedReceipt {
  type: "income" | "expense" | "bill_payment" | "debt_payment";
  amount: number;
  date: string;
  note: string;
  suggestedCategoryName: string;
}

function fallbackParse(): ParsedReceipt {
  const date = new Date().toISOString().slice(0, 10);
  return {
    type: "expense",
    amount: 0,
    date,
    note: "",
    suggestedCategoryName: "مصروفات عامة",
  };
}

function buildFallbackHabitsCoach(payload: HabitsCoachPayload): HabitsCoachResponse {
  const nextHabit = payload.habits.find((habit) => !habit.completed) ?? payload.habits[0];
  const secondHabit = payload.habits.find((habit) => !habit.completed && habit.name !== nextHabit?.name);
  const attentionReminder = payload.reminders.find((item) => item.tone === "attention");
  const completedAll = payload.totalHabits > 0 && payload.completedToday >= payload.totalHabits;

  const headline = completedAll
    ? "يومك يبدو متماسكًا جدًا اليوم"
    : payload.progressPercent >= 70
      ? "أنت قريب جدًا من إغلاق يوم قوي"
      : payload.progressPercent >= 35
        ? "اليوم جيد، لكنه يحتاج دفعة صغيرة واضحة"
        : "ابدأ الآن بعادة واحدة سهلة لتكسب الزخم";

  const overviewParts = [
    `أنجزت ${payload.completedToday} من ${payload.totalHabits} عادات اليوم.`,
    payload.todayMoodLabel ? `مزاجك اليوم: ${payload.todayMoodLabel}.` : null,
    attentionReminder ? `يوجد تذكير مفتوح لـ ${attentionReminder.title}.` : null,
    payload.bestStreak > 0 ? `أفضل سلسلة حالية لديك ${payload.bestStreak} يومًا.` : null,
  ].filter(Boolean);

  const actions = [
    nextHabit ? `ابدأ الآن بـ ${nextHabit.name} لأنها أقرب عادة لتحريك اليوم للأمام.` : "ابدأ بعادة قصيرة جدًا الآن بدل تأجيل اليوم كله.",
    secondHabit ? `بعدها أغلق ${secondHabit.name} مباشرة لتكسب إحساسًا واضحًا بالتقدم.` : "بعد أول إنجاز، أغلق عادة ثانية مباشرة لتثبيت الزخم.",
    payload.todayMoodLabel === "مرهق"
      ? "خفف الهدف اليوم: ركّز على الإنجاز الكافي بدل الكمال."
      : "لا تحاول إنهاء كل شيء دفعة واحدة؛ عادة واحدة الآن أفضل من خطة كبيرة مؤجلة.",
  ].slice(0, 3);

  const focusHabits = [nextHabit?.name, secondHabit?.name].filter(Boolean) as string[];

  return {
    headline,
    overview: overviewParts.join(" "),
    momentumLabel: completedAll
      ? "اليوم شبه مكتمل"
      : payload.progressPercent >= 70
        ? "زخم قوي"
        : payload.progressPercent >= 35
        ? "زخم قابل للتحسين"
          : "بداية هادئة",
    winCondition: nextHabit
      ? `إذا أنجزت ${nextHabit.name}${secondHabit ? ` ثم ${secondHabit.name}` : ""} فسيصبح يومك على المسار الصحيح.`
      : "إنجاز عادة واحدة واضحة الآن يكفي ليمنح اليوم اتجاهًا صحيحًا.",
    watchOut:
      payload.todayMoodLabel === "مرهق"
        ? "لا ترفع السقف اليوم. اختر إنجازًا كافيًا بدل محاولة تعويض كل شيء دفعة واحدة."
        : "لا تبدّد الزخم في عادات كثيرة مرة واحدة؛ ابدأ بالأقرب للإغلاق ثم انتقل لغيرها.",
    focusHabits: focusHabits.length ? focusHabits : ["ابدأ بعادة واحدة"],
    actions,
    encouragement: completedAll
      ? "أغلق اليوم بهدوء واستمر على نفس الإيقاع."
      : "الاستمرار أهم من الكمال. خطوة واحدة الآن تغيّر بقية اليوم.",
    generatedAt: new Date().toISOString(),
    source: "fallback",
  };
}

export async function parseReceiptWithAI(imageDataUrl: string): Promise<ParsedReceipt> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your server environment.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this receipt/invoice image. Return strict JSON only with keys: type (income|expense|bill_payment|debt_payment), amount (number), date (YYYY-MM-DD), note (short Arabic summary), suggestedCategoryName (Arabic category). If uncertain choose expense and amount 0.",
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI parsing failed: ${text}`);
  }

  const body = (await response.json()) as { output_text?: string };
  const raw = body.output_text || "";

  try {
    const parsed = JSON.parse(raw) as ParsedReceipt;
    return {
      type: parsed.type,
      amount: Number(parsed.amount) || 0,
      date: parsed.date || new Date().toISOString().slice(0, 10),
      note: parsed.note || "",
      suggestedCategoryName: parsed.suggestedCategoryName || "مصروفات عامة",
    };
  } catch {
    return fallbackParse();
  }
}

export async function generateHabitsCoachBrief(rawPayload: unknown): Promise<HabitsCoachResponse> {
  const parsedPayload = habitsCoachPayloadSchema.parse(rawPayload);
  const fallback = buildFallbackHabitsCoach(parsedPayload);
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return fallback;
  }

  const model = process.env.OPENAI_HABITS_MODEL || process.env.OPENAI_MEAL_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are a premium Arabic habit coach inside Planner Hub. Return strict JSON only. Write Arabic only. Be concise, practical, supportive, and never guilt-inducing. Do not mention AI limitations. Use the provided habit summary only. Avoid markdown.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `اعتمادًا على هذا الملخص، أعد JSON فقط بالمفاتيح التالية: ` +
                `headline, overview, momentumLabel, winCondition, watchOut, focusHabits, actions, encouragement. ` +
                `الشروط: headline حتى 90 حرفًا، overview حتى 220 حرفًا، momentumLabel حتى 48 حرفًا، ` +
                `winCondition حتى 96 حرفًا، watchOut حتى 96 حرفًا، ` +
                `focusHabits من 1 إلى 3 عادات بأسمائها فقط، actions من 2 إلى 3 خطوات عملية وقصيرة، ` +
                `encouragement حتى 140 حرفًا. اجعل النص مباشرًا ومفيدًا لليوم الحالي.\n\n` +
                JSON.stringify(parsedPayload),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallback;
  }

  const body = (await response.json()) as { output_text?: string };
  const raw = body.output_text || "";

  try {
    const parsed = JSON.parse(raw) as Omit<HabitsCoachResponse, "generatedAt" | "source">;
    return habitsCoachResponseSchema.parse({
      ...parsed,
      generatedAt: new Date().toISOString(),
      source: "openai",
    });
  } catch {
    return fallback;
  }
}

function buildFallbackDashboardAssistant({
  action,
  context,
}: DashboardAssistantRequest): DashboardAssistantResult {
  const nextHref =
    context.planner.overdueTasks > 0 || context.planner.tasksToday > 0
      ? "/weekly-planner"
      : context.habits.atRiskHabits.length > 0
        ? "/habits?tab=habits"
        : context.meals.mealsToday === 0
          ? "/meal"
          : context.cashflow.pendingPayments > 0
            ? "/cashflow?screen=upcoming"
            : "/budget";

  const nextLabel =
    nextHref.startsWith("/weekly-planner")
      ? "راجع أولويات اليوم"
      : nextHref.startsWith("/habits")
        ? "أغلق عادة مهددة الآن"
        : nextHref.startsWith("/meal")
          ? "راجع وجبات اليوم"
          : nextHref.startsWith("/cashflow")
            ? "افتح الدفعات القريبة"
            : "راجع حركة الميزانية";

  const headlineMap: Record<DashboardAssistantRequest["action"], string> = {
    generateDashboardInsight:
      context.planner.overdueTasks > 0
        ? "اليوم يحتاج حسمًا مبكرًا"
        : context.habits.progressPercent >= 70
          ? "يومك متماسك ويحتاج تثبيتًا فقط"
          : "ابدأ بخطوة واحدة واضحة لتأخذ الزخم",
    reprioritizeDay: "هذا هو الترتيب الأذكى لبقية اليوم",
    simplifyPlan: "يمكن تبسيط اليوم بدون خسارة الاتجاه",
    spotRisks: "هذه أهم المخاطر التي تستحق انتباهك",
  };

  const summaryMap: Record<DashboardAssistantRequest["action"], string> = {
    generateDashboardInsight:
      `لديك ${context.planner.tasksToday} مهام اليوم، و${context.habits.pendingHabits} عادات غير مكتملة، و${context.cashflow.pendingPayments} تنبيهات مالية تحتاج مراقبة.`,
    reprioritizeDay:
      "ابدأ بالمهمة الأقرب للإغلاق، ثم أغلق عادة واحدة، وبعدها راجع أي عنصر مالي أو غذائي مفتوح.",
    simplifyPlan:
      "اختر إنجازًا واحدًا من المخطط، عادة واحدة فقط، ثم اترك الباقي كمرحلة ثانية بدل ضغط كل شيء معًا.",
    spotRisks:
      "الخطر الأكبر الآن هو تراكم العناصر المفتوحة قبل نهاية اليوم، خاصة إذا تأخرت البداية أو ارتفع ضغط الصرف.",
  };

  const bulletsMap: Record<DashboardAssistantRequest["action"], string[]> = {
    generateDashboardInsight: [
      context.planner.overdueTasks > 0 ? "هناك مهام متأخرة تحتاج إغلاقًا اليوم." : "ابدأ بأقرب مهمة قابلة للإغلاق.",
      context.habits.atRiskHabits[0] ? `عادة ${context.habits.atRiskHabits[0]} تحتاج تثبيتًا مبكرًا.` : "عادة واحدة الآن تكفي لرفع الزخم.",
      context.cashflow.warningLabel || context.budget.pressureLabel === "مرتفع" ? "الوضع المالي يحتاج مراجعة قصيرة اليوم." : "الوضع المالي الحالي يبدو مقبولًا.",
    ],
    reprioritizeDay: [
      "أغلق أولًا ما يحمل أثرًا مباشرًا على اليوم.",
      "لا تؤجل العادة الأقرب للإتمام إلى آخر اليوم.",
      "اترك التحسينات غير العاجلة لوقت لاحق.",
    ],
    simplifyPlan: [
      "احذف خطوة غير ضرورية من منتصف اليوم.",
      "حوّل أي عادة مرهقة إلى نسخة أخف تكفي للاستمرار.",
      "ركّز على إنجازين مهمين بدل خمسة متوسطة.",
    ],
    spotRisks: [
      context.planner.overdueTasks > 0 ? "المهام المتأخرة قد تسحب انتباه اليوم كله." : "التشتت أخطر من نقص الوقت اليوم.",
      context.habits.atRiskHabits.length > 0 ? "سلسلة عادة واحدة على الأقل معرضة للانقطاع." : "العادات مستقرة نسبيًا إذا بدأت مبكرًا.",
      context.cashflow.pendingPayments > 0 ? "هناك دفعات معلقة قد تحتاج متابعة." : "لا توجد مخاطرة مالية ثقيلة الآن.",
    ],
  };

  return dashboardAssistantResultSchema.parse({
    headline: headlineMap[action],
    summary: summaryMap[action],
    bullets: bulletsMap[action].slice(0, 3),
    bestNextAction: {
      type: nextHref.startsWith("/weekly-planner")
        ? "planner"
        : nextHref.startsWith("/habits")
          ? "habits"
          : nextHref.startsWith("/meal")
            ? "meal"
            : nextHref.startsWith("/cashflow")
              ? "cashflow"
              : "budget",
      label: nextLabel,
      href: nextHref,
    },
    generatedAt: new Date().toISOString(),
    source: "fallback",
  });
}

export async function generateDashboardAssistant(rawPayload: unknown): Promise<DashboardAssistantResult> {
  const parsedPayload = dashboardAssistantRequestSchema.parse(rawPayload);
  const fallback = buildFallbackDashboardAssistant(parsedPayload);
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return fallback;
  }

  const model = process.env.OPENAI_DASHBOARD_MODEL || process.env.OPENAI_MEAL_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are Planner Hub dashboard intelligence. Return strict JSON only. Write Arabic only. Be concise, practical, calm, and high-signal. No markdown. No disclaimers. Keep outputs short and daily-usable.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `اعتمادًا على هذا السياق اليومي، أعد JSON فقط بالمفاتيح التالية: headline, summary, bullets, bestNextAction. ` +
                `headline حتى 90 حرفًا، summary حتى 220 حرفًا، bullets من 2 إلى 4 نقاط قصيرة، ` +
                `bestNextAction يحتوي type من planner|habits|budget|meal|cashflow و label و href. ` +
                `إذا كان action هو simplifyPlan فليكن الإخراج أبسط وأهدأ. إذا كان action هو spotRisks فركّز على التحذيرات العملية فقط.\n\n` +
                JSON.stringify(parsedPayload),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallback;
  }

  const body = (await response.json()) as { output_text?: string };
  try {
    const parsed = JSON.parse(body.output_text || "");
    return dashboardAssistantResultSchema.parse({
      ...parsed,
      generatedAt: new Date().toISOString(),
      source: "openai",
    });
  } catch {
    return fallback;
  }
}
