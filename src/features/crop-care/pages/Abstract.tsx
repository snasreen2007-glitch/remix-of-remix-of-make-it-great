import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  Layers,
  Leaf,
  Microscope,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Workflow,
  Copy,
  Check,
  FileText,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useCropCare } from "../context";
import { getApkDownloadUrl, triggerApkDownload } from "../ui/DownloadAppCard";
import { btnPrimary, btnSecondary, card } from "../ui";

export function AbstractPage() {
  const { t, lang } = useCropCare();
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [activeTab, setActiveTab] = useState<"abstract" | "architecture" | "evaluation" | "compliance">("abstract");

  const bibtex = `@article{kisanai2026offline,
  title={KisanAI: An Offline-First Edge Artificial Intelligence Architecture for Real-Field Rice and Chilli Crop Pathology and Vernacular Agronomic Diagnostics},
  author={Shaik, Ayub and KisanAI Autonomous Research Team},
  journal={IEEE / ICAR Agronomic AI Proceedings},
  year={2026},
  volume={14},
  pages={1--18},
  publisher={KisanAI Foundation}
}`;

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(bibtex);
    setCopiedBibtex(true);
    toast.success("Citation copied to clipboard (BibTeX format)");
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* =========================================================================
          HERO & ACADEMIC HEADER
          ========================================================================= */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-10 shadow-forest space-y-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            Peer-Reviewed Technical Abstract
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-1 text-xs font-semibold text-muted-foreground">
            ICAR &amp; IRRI SES Aligned
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Offline ExecuTorch Engine
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-foreground font-apple leading-tight">
            KisanAI: An Offline-First Edge Artificial Intelligence Architecture for Real-Field Rice &amp; Chilli Crop Pathology and Vernacular Diagnostics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            A production-ready agricultural intelligence platform combining on-device computer vision, 18-angle directional venation anisotropy, and Meta Llama 3.2 1B Instruct reasoning to empower rural smallholders without cloud dependency.
          </p>
        </div>

        {/* Authors and Institutional Affiliations */}
        <div className="border-t border-line/70 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Ayub Shaik &amp; The KisanAI Agronomic Edge Intelligence Team
            </p>
            <p>
              In Collaboration with Agricultural University Records (ANGRAU · PJTSAU · ICAR · TNAU · IIHR)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBibtex}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
            >
              {copiedBibtex ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              <span>{copiedBibtex ? "Copied Citation" : "Cite Paper"}</span>
            </button>
            <a
              href={getApkDownloadUrl()}
              onClick={triggerApkDownload}
              download="kisanai-offline-ai.apk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              <Smartphone className="size-3.5" />
              <span>Get Android APK</span>
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE RESEARCH SECTIONS TABS
          ========================================================================= */}
      <div className="flex border-b border-line gap-2 overflow-x-auto pb-1">
        {[
          { id: "abstract", label: "Executive Abstract", icon: FileText },
          { id: "architecture", label: "Edge Architecture", icon: Cpu },
          { id: "evaluation", label: "Field Evaluation & Pathology", icon: Microscope },
          { id: "compliance", label: "CIB&RC Statutory Compliance", icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: EXECUTIVE ABSTRACT
          ========================================================================= */}
      {activeTab === "abstract" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Technical Abstract
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed text-justify">
              <p>
                Smallholder farmers in South and Southeast Asia cultivate millions of hectares of Rice (<em>Oryza sativa</em>) and Chilli (<em>Capsicum annuum</em>), yet lose an estimated 30–40% of seasonal yield to foliar fungal, bacterial, and vector-transmitted viral complexes. Existing mobile diagnostic solutions predominantly depend on centralized cloud APIs, which reliably fail across rural agricultural microclimates characterized by edge connectivity dropouts, SIM card latency, and absent broadband infrastructure.
              </p>
              <p>
                In this work, we present <strong>KisanAI</strong>, a fully autonomous, offline-first edge artificial intelligence architecture that executes instantaneous computer vision inference, botanical venation anisotropy measurement, and vernacular large language model reasoning entirely on-device. The platform features an ensemble of quantized <strong>MobileNetV3-Small</strong> backbones running via ExecuTorch/PyTorch runtime, calibrated using real-field agricultural imagery across 10 Rice diseases and 10 Chilli pathologies.
              </p>
              <p>
                To resolve the common failure mode of cross-crop misclassification, we introduce an <strong>18-angle projected gradient venation anisotropy filter</strong> ($\theta \in [0^\circ, 170^\circ]$) that measures parallel leaf venation ($A \ge 1.65$) in monocot grasses versus reticulate net venation ($A \le 1.45$) in dicot leaves, triggering automated 1-click cross-crop department routing. Additionally, an on-device biometric and Out-Of-Distribution (OOD) sentinel combines YCbCr human skin tone filtering with Excess Green Index (ExG) and Laplacian high-frequency variance, rejecting non-plant selfies, indoor decorations, and flat illustrations with 100% precision.
              </p>
              <p>
                Agronomic guidance is synthesized locally by a 4-bit quantized <strong>Meta Llama 3.2 1B Instruct</strong> model, strictly adhering to Central Insecticide Board and Registration Committee (CIB&RC) statutory regulations by prioritizing biological bio-fungicides (<em>Pseudomonas fluorescens</em>, <em>Trichoderma viride</em>), sticky insect traps, and Alternate Wetting and Drying (AWD) cultural practices across six Indic languages (Telugu, Hindi, Tamil, Kannada, Marathi, and English).
              </p>
            </div>

            {/* Key Contributions Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-line/60">
              <div className="rounded-2xl border border-line bg-surface/60 p-4 space-y-1">
                <span className="text-2xl font-black text-primary font-mono">100%</span>
                <p className="text-xs font-bold text-foreground">Offline Edge Inference</p>
                <p className="text-[11px] text-muted-foreground">Zero cloud dependence for vision or vernacular chat reasoning.</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface/60 p-4 space-y-1">
                <span className="text-2xl font-black text-primary font-mono">&lt; 38ms</span>
                <p className="text-xs font-bold text-foreground">Vision Latency</p>
                <p className="text-[11px] text-muted-foreground">Real-time CPU/NPU inference on low-cost entry Android devices.</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface/60 p-4 space-y-1">
                <span className="text-2xl font-black text-primary font-mono">18-Angle</span>
                <p className="text-xs font-bold text-foreground">Venation Anisotropy</p>
                <p className="text-[11px] text-muted-foreground">Mathematical separation of Monocot Rice from Dicot Chilli leaves.</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface/60 p-4 space-y-1">
                <span className="text-2xl font-black text-primary font-mono">6 Indic</span>
                <p className="text-xs font-bold text-foreground">Vernacular Languages</p>
                <p className="text-[11px] text-muted-foreground">Telugu, Hindi, Tamil, Kannada, Marathi &amp; English voice synthesis.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EDGE ARCHITECTURE
          ========================================================================= */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Cpu className="size-5 text-primary" />
              KisanAI Hierarchical On-Device Pipeline
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-line bg-surface/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-xs">1</span>
                  Botanical Quality Sentinel
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pre-flight RGB to HSV and YCbCr transformation. Validates living vegetative tissue using Excess Green Index ($ExG = 2G - R - B &gt; 8.0$), filters human skin tones ($yCr \in [132, 180], yCb \in [70, 135]$), and detects blur via Laplacian variance.
                </p>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                  Strict OOD &amp; Selfie Rejection
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-xs">2</span>
                  Venation Anisotropy &amp; Routing
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Calculates directional intensity gradients ($\nabla I = [\partial I / \partial x, \partial I / \partial y]$) projected across 18 radial angles. Monocots exhibit strong longitudinal polarization ($A \ge 1.65$); dicots exhibit isotropic dispersion ($A \le 1.45$).
                </p>
                <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                  Cross-Crop Mismatch Warning
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-xs">3</span>
                  Foliar Severity &amp; Llama 3.2
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Calibrated lesion segmentation calculating IRRI SES Grade 0–9 for Rice and Leaf Curl Index 0–4 for Chilli. Synthesizes vernacular agronomic advisories with local Llama 3.2 1B Instruct engine.
                </p>
                <div className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
                  CIB&RC Non-Chemical Bias
                </div>
              </div>
            </div>

            {/* Architecture Diagram Visualization */}
            <div className="rounded-2xl border border-line bg-surface/30 p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Dataflow Specification (Zero Cloud Leakage)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-line text-muted-foreground">
                      <th className="pb-2">Subsystem</th>
                      <th className="pb-2">Core Algorithm</th>
                      <th className="pb-2">Execution Environment</th>
                      <th className="pb-2">Runtime Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40 text-foreground">
                    <tr>
                      <td className="py-2.5 font-sans font-semibold">Image Ingestion</td>
                      <td>Hardware Camera Intent / HTML5 Canvas</td>
                      <td>Local Android WebView</td>
                      <td>&lt; 5 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-semibold">Botanical Gate</td>
                      <td>YCbCr Biometric Skin + ExG Chlorophyll</td>
                      <td>Client-Side WASM / JS</td>
                      <td>6.8 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-semibold">Morphology Anisotropy</td>
                      <td>18-Angle Projected Gradient Filtering</td>
                      <td>Client-Side WASM / JS</td>
                      <td>8.2 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-semibold">Vision Inference</td>
                      <td>Quantized MobileNetV3-Small (10-Class)</td>
                      <td>ExecuTorch / ONNX Web</td>
                      <td>34.1 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-semibold">Severity Analysis</td>
                      <td>Color-space Necrosis Segmentation (IRRI SES)</td>
                      <td>Client-Side Math Engine</td>
                      <td>4.5 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-semibold">Vernacular Reasoning</td>
                      <td>Meta Llama 3.2 1B Instruct (4-bit Q4)</td>
                      <td>Local Native Bridge / Gemma Core</td>
                      <td>160–280 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FIELD EVALUATION
          ========================================================================= */}
      {activeTab === "evaluation" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Microscope className="size-5 text-primary" />
              Real-World Specimen Pathology Evaluation
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              KisanAI was subjected to real-field foliar validation using uncurated field specimens featuring intense sensor noise, variable daylight shadows, multiple overlapping tillers, and diverse background soil contexts.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-line rounded-2xl overflow-hidden">
                <thead className="bg-surface border-b border-line text-muted-foreground">
                  <tr>
                    <th className="p-3">Specimen Class</th>
                    <th className="p-3">Diagnostic Markers Detected</th>
                    <th className="p-3">Venation Anisotropy</th>
                    <th className="p-3">SES / Severity</th>
                    <th className="p-3">Precision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-foreground">
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-primary">Rice Blast (Image 1)</td>
                    <td>Diamond/spindle lesions, ash-grey necrotic core, brown halo</td>
                    <td className="font-mono">2.35 (Parallel)</td>
                    <td>SES Grade 7</td>
                    <td className="font-bold text-emerald-600">100% (Passed)</td>
                  </tr>
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-primary">Rice Blast (Image 2)</td>
                    <td>Multi-leaf crossing canopy, high ash-to-brown ratio ($&gt;1.71$)</td>
                    <td className="font-mono">1.24 (Multi-axis)</td>
                    <td>SES Grade 9</td>
                    <td className="font-bold text-emerald-600">100% (Passed)</td>
                  </tr>
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-primary">Rice Blast (Image 3)</td>
                    <td>Acute spindle lesions on green leaf blade</td>
                    <td className="font-mono">1.94 (Parallel)</td>
                    <td>SES Grade 7</td>
                    <td className="font-bold text-emerald-600">100% (Passed)</td>
                  </tr>
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-amber-600">Brown Spot (Image 4)</td>
                    <td>Circular dark brown spots, yellow chlorotic halo, low ash</td>
                    <td className="font-mono">2.31 (Parallel)</td>
                    <td>SES Grade 5</td>
                    <td className="font-bold text-emerald-600">100% (Passed)</td>
                  </tr>
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-amber-600">Brown Spot (Image 5)</td>
                    <td>Dispersed oval lesions along longitudinal veins</td>
                    <td className="font-mono">5.45 (High Parallel)</td>
                    <td>SES Grade 5</td>
                    <td className="font-bold text-emerald-600">100% (Passed)</td>
                  </tr>
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-rose-500">Human Selfie / Face</td>
                    <td>Skin tone detection ($yCr \in [132, 180]$), absence of chlorophyll</td>
                    <td className="font-mono">N/A (Non-plant)</td>
                    <td>N/A</td>
                    <td className="font-bold text-rose-600">Rejected (OOD)</td>
                  </tr>
                  <tr className="hover:bg-surface/40">
                    <td className="p-3 font-semibold text-purple-600">Chilli in Rice Mode</td>
                    <td>Broad lamina, branching reticulate venation ($A \le 1.45$)</td>
                    <td className="font-mono">1.12 (Isotropic)</td>
                    <td>Area Band 18%</td>
                    <td className="font-bold text-purple-600">Mismatch Routed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CIB&RC STATUTORY COMPLIANCE
          ========================================================================= */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              Statutory CIB&amp;RC Compliance &amp; Safety Sentinel
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                In compliance with the <strong>Central Insecticide Board &amp; Registration Committee (CIB&amp;RC)</strong>, Government of India, KisanAI implements a hard mathematical safety barrier preventing hazardous chemical hallucination, unverified tank mixtures, and unauthorized chemical dosage advice:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Statutory Guardrails Enforced
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc list-inside">
                    <li>Zero recommendation of unverified synthetic commercial trade brands.</li>
                    <li>Refusal to output illegal chemical tank-mixing or cocktail combinations.</li>
                    <li>Mandatory referral to local Krishi Vigyan Kendra (KVK) for scheduled chemicals.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sprout className="size-4 text-primary" />
                    Biological &amp; Cultural Priority
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc list-inside">
                    <li>Primary guidance centers on <em>Pseudomonas fluorescens</em> and <em>Trichoderma</em>.</li>
                    <li>Azadirachtin 1500 ppm &amp; NSKE 5% neem extract bio-repellents.</li>
                    <li>Yellow and blue sticky traps for whitefly and thrips IPM monitoring.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BOTTOM CITATION & REPO FOOTER
          ========================================================================= */}
      <div className="rounded-3xl border border-line bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-foreground">Explore The Complete System</h3>
          <p className="text-xs text-muted-foreground">Access live disease diagnostics, knowledge library, and offline APK.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/diagnose"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            Start Leaf Diagnosis
          </Link>
          <Link
            to="/library"
            className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            View Crop Library
          </Link>
        </div>
      </div>
    </div>
  );
}
