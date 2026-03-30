import {
  habitsCoachPayloadSchema,
  habitsCoachResponseSchema,
  type HabitsCoachPayload,
  type HabitsCoachResponse,
} from "../shared/ai/habits-coach";

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
                `headline, overview, momentumLabel, focusHabits, actions, encouragement. ` +
                `الشروط: headline حتى 90 حرفًا، overview حتى 220 حرفًا، momentumLabel حتى 48 حرفًا، ` +
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
