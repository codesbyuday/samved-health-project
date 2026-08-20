import "server-only";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

async function runGeminiPrompt(prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GeminiResponse;

  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() || null
  );
}

export async function generateGeminiOutbreakExplanation(input: {
  wardName: string;
  wardNumber: number;
  diseaseName: string;
  currentWeekCases: number;
  previousWeekCases: number;
  growthRate: number;
  riskLevel: string;
  triggers: string[];
}) {
  return runGeminiPrompt(`You are helping a municipal public health team explain a ward-level disease surveillance signal.
Write exactly 3 short sentences in plain language.

Ward: ${input.wardName} (${input.wardNumber})
Disease: ${input.diseaseName}
Current week cases: ${input.currentWeekCases}
Previous week cases: ${input.previousWeekCases}
Growth rate: ${input.growthRate}%
Risk level: ${input.riskLevel}
Detected triggers: ${input.triggers.join(", ") || "none"}

Sentence 1: why the ward is being monitored.
Sentence 2: how urgent the situation is without causing panic.
Sentence 3: one practical SMC response step.
Do not mention AI, patients, personal data, or raw formulas.`);
}

export async function buildCitizenAlertMessage(input: {
  wardNumber: number;
  diseaseName: string;
  defaultMessage: string;
}) {
  const generated = await runGeminiPrompt(`Rewrite the following public health alert for citizens.
Keep it calm, simple, and actionable in exactly 2 sentences.

Disease: ${input.diseaseName}
Ward: ${input.wardNumber}
Draft message: ${input.defaultMessage}

Mention the ward, avoid panic, and include practical prevention advice.
Do not mention personal data, detection models, or unverified claims.`);

  return generated ?? input.defaultMessage;
}

