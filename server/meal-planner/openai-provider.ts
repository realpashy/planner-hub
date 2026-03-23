import { z } from "zod";
import {
  aiDaySchema,
  aiGroceryGroupSchema,
  aiMealSchema,
  aiWeekPlanSchema,
  type AiDayPlan,
  type AiGroceryGroup,
  type AiMeal,
  type AiProviderUsage,
  type EditMealAiInput,
  type GenerateWeekAiInput,
  type RegenerateDayAiInput,
} from "../../shared/ai/ai-types.ts";
import {
  buildDayRegenerationPrompt,
  buildGroceryOrganizationPrompt,
  buildMealEditPrompt,
  buildSingleDayGenerationPrompt,
  buildWeeklyGenerationPrompt,
} from "./prompts.ts";
import { getPlanTierConfig } from "../../shared/plans/feature-access.ts";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MEAL_MODEL = process.env.OPENAI_MEAL_MODEL || "gpt-5-mini";
const OPENAI_REQUEST_TIMEOUT_MS = 30_000;
const SINGLE_DAY_WEEKLY_TIMEOUT_MS = 15_000;
const WEEKLY_DAY_BATCH_SIZE = 3;

type JsonSchemaName = "weekly_plan" | "single_day" | "single_meal" | "grocery_groups";
type WeeklyGenerationProgress = {
  stage: string;
  message: string;
  dayIndex?: number;
  totalDays?: number;
  dateISO?: string;
};

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

  if (name === "grocery_groups") {
    return {
      name,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          grocery: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                key: { type: "string", enum: ["produce", "dairy_fridge", "meats", "pantry", "bakery", "frozen", "snacks", "spices"] },
                title: { type: "string", maxLength: 32 },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      key: { type: "string", maxLength: 48 },
                      label: { type: "string", maxLength: 48 },
                      quantity: { type: "string", maxLength: 32 },
                    },
                    required: ["key", "label", "quantity"],
                  },
                  maxItems: 32,
                },
              },
              required: ["key", "title", "items"],
            },
            maxItems: 8,
          },
        },
        required: ["grocery"],
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
        grocery: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              key: { type: "string", enum: ["produce", "dairy_fridge", "meats", "pantry", "bakery", "frozen", "snacks", "spices"] },
              title: { type: "string", maxLength: 32 },
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    key: { type: "string", maxLength: 48 },
                    label: { type: "string", maxLength: 48 },
                    quantity: { type: "string", maxLength: 32 },
                  },
                  required: ["key", "label", "quantity"],
                },
                maxItems: 32,
              },
            },
            required: ["key", "title", "items"],
          },
          maxItems: 8,
        },
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
  timeoutMs,
}: {
  prompt: string;
  schemaName: JsonSchemaName;
  validator: z.ZodType<T>;
  timeoutMs?: number;
}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  let lastError: Error | null = null;
  const completionBudgets =
    schemaName === "weekly_plan"
      ? [2400, 3400]
      : schemaName === "grocery_groups"
        ? [700, 1100]
      : schemaName === "single_day"
        ? [1100, 1500]
        : [650, 900];

  for (let attempt = 0; attempt < completionBudgets.length; attempt += 1) {
    const requestStartedAt = Date.now();
    let response: Response;

    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        signal: AbortSignal.timeout(timeoutMs ?? OPENAI_REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          model: OPENAI_MEAL_MODEL,
          reasoning_effort: "minimal",
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
    } catch (error) {
      lastError = new Error(
        error instanceof Error && error.name === "TimeoutError"
          ? `OpenAI request timed out after ${(timeoutMs ?? OPENAI_REQUEST_TIMEOUT_MS) / 1000}s.`
          : error instanceof Error
            ? error.message
            : String(error),
      );
      continue;
    }

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
        meta: {
          elapsedMs: Date.now() - requestStartedAt,
          completionBudget: completionBudgets[attempt],
          attempts: attempt + 1,
          model: OPENAI_MEAL_MODEL,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const finishReason = body.choices?.[0]?.finish_reason ?? "unknown";
      const shouldRetryForLength = attempt < completionBudgets.length - 1 && finishReason === "length";
      if (shouldRetryForLength) {
        continue;
      }
    }
  }

  throw new Error(`OpenAI structured JSON parsing failed: ${lastError?.message ?? "unknown error"}`);
}

function buildWeeklySummary(days: AiDayPlan[], preferences: Record<string, unknown>) {
  const totalCalories = days.reduce((sum, day) => sum + day.meals.reduce((mealSum, meal) => mealSum + meal.calories, 0), 0);
  const averageCalories = days.length ? Math.round(totalCalories / days.length) : 0;
  const mealsPerDay = typeof preferences.mealsPerDay === "number" ? preferences.mealsPerDay : 3;
  const summary = `خطة ${days.length} أيام بمتوسط ${averageCalories} kcal و${mealsPerDay} وجبات يوميًا.`;
  return summary.slice(0, 220);
}

async function generateSingleDayFromScratch(input: GenerateWeekAiInput, dateISO: string) {
  const result = await requestStructuredJson({
    prompt: buildSingleDayGenerationPrompt(dateISO, input.userContext, input.preferences, input.activeDates),
    schemaName: "single_day",
    validator: aiDaySchema,
    timeoutMs: SINGLE_DAY_WEEKLY_TIMEOUT_MS,
  });

  return {
    day: aiDaySchema.parse({
      ...result.data,
      dateISO,
    }) as AiDayPlan,
    usage: result.usage,
    meta: result.meta,
  };
}

export async function organizeGroceryAIFromDays(days: AiDayPlan[], userContext: GenerateWeekAiInput["userContext"]) {
  const result = await requestStructuredJson({
    prompt: buildGroceryOrganizationPrompt(
      days.map((day) => ({
        dateISO: day.dateISO,
        meals: day.meals.map((meal) => ({
          mealType: meal.mealType,
          title: meal.title,
          ingredients: meal.ingredients,
        })),
      })),
      userContext,
    ),
    schemaName: "grocery_groups",
    validator: z.object({
      grocery: z.array(aiGroceryGroupSchema).max(8).default([]),
    }),
    timeoutMs: 12_000,
  });

  return {
    grocery: result.data.grocery as AiGroceryGroup[],
    usage: result.usage,
    meta: result.meta,
  };
}

async function runWeeklyDayBatches(
  input: GenerateWeekAiInput,
  onProgress?: (progress: WeeklyGenerationProgress) => Promise<void> | void,
) {
  const wallStartedAt = Date.now();
  const days: AiDayPlan[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let completionBudget = 0;

  for (let index = 0; index < input.activeDates.length; index += WEEKLY_DAY_BATCH_SIZE) {
    const batch = input.activeDates.slice(index, index + WEEKLY_DAY_BATCH_SIZE);
    await onProgress?.({
      stage: "weekly_batch_started",
      message: `Starting batch ${Math.floor(index / WEEKLY_DAY_BATCH_SIZE) + 1} for ${batch.join(", ")}`,
      dayIndex: index + 1,
      totalDays: input.activeDates.length,
      dateISO: batch[0],
    });

    const batchResults = await Promise.all(
      batch.map(async (dateISO, batchIndex) => {
        await onProgress?.({
          stage: "weekly_day_started",
          message: `Generating ${dateISO}`,
          dayIndex: index + batchIndex + 1,
          totalDays: input.activeDates.length,
          dateISO,
        });
        const result = await generateSingleDayFromScratch(input, dateISO);
        await onProgress?.({
          stage: "weekly_day_completed",
          message: `Completed ${dateISO} in ${result.meta.elapsedMs}ms (${result.usage.inputTokens}/${result.usage.outputTokens} tokens)`,
          dayIndex: index + batchIndex + 1,
          totalDays: input.activeDates.length,
          dateISO,
        });
        return result;
      }),
    );

    for (const result of batchResults) {
      days.push(result.day);
      inputTokens += result.usage.inputTokens;
      outputTokens += result.usage.outputTokens;
      completionBudget = Math.max(completionBudget, result.meta.completionBudget);
    }

    await onProgress?.({
      stage: "weekly_batch_completed",
      message: `Finished batch ${Math.floor(index / WEEKLY_DAY_BATCH_SIZE) + 1}`,
      dayIndex: Math.min(index + batch.length, input.activeDates.length),
      totalDays: input.activeDates.length,
      dateISO: batch[batch.length - 1],
    });
  }

  return {
    plan: aiWeekPlanSchema.parse({
      summary: buildWeeklySummary(days, input.preferences),
      insights: [],
      days,
    }),
    usage: {
      inputTokens,
      outputTokens,
    } satisfies AiProviderUsage,
    meta: {
      elapsedMs: Date.now() - wallStartedAt,
      completionBudget,
      attempts: days.length,
      model: OPENAI_MEAL_MODEL,
    },
  };
}

export async function generateWeeklyPlanAI(
  input: GenerateWeekAiInput,
  options?: {
    onProgress?: (progress: WeeklyGenerationProgress) => Promise<void> | void;
  },
) {
  const activeDates = input.activeDates.slice(0, 7);
  const compactInput = {
    ...input,
    activeDates,
  };

  await options?.onProgress?.({
    stage: "weekly_generation_started",
    message: `Starting weekly generation for ${activeDates.length} day(s)`,
    dayIndex: 0,
    totalDays: activeDates.length,
  });

  const tierAccess = getPlanTierConfig(compactInput.userContext.tier).access;
  if (activeDates.length <= 2 && tierAccess.mealPlanner.smartOptimization) {
    const prompt = buildWeeklyGenerationPrompt(
      compactInput.userContext,
      compactInput.preferences,
      tierAccess,
      activeDates,
    );
    const result = await requestStructuredJson({
      prompt,
      schemaName: "weekly_plan",
      validator: aiWeekPlanSchema,
    });
    await options?.onProgress?.({
      stage: "weekly_generation_completed",
      message: `Completed compact weekly generation in ${result.meta.elapsedMs}ms`,
      dayIndex: activeDates.length,
      totalDays: activeDates.length,
      dateISO: activeDates[activeDates.length - 1],
    });
    const groceryResult = await organizeGroceryAIFromDays(result.data.days as AiDayPlan[], compactInput.userContext);
    return {
      plan: aiWeekPlanSchema.parse({
        ...result.data,
        grocery: groceryResult.grocery,
      }),
      usage: {
        inputTokens: result.usage.inputTokens + groceryResult.usage.inputTokens,
        outputTokens: result.usage.outputTokens + groceryResult.usage.outputTokens,
      },
      meta: {
        ...result.meta,
        elapsedMs: result.meta.elapsedMs + groceryResult.meta.elapsedMs,
        completionBudget: Math.max(result.meta.completionBudget, groceryResult.meta.completionBudget),
        attempts: result.meta.attempts + groceryResult.meta.attempts,
      },
    };
  }

  const result = await runWeeklyDayBatches(compactInput, options?.onProgress);
  const groceryResult = await organizeGroceryAIFromDays(result.plan.days as AiDayPlan[], compactInput.userContext);
  await options?.onProgress?.({
    stage: "weekly_generation_completed",
    message: `Completed weekly generation in ${result.meta.elapsedMs}ms`,
    dayIndex: activeDates.length,
    totalDays: activeDates.length,
    dateISO: activeDates[activeDates.length - 1],
  });
  return {
    plan: aiWeekPlanSchema.parse({
      ...result.plan,
      grocery: groceryResult.grocery,
    }),
    usage: {
      inputTokens: result.usage.inputTokens + groceryResult.usage.inputTokens,
      outputTokens: result.usage.outputTokens + groceryResult.usage.outputTokens,
    },
    meta: {
      ...result.meta,
      elapsedMs: result.meta.elapsedMs + groceryResult.meta.elapsedMs,
      completionBudget: Math.max(result.meta.completionBudget, groceryResult.meta.completionBudget),
      attempts: result.meta.attempts + groceryResult.meta.attempts,
    },
  };
}

export async function editMealAI(input: EditMealAiInput) {
  const result = await requestStructuredJson({
    prompt: buildMealEditPrompt(input.existingMeal, input.editRequest, input.userContext),
    schemaName: "single_meal",
    validator: aiMealSchema,
  });
  return { meal: result.data as AiMeal, usage: result.usage, meta: result.meta };
}

export async function regenerateDayAI(input: RegenerateDayAiInput) {
  const result = await requestStructuredJson({
    prompt: buildDayRegenerationPrompt(input.existingDay, input.userContext, input.preferences),
    schemaName: "single_day",
    validator: aiDaySchema,
  });
  return { day: result.data as AiDayPlan, usage: result.usage, meta: result.meta };
}
