import "server-only";

const FASTAPI_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

async function runGeminiPromptDirect(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          cache: "no-store",
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const payload = (await response.json()) as GeminiResponse;
        const text = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("\n")
          .trim();
        if (text) return text;
      }
    } catch {
      // try next model
    }
  }

  return null;
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
}): Promise<string> {
  // 1. First attempt: call Centralized FastAPI backend AI service
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/ai/explain-signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ward_name: input.wardName,
        ward_number: input.wardNumber,
        disease_name: input.diseaseName,
        current_week_cases: input.currentWeekCases,
        previous_week_cases: input.previousWeekCases,
        growth_rate: input.growthRate,
        risk_level: input.riskLevel.toLowerCase(),
        triggers: input.triggers,
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.explanation) {
        return data.explanation;
      }
    }
  } catch {
    // Backend unreachable, fallback to direct or heuristic
  }

  // 2. Second attempt: Direct Gemini API if frontend has GEMINI_API_KEY
  const directPrompt = `You are helping a municipal public health team explain a ward-level disease surveillance signal.
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
Do not mention AI, patients, personal data, or raw formulas.`;

  const directResult = await runGeminiPromptDirect(directPrompt);
  if (directResult) {
    return directResult;
  }

  // 3. Third attempt: High-quality epidemiological fallback
  const triggerText =
    input.triggers.length > 0
      ? input.triggers.join(", ")
      : "elevated weekly case trends";

  return (
    `${input.wardName} is under active surveillance due to ${triggerText}. ` +
    `The observed ${input.diseaseName} increase of ${input.growthRate}% requires heightened municipal vigilance without public alarm. ` +
    `SMC field health teams are directed to carry out targeted vector checks and local awareness measures.`
  );
}

export async function buildCitizenAlertMessage(input: {
  wardNumber: number;
  diseaseName: string;
  defaultMessage: string;
}): Promise<string> {
  // 1. First attempt: call Centralized FastAPI backend AI service
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/ai/generate-citizen-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ward_number: input.wardNumber,
        disease_name: input.diseaseName,
        default_message: input.defaultMessage,
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.alert_message) {
        return data.alert_message;
      }
    }
  } catch {
    // Backend unreachable, fallback
  }

  // 2. Second attempt: Direct Gemini API
  const directPrompt = `Rewrite the following public health alert for citizens.
Keep it calm, simple, and actionable in exactly 2 sentences.

Disease: ${input.diseaseName}
Ward: ${input.wardNumber}
Draft message: ${input.defaultMessage}

Mention the ward, avoid panic, and include practical prevention advice.
Do not mention personal data, detection models, or unverified claims.`;

  const directResult = await runGeminiPromptDirect(directPrompt);
  if (directResult) {
    return directResult;
  }

  // 3. Third attempt: Calm citizen advisory fallback
  return (
    `Public health notice for Ward ${input.wardNumber}: Health teams are monitoring localized cases of ${input.diseaseName}. ` +
    `Residents are advised to ensure clean drinking water, prevent water stagnation, and consult their nearest SMC clinic upon early symptoms.`
  );
}


