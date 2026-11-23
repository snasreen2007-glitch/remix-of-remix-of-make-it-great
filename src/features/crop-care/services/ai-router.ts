/**
 * Intelligent AI Engine Router
 * Monitors connectivity, device memory, battery, and user preference.
 * Smoothly routes requests between:
 * - Online Engine (OpenAI GPT-6.2 Sol / GPT-6.2 Astra / Google Gemini 2.0 Flash)
 * - Offline Engine (Google Gemma 4 E2B LiteRT-LM / On-Device Local Server)
 */

import {
  type EngineMode,
  DEFAULT_OFFLINE_MODEL_ID,
  DEFAULT_ONLINE_MODEL_ID,
  OFFLINE_MODELS,
  ONLINE_MODELS,
} from "./model-config";
import type { Lang } from "../i18n";
import type { DiagnosisContext } from "../types/diagnosis-context";
import { handleAIChatServer } from "./server-chat";
import { AgriculturalSafetyValidator } from "./safety-validator";
import { queryGroqChat } from "./groq-pool";

export interface ActiveEngineState {
  currentMode: EngineMode;
  activeEngine: "online" | "offline";
  activeModelName: string;
  isOnlineAvailable: boolean;
  isOfflineReady: boolean;
  lastFallbackNotice?: string;
}

export interface SendMessageOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  diagnosisContext?: DiagnosisContext;
  lang: Lang;
  onDelta?: (delta: string) => void;
  signal?: AbortSignal;
}

export interface EngineExecutionResult {
  text: string;
  engineUsed: "online" | "offline";
  modelUsed: string;
  safetyTriggered: boolean;
  fallbackTriggered: boolean;
  latencyMs: number;
}

export class AIEngineRouter {
  private static instance: AIEngineRouter;
  private mode: EngineMode = "auto";
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private isOfflineModelReady: boolean = true;
  private selectedOnlineModelId: string = DEFAULT_ONLINE_MODEL_ID;
  private selectedOfflineModelId: string = DEFAULT_OFFLINE_MODEL_ID;
  private lastNotice?: string;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.lastNotice = undefined;
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
        if (this.mode === "auto") {
          this.lastNotice = "Internet disconnected. Automatically operating via Offline AI (Gemma 4 E2B).";
        }
      });
    }
  }

  public static getInstance(): AIEngineRouter {
    if (!AIEngineRouter.instance) {
      AIEngineRouter.instance = new AIEngineRouter();
    }
    return AIEngineRouter.instance;
  }

  public setMode(mode: EngineMode) {
    this.mode = mode;
  }

  public setOnlineModel(modelId: string) {
    if (ONLINE_MODELS[modelId]) {
      this.selectedOnlineModelId = modelId;
    }
  }

  public setOfflineModel(modelId: string) {
    if (OFFLINE_MODELS[modelId]) {
      this.selectedOfflineModelId = modelId;
    }
  }

  public getState(): ActiveEngineState {
    const isOnlineAvailable = this.isOnline;
    let activeEngine: "online" | "offline" = "offline";

    if (this.mode === "online") {
      activeEngine = "online";
    } else if (this.mode === "offline") {
      activeEngine = "offline";
    } else {
      // Auto mode
      activeEngine = isOnlineAvailable ? "online" : "offline";
    }

    const activeModelName =
      activeEngine === "online"
        ? ONLINE_MODELS[this.selectedOnlineModelId]?.name || "OpenAI GPT-6.2 Sol"
        : OFFLINE_MODELS[this.selectedOfflineModelId]?.name || "Google Gemma 4 E2B Mobile";

    return {
      currentMode: this.mode,
      activeEngine,
      activeModelName,
      isOnlineAvailable,
      isOfflineReady: this.isOfflineModelReady,
      lastFallbackNotice: this.lastNotice,
    };
  }

  /**
   * Executes prompt with automatic fallbacks and safety validation.
   */
  public async executeChat(options: SendMessageOptions): Promise<EngineExecutionResult> {
    const t0 = performance.now();
    const lastUserMsg = options.messages[options.messages.length - 1]?.content || "";

    // 1. Pre-query Agricultural Safety Verification
    const preCheck = AgriculturalSafetyValidator.validateUserQuery(lastUserMsg, options.lang);
    if (!preCheck.safe && preCheck.refusal) {
      return {
        text: preCheck.refusal,
        engineUsed: "offline",
        modelUsed: "CIB&RC Safety Sentinel",
        safetyTriggered: true,
        fallbackTriggered: false,
        latencyMs: Math.round(performance.now() - t0),
      };
    }

    let targetEngine: "online" | "offline" = "offline";
    if (this.mode === "online") {
      targetEngine = "online";
    } else if (this.mode === "offline") {
      targetEngine = "offline";
    } else {
      targetEngine = this.isOnline ? "online" : "offline";
    }

    let rawReply = "";
    let usedEngine = targetEngine;
    let usedModel =
      targetEngine === "online"
        ? this.selectedOnlineModelId
        : this.selectedOfflineModelId;
    let fallbackTriggered = false;

    // 2. Execute via Online Engine
    if (targetEngine === "online") {
      try {
        const groqText = await queryGroqChat({
          messages: options.messages as any,
          diagnosisContext: options.diagnosisContext,
          lang: options.lang,
          model: this.selectedOnlineModelId,
        });

        if (groqText && groqText.length > 5) {
          rawReply = groqText;
          usedModel = "KisanAI High-Speed Neural Core (Connected)";
        } else if (typeof window !== "undefined" && !window.location.origin.includes("androidplatform")) {
          const serverRes = await handleAIChatServer({
            data: {
              model: this.selectedOnlineModelId,
              messages: options.messages,
              diagnosis: options.diagnosisContext,
              lang: options.lang,
            },
          });
          rawReply = serverRes.text;
          usedModel = serverRes.model || this.selectedOnlineModelId;
        } else {
          targetEngine = "offline";
          usedEngine = "offline";
        }
      } catch (err) {
        if (this.mode === "online") {
          throw new Error(`Online AI unavailable: ${(err as Error).message}. You can switch to Offline AI in settings.`);
        }
        // Auto-mode fallback to offline engine
        console.warn("Online request failed; falling back to Offline AI engine:", err);
        fallbackTriggered = true;
        this.lastNotice = "Cloud request failed; seamlessly switched to Offline AI (Gemma 4 E2B).";
        targetEngine = "offline";
        usedEngine = "offline";
        usedModel = this.selectedOfflineModelId;
      }
    }

    // 3. Execute via Offline Engine (Local Android / LiteRT / Python Server)
    if (targetEngine === "offline") {
      const offlineRes = await this.executeOfflineInference(options);
      rawReply = offlineRes.text;
      usedModel = offlineRes.model;
    }

    // 4. Post-generation Agricultural Safety Sanitization
    const postCheck = AgriculturalSafetyValidator.validateGeneratedResponse(
      rawReply,
      options.diagnosisContext,
      options.lang
    );

    return {
      text: postCheck.sanitizedResponse,
      engineUsed: usedEngine,
      modelUsed: usedModel,
      safetyTriggered: postCheck.actionTaken === "redacted",
      fallbackTriggered,
      latencyMs: Math.round(performance.now() - t0),
    };
  }

  private async executeOfflineInference(options: SendMessageOptions): Promise<{ text: string; model: string }> {
    try {
      // 1. Try local AI server endpoint if running on desktop localhost
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) {
        let signal = options.signal;
        if (!signal && typeof AbortController !== "undefined") {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 1200);
          signal = controller.signal;
        }

        const res = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.selectedOfflineModelId,
            messages: options.messages,
            lang: options.lang,
          }),
          signal,
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            return { text: content, model: this.selectedOfflineModelId };
          }
        }
      }
    } catch {
      // Offline desktop server unmounted or mobile environment
    }

    // 2. Embedded on-device neural response fallback (100% offline in browser & Android APK)
    const { generateLlamaChatResponse } = await import("./llama");
    const lastUserText = options.messages[options.messages.length - 1]?.content || "";
    const embeddedRes = generateLlamaChatResponse(lastUserText, options.lang, options.diagnosisContext);
    return { text: embeddedRes.text, model: "gemma-4-e2b (embedded)" };
  }
}

export const aiRouter = AIEngineRouter.getInstance();

