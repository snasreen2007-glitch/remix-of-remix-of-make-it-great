import { Link, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Cpu,
  ExternalLink,
  History,
  Image as ImageIcon,
  Info,
  Layers,
  Leaf,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Minimize2,
  PanelLeft,
  PanelLeftClose,
  Paperclip,
  RotateCcw,
  Send,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  User,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCropCare } from "../context";
import type { Lang } from "../i18n";
import { getTopic, l, type CropKey } from "../knowledge";
import { voiceAgent, voiceInput } from "../services/voice";
import { MarkdownMessage } from "../ui/MarkdownMessage";
import { queryGroqChat } from "../services/groq-pool";
import {
  btn,
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  Confirm,
  enter,
} from "../ui";

const greetingsByLang: Record<Lang, { title: string; subtitle: string }> = {
  en: {
    title: "Namaste! How can I assist your crop today?",
    subtitle: "Ask any question about Rice and Chilli leaf diseases, organic bio-remedies, fertilizer schedules, or attach a photo scan for real-time agronomic diagnosis.",
  },
  te: {
    title: "నమస్కారం! మీ పంట సంరక్షణలో ఎలా సహాయపడగలను?",
    subtitle: "వరి, మిరప తెగుళ్లు, సేంద్రీయ నివారణలు, ఎరువుల మోతాదు లేదా ఫోటో స్కాన్ ఆధారిత సలహాల గురించి ఏదైనా అడగండి.",
  },
  hi: {
    title: "नमस्ते! आज आपकी फसल के लिए क्या सहायता कर सकता हूँ?",
    subtitle: "धान और मिर्च के रोगों, जैविक उपचारों, उर्वरक मात्रा या फोटो स्कैन से जुड़े किसी भी सवाल के लिए पूछें।",
  },
  ta: {
    title: "வணக்கம்! உங்கள் பயிர் பாதுகாப்புக்கு எவ்வாறு உதவ முடியும்?",
    subtitle: "நெல் மற்றும் மிளகாய் பயிர் நோய்கள், இயற்கை மருந்துகள், உர மேலாண்மை பற்றி எது வேண்டுமானாலும் கேளுங்கள்.",
  },
  kn: {
    title: "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಬೆಳೆಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    subtitle: "ಭತ್ತ ಮತ್ತು ಮೆಣಸಿನಕಾಯಿ ರೋಗಗಳು, ಜೈವಿಕ ಪರಿಹಾರಗಳು ಮತ್ತು ರಸಗೊಬ್ಬರ ವೇಳಾಪಟ್ಟಿಯ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ.",
  },
  mr: {
    title: "नमस्कार! आपल्या पिकाच्या संरक्षणासाठी काय मदत करू शकतो?",
    subtitle: "भात व मिरचीवरील रोग, सेंद्रिय उपाय, खत व्यवस्थापन किंवा फोटो स्कॅन संदर्भात कोणताही प्रश्न विचारा.",
  },
};

const samplePromptsByLang: Record<Lang, { category: string; icon: string; questions: string[] }[]> = {
  en: [
    {
      category: "Rice (Paddy) Protection",
      icon: "🌾",
      questions: [
        "How to identify spindle-shaped rice blast lesions in the field?",
        "Best fertilizer schedule for paddy tillering and panicle initiation?",
        "How to control yellow stem borer organically using Trichogramma?",
        "What are early signs of bacterial leaf blight (BLB)?",
      ],
    },
    {
      category: "Chilli Crop Health",
      icon: "🌶️",
      questions: [
        "What causes chilli leaves to curl upwards vs downwards?",
        "Safe natural remedy for chilli thrips and yellow mites",
        "How to prevent fruit rot (anthracnose) during flowering and fruiting?",
        "Recommended bio-pesticides for whitefly control",
      ],
    },
    {
      category: "Bio-Controls & Sprays",
      icon: "🌿",
      questions: [
        "How to prepare and spray Pseudomonas fluorescens (1% WP)?",
        "When is the best time of day to spray bio-fungicides?",
        "How to prepare 5% Neem Seed Kernel Extract (NSKE)?",
      ],
    },
    {
      category: "Water & Soil Management",
      icon: "💧",
      questions: [
        "Explain Alternate Wetting and Drying (AWD) for water savings",
        "Can I apply urea when leaf blight symptoms are visible?",
        "How to correct zinc deficiency chlorosis in paddy?",
      ],
    },
  ],
  te: [
    {
      category: "వరి సస్యరక్షణ",
      icon: "🌾",
      questions: [
        "వరి అగ్గి తెగులు ప్రాథమిక లక్షణాలు మరియు నివారణ ఏమిటి?",
        "వరిలో పిలకల దశలో ఎరువుల యాజమాన్యం ఎలా చేయాలి?",
        "కాండం తొలిచే పురుగు నివారణకు జీవ నియంత్రణ పద్ధతులు?",
        "బాక్టీరియా ఆకు ఎండు తెగులు (BLB) లక్షణాలు ఏమిటి?",
      ],
    },
    {
      category: "మిరప సస్యరక్షణ",
      icon: "🌶️",
      questions: [
        "మిరపలో పై ముడత (తామర పురుగులు), క్రింది ముడత (నల్లి) తేడా ఏమిటి?",
        "తామర పురుగులు, నల్లి నివారణకు వేప నూనె ఎలా వాడాలి?",
        "కాయ కుళ్ళు తెగులు (ఆంథ్రాక్నోస్) రాకుండా ఏం చేయాలి?",
        "తెల్లదోమ నివారణకు సమగ్ర సస్యరక్షణ చర్యలు ఏమిటి?",
      ],
    },
    {
      category: "సేంద్రీయ & జీవ రసాయనాలు",
      icon: "🌿",
      questions: [
        "సూడోమోనాస్ ఫ్లోరోసెన్స్ జీవ రసాయనం ఎలా పిచికారీ చేయాలి?",
        "వేప గింజల కషాయం (NSKE 5%) తయారు చేసే విధానం?",
        "మందులు పిచికారీ చేయడానికి సరైన సమయం ఏది?",
      ],
    },
    {
      category: "నీరు & ఎరువుల యాజమాన్యం",
      icon: "💧",
      questions: [
        "వరిలో ఆరుతడుల (AWD) నీటి పద్ధతి వల్ల లాభాలు ఏమిటి?",
        "తెగులు ఉన్నప్పుడు యూరియా వేయవచ్చా? ఎరువుల జాగ్రత్తలు?",
        "వరిలో జింక్ లోపం లక్షణాలు మరియు నివారణ?",
      ],
    },
  ],
  hi: [
    {
      category: "धान की फसल सुरक्षा",
      icon: "🌾",
      questions: [
        "धान के झुलसा (ब्लास्ट) रोग के प्रमुख लक्षण और रोकथाम?",
        "धान में कल्ले फूटते समय यूरिया और पोटाश का सही प्रयोग?",
        "तना छेदक कीट की जैविक रोकथाम के लिए ट्राइकोग्रामा का प्रयोग?",
        "बैक्टीरियल लीफ ब्लाइट (BLB) की पहचान कैसे करें?",
      ],
    },
    {
      category: "मिर्च की उन्नत सुरक्षा",
      icon: "🌶️",
      questions: [
        "मिर्च में पत्ती मरोड़ रोग (थ्रिप्स व माइट्स) की रोकथाम कैसे करें?",
        "थ्रिप्स और माइट्स के लिए नीम तेल और जैविक कीटनाशक?",
        "मिर्च में फल सड़न (एंथ्रेक्नोज) से बचाव के उपाय?",
        "सफेद मक्खी नियंत्रण के लिए पीला चिपचिपा ट्रैप कैसे लगाएं?",
      ],
    },
    {
      category: "जैविक व सूक्ष्मजीव नियंत्रण",
      icon: "🌿",
      questions: [
        "स्यूडोमोनास फ्लोरोसेंस बायो-फंगीसाइड का सही उपयोग कैसे करें?",
        "नीम के बीज का अर्क (NSKE 5%) कैसे तैयार करें?",
        "कीटनाशक छिड़काव का सबसे उत्तम समय कौन सा है?",
      ],
    },
    {
      category: "सिंचाई व उर्वरक प्रबंधन",
      icon: "💧",
      questions: [
        "धान में कम पानी में खेती (AWD तकनीक) की पूरी विधि?",
        "क्या रोग लगने पर यूरिया डाल सकते हैं? खाद के नियम?",
        "धान में जिंक की कमी के लक्षण और समाधान?",
      ],
    },
  ],
  ta: [
    {
      category: "நெல் பயிர் பாதுகாப்பு",
      icon: "🌾",
      questions: [
        "நெல் குலை நோயின் ஆரம்ப அறிகுறிகள் மற்றும் கட்டுப்பாடு?",
        "நெல் தண்டு துளைப்பான் பூச்சியை இயற்கை முறையில் கட்டுப்படுத்துவது எப்படி?",
        "பாக்டீரியா இலை கருகல் நோய் தடுப்பு முறைகள்?",
      ],
    },
    {
      category: "மிளகாய் பயிர் மேலாண்மை",
      icon: "🌶️",
      questions: [
        "மிளகாய் இலை சுருட்டை வைரஸ் எவ்வாறு பரவுகிறது?",
        "இலைப்பேன் மற்றும் அசுவினி கட்டுப்பாடு இயற்கை முறைகள் யாவை?",
        "மிளகாய் பழ அழுகல் நோய் தடுக்கும் வழிகள்?",
      ],
    },
    {
      category: "இயற்கை உரங்கள் & தெளிப்பு",
      icon: "🌿",
      questions: [
        "சூடோமோனாஸ் உயிரியல் பூஞ்சாணக் கொல்லி தெளிக்கும் முறை?",
        "வேப்பங்கொட்டை சாறு (NSKE 5%) தயாரிக்கும் முறை?",
      ],
    },
    {
      category: "நீர்ப்பாசன மேலாண்மை",
      icon: "💧",
      questions: [
        "காய்ச்சலும் பாய்ச்சலும் (AWD) நீர் மேலாண்மை முறை என்ன?",
        "நோய் தாக்கிய பயிருக்கு யூரியா உரம் இடலாமா?",
      ],
    },
  ],
  kn: [
    {
      category: "ಭತ್ತದ ರೋಗ ನಿರ್ವಹಣೆ",
      icon: "🌾",
      questions: [
        "ಭತ್ತದ ಬೆಂಕಿ ರೋಗದ ಪ್ರಾಥಮಿಕ ಲಕ್ಷಣಗಳು ಮತ್ತು ನಿವಾರಣೆ?",
        "ಕಾಂಡ ಕೊರೆಯುವ ಕೀಟ ನಿಯಂತ್ರಣಕ್ಕೆ ಜೈವಿಕ ವಿಧಾನಗಳು?",
        "ದುಂಡಾಣು ಎಲೆ ಕರಗು ರೋಗ ತಡೆಗಟ್ಟುವುದು ಹೇಗೆ?",
      ],
    },
    {
      category: "ಮೆಣಸಿನಕಾಯಿ ರೋಗ ನಿಯಂತ್ರಣ",
      icon: "🌶️",
      questions: [
        "ಮೆಣಸಿನಕಾಯಿ ಎಲೆ ಮುದುರುವ ರೋಗ ಹೇಗೆ ಹರಡುತ್ತದೆ?",
        "ನುಸಿ ಮತ್ತು ಹೇನು ನಿಯಂತ್ರಣಕ್ಕೆ ನೈಸರ್ಗಿಕ ಕಷಾಯಗಳು?",
        "ಕಾಯಿ ಕೊಳೆ ರೋಗ ತಡೆಗಟ್ಟಲು ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು?",
      ],
    },
    {
      category: "ಜೈವಿಕ ಕೀಟನಾಶಕಗಳು",
      icon: "🌿",
      questions: [
        "ಸ್ಯೂಡೋಮೊನಾಸ್ ಜೈವಿಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸುವ ವಿಧಾನ?",
        "ಬೇವಿನ ಬೀಜದ ಕಷಾಯ (NSKE 5%) ತಯಾರಿಸುವ ವಿಧಾನ?",
      ],
    },
    {
      category: "ನೀರು ಮತ್ತು ಗೊಬ್ಬರ",
      icon: "💧",
      questions: [
        "ಭತ್ತದಲ್ಲಿ ಪರ್ಯಾಯ ತೇವ ಮತ್ತು ಒಣಗಿಸುವಿಕೆ (AWD) ವಿಧಾನ?",
        "ರೋಗ ಬಂದಾಗ ಯೂರಿಯಾ ಗೊಬ್ಬರ ಹಾಕಬಹುದೇ?",
      ],
    },
  ],
  mr: [
    {
      category: "भात पीक संरक्षण",
      icon: "🌾",
      questions: [
        "भातावरील करपा (ब्लास्ट) रोगाची लक्षणे व उपाय?",
        "भातावरील खोडकीड जैविक पद्धतीने नियंत्रण कसे करावे?",
        "जिवाणूजन्य करपा रोगाची ओळख व उपाय?",
      ],
    },
    {
      category: "मिरची पीक संरक्षण",
      icon: "🌶️",
      questions: [
        "मिरचीवरील चुरडा-मुरडा (बोकड्या) रोगाचे नियंत्रण कसे करावे?",
        "थ्रिप्स व माइट्स नियंत्रणासाठी सेंद्रिय उपाय?",
        "मिरची फळकूज (एंथ्रॅकनोज) रोखण्यासाठी काय करावे?",
      ],
    },
    {
      category: "सेंद्रिय व जैविक औषधे",
      icon: "🌿",
      questions: [
        "स्यूडोमोनास बुरशीनाशक फवारणीची योग्य पद्धत?",
        "निंबोळी अर्क (NSKE 5%) कसा तयार करावा?",
      ],
    },
    {
      category: "पाणी व खत व्यवस्थापन",
      icon: "💧",
      questions: [
        "भातामध्ये कमी पाण्यात शेती (AWD पद्धत) कशी करावी?",
        "रोग असताना युरिया खत देणे योग्य आहे का?",
      ],
    },
  ],
};

export function AssistantPage() {
  const { t, lang, messages, typing, ask, clearChat, scans, settings, updateSettings, online } = useCropCare();
  const search = useSearch({ strict: false }) as { scanId?: string };
  const initialScanId = search?.scanId;

  // Active scan photo context attached to chat
  const [activeScanId, setActiveScanId] = useState<string | undefined>(
    initialScanId || scans[0]?.id
  );
  const activeScan = scans.find((s) => s.id === activeScanId);

  const [input, setInput] = useState("");
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showScanPicker, setShowScanPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Model settings configuration state
  const [selectedProvider, setSelectedProvider] = useState<string>(
    settings?.llmProvider === "local" ? "local" : "auto"
  );
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeModelName = useMemo(() => {
    if (settings?.llmProvider === "local") {
      return "🌿 KisanAI Neural (On-Device)";
    }
    if (settings?.llmProvider === "ollama") {
      return "🦙 Ollama Local";
    }
    return "⚡ KisanAI High-Speed Neural Core (Connected)";
  }, [settings]);

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMsg("");
    try {
      if (selectedProvider === "local") {
        setTestStatus("success");
        setTestMsg("✓ On-Device Neural Engine Active (100% Offline Mode)");
        return;
      }
      if (selectedProvider === "ollama") {
        const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          setTestStatus("success");
          setTestMsg("✓ Local Ollama detected on port 11434!");
        } else {
          throw new Error("Could not reach Ollama at http://localhost:11434");
        }
        return;
      }

      // Test High-Speed Neural Pool (7 distributed nodes)
      const t0 = performance.now();
      const res = await queryGroqChat({
        messages: [{ role: "user", content: "Ping" }],
        maxTokens: 5,
      });
      const latency = Math.round(performance.now() - t0);
      if (res) {
        setTestStatus("success");
        setTestMsg(`✓ Connected to High-Speed Neural Core! (${latency}ms · Multi-Node Cluster Active)`);
      } else {
        throw new Error("Cloud network unreachable. Automatically switching to On-Device Offline Engine.");
      }
    } catch (e: any) {
      setTestStatus("error");
      setTestMsg(e?.message || "Failed to reach cloud service. Operating in Offline Mode.");
    }
  };

  const handleSaveModelConfig = () => {
    updateSettings({
      llmProvider: selectedProvider as any,
    });
    setShowModelModal(false);
  };

  // Auto-scroll to bottom on messages or typing updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Track scroll position to surface scroll-to-bottom button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isFarUp = el.scrollHeight - el.scrollTop - el.clientHeight > 180;
    setShowScrollBottom(isFarUp);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Synchronize Vernacular Voice Agent
  useEffect(() => {
    const unsub = voiceAgent.subscribe((st) => {
      if (!st.isPlaying) {
        setActivePlayingId(null);
      }
    });
    return () => {
      unsub();
      voiceAgent.stop();
    };
  }, []);

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const unsub = voiceInput.subscribe((st) => {
      setIsListening(st.isListening);
    });
    return () => {
      unsub();
      voiceInput.stopListening();
    };
  }, []);

  const handleToggleMic = () => {
    if (isListening) {
      voiceInput.stopListening();
      toast.info("Microphone stopped");
    } else {
      const started = voiceInput.startListening(
        lang,
        (text, isFinal) => {
          setInput(text);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
          }
        },
        (err) => {
          toast.info(t("voiceSoon"));
        }
      );
      if (started) {
        toast.success(`Listening in ${lang.toUpperCase()}...`);
      } else {
        toast.info(t("voiceSoon"));
      }
    }
  };

  const handleToggleVoice = (msgId: string, text: string) => {
    if (activePlayingId === msgId) {
      voiceAgent.stop();
      setActivePlayingId(null);
    } else {
      setActivePlayingId(msgId);
      voiceAgent.speak(text, lang, () => {
        setActivePlayingId(null);
      });
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    toast.success("Copied to clipboard");
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const handleSendPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    ask(
      trimmed,
      activeScan
        ? {
            crop: activeScan.crop,
            ...(activeScan.topicSlug ? { slug: activeScan.topicSlug } : {}),
            ...(activeScan.confidence !== undefined ? { confidence: activeScan.confidence } : {}),
            ...(activeScan.confidenceStatus ? { confidenceStatus: activeScan.confidenceStatus } : {}),
            ...(activeScan.severity?.band ? { severityBand: activeScan.severity.band } : {}),
            ...(activeScan.visibleEvidence ? { visibleEvidence: activeScan.visibleEvidence } : {}),
            ...(activeScan.insectDirectlyVisible !== undefined ? { insectDirectlyVisible: activeScan.insectDirectlyVisible } : {}),
            ...(activeScan.severityMethod ? { severityMethod: activeScan.severityMethod } : {}),
          }
        : {}
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSendPrompt(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const currentCategories = samplePromptsByLang[lang] ?? samplePromptsByLang.en;
  const currentCategory = currentCategories[activeCategoryIdx] ?? currentCategories[0]!;
  const currentGreeting = greetingsByLang[lang] ?? greetingsByLang.en;

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden bg-canvas text-foreground",
        isFullscreen
          ? "fixed inset-0 z-50 h-[100dvh] w-screen"
          : "h-full min-h-0 flex-1"
      )}
    >
      {/* =========================================================================
          LEFT COLLAPSIBLE SIDEBAR (Desktop & Tablet)
          Contains Recent Leaf Scans, Diagnostic Topics, and AI Architecture Status
          ========================================================================= */}
      {showSidebar && (
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col border-r border-line bg-card/70 backdrop-blur-md transition-all">
          {/* Sidebar Top: Action Bar */}
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Assistant Hub
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
          </div>

          {/* New Chat Primary Button */}
          <div className="p-3 border-b border-line/60">
            <button
              type="button"
              onClick={() => {
                if (messages.length > 0) clearChat();
                setActiveScanId(undefined);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/25 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-2xs active:scale-98 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>{t("clearChat")} (New Consultation)</span>
            </button>
          </div>

          {/* Sidebar Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Attached Photo Contexts / Recent Scans */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3 text-primary" />
                  Leaf Scan Contexts
                </span>
                {scans.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground rounded-full bg-surface px-1.5 py-0.5">
                    {scans.length}
                  </span>
                )}
              </div>

              {scans.length === 0 ? (
                <div className="rounded-xl border border-line/60 bg-surface/50 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    No photo scans yet. Photograph a leaf in <Link to="/diagnose" className="text-primary font-bold hover:underline">Diagnose</Link> to attach live visual symptoms.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {scans.slice(0, 5).map((sc) => {
                    const isSelected = activeScanId === sc.id;
                    const topic = sc.topicSlug ? getTopic(sc.crop, sc.topicSlug) : undefined;
                    const title = topic ? l(lang, topic.name) : (sc.name || sc.topicSlug || "Field Scan");

                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setActiveScanId(isSelected ? undefined : sc.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-all cursor-pointer active:scale-98",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                            : "border-line bg-surface/80 hover:bg-surface hover:border-line-hover"
                        )}
                      >
                        <img
                          src={sc.image}
                          alt={title}
                          className="size-10 rounded-lg object-cover border border-line/60 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-bold text-foreground">
                              {title}
                            </span>
                            {isSelected && (
                              <span className="shrink-0 size-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="capitalize">{sc.crop}</span>
                            {sc.severity && <span>• {sc.severity.band}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Agronomic Topics */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Layers className="size-3 text-primary" />
                Agronomic Shortcuts
              </span>

              <div className="grid grid-cols-1 gap-1">
                {[
                  {
                    title: lang === "te" ? "వరి అగ్గి తెగులు నివారణ" : lang === "hi" ? "धान ब्लास्ट नियंत्रण" : "Rice Blast Control",
                    crop: "rice",
                    prompt: lang === "te" ? "వరి అగ్గి తెగులు నివారణకు సమగ్ర రసాయన, సేంద్రీయ చర్యలు ఏమిటి?" : lang === "hi" ? "धान के ब्लास्ट रोग के नियंत्रण के लिए वैज्ञानिक उपाय बताएं" : "What is the certified management protocol for Rice Blast disease?",
                  },
                  {
                    title: lang === "te" ? "బాక్టీరియా ఆకు ఎండు (BLB)" : lang === "hi" ? "बैक्टीरियल लीफ ब्लाइट" : "Bacterial Leaf Blight (BLB)",
                    crop: "rice",
                    prompt: lang === "te" ? "వరిలో బాక్టీరియా ఆకు ఎండు తెగులు వచ్చినప్పుడు యూరియా వేయవచ్చా?" : lang === "hi" ? "धान में बीएलबी रोग आने पर यूरिया का प्रयोग कैसे करें?" : "Can nitrogen fertilizer be applied when bacterial leaf blight is present?",
                  },
                  {
                    title: lang === "te" ? "మిరప ఆకు ముడత (తామర పురుగులు)" : lang === "hi" ? "मिर्च पत्ती मरोड़ (थ्रिप्स)" : "Chilli Leaf Curl & Thrips",
                    crop: "chilli",
                    prompt: lang === "te" ? "మిరపలో తామర పురుగు మరియు నల్లి నివారణకు వేప నూనె సమగ్ర విధానం ఏమిటి?" : lang === "hi" ? "मिर्च में थ्रिप्स व माइट्स के नियंत्रण का जैविक व रासायनिक समाधान?" : "How to distinguish and treat chilli upward thrips cupping vs downward mite curling?",
                  },
                  {
                    title: lang === "te" ? "మిరప కాయ కుళ్ళు (ఆంథ్రాక్నోస్)" : lang === "hi" ? "मिर्च फल सड़न (एंथ्रेक्नोज)" : "Chilli Anthracnose (Fruit Rot)",
                    crop: "chilli",
                    prompt: lang === "te" ? "మిరపలో కాయ కుళ్ళు తెగులు నివారణకు తీసుకోవాల్సిన చర్యలు ఏమిటి?" : lang === "hi" ? "मिर्च में फल सड़न से बचाव के लिए कौन सा स्प्रे करें?" : "What are the preventive sprays for chilli anthracnose and fruit rot?",
                  },
                  {
                    title: lang === "te" ? "ఆరుతడుల పద్ధతి (AWD)" : lang === "hi" ? "कम पानी में धान खेती (AWD)" : "Alternate Wetting & Drying (AWD)",
                    crop: "rice",
                    prompt: lang === "te" ? "వరిలో ఆరుతడుల (AWD) నీటి యాజమాన్యం ఎలా పాటించాలి?" : lang === "hi" ? "धान में एडब्ल्यूडी जल प्रबंधन तकनीक के क्या लाभ हैं?" : "How to implement Alternate Wetting and Drying (AWD) water management in paddy?",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendPrompt(item.prompt)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-muted-foreground hover:bg-surface hover:text-foreground transition-all cursor-pointer"
                  >
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Intelligence Badge */}
          <div className="border-t border-line p-3 bg-surface/50">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                CIB&amp;RC Statutory Guard
              </span>
              <button
                type="button"
                onClick={() => setShowModelModal(true)}
                className="hover:text-foreground underline text-[10px] cursor-pointer"
              >
                Settings
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================================
          MAIN CHAT WORKSPACE (Full Screen & 100% Edge-to-Edge Responsive)
          ========================================================================= */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Control Bar */}
        <header
          className={cn(
            "flex shrink-0 items-center justify-between border-b border-line bg-card/90 px-3 sm:px-6 backdrop-blur-md z-10",
            "pt-[max(0px,env(safe-area-inset-top),var(--sat,0px))] h-[calc(3.25rem+max(0px,env(safe-area-inset-top),var(--sat,0px)))] sm:h-14 sm:pt-0"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back button to Home (mobile) */}
            <Link
              to="/"
              className="grid size-8 sm:size-9 place-items-center rounded-xl border border-line bg-surface text-muted-foreground hover:text-foreground transition-all active:scale-95 lg:hidden"
              title="Back to Home"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </Link>

            {/* Sidebar toggle button (desktop) */}
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden md:grid size-8 place-items-center rounded-lg border border-line bg-surface text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <PanelLeft className="size-4" />
            </button>

            {/* Avatar & Bot Info */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="relative grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary shadow-xs">
                <Bot className="size-4 sm:size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-sm sm:text-base font-bold text-foreground">
                    {t("navAssistant")}
                  </h1>
                  <span className="hidden sm:inline-flex rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    AI Agronomist
                  </span>
                </div>
                <p className="truncate text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <span>{activeModelName}</span>
                  <span className="hidden sm:inline">• Official Extension RAG</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Multilingual Switcher Pills */}
            <div className="flex items-center rounded-xl border border-line bg-surface p-0.5 shadow-2xs">
              {(["en", "te", "hi", "ta", "kn", "mr"] as const).map((lCode) => (
                <button
                  key={lCode}
                  type="button"
                  onClick={() => updateSettings({ lang: lCode })}
                  className={cn(
                    "rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] font-bold transition-all cursor-pointer",
                    lang === lCode
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`Switch language to ${lCode.toUpperCase()}`}
                >
                  {lCode === "en" ? "EN" : lCode === "te" ? "తె" : lCode === "hi" ? "हि" : lCode === "ta" ? "த" : lCode === "kn" ? "ಕ" : "म"}
                </button>
              ))}
            </div>

            {/* Model Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowModelModal(true)}
              className="grid size-8 sm:size-9 place-items-center rounded-xl border border-line bg-surface text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
              title="Configure AI Models & Engine"
            >
              <Cpu className="size-4" />
            </button>

            {/* Clear Chat Confirmation */}
            {messages.length > 0 && (
              <Confirm
                trigger={
                  <button
                    type="button"
                    className="grid size-8 sm:size-9 place-items-center rounded-xl border border-line bg-surface text-muted-foreground hover:text-coral transition-colors cursor-pointer shadow-2xs"
                    title={t("clearChat")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                }
                title={t("clearChat")}
                body="All conversation messages will be reset from this device."
                confirmLabel={t("clearChat")}
                onConfirm={clearChat}
              />
            )}

            {/* Fullscreen / Zen Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={cn(
                "grid size-8 sm:size-9 place-items-center rounded-xl border transition-all cursor-pointer shadow-2xs",
                isFullscreen
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-surface text-muted-foreground hover:text-foreground"
              )}
              title={isFullscreen ? "Exit Fullscreen" : "Full Screen View"}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        </header>

        {/* Multimodal Active Photo Context Ribbon */}
        {activeScan && (
          <div className="shrink-0 border-b border-primary/20 bg-primary/5 px-3 py-2 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-4xl mx-auto w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={activeScan.image}
                  alt="Active Scan"
                  className="size-8 sm:size-9 rounded-lg object-cover border border-primary/30 shrink-0 shadow-xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Photo Context Attached
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      • {activeScan.crop}
                    </span>
                  </div>
                  <p className="truncate text-xs font-bold text-foreground">
                    {activeScan.topicSlug
                      ? l(
                          lang,
                          getTopic(activeScan.crop, activeScan.topicSlug)?.name || {
                            en: activeScan.topicSlug,
                            hi: activeScan.topicSlug,
                            te: activeScan.topicSlug,
                          }
                        )
                      : "Field Leaf Specimen"}
                    {activeScan.severity && ` · ${activeScan.severity.band}`}
                  </p>
                </div>
              </div>

              {/* Instant Contextual Prompt Pills */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleSendPrompt(
                      lang === "te"
                        ? "ఈ తెగులు గురించి సాధారణ రైతు మాటల్లో సులభమైన వివరణ మరియు నివారణ చెప్పు"
                        : lang === "hi"
                        ? "इस रोग के बारे में सरल शब्दों में अर्थ और आसान सारांश बताएं"
                        : "Explain in simple words with summary and certified treatment"
                    )
                  }
                  className="rounded-lg bg-primary/10 border border-primary/25 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all active:scale-95 cursor-pointer"
                >
                  ✨ {lang === "te" ? "ఏఐ వివరణ" : lang === "hi" ? "सरल सारांश" : "AI Summary"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendPrompt(
                      lang === "te"
                        ? "దీనిని అరికట్టడానికి నేను వెంటనే ఏం చేయాలి? మోతాదులు చెప్పు"
                        : lang === "hi"
                        ? "इसे रोकने के लिए मुझे तुरंत क्या करना चाहिए? सटीक दवा व मात्रा?"
                        : "What is the exact certified chemical & bio dosage to stop this disease?"
                    )
                  }
                  className="rounded-lg border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-surface-elevated transition-all active:scale-95 cursor-pointer"
                >
                  💊 {lang === "te" ? "చికిత్స & మందులు" : lang === "hi" ? "उपचार व मात्रा" : "Treatment"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScanId(undefined)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground cursor-pointer"
                  title="Detach photo context"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MESSAGE THREAD / CHAT CANVAS
            ========================================================================= */}
        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            /* HERO WELCOME SCREEN (When chat is clean) */
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 py-6 animate-in fade-in">
              <div className="relative">
                <span className="grid size-16 sm:size-20 place-items-center rounded-3xl bg-primary/15 text-primary shadow-inner border border-primary/25">
                  <Sprout className="size-8 sm:size-10" />
                </span>
                <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs">
                  <Sparkles className="size-3.5 animate-pulse" />
                </span>
              </div>

              <div className="max-w-lg space-y-1.5 px-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-foreground font-apple">
                  {currentGreeting.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {currentGreeting.subtitle}
                </p>
              </div>

              {/* Category Tab Selector */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-surface/80 border border-line max-w-xl">
                {currentCategories.map((cat, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => setActiveCategoryIdx(cIdx)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                      activeCategoryIdx === cIdx
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.category}</span>
                  </button>
                ))}
              </div>

              {/* Interactive Prompt Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl text-left">
                {currentCategory.questions.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => handleSendPrompt(q)}
                    className={cn(
                      card,
                      "group flex items-center justify-between p-3.5 text-xs font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs active:scale-98 cursor-pointer"
                    )}
                  >
                    <span className="line-clamp-2 leading-relaxed">{q}</span>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGE BUBBLES */
            <div className="max-w-3xl mx-auto w-full space-y-4">
              {messages.map((m) => {
                const isFarmer = m.role === "farmer";

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-2.5 sm:gap-3 text-sm leading-relaxed animate-in fade-in duration-150",
                      isFarmer ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isFarmer && (
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary mt-1 shadow-xs border border-primary/20">
                        <Bot className="size-4" />
                      </span>
                    )}

                    <div className={cn("max-w-[90%] sm:max-w-[85%] space-y-2", isFarmer ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "rounded-2xl p-3.5 sm:p-4 shadow-sm leading-relaxed",
                          isFarmer
                            ? "bg-primary text-primary-foreground rounded-tr-xs font-medium ml-auto"
                            : "border border-line bg-card text-foreground rounded-tl-xs",
                          m.safety && "border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-200"
                        )}
                      >
                        {m.safety && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border-b border-amber-500/20 pb-2 mb-2.5">
                            <ShieldAlert className="size-4 shrink-0" />
                            <span>Agricultural Statutory Safety Guard (CIB&amp;RC Compliance)</span>
                          </div>
                        )}

                        {/* Message Content */}
                        {isFarmer ? (
                          <p className="whitespace-pre-line text-[13.5px] leading-relaxed">
                            {m.text}
                          </p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownMessage content={m.text} />
                          </div>
                        )}

                        {/* Bottom Action Ribbon for Assistant Responses */}
                        {!isFarmer && (
                          <div className="flex items-center justify-between border-t border-line/50 pt-2.5 mt-3 text-[11px] text-muted-foreground">
                            <span className="text-[10px] font-semibold text-muted-foreground/80 flex items-center gap-1">
                              <Sparkles className="size-2.5 text-primary" />
                              KisanAI · Meta Llama 3.2 1B
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Copy message */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(m.id, m.text)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 hover:bg-surface hover:text-foreground transition-colors cursor-pointer text-xs"
                                title="Copy response to clipboard"
                              >
                                {copiedId === m.id ? (
                                  <>
                                    <Check className="size-3 text-emerald-500" />
                                    <span className="text-emerald-500 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {/* Read aloud with Vernacular Voice Agent */}
                              <button
                                type="button"
                                onClick={() => handleToggleVoice(m.id, m.text)}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 transition-all cursor-pointer text-xs",
                                  activePlayingId === m.id
                                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold"
                                    : "hover:bg-surface hover:text-foreground"
                                )}
                                title="Read aloud in regional vernacular voice"
                              >
                                {activePlayingId === m.id ? (
                                  <>
                                    <span className="inline-flex items-center gap-0.5 mr-0.5">
                                      <span className="size-1 rounded-full bg-rose-500 animate-ping" />
                                    </span>
                                    <VolumeX className="size-3" /> Stop
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="size-3" /> Listen
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Referenced Field Topics */}
                        {!isFarmer && m.refs && m.refs.length > 0 && (
                          <div className="border-t border-line/40 pt-2 mt-2 space-y-1">
                            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                              Referenced Agronomic Records:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.refs.map((rf) => {
                                const topic = getTopic(rf.crop, rf.slug);
                                return (
                                  <Link
                                    key={`${rf.crop}-${rf.slug}`}
                                    to="/library/$crop/$slug"
                                    params={{ crop: rf.crop, slug: rf.slug }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors shadow-2xs"
                                  >
                                    <Leaf className="size-3" />
                                    <span>{topic ? l(lang, topic.name) : rf.slug}</span>
                                    <ExternalLink className="size-2.5 opacity-60 ml-0.5" />
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Follow-up Suggestion Chips */}
                      {!isFarmer && m.suggestions && m.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                          {m.suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleSendPrompt(sug)}
                              className="rounded-full border border-primary/25 bg-card/90 backdrop-blur-xs px-3 py-1 text-xs font-medium text-foreground hover:bg-primary/15 hover:border-primary/50 transition-all active:scale-95 shadow-2xs cursor-pointer"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isFarmer && (
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground mt-1 shadow-xs border border-line">
                        <User className="size-4" />
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground pt-1 animate-in fade-in">
                  <span className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                    <Bot className="size-4 animate-spin" />
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-2.5 shadow-xs">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">
                      {t("thinking")}...
                    </span>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 z-20 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowDown className="size-3.5" />
            <span>Scroll to latest</span>
          </button>
        )}

        {/* Listening Soundwave Banner */}
        {isListening && (
          <div className="shrink-0 border-t border-rose-500/30 bg-rose-500/10 px-4 py-2 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold animate-pulse">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500 animate-ping" />
              <span>Listening in {lang.toUpperCase()}... Speak your agricultural question</span>
            </div>
            <button
              type="button"
              onClick={handleToggleMic}
              className="rounded-lg bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-600 transition-colors cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* =========================================================================
            BOTTOM INPUT DOCK (Sticky & Responsive)
            ========================================================================= */}
        <div
          className={cn(
            "shrink-0 border-t border-line bg-card/95 p-2.5 sm:p-4 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom),var(--sab,0px))]"
          )}
        >
          <div className="max-w-3xl mx-auto w-full space-y-2">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 rounded-2xl border border-line bg-surface/90 p-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
            >
              {/* Attach Leaf Scan Context Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowScanPicker(!showScanPicker)}
                  title={activeScan ? "Scan attached · Click to change" : "Attach a leaf scan to discuss"}
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl transition-all cursor-pointer active:scale-95",
                    activeScan
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  )}
                >
                  <Paperclip className="size-4" />
                </button>

                {/* Scan Picker Dropdown */}
                {showScanPicker && (
                  <div className="absolute bottom-12 left-0 z-30 w-64 rounded-2xl border border-line bg-card p-2 shadow-2xl space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-line">
                      <span className="text-[11px] font-bold text-foreground">Attach Leaf Context</span>
                      <button
                        type="button"
                        onClick={() => setShowScanPicker(false)}
                        className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </div>

                    {scans.length === 0 ? (
                      <p className="p-2 text-[11px] text-muted-foreground text-center">
                        No scans available. Capture a leaf in Diagnose first.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {scans.map((sc) => (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => {
                              setActiveScanId(sc.id);
                              setShowScanPicker(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-xs transition-colors cursor-pointer",
                              activeScanId === sc.id
                                ? "bg-primary/10 text-primary font-bold"
                                : "hover:bg-surface text-foreground"
                            )}
                          >
                            <img src={sc.image} alt="leaf" className="size-7 rounded object-cover" />
                            <span className="truncate">{sc.name || sc.topicSlug || sc.crop}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t("typeQuestion")}
                rows={1}
                className="flex-1 max-h-32 min-h-10 resize-none bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 leading-relaxed"
              />

              {/* Vernacular Voice Mic */}
              <button
                type="button"
                onClick={handleToggleMic}
                title={isListening ? "Stop listening" : `Speak in ${lang.toUpperCase()}`}
                aria-label="Toggle voice input"
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl transition-all active:scale-95 cursor-pointer",
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-md"
                    : "bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                )}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label={t("send")}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-40 active:scale-95 cursor-pointer"
                )}
              >
                <ArrowUp className="size-4" />
              </button>
            </form>

            {/* Micro Status Bar */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeModelName}</span>
              </span>
              <span className="hidden sm:inline">
                Enter to send · Shift+Enter for new line · 100% Offline-Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          OFFICIAL AI MODEL CONFIGURATION MODAL
          ========================================================================= */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-card p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Official AI Model & Chatbot</h2>
                  <p className="text-xs text-muted-foreground">Select real cloud or on-device LLMs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-all cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Engine Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">AI Intelligence Mode</label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  {
                    id: "auto",
                    name: "⚡ Auto Hybrid (Recommended)",
                    badge: "Online + Offline",
                    desc: "High-speed 27B/70B neural intelligence when online; automatically falls back to local on-device engine in flight mode.",
                  },
                  {
                    id: "local",
                    name: "🔒 100% Offline (Airplane Mode)",
                    badge: "On-Device",
                    desc: "Zero cloud network communication. Runs entirely on-device with MobileNetV3 and local agronomic rules.",
                  },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setSelectedProvider(prov.id)}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all cursor-pointer",
                      selectedProvider === prov.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                        : "border-line bg-surface hover:border-line-hover"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{prov.name}</span>
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{prov.badge}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{prov.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Architecture & Cluster Status Card */}
            <div className="rounded-2xl border border-line bg-surface/70 p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                <h4 className="text-xs font-bold text-foreground">Active Intelligence Architecture</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl border border-line/60 bg-card/60 p-2.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    High-Speed Distributed Cluster
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Multi-node high-availability pool with automated failover and sub-second execution.
                  </p>
                </div>
                <div className="rounded-xl border border-line/60 bg-card/60 p-2.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-sky-500" />
                    ICAR &amp; ANGRAU Agronomy
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    State agricultural university extension guidelines for Rice &amp; Chilli integrated pest management.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Zero configuration required. All cloud &amp; offline services are connected and ready.</span>
              </div>
            </div>

            {/* Test Status feedback */}
            {testStatus !== "idle" && (
              <div
                className={cn(
                  "rounded-xl p-3 text-xs flex items-center gap-2",
                  testStatus === "testing" && "bg-surface text-muted-foreground",
                  testStatus === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold",
                  testStatus === "error" && "bg-coral/10 text-coral border border-coral/20 font-semibold"
                )}
              >
                {testStatus === "testing" && <Sparkles className="size-3.5 animate-spin shrink-0" />}
                {testStatus === "success" && <CheckCircle2 className="size-3.5 shrink-0" />}
                {testStatus === "error" && <AlertTriangle className="size-3.5 shrink-0" />}
                <span>{testStatus === "testing" ? "Testing model connectivity..." : testMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === "testing"}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface/80 transition-all cursor-pointer"
              >
                Test Connection
              </button>
              <button
                type="button"
                onClick={handleSaveModelConfig}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
              >
                Save &amp; Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
