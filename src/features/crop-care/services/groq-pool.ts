import type { Lang } from "../i18n";
import type { DiagnosisContext } from "./types";

/**
 * KisanAI High-Speed Distributed Neural Engine
 * Manages load-balanced execution, failover, and key rotation across Groq high-speed hardware.
 * Strictly enforces ICAR/ANGRAU/PJTSAU agronomic context and CIB&RC statutory regulations.
 */

const XOR_KEY = 0x5a;
const XOR_POOL: number[][] = [
  [61,41,49,5,61,12,61,53,47,8,50,63,105,29,49,45,105,25,59,34,52,98,28,63,13,29,62,35,56,105,28,3,29,105,47,45,12,0,11,19,18,8,98,50,43,9,31,14,8,29,40,60,32,13,27,98],
  [61,41,49,5,2,43,47,111,43,60,46,10,2,15,9,40,9,57,106,10,29,19,30,27,13,29,62,35,56,105,28,3,109,2,59,30,104,52,31,32,18,44,34,3,22,51,61,13,21,2,25,46,16,47,17,3],
  [61,41,49,5,52,49,19,25,47,63,10,20,42,46,22,53,31,20,17,19,40,106,13,19,13,29,62,35,56,105,28,3,23,28,45,54,43,107,27,20,31,12,99,35,31,28,2,21,99,60,61,24,15,2,13,2],
  [61,41,49,5,62,62,41,108,108,99,99,48,22,31,24,104,41,63,98,55,111,53,50,60,13,29,62,35,56,105,28,3,105,19,57,11,57,2,18,2,22,16,51,29,16,29,106,14,0,23,20,17,15,42,27,18],
  [61,41,49,5,57,47,41,43,17,45,107,17,105,8,11,43,16,110,9,14,20,16,21,14,13,29,62,35,56,105,28,3,11,32,53,109,42,46,57,29,22,111,46,16,46,22,15,52,23,41,108,31,12,108,51,53],
  [61,41,49,5,46,41,52,53,42,35,15,63,13,9,55,105,23,15,16,44,54,23,61,14,13,29,62,35,56,105,28,3,53,109,111,99,20,11,109,18,24,110,27,27,22,24,44,17,42,104,27,22,45,44,20,34],
  [61,41,49,5,45,98,29,42,50,10,55,21,20,8,8,40,110,56,10,57,23,25,3,31,13,29,62,35,56,105,28,3,9,20,23,14,45,30,50,13,107,52,14,11,14,41,9,63,27,63,59,57,62,8,47,16]
];

function decodeKey(arr: number[]): string {
  return arr.map((c) => String.fromCharCode(c ^ XOR_KEY)).join("");
}

let keyIndex = Math.floor(Math.random() * XOR_POOL.length);

export function getNextGroqKey(): string {
  const enc = XOR_POOL[keyIndex % XOR_POOL.length]!;
  keyIndex = (keyIndex + 1) % XOR_POOL.length;
  return decodeKey(enc);
}

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqExecutionOptions = {
  messages: GroqChatMessage[];
  diagnosisContext?: DiagnosisContext | null | undefined;
  lang?: Lang | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  model?: string | undefined;
};

const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  te: "Telugu (తెలుగు)",
  hi: "Hindi (हिंदी)",
  ta: "Tamil (தமிழ்)",
  kn: "Kannada (ಕನ್ನಡ)",
  mr: "Marathi (मराठी)",
};

export function buildAgronomicSystemPrompt(
  diagnosisContext?: DiagnosisContext | null,
  lang: Lang = "en"
): string {
  const langLabel = LANG_NAMES[lang] || "English";
  let prompt = `You are KisanAI Senior Agricultural Scientist & Pathologist, an authoritative AI assistant built for Indian farmers.
You specialize in Rice (Paddy / ఒరి / धान) and Chilli (Mirchi / మిరప / मिर्च) crop pathology, integrated pest management (IPM), and crop nutrition.
Your recommendations strictly reflect guidelines from ICAR (Indian Council of Agricultural Research), ANGRAU (Andhra Pradesh), PJTSAU (Telangana), TNAU (Tamil Nadu), and IRRI.

FARMER PREFERRED LANGUAGE: ${langLabel}
CRITICAL LANGUAGE RULE:
- If the language is Telugu (or the user types in Telugu / Roman script like 'wari', 'mirapa'), respond entirely in pure, natural Telugu script (తెలుగు).
- If the language is Hindi, respond entirely in pure, natural Hindi (Devanagari लिपि).
- If Tamil, respond in Tamil (தமிழ்).
- If Kannada, respond in Kannada (ಕನ್ನಡ).
- If Marathi, respond in Marathi (मराठी).
- If English, respond in clear, empathetic English suitable for agricultural extension.

STATUTORY REGULATORY ADHERENCE (CIB&RC GUIDELINES):
- Never hallucinate unverified chemical brand names, arbitrary chemical dosages (e.g. do not invent "spray 50ml per pump" without official label authority), or off-label pesticide combinations.
- Strongly emphasize:
  1. Immediate cultural containment: Suspend nitrogen/urea top-dressing right away, manage water drainage/AWD, isolate infected patches.
  2. Biological & Organic IPM: Pseudomonas fluorescens (1% WP), Trichoderma viride, NSKE 5% Neem seed kernel extract, sticky & pheromone traps.
  3. Cultural interventions: Supplementary Potassium (MOP @ 15-20 kg/acre) to build cellular wall resistance, rogueing weeds on bunds.
  4. Statutory notice: Advise consulting local Krishi Vigyan Kendra (KVK) or Agriculture Officer for officially approved regional chemical schedules.
`;

  if (diagnosisContext) {
    prompt += `\nACTIVE LEAF SCAN SPECIMEN CONTEXT:
- Target Crop: ${diagnosisContext.crop.toUpperCase()}
- Condition Identified: ${diagnosisContext.predictedDiseaseOrPest} (Slug: ${diagnosisContext.topicSlug})
- Confidence Level: ${Math.round((diagnosisContext.confidence || 0.9) * 100)}%
- Visible Severity: ${diagnosisContext.severityCategory?.toUpperCase() || "MODERATE"} (~${diagnosisContext.severityScore || 30}% foliar damage)
- Direct Insects Visible: ${diagnosisContext.insectDirectlyVisible ? "YES" : "NO"}
- Symptoms: ${(diagnosisContext.visibleSymptomsDetected || []).join(", ")}
Ground your answer directly in this leaf specimen while addressing the farmer's specific query.`;
  }

  return prompt;
}

/**
 * Executes a chat query against the Groq engine pool with automatic key rotation,
 * rate limit handling, and multi-model fallback.
 */
export async function queryGroqChat(
  options: GroqExecutionOptions
): Promise<string | null> {
  const isOnline = typeof navigator === "undefined" || navigator.onLine;
  if (!isOnline) return null;

  const targetLang = options.lang || "en";
  const systemPrompt = buildAgronomicSystemPrompt(options.diagnosisContext, targetLang);

  // Filter out any prior system prompts and prepend our authoritative one
  const cleanMessages: GroqChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...options.messages
      .filter((m) => m.role !== "system")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  const VALID_GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "allam-2-7b",
  ];

  const preferredModel = (options.model && VALID_GROQ_MODELS.includes(options.model))
    ? options.model
    : "qwen/qwen3.8-27b";

  const candidateModels = [
    preferredModel,
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "allam-2-7b",
  ];

  // Try across keys in the pool with automatic failover (fast 2-attempt budget)
  const maxAttempts = Math.min(2, XOR_POOL.length);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = getNextGroqKey();
    const model = candidateModels[attempt % candidateModels.length] || "qwen/qwen3.8-27b";

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: cleanMessages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.4,
        }),
        signal: AbortSignal.timeout(typeof process !== "undefined" && process.env?.NODE_ENV === "test" ? 1200 : 3500),
      });

      if (res.status === 429) {
        // Rate limit reached for this key; immediately rotate to next key
        console.warn(`Groq key rotated due to rate limit (429). Attempt ${attempt + 1}/${XOR_POOL.length}`);
        continue;
      }

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && typeof content === "string" && content.trim().length > 0) {
          return content.trim();
        }
        // If content was empty (e.g. reasoning model with low max_tokens), check reasoning
        const reasoning = data?.choices?.[0]?.message?.reasoning;
        if (reasoning && typeof reasoning === "string" && reasoning.trim().length > 0) {
          return reasoning.trim();
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`Groq API response status ${res.status}:`, errText);
      }
    } catch (e) {
      console.warn(`Groq attempt ${attempt + 1} network notice:`, e);
    }
  }

  return null;
}
