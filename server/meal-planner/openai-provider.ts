import { z } from "zod";
import {
  aiDaySchema,
  aiMealSchema,
  aiWeekPlanSchema,
  type AiDayPlan,
  type AiMeal,
  type AiProviderUsage,
  type EditMealAiInput,
  type GenerateWeekAiInput,
  type RegenerateDayAiInput,
} from "../../shared/ai/ai-types.ts";
import { buildDayRegenerationPrompt, buildMealEditPrompt, buildWeeklyGenerationPrompt } from "./prompts.ts";
import { getPlanTierConfig } from "../../shared/plans/feature-access.ts";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MEAL_MODEL = process.env.OPENAI_MEAL_MODEL || "gpt-5-mini";

type JsonSchemaName = "weekly_plan" | "single_day" | "single_meal";

function extractMessageContent(message: unknown) {
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item && typeof (item as { text?: unknown }).text === "string") {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

function normalizeMealTypeValue(value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  const mealTypeMap: Record<string, string> = {
    breakfast: "breakfast",
    lunch: "lunch",
    dinner: "dinner",
    snack: "snack",
    snacks: "snack",
    "فطور": "breakfast",
    "إفطار": "breakfast",
    "افطار": "breakfast",
    "غداء": "lunch",
    "عشاء": "dinner",
    "سناك": "snack",
    "وجبة خفيفة": "snack",
  };
  return mealTypeMap[normalized] ?? value;
}

function normalizeAiJsonShape(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(normalizeAiJsonShape);
  if (!input || typeof input !== "object") return input;

  return Object.entries(input as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key === "mealType") {
      acc[key] = normalizeMealTypeValue(value);
    } else {
      acc[key] = normalizeAiJsonShape(value);
    }
    return acc;
  }, {});
}

function getMealProperties() {
  return {
    mealType: { type: "string" },
    title: { type: "string", maxLength: 56 },
    ingredients: { type: "array", items: { type: "string", maxLength: 32 }, maxItems: 6 },
    steps: { type: "array", items: { type: "string", maxLength: 56 }, maxItems: 2 },
    calories: { type: "number" },
    protein: { type: "number" },
    carbs: { type: "number" },
    fat: { type: "number" },
    reason: { type: "string", maxLength: 120 },
  };
}

function getMealRequiredFields() {
  return ["mealType", "title", "ingredients", "steps", "calories", "protein", "carbs", "fat", "reason"] as const;
}

function getJsonSchema(name: JsonSchemaName) {
  if (name === "single_day") {
    return {
      name,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          dateISO: { type: "string" },
          tip: { type: "string" },
          waterTargetCups: { type: "number" },
          meals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: getMealProperties(),
              required: [...getMealRequiredFields()],
            },
            minItems: 1,
            maxItems: 5,
          },
        },
        required: ["dateISO", "tip", "waterTargetCups", "meals"],
      },
    };
  }

  if (name === "single_meal") {
    return {
      name,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: getMealProperties(),
        required: [...getMealRequiredFields()],
      },
    };
  }

  return {
    name,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        days: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              dateISO: { type: "string" },
              tip: { type: "string" },
              waterTargetCups: { type: "number" },
              meals: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: getMealProperties(),
                  required: [...getMealRequiredFields()],
                },
                minItems: 1,
                maxItems: 5,
              },
            },
            required: ["dateISO", "tip", "waterTargetCups", "meals"],
          },
          minItems: 1,
          maxItems: 7,
        },
      },
      required: ["summary", "days"],
    },
  };
}

async function requestStructuredJson<T>({
  prompt,
  schemaName,
  validator,
}: {
  prompt: string;
  schemaName: JsonSchemaName;
  validator: z.ZodType<T>;
}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  let lastError: Error | null = null;
  const completionBudgets =
    schemaName === "weekly_plan"
      ? [3200, 5200]
      : schemaName === "single_day"
        ? [1400, 2400]
        : [700, 1200];

  for (let attempt = 0; attempt < completionBudgets.length; attempt += 1) {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_MEAL_MODEL,
        max_completion_tokens: completionBudgets[attempt],
        messages: [
          {
            role: "system",
            content: "You are Planner Hub meal planner AI. Return compact JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            ...getJsonSchema(schemaName),
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${await response.text()}`);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: unknown; finish_reason?: string | null }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    try {
      const content = extractMessageContent(body.choices?.[0]?.message);
      if (!content) {
        const finishReason = body.choices?.[0]?.finish_reason ?? "unknown";
        throw new Error(`OpenAI returned empty JSON content (finish_reason: ${finishReason}).`);
      }

      const parsed = validator.parse(normalizeAiJsonShape(JSON.parse(content)));
      return {
        data: parsed,
        usage: {
          inputTokens: body.usage?.prompt_tokens ?? 0,
          outputTokens: body.usage?.completion_tokens ?? 0,
        } satisfies AiProviderUsage,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(`OpenAI structured JSON parsing failed: ${lastError?.message ?? "unknown error"}`);
}

export async function generateWeeklyPlanAI(input: GenerateWeekAiInput) {
  const prompt = buildWeeklyGenerationPrompt(
    input.userContext,
    input.preferences,
    getPlanTierConfig(input.userContext.tier).access,
    input.activeDates,
  );
  const result = await requestStructuredJson({
    prompt,
    schemaName: "weekly_plan",
    validator: aiWeekPlanSchema,
  });
  return { plan: result.data, usage: result.usage };
}

export async function editMealAI(input: EditMealAiInput) {
  const result = await requestStructuredJson({
    prompt: buildMealEditPrompt(input.existingMeal, input.editRequest, input.userContext),
    schemaName: "single_meal",
    validator: aiMealSchema,
  });
  return { meal: result.data as AiMeal, usage: result.usage };
}

export async function regenerateDayAI(input: RegenerateDayAiInput) {
  const result = await requestStructuredJson({
    prompt: buildDayRegenerationPrompt(input.existingDay, input.userContext, input.preferences),
    schemaName: "single_day",
    validator: aiDaySchema,
  });
  return { day: result.data as AiDayPlan, usage: result.usage };
}
