/**
 * Multilingual Voice Agent & Speech Synthesizer for KisanAI
 *
 * Provides resilient, offline-ready vernacular speech across all 6 regional languages:
 * Telugu (te), Hindi (hi), Tamil (ta), Kannada (kn), Marathi (mr), and English (en).
 *
 * Tier 1: Native Android TextToSpeech via window.CropAssistantAndroid bridge.
 * Tier 2: Web Speech API with regional voice auto-discovery across candidate tags & script names.
 * Tier 3: Indic Phonetic Transliteration Fallback Engine to guarantee audible playback
 *         even on Windows/Chromium environments lacking installed regional voice packs.
 */

import type { Lang } from "../i18n";

export interface VoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  activeText: string | null;
  supported: boolean;
  engine: "native" | "web-vernacular" | "web-phonetic" | "idle";
  activeLang: Lang;
}

const BCP47_LANG_TAGS: Record<Lang, string[]> = {
  en: ["en-IN", "en-GB", "en-US", "en"],
  hi: ["hi-IN", "hi-Deva", "hi"],
  te: ["te-IN", "te-Telu", "te"],
  ta: ["ta-IN", "ta-LK", "ta-Taml", "ta"],
  kn: ["kn-IN", "kn-Knda", "kn"],
  mr: ["mr-IN", "mr-Deva", "mr"],
};

const VERNACULAR_NAMES: Record<Lang, string[]> = {
  en: ["english", "india", "en-in"],
  hi: ["hindi", "हिन्दी", "हिंदी", "hi-in", "lekha"],
  te: ["telugu", "తెలుగు", "te-in", "mohan", "shruti"],
  ta: ["tamil", "தமிழ்", "ta-in", "valluvar"],
  kn: ["kannada", "ಕನ್ನಡ", "kn-in", "gagan", "sapna"],
  mr: ["marathi", "मराठी", "mr-in", "aarohi"],
};

// ============================================================================
// INDIC SCRIPT PHONETIC TRANSLITERATOR
// Maps Telugu, Tamil, Kannada, and Marathi Unicode glyphs to natural Romanized
// phonetic syllables that any Indian-English (en-IN) TTS voice can pronounce.
// ============================================================================

const TELUGU_MAP: Record<number, string> = {
  0x0C05: "a", 0x0C06: "aa", 0x0C07: "i", 0x0C08: "ee", 0x0C09: "u", 0x0C0A: "oo",
  0x0C0E: "e", 0x0C0F: "ae", 0x0C10: "ai", 0x0C12: "o", 0x0C13: "oh", 0x0C14: "au",
  0x0C15: "ka", 0x0C16: "kha", 0x0C17: "ga", 0x0C18: "gha", 0x0C1A: "cha", 0x0C1C: "ja",
  0x0C1F: "ta", 0x0C20: "tha", 0x0C21: "da", 0x0C22: "dha", 0x0C23: "na", 0x0C24: "tha",
  0x0C25: "thha", 0x0C26: "dha", 0x0C27: "dhha", 0x0C28: "na", 0x0C2A: "pa", 0x0C2B: "pha",
  0x0C2C: "ba", 0x0C2D: "bha", 0x0C2E: "ma", 0x0C2F: "ya", 0x0C30: "ra", 0x0C32: "la",
  0x0C35: "va", 0x0C36: "sha", 0x0C37: "sha", 0x0C38: "sa", 0x0C39: "ha", 0x0C33: "la"
};

const TELUGU_MATRAS: Record<number, string> = {
  0x0C3E: "aa", 0x0C3F: "i", 0x0C40: "ee", 0x0C41: "u", 0x0C42: "oo",
  0x0C46: "e", 0x0C47: "ae", 0x0C48: "ai", 0x0C4A: "o", 0x0C4B: "oh", 0x0C4C: "au"
};

const TAMIL_MAP: Record<number, string> = {
  0x0B85: "a", 0x0B86: "aa", 0x0B87: "i", 0x0B88: "ee", 0x0B89: "u", 0x0B8A: "oo",
  0x0B8E: "e", 0x0B8F: "ae", 0x0B90: "ai", 0x0B92: "o", 0x0B93: "oh", 0x0B94: "au",
  0x0B95: "ka", 0x0B99: "nga", 0x0B9A: "cha", 0x0B9C: "ja", 0x0B9E: "nya",
  0x0B9F: "ta", 0x0BA3: "na", 0x0BA4: "tha", 0x0BA8: "na", 0x0BA9: "na",
  0x0BAA: "pa", 0x0BAE: "ma", 0x0BAF: "ya", 0x0BB0: "ra", 0x0BB1: "ra",
  0x0BB2: "la", 0x0BB3: "la", 0x0BB4: "zha", 0x0BB5: "va", 0x0BB7: "sha",
  0x0BB8: "sa", 0x0BB9: "ha"
};

const TAMIL_MATRAS: Record<number, string> = {
  0x0BBE: "aa", 0x0BBF: "i", 0x0BC0: "ee", 0x0BC1: "u", 0x0BC2: "oo",
  0x0BC6: "e", 0x0BC7: "ae", 0x0BC8: "ai", 0x0BCA: "o", 0x0BCB: "oh", 0x0BCC: "au"
};

const KANNADA_MAP: Record<number, string> = {
  0x0C85: "a", 0x0C86: "aa", 0x0C87: "i", 0x0C88: "ee", 0x0C89: "u", 0x0C8A: "oo",
  0x0C8E: "e", 0x0C8F: "ae", 0x0C90: "ai", 0x0C92: "o", 0x0C93: "oh", 0x0C94: "au",
  0x0C95: "ka", 0x0C96: "kha", 0x0C97: "ga", 0x0C98: "gha", 0x0C9A: "cha", 0x0C9C: "ja",
  0x0C9F: "ta", 0x0CA0: "tha", 0x0CA1: "da", 0x0CA2: "dha", 0x0CA3: "na", 0x0CA4: "tha",
  0x0CA5: "thha", 0x0CA6: "dha", 0x0CA7: "dhha", 0x0CA8: "na", 0x0CAA: "pa", 0x0CAB: "pha",
  0x0CAC: "ba", 0x0CAD: "bha", 0x0CAE: "ma", 0x0CAF: "ya", 0x0CB0: "ra", 0x0CB2: "la",
  0x0CB5: "va", 0x0CB6: "sha", 0x0CB7: "sha", 0x0CB8: "sa", 0x0CB9: "ha", 0x0CB3: "la"
};

const KANNADA_MATRAS: Record<number, string> = {
  0x0CBE: "aa", 0x0CBF: "i", 0x0CC0: "ee", 0x0CC1: "u", 0x0CC2: "oo",
  0x0CC6: "e", 0x0CC7: "ae", 0x0CC8: "ai", 0x0CCA: "o", 0x0CCB: "oh", 0x0CCC: "au"
};

const DEVANAGARI_MAP: Record<number, string> = {
  0x0905: "a", 0x0906: "aa", 0x0907: "i", 0x0908: "ee", 0x0909: "u", 0x090A: "oo",
  0x090F: "e", 0x0910: "ai", 0x0913: "o", 0x0914: "au",
  0x0915: "ka", 0x0916: "kha", 0x0917: "ga", 0x0918: "gha", 0x091A: "cha", 0x091C: "ja",
  0x091F: "ta", 0x0920: "tha", 0x0921: "da", 0x0922: "dha", 0x0923: "na", 0x0924: "tha",
  0x0925: "thha", 0x0926: "dha", 0x0927: "dhha", 0x0928: "na", 0x092A: "pa", 0x092B: "pha",
  0x092C: "ba", 0x092D: "bha", 0x092E: "ma", 0x092F: "ya", 0x0930: "ra", 0x0932: "la",
  0x0935: "va", 0x0936: "sha", 0x0937: "sha", 0x0938: "sa", 0x0939: "ha", 0x0933: "la"
};

const DEVANAGARI_MATRAS: Record<number, string> = {
  0x093E: "aa", 0x093F: "i", 0x0940: "ee", 0x0941: "u", 0x0942: "oo",
  0x0947: "e", 0x0948: "ai", 0x094B: "o", 0x094C: "au"
};

/**
 * Transliterates an Indic script string to phonetic English syllables
 */
export function transliterateIndic(text: string, lang: Lang): string {
  let charMap: Record<number, string>;
  let matraMap: Record<number, string>;
  let viramaCode: number;
  let anusvaraCode: number;

  switch (lang) {
    case "te":
      charMap = TELUGU_MAP;
      matraMap = TELUGU_MATRAS;
      viramaCode = 0x0C4D;
      anusvaraCode = 0x0C02;
      break;
    case "ta":
      charMap = TAMIL_MAP;
      matraMap = TAMIL_MATRAS;
      viramaCode = 0x0BCD;
      anusvaraCode = 0x0B82;
      break;
    case "kn":
      charMap = KANNADA_MAP;
      matraMap = KANNADA_MATRAS;
      viramaCode = 0x0CCD;
      anusvaraCode = 0x0C82;
      break;
    case "mr":
    case "hi":
      charMap = DEVANAGARI_MAP;
      matraMap = DEVANAGARI_MATRAS;
      viramaCode = 0x094D;
      anusvaraCode = 0x0902;
      break;
    default:
      return text;
  }

  const result: string[] = [];
  let i = 0;
  while (i < text.length) {
    const code = text.charCodeAt(i);
    const nextCode = i + 1 < text.length ? text.charCodeAt(i + 1) : null;

    if (charMap[code]) {
      const base = charMap[code]!;
      if (nextCode === viramaCode) {
        result.push(base.endsWith("a") ? base.slice(0, -1) : base);
        i += 2;
        continue;
      } else if (nextCode && matraMap[nextCode]) {
        const root = base.endsWith("a") ? base.slice(0, -1) : base;
        result.push(root + matraMap[nextCode]);
        i += 2;
        continue;
      } else {
        result.push(base);
      }
    } else if (code === anusvaraCode) {
      result.push("m");
    } else {
      result.push(text[i]!);
    }
    i++;
  }

  return result.join("");
}

// ============================================================================
// VOICE AGENT SERVICE (TEXT-TO-SPEECH)
// ============================================================================

class VoiceAgentService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(state: VoicePlaybackState) => void> = new Set();
  private voicesCached: SpeechSynthesisVoice[] = [];
  private onEndCallback: (() => void) | null = null;

  private state: VoicePlaybackState = {
    isPlaying: false,
    isPaused: false,
    activeText: null,
    supported: false,
    engine: "idle",
    activeLang: "en",
  };

  constructor() {
    if (typeof window !== "undefined") {
      // Connect to Android Native TTS notification listener if inside APK WebView
      (window as unknown as { onCropAssistantVoiceState?: (playing: boolean) => void }).onCropAssistantVoiceState = (playing: boolean) => {
        this.state.isPlaying = playing;
        this.state.isPaused = false;
        if (!playing) {
          this.state.activeText = null;
          this.state.engine = "idle";
          if (this.onEndCallback) {
            const cb = this.onEndCallback;
            this.onEndCallback = null;
            cb();
          }
        }
        this.notify();
      };

      if ("speechSynthesis" in window) {
        this.synth = window.speechSynthesis;
        this.state.supported = true;
        this.loadVoices();
        window.speechSynthesis.addEventListener("voiceschanged", () => {
          this.loadVoices();
        });
      }
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const list = this.synth.getVoices();
    if (list && list.length > 0) {
      this.voicesCached = list;
    }
    return this.voicesCached;
  }

  public async ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
    if (this.voicesCached.length > 0) return this.voicesCached;
    if (!this.synth) return [];

    const immediate = this.synth.getVoices();
    if (immediate.length > 0) {
      this.voicesCached = immediate;
      return immediate;
    }

    return new Promise((resolve) => {
      let settled = false;
      const handler = () => {
        if (!settled) {
          settled = true;
          this.synth?.removeEventListener("voiceschanged", handler);
          this.loadVoices();
          resolve(this.voicesCached);
        }
      };
      this.synth?.addEventListener("voiceschanged", handler);
      setTimeout(() => {
        if (!settled) {
          settled = true;
          this.synth?.removeEventListener("voiceschanged", handler);
          this.loadVoices();
          resolve(this.voicesCached);
        }
      }, 600);
    });
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const hasNative = Boolean(
      (window as unknown as { CropAssistantAndroid?: { speakText?: unknown } }).CropAssistantAndroid?.speakText ||
      (window as unknown as { CropAssistantNative?: { speak?: unknown } }).CropAssistantNative?.speak
    );
    return hasNative || (this.state.supported && this.synth !== null);
  }

  public getState(): VoicePlaybackState {
    return { ...this.state };
  }

  public subscribe(listener: (state: VoicePlaybackState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.warn("VoiceAgent listener error:", err);
      }
    });
  }

  /**
   * Speak text in farmer's preferred language with guaranteed fallback across all 6 languages.
   */
  public async speak(text: string, lang: Lang = "en", onEnd?: () => void): Promise<boolean> {
    this.stop();
    this.onEndCallback = onEnd || null;

    const cleanText = text
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "") // strip emojis
      .replace(/[*_#`~[\]()<>|]/g, " ")
      .replace(/•\s*/g, ". ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return false;

    // ------------------------------------------------------------------------
    // TIER 1: Native Android TextToSpeech Bridge (APK on real device)
    // ------------------------------------------------------------------------
    const androidObj = (window as unknown as { CropAssistantAndroid?: { speakText: (txt: string, l: string) => boolean } }).CropAssistantAndroid;
    if (androidObj && typeof androidObj.speakText === "function") {
      try {
        const spoken = androidObj.speakText(cleanText, lang);
        if (spoken) {
          this.state.isPlaying = true;
          this.state.isPaused = false;
          this.state.activeText = cleanText;
          this.state.activeLang = lang;
          this.state.engine = "native";
          this.notify();
          return true;
        }
      } catch (e) {
        console.warn("Android native TTS bridge failed, falling back to Web Speech:", e);
      }
    }

    const nativeShim = (window as unknown as { CropAssistantNative?: { speak: (txt: string, l: string) => boolean } }).CropAssistantNative;
    if (nativeShim && typeof nativeShim.speak === "function") {
      try {
        const spoken = nativeShim.speak(cleanText, lang);
        if (spoken) {
          this.state.isPlaying = true;
          this.state.isPaused = false;
          this.state.activeText = cleanText;
          this.state.activeLang = lang;
          this.state.engine = "native";
          this.notify();
          return true;
        }
      } catch (e) {
        console.warn("CropAssistantNative speak shim failed:", e);
      }
    }

    // ------------------------------------------------------------------------
    // TIER 2: Web Speech API with Smart Regional Voice Matching
    // ------------------------------------------------------------------------
    if (!this.synth) {
      console.warn("Speech synthesis unavailable on this device/browser.");
      return false;
    }

    const voices = await this.ensureVoicesLoaded();
    const candidateTags = BCP47_LANG_TAGS[lang] || ["en-IN", "en"];
    const vernacularHints = VERNACULAR_NAMES[lang] || ["india"];

    let regionalVoice: SpeechSynthesisVoice | undefined;

    // Step A: Exact language code match
    for (const tag of candidateTags) {
      const lowerTag = tag.toLowerCase();
      regionalVoice = voices.find((v) => {
        const vLang = v.lang.toLowerCase().replace("_", "-");
        return vLang === lowerTag || vLang.startsWith(`${lowerTag}-`);
      });
      if (regionalVoice) break;
    }

    // Step B: Match by regional name in voice title or localized descriptor
    if (!regionalVoice) {
      regionalVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const langLower = v.lang.toLowerCase();
        return vernacularHints.some((hint) => nameLower.includes(hint) || langLower.includes(hint));
      });
    }

    // Step C: If a dedicated vernacular voice exists, use it directly!
    if (regionalVoice) {
      return this.playWebUtterance(cleanText, regionalVoice.lang, regionalVoice, "web-vernacular", lang);
    }

    // ------------------------------------------------------------------------
    // TIER 3: Indic Phonetic Transliteration Fallback
    // When browser lacks native voices for Telugu, Tamil, Kannada, or Marathi,
    // transliterate into phonetic Indian syllables and speak via Indian English voice.
    // ------------------------------------------------------------------------
    console.info(`No native voice found for ${lang.toUpperCase()}. Triggering Indic Phonetic Speech Engine.`);
    const phoneticText = lang === "en" ? cleanText : transliterateIndic(cleanText, lang);

    // Find Indian English voice or best generic Indian voice
    let indianVoice = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace("_", "-");
      const vName = v.name.toLowerCase();
      return vLang === "en-in" || vName.includes("india") || vName.includes("heera") || vName.includes("ravi") || vName.includes("neerja");
    });

    if (!indianVoice) {
      // Fallback to Hindi voice or English voice
      indianVoice = voices.find((v) => v.lang.toLowerCase().startsWith("hi") || v.lang.toLowerCase().startsWith("en")) || voices[0];
    }

    const voiceLang = indianVoice?.lang || candidateTags[0] || "en-IN";
    return this.playWebUtterance(phoneticText, voiceLang, indianVoice, "web-phonetic", lang);
  }

  private playWebUtterance(
    textToSpeak: string,
    langTag: string,
    voice: SpeechSynthesisVoice | undefined,
    engine: "web-vernacular" | "web-phonetic",
    originalLang: Lang
  ): boolean {
    if (!this.synth) return false;

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langTag;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.88; // Farmer-friendly, crystal-clear cadence
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.activeText = textToSpeak;
        this.state.engine = engine;
        this.state.activeLang = originalLang;
        this.notify();
      };

      utterance.onend = () => {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.activeText = null;
        this.state.engine = "idle";
        this.currentUtterance = null;
        this.notify();
        if (this.onEndCallback) {
          const cb = this.onEndCallback;
          this.onEndCallback = null;
          cb();
        }
      };

      utterance.onerror = (e) => {
        const errType = (e as any)?.error;
        // Interrupted or canceled are expected lifecycle events when stopping or re-triggering speech
        if (errType === "interrupted" || errType === "canceled") {
          this.state.isPlaying = false;
          this.state.isPaused = false;
          this.state.activeText = null;
          this.state.engine = "idle";
          this.currentUtterance = null;
          this.notify();
          return;
        }

        // If error is language-unavailable and we haven't tried phonetic yet, try phonetic fallback
        if (engine === "web-vernacular" && (errType === "language-unavailable" || errType === "voice-unavailable")) {
          const phonetic = transliterateIndic(textToSpeak, originalLang);
          const fallbackVoice = this.voicesCached.find((v) => v.lang.toLowerCase().includes("in") || v.lang.toLowerCase().startsWith("en")) || this.voicesCached[0];
          this.playWebUtterance(phonetic, fallbackVoice?.lang || "en-IN", fallbackVoice, "web-phonetic", originalLang);
          return;
        }

        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.activeText = null;
        this.state.engine = "idle";
        this.currentUtterance = null;
        this.notify();
      };

      if (this.synth.speaking || this.synth.pending) {
        this.synth.cancel();
      }
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (err) {
      console.error("Failed to speak utterance:", err);
      return false;
    }
  }

  public pause(): void {
    if (this.synth && this.state.isPlaying && !this.state.isPaused) {
      this.synth.pause();
      this.state.isPaused = true;
      this.notify();
    }
  }

  public resume(): void {
    if (this.synth && this.state.isPaused) {
      this.synth.resume();
      this.state.isPaused = false;
      this.notify();
    }
  }

  public stop(): void {
    // 1. Stop native Android TTS if running
    try {
      const androidObj = (window as unknown as { CropAssistantAndroid?: { stopSpeaking: () => void } }).CropAssistantAndroid;
      if (androidObj && typeof androidObj.stopSpeaking === "function") {
        androidObj.stopSpeaking();
      }
      const nativeShim = (window as unknown as { CropAssistantNative?: { stopSpeaking: () => void } }).CropAssistantNative;
      if (nativeShim && typeof nativeShim.stopSpeaking === "function") {
        nativeShim.stopSpeaking();
      }
    } catch {}

    // 2. Stop Web Speech API
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }

    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.activeText = null;
    this.state.engine = "idle";
    this.currentUtterance = null;
    this.onEndCallback = null;
    this.notify();
  }

  public toggle(text: string, lang: Lang = "en"): void {
    if (this.state.isPlaying) {
      if (this.state.isPaused) {
        this.resume();
      } else {
        this.stop();
      }
    } else {
      void this.speak(text, lang);
    }
  }
}

// ============================================================================
// VOICE INPUT SERVICE (SPEECH-TO-TEXT FOR VERNACULAR QUERIES)
// ============================================================================

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  lang: Lang;
  error: string | null;
}

class VoiceInputService {
  private recognition: any = null;
  private isSupportedFlag = false;
  private listeners: Set<(state: VoiceInputState) => void> = new Set();
  private state: VoiceInputState = {
    isListening: false,
    transcript: "",
    lang: "en",
    error: null,
  };

  constructor() {
    if (typeof window !== "undefined") {
      const win = window as any;
      const RecClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (RecClass) {
        this.isSupportedFlag = true;
      }
    }
  }

  public isSupported(): boolean {
    return this.isSupportedFlag;
  }

  public getState(): VoiceInputState {
    return { ...this.state };
  }

  public subscribe(listener: (state: VoiceInputState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(s);
      } catch {}
    });
  }

  public startListening(
    lang: Lang = "en",
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void
  ): boolean {
    if (typeof window === "undefined") return false;

    const win = window as any;
    const RecClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!RecClass) {
      if (onError) onError("Voice recognition is not supported in this browser.");
      return false;
    }

    this.stopListening();

    try {
      const rec = new RecClass();
      const candidateTag = BCP47_LANG_TAGS[lang]?.[0] || "en-IN";
      rec.lang = candidateTag;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.state.isListening = true;
        this.state.transcript = "";
        this.state.lang = lang;
        this.state.error = null;
        this.notify();
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        this.state.transcript = text;
        this.notify();
        onTranscript(text, Boolean(final));
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        this.state.isListening = false;
        this.state.error = event.error;
        this.notify();
        if (onError) onError(event.error);
      };

      rec.onend = () => {
        this.state.isListening = false;
        this.recognition = null;
        this.notify();
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (err: any) {
      console.warn("Failed to start speech recognition:", err);
      this.state.isListening = false;
      this.state.error = String(err);
      this.notify();
      if (onError) onError(String(err));
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.state.isListening = false;
    this.notify();
  }
}

export const voiceAgent = new VoiceAgentService();
export const voiceInput = new VoiceInputService();
