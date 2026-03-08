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
