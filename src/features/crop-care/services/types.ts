import type { CropKey, Mode } from "../knowledge";
import type { Lang } from "../i18n";

export type Band = "mild" | "moderate" | "severe";
export type SeverityScale = "irri-ses" | "area-band" | "leaf-curl-index";

export type QualityCheckId = "blur" | "dark" | "subject" | "suitability" | "leaf";
export type QualityCheck = { id: QualityCheckId; pass: boolean; tip: string };
export type QualityReport = { ok: boolean; checks: QualityCheck[]; brightness: number; sharpness: number; contrast: number; greenShare: number };

export type SeverityResult = { scale: SeverityScale; score: number; max: number; band: Band; areaPercent?: number };

/**
 * where the result came from:
 * - model: the native on-device model produced it
 * - sample: clearly-labelled demo data (no model was run)
 * - none: photo saved without any analysis
 */
export type ResultSource = "model" | "sample" | "none";
export type Outcome = "identified" | "unknown" | "unanalysed";

export type DynamicCurePlan = {
  model: string;
  generatedAt: number;
  immediate: string[];
  biological: string[];
  cultural: string[];
  statutory: string;
  markdownNarrative?: string;
};

export type PestAnalysis = {
  detectedPest?: string;
  pestConfidence?: number;
  visibleDamage?: string;
  countRange?: string;
};

export type NutritionAnalysis = {
  suspectedDeficiency?: string;
  deficiencyConfidence?: number;
  guidance?: string;
  isConfirmed?: boolean;
};

export type CropMismatch = {
  detectedCrop: CropKey;
  expectedCrop: CropKey;
  confidence: number;
  message: string;
};

export type Scan = {
  id: string;
  crop: CropKey;
  mode: Mode;
  createdAt: string;
  image: string;
  source: ResultSource;
  outcome: Outcome;
  topicSlug?: string;
  slug?: string;
  name?: string;
  severityBand?: Band;
  timestamp?: number;
  confidence?: number;
  confidenceStatus?: "calibrated" | "calibrated_uncertain" | "unreliable_input";
  visibleEvidence?: string[];
  insectDirectlyVisible?: boolean;
  severityMethod?: string;
  candidates?: { slug: string; confidence: number }[];
  severity?: SeverityResult;
  pestAnalysis?: PestAnalysis;
  nutritionAnalysis?: NutritionAnalysis;
  cropMismatch?: CropMismatch;
  quality?: QualityReport;
  curePlan?: DynamicCurePlan;
  note?: string;
  diagnostics?: {
    plantPixels?: number;
    lesionPixels?: number;
    affectedPercent?: number;
    isCropValid?: boolean;
    pattern?: string;
    [key: string]: any;
  };
};

export type SavedKind = "topic" | "treatment" | "prevention" | "report";
export type SavedItem = { id: string; kind: SavedKind; crop: CropKey; slug?: string; scanId?: string; savedAt: string; title?: string };

export type Season = "kharif" | "rabi" | "zaid" | "early-kharif" | "post-monsoon";
export type ThemePref = "dark" | "light" | "system";
export type LLMProvider = "auto" | "gemini" | "groq" | "openai" | "ollama" | "local";

export type Settings = {
  onboarded: boolean;
  name: string;
  lang: Lang;
  theme: ThemePref;
  state: string;
  district: string;
  season: Season;
  crops: CropKey[];
  llmProvider?: LLMProvider;
  geminiApiKey?: string;
  groqApiKey?: string;
  openaiApiKey?: string;
  customModel?: string;
};

export type Reminder = { id: string; title: string; crop: CropKey; dueDate: string; createdAt: string; done: boolean };
export type LocalEvent = { id: string; kind: "scan-saved" | "advisory-saved" | "report-prepared"; label: string; at: string; link?: string };

export type ChatMessage = {
  id: string;
  role: "farmer" | "assistant";
  text: string;
  refs?: { crop: CropKey; slug: string }[];
  safety?: boolean;
  timestamp?: number;
  suggestions?: string[];
};

export type ModelState = "installed" | "unavailable" | "error";
export type ModelStatusItem = {
  id:
    | "vision-rice"
    | "vision-chilli"
    | "vision-pest-specialist"
    | "opencv-severity"
    | "llm"
    | "database"
    | "runtime";
  label: string;
  detail: string;
  state: ModelState;
  version?: string;
  sizeMb?: number;
};
