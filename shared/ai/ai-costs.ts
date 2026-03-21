export const AI_PRICING = {
  inputPerMillion: 0.25,
  outputPerMillion: 2.0,
} as const;

export function estimateAiCostUsd(inputTokens: number, outputTokens: number) {
  return Number(
    (
      (inputTokens / 1_000_000) * AI_PRICING.inputPerMillion +
      (outputTokens / 1_000_000) * AI_PRICING.outputPerMillion
    ).toFixed(6),
  );
}
