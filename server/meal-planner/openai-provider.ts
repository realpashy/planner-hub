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
} from "@shared/ai/ai-types";
import { buildDayRegenerationPrompt, buildMealEditPrompt, buildWeeklyGenerationPrompt } from "./prompts";
import { getPlanTierConfig } from "@shared/plans/feature-access";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MEAL_MODEL = process.env.OPENAI_MEAL_MODEL || "gpt-5-mini";

type JsonSchemaName = "weekly_plan" | "single_day" | "single_meal";

function getJsonSchema(name: JsonSchemaName) {
  if (name === "single_day") {
    return {
      name,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          dateISO: { type: "string" },
          meals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                mealType: { type: "string" },
                title: { type: "string" },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                tags: { type: "array", items: { type: "string" } },
                ingredients: { type: "array", items: { type: "string" } },
                shortNote: { type: "string" },
                image: { type: "string" },
                imageType: { type: "string" },
                imageSource: { type: "string" },
              },
              required: ["mealType", "title", "calories", "protein", "carbs", "fat", "tags", "ingredients", "shortNote", "image", "imageType", "imageSource"],
            },
          },
          waterTargetCups: { type: "number" },
          notes: { type: "string" },
        },
        required: ["dateISO", "meals", "waterTargetCups", "notes"],
      },
    };
  }

  if (name === "single_meal") {
    return {
      name,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          mealType: { type: "string" },
          title: { type: "string" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
          ingredients: { type: "array", items: { type: "string" } },
          shortNote: { type: "string" },
          image: { type: "string" },
          imageType: { type: "string" },
          imageSource: { type: "string" },
        },
        required: ["mealType", "title", "calories", "protein", "carbs", "fat", "tags", "ingredients", "shortNote", "image", "imageType", "imageSource"],
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
              meals: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    mealType: { type: "string" },
                    title: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    tags: { type: "array", items: { type: "string" } },
                    ingredients: { type: "array", items: { type: "string" } },
                    shortNote: { type: "string" },
                    image: { type: "string" },
                    imageType: { type: "string" },
                    imageSource: { type: "string" },
                  },
                  required: ["mealType", "title", "calories", "protein", "carbs", "fat", "tags", "ingredients", "shortNote", "image", "imageType", "imageSource"],
                },
              },
              waterTargetCups: { type: "number" },
              notes: { type: "string" },
            },
            required: ["dateISO", "meals", "waterTargetCups", "notes"],
          },
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

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MEAL_MODEL,
      messages: [
        {
          role: "system",
          content: "You are Planner Hub meal planner AI. Output JSON only, compact, practical, no prose outside the schema.",
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
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = body.choices?.[0]?.message?.content ?? "";
  const parsed = validator.parse(JSON.parse(content));
  return {
    data: parsed,
    usage: {
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
    } satisfies AiProviderUsage,
  };
}

export async function generateWeeklyPlanAI(input: GenerateWeekAiInput) {
  const prompt = buildWeeklyGenerationPrompt(
    input.userContext,
    input.preferences,
    getPlanTierConfig(input.userContext.tier).access,
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
