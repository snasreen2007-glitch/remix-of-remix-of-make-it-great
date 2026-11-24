import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Eye,
  FileImage,
  FlaskConical,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  RefreshCw,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  SwitchCamera,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCropCare } from "../context";
import { crops, l, type CropKey, type Mode } from "../knowledge";
import {
  assessImage,
  compressPhoto,
} from "../services/quality";
import { diagnosisService } from "../services/diagnosis";
import { newId } from "../services/store";
import type { QualityReport, Scan } from "../services/types";
import {
  btn,
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  enter,
  Notice,
  PageHeader,
  SampleBadge,
} from "../ui";

type Step = "crop" | "type" | "capture" | "quality" | "model" | "analysing";

export function DiagnosePage() {
  const { t, lang, settings, addScan } = useCropCare();
  const navigate = useNavigate();

  // Search parameters if navigated from home quick actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const search: any = useSearch({ strict: false });

  const [step, setStep] = useState<Step>(() => {
    if (search?.crop && search?.mode) return "capture";
    if (search?.crop) return "type";
    return "crop";
  });

  const [selectedCrop, setSelectedCrop] = useState<CropKey>(
    search?.crop === "chilli" || search?.crop === "rice"
      ? search.crop
      : settings.crops[0] || "rice",
  );

  const [selectedMode, setSelectedMode] = useState<Mode>(
    search?.mode === "pest" ? "pest" : "disease",
  );

  // Photo capture states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment",
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Sample analysis walkthrough states
  const [analysisStep, setAnalysisStep] = useState(0);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start live camera
  const startCamera = async (facing: "environment" | "user" = cameraFacing) => {
    setCameraError(null);
    stopCamera();

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera access requires HTTPS or localhost. Tap 'Take Photo' below to use your native device camera."
        );
        setCameraActive(false);
        return;
      }

      // Try environment-facing camera first with flexible resolution constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback with minimal constraints for devices that reject specific resolution queries
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        video.muted = true;
        video.defaultMuted = true;
        video.onloadedmetadata = () => {
          video.play().catch((err) => console.warn("Video play error:", err));
        };
        if (video.readyState >= 2) {
          video.play().catch(() => {});
        }
      }
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn("Camera start failed:", err);
      setCameraError(
        "Camera stream not active. Tap 'Take Photo' to capture directly with your camera app."
      );
      setCameraActive(false);
    }
  };

  // Clean up camera when leaving capture step
  useEffect(() => {
    if (step === "capture" && !capturedImage) {
      void startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step, capturedImage, cameraFacing]);

  // Capture still from video stream, cropping strictly to the square reticle
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    let sx = 0;
    let sy = 0;
    let sSize = Math.min(vw, vh);

    const reticleEl = reticleRef.current;
    const videoEl = videoRef.current;

    if (reticleEl && videoEl && reticleEl.offsetWidth > 0 && videoEl.offsetWidth > 0) {
      const vRect = videoEl.getBoundingClientRect();
      const rRect = reticleEl.getBoundingClientRect();

      // CSS object-cover projection:
      // Map screen container coordinates to raw camera stream pixels
      const videoRatio = vw / vh;
      const containerRatio = vRect.width / Math.max(1, vRect.height);

      let displayedW: number;
      let displayedH: number;
      let offsetX: number;
      let offsetY: number;
      let screenToVideoScale: number;

      if (videoRatio > containerRatio) {
        // Video is wider than container; horizontal sides overflow and are cropped
        displayedH = vRect.height;
        displayedW = vRect.height * videoRatio;
        offsetX = (vRect.width - displayedW) / 2;
        offsetY = 0;
        screenToVideoScale = vh / Math.max(1, vRect.height);
      } else {
        // Video is taller than container; vertical top/bottom overflow and are cropped
        displayedW = vRect.width;
        displayedH = vRect.width / videoRatio;
        offsetX = 0;
        offsetY = (vRect.height - displayedH) / 2;
        screenToVideoScale = vw / Math.max(1, vRect.width);
      }

      // Reticle center mapped into the video coordinate frame
      const reticleCenterScreenX = (rRect.left + rRect.width / 2) - (vRect.left + offsetX);
      const reticleCenterScreenY = (rRect.top + rRect.height / 2) - (vRect.top + offsetY);

      const vidCx = reticleCenterScreenX * screenToVideoScale;
      const vidCy = reticleCenterScreenY * screenToVideoScale;

      const rawCropSize = Math.min(rRect.width, rRect.height) * screenToVideoScale;
      sSize = Math.max(64, Math.min(Math.floor(rawCropSize), vw, vh));

      sx = Math.max(0, Math.min(vw - sSize, Math.floor(vidCx - sSize / 2)));
      sy = Math.max(0, Math.min(vh - sSize, Math.floor(vidCy - sSize / 2)));
    } else {
      // Fallback: 70% of the shortest video dimension centered
      sSize = Math.round(Math.min(vw, vh) * 0.70);
      sx = Math.floor((vw - sSize) / 2);
      sy = Math.floor((vh - sSize) / 2);
    }

    const targetSize = Math.min(sSize, 960);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw only the cropped square area
    ctx.drawImage(video, sx, sy, sSize, sSize, 0, 0, targetSize, targetSize);
    stopCamera();

    compressPhoto(canvas)
      .then((dataUrl) => {
        setCapturedImage(dataUrl);
        runQualityAssessment(dataUrl);
      })
      .catch((err) => {
        console.error("Compression failed:", err);
        toast.error("Failed to process photo");
      });
  };

  // Drag and drop handlers for specimen images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file (JPG, PNG, WebP)");
      return;
    }

    stopCamera();
    compressPhoto(file)
      .then((dataUrl) => {
        setCapturedImage(dataUrl);
        runQualityAssessment(dataUrl);
      })
      .catch((err) => {
        console.error("Image loading failed:", err);
        toast.error("Invalid image format");
      });
  };

  // Handle file upload from gallery / disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    compressPhoto(file)
      .then((dataUrl) => {
        setCapturedImage(dataUrl);
        runQualityAssessment(dataUrl);
      })
      .catch((err) => {
        console.error("Image loading failed:", err);
        toast.error("Invalid image format");
      });
  };

  // Run mathematical image quality check and immediately start live model analysis
  const runQualityAssessment = async (dataUrl: string) => {
    setIsCheckingQuality(true);
    setStep("analysing");
    setAnalysisStep(1);

    // Progressive visual feedback for farmer while on-device vision model runs
    const t1 = setTimeout(() => setAnalysisStep(2), 400);
    const t2 = setTimeout(() => setAnalysisStep(3), 900);
    const t3 = setTimeout(() => setAnalysisStep(4), 1500);

    try {
      const [report, result] = await Promise.all([
        assessImage(dataUrl).catch(() => null),
        diagnosisService.diagnose({
          crop: selectedCrop,
          mode: selectedMode,
          image: dataUrl,
        }),
      ]);

      setQualityReport(report);
      setAnalysisStep(5);

      setTimeout(() => {
        // Enforce strict leaf validation: reject non-leaves, drawings, human faces, and OOD objects
        const leafCheck = report?.checks?.find((c) => c.id === "leaf");
        const isNonLeaf = leafCheck ? !leafCheck.pass : (result.diagnostics?.isCropValid === false);
        const isOOD = result.outcome === "unknown" || result.topicSlug === "unknown" || result.diagnostics?.isCropValid === false;
        const outcome = (!isNonLeaf && !isOOD && result.outcome === "identified" && Boolean(result.topicSlug)) ? "identified" : "unknown";

        const scan: Scan = {
          id: newId(),
          crop: selectedCrop,
          mode: selectedMode,
          createdAt: new Date().toISOString(),
          image: dataUrl,
          source: result.source,
          outcome,
          ...(outcome === "identified" && result.topicSlug ? { topicSlug: result.topicSlug } : {}),
          confidence: outcome === "identified" ? (result.confidence ?? 0.75) : (result.confidence ?? 0.15),
          candidates: result.candidates && result.candidates.length > 0 ? result.candidates : (result.topicSlug ? [{ slug: result.topicSlug, confidence: result.confidence ?? 0.3 }] : []),
          ...(outcome === "identified" && result.severity ? { severity: result.severity } : {}),
          ...(result.pestAnalysis ? { pestAnalysis: result.pestAnalysis } : {}),
          ...(result.nutritionAnalysis ? { nutritionAnalysis: result.nutritionAnalysis } : {}),
          ...(report ? { quality: report } : {}),
          diagnostics: result.diagnostics,
        };

        addScan(scan);
        void navigate({ to: "/scans/$scanId", params: { scanId: scan.id } });
      }, 700);
    } catch (err) {
      console.error("Diagnosis error:", err);
      // Fallback
      startSampleWalkthrough();
    } finally {
      setIsCheckingQuality(false);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    }
  };

  // Reset and take another photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setQualityReport(null);
    setStep("capture");
  };

  // Run on-device AI diagnosis walkthrough
  const startLiveDiagnosis = () => {
    if (!capturedImage) return;
    setStep("analysing");
    setAnalysisStep(1);

    const timeouts = [
      setTimeout(() => setAnalysisStep(2), 500),
      setTimeout(() => setAnalysisStep(3), 1100),
      setTimeout(() => setAnalysisStep(4), 1800),
      setTimeout(() => setAnalysisStep(5), 2400),
      setTimeout(async () => {
        try {
          const result = await diagnosisService.diagnose({
            crop: selectedCrop,
            mode: selectedMode,
            image: capturedImage,
          });

          const leafCheck = qualityReport?.checks?.find((c) => c.id === "leaf");
          const isNonLeaf = leafCheck ? !leafCheck.pass : (result.diagnostics?.isCropValid === false);
          const isOOD = result.outcome === "unknown" || result.topicSlug === "unknown" || result.diagnostics?.isCropValid === false;
          const outcome = (!isNonLeaf && !isOOD && result.outcome === "identified" && Boolean(result.topicSlug)) ? "identified" : "unknown";

          const scan: Scan = {
            id: newId(),
            crop: selectedCrop,
            mode: selectedMode,
            createdAt: new Date().toISOString(),
            image: capturedImage,
            source: result.source,
            outcome,
            ...(outcome === "identified" && result.topicSlug ? { topicSlug: result.topicSlug } : {}),
            confidence: outcome === "identified" ? (result.confidence ?? 0.75) : (result.confidence ?? 0.15),
            ...(result.confidenceStatus ? { confidenceStatus: result.confidenceStatus } : {}),
            ...(result.visibleEvidence ? { visibleEvidence: result.visibleEvidence } : {}),
            ...(result.insectDirectlyVisible !== undefined ? { insectDirectlyVisible: result.insectDirectlyVisible } : {}),
            ...(result.severityMethod ? { severityMethod: result.severityMethod } : {}),
            candidates: result.candidates && result.candidates.length > 0 ? result.candidates : (result.topicSlug ? [{ slug: result.topicSlug, confidence: result.confidence ?? 0.3 }] : []),
            ...(outcome === "identified" && result.severity ? { severity: result.severity } : {}),
            ...(result.pestAnalysis ? { pestAnalysis: result.pestAnalysis } : {}),
            ...(result.nutritionAnalysis ? { nutritionAnalysis: result.nutritionAnalysis } : {}),
            ...(result.cropMismatch ? { cropMismatch: result.cropMismatch } : {}),
            ...(qualityReport ? { quality: qualityReport } : {}),
            diagnostics: result.diagnostics,
          };

          addScan(scan);
          void navigate({ to: "/scans/$scanId", params: { scanId: scan.id } });
        } catch (err) {
          console.error("Diagnosis error:", err);
          startSampleWalkthrough();
        }
      }, 3000),
    ];

    return () => timeouts.forEach(clearTimeout);
  };

  // Run sample analysis animation then finish
  const startSampleWalkthrough = () => {
    if (!capturedImage) return;
    setStep("analysing");
    setAnalysisStep(1);

    const timeouts = [
      setTimeout(() => setAnalysisStep(2), 600),
      setTimeout(() => setAnalysisStep(3), 1300),
      setTimeout(() => setAnalysisStep(4), 2000),
      setTimeout(() => setAnalysisStep(5), 2700),
      setTimeout(() => {
        // Generate sample result
        const sample = diagnosisService.sample({
          crop: selectedCrop,
          mode: selectedMode,
          image: capturedImage,
        });

        const scan: Scan = {
          id: newId(),
          crop: selectedCrop,
          mode: selectedMode,
          createdAt: new Date().toISOString(),
          image: capturedImage,
          source: "sample",
          outcome: sample.outcome,
          ...(sample.topicSlug ? { topicSlug: sample.topicSlug } : {}),
          ...(sample.confidence !== undefined ? { confidence: sample.confidence } : {}),
          ...(sample.severity ? { severity: sample.severity } : {}),
          ...(qualityReport ? { quality: qualityReport } : {}),
        };

        addScan(scan);
        void navigate({ to: "/scans/$scanId", params: { scanId: scan.id } });
      }, 3400),
    ];

    return () => timeouts.forEach(clearTimeout);
  };

  // Save photo directly without diagnosis
  const saveWithoutDiagnosis = () => {
    if (!capturedImage) return;

    const scan: Scan = {
      id: newId(),
      crop: selectedCrop,
      mode: selectedMode,
      createdAt: new Date().toISOString(),
      image: capturedImage,
      source: "none",
      outcome: "unanalysed",
      ...(qualityReport ? { quality: qualityReport } : {}),
    };

    addScan(scan);
    void navigate({ to: "/scans/$scanId", params: { scanId: scan.id } });
  };

  // ==========================================
  // RENDER STEP 1: CHOOSE CROP
  // ==========================================
  if (step === "crop") {
    return (
      <div className={cn("space-y-6", enter)}>
        <PageHeader
          eyebrow="Step 1 of 3"
          title={t("whatGrowing")}
          sub={t("whatGrowingSub")}
          back
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {crops.map((crop) => {
            const isSelected = selectedCrop === crop.key;
            return (
              <button
                key={crop.key}
                type="button"
                onClick={() => {
                  setSelectedCrop(crop.key);
                  setStep("type");
                }}
                className={cn(
                  card,
                  "group relative overflow-hidden text-left transition-all hover:border-primary/50",
                  isSelected && "border-primary ring-2 ring-primary/40",
                )}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={crop.closeup}
                    alt={l(lang, crop.name)}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="image-scrim absolute inset-0" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                    <span className="on-image text-2xl font-bold">
                      {l(lang, crop.name)}
                    </span>
                    <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-1">
                      <ChevronRight className="size-5" />
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {crop.key === "rice" ? t("riceDesc") : t("chilliDesc")}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs font-semibold text-primary">
                    <span>{t("select")} {l(lang, crop.name)}</span>
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 2: CHOOSE PROBLEM TYPE
  // ==========================================
  if (step === "type") {
    const cropObj = crops.find((c) => c.key === selectedCrop) || crops[0]!;

    return (
      <div className={cn("space-y-6", enter)}>
        <button
          onClick={() => setStep("crop")}
          className="-ml-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Change crop ({l(lang, cropObj.name)})
        </button>

        <PageHeader
          eyebrow="Step 2 of 3"
          title={t("chooseType")}
          sub={`Select what symptoms you are observing on your ${l(lang, cropObj.name)} plant.`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Disease Detection Option */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode("disease");
              setStep("capture");
            }}
            className={cn(
              card,
              "group p-5 text-left transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99]",
              selectedMode === "disease" && "border-primary/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-xl bg-coral/15 text-coral">
                <Sparkles className="size-6" />
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground group-hover:border-primary group-hover:text-primary">
                Choose
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-foreground">
              {t("diseaseDetection")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("diseaseDetectionSub")}
            </p>

            <div className="mt-4 rounded-xl border border-line bg-surface/50 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Common signs:</p>
              <p className="mt-0.5">
                {selectedCrop === "rice"
                  ? "Spindle spots, brown patches, yellow leaf blight, sheath rot"
                  : "Leaf curl, dark spots on fruit, circular white powdery patches, dieback"}
              </p>
            </div>
          </button>

          {/* Pest Identification Option */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode("pest");
              setStep("capture");
            }}
            className={cn(
              card,
              "group p-5 text-left transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99]",
              selectedMode === "pest" && "border-primary/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-xl bg-amber/15 text-amber">
                <Bug className="size-6" />
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground group-hover:border-primary group-hover:text-primary">
                Choose
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-foreground">
              {t("pestIdentification")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("pestIdentificationSub")}
            </p>

            <div className="mt-4 rounded-xl border border-line bg-surface/50 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Common signs:</p>
              <p className="mt-0.5">
                {selectedCrop === "rice"
                  ? "Brown planthoppers at base, dead heart, folded leaves, silver shoot"
                  : "Thrips, mites on undersides, whiteflies, aphids, chewed leaves"}
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 3: CAPTURE / PHOTO INTAKE
  // ==========================================
  if (step === "capture") {
    const cropObj = crops.find((c) => c.key === selectedCrop) || crops[0]!;

    return (
      <div className={cn("space-y-5", enter)}>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep("type")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to options
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-foreground">
            <span className="size-2 rounded-full bg-primary" />
            {l(lang, cropObj.name)} · {t(selectedMode)}
          </span>
        </div>

        {/* Viewfinder Card with Drag & Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative overflow-hidden rounded-3xl border border-line bg-black shadow-2xl transition-all",
            isDraggingOver && "ring-4 ring-primary shadow-primary/30"
          )}
        >
          {/* Aspect Container */}
          <div className="relative aspect-[4/3] w-full max-h-[62vh] overflow-hidden bg-neutral-950 sm:aspect-[16/10]">
            {/* Video element remains unconditionally mounted in DOM so videoRef is ready on first start */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity duration-300",
                cameraActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none -z-10"
              )}
            />

            {!cameraActive && (
              <div className="flex size-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Camera className="size-12 text-primary/40" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {cameraError || t("camStarting")}
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Take a photo, choose an existing image, or drag & drop a file here.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className={cn(btnPrimary, "min-h-11 px-5 text-sm shadow-md shadow-primary/20")}
                  >
                    <Camera className="size-4" /> Take Photo with Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(btnSecondary, "min-h-11 px-5 text-sm")}
                  >
                    <Upload className="size-4" /> Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => void startCamera(cameraFacing)}
                    className={cn(btnGhost, "min-h-11 px-3 text-xs text-muted-foreground")}
                  >
                    <RefreshCw className="size-3.5" /> Try Live Stream
                  </button>
                </div>
              </div>
            )}

            {/* Framing reticle overlay for active camera (Cropped strictly to this square) */}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                <div
                  ref={reticleRef}
                  className="relative size-60 rounded-2xl border-2 border-dashed border-primary/70 sm:size-72"
                >
                  <span className="absolute -left-1 -top-1 size-5 rounded-tl-lg border-l-4 border-t-4 border-primary" />
                  <span className="absolute -right-1 -top-1 size-5 rounded-tr-lg border-r-4 border-t-4 border-primary" />
                  <span className="absolute -bottom-1 -left-1 size-5 rounded-bl-lg border-b-4 border-l-4 border-primary" />
                  <span className="absolute -bottom-1 -right-1 size-5 rounded-br-lg border-b-4 border-r-4 border-primary" />
                  <p className="absolute -top-7 inset-x-0 text-center font-mono text-[11px] font-semibold uppercase tracking-wider text-primary drop-shadow">
                    Align affected leaf · Square crop
                  </p>
                </div>
              </div>
            )}

            {/* Drag & drop active drop overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-sm animate-in fade-in">
                <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-bounce">
                  <Upload className="size-8" />
                </span>
                <p className="mt-4 text-lg font-bold text-white drop-shadow">
                  Drop Leaf Image Here
                </p>
                <p className="mt-1 text-xs text-neutral-300">
                  Instant offline AI diagnosis will start automatically
                </p>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/90 p-4 px-6 backdrop-blur">
            {/* Gallery input trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-12 place-items-center rounded-xl bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
              aria-label="Gallery"
              title="Upload photo from disk / gallery"
            >
              <ImageIcon className="size-5" />
            </button>

            {/* Shutter Button */}
            {cameraActive ? (
              <button
                type="button"
                onClick={captureFromVideo}
                className="grid size-18 place-items-center rounded-full bg-white p-1 shadow-lg shadow-white/20 transition-transform active:scale-95"
                aria-label={t("capture")}
                title="Capture & Crop to Viewfinder Square"
              >
                <span className="size-full rounded-full border-2 border-neutral-900 bg-primary" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-all"
                >
                  <Camera className="size-4" /> Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => void startCamera(cameraFacing)}
                  className="inline-flex min-h-12 items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 active:scale-95 transition-all"
                  title="Try live camera stream"
                >
                  <RefreshCw className="size-3.5" /> Live
                </button>
              </div>
            )}

            {/* Flip Camera */}
            <button
              type="button"
              onClick={() => {
                const next = cameraFacing === "environment" ? "user" : "environment";
                setCameraFacing(next);
                void startCamera(next);
              }}
              className="grid size-12 place-items-center rounded-xl bg-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
              aria-label="Flip camera"
            >
              <SwitchCamera className="size-5" />
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-4 sm:p-5 text-center transition-all shadow-sm",
            isDraggingOver
              ? "border-primary bg-primary/15 scale-[1.01] shadow-lg shadow-primary/20 ring-4 ring-primary/20"
              : "border-line bg-card hover:border-primary/50 hover:bg-surface/80"
          )}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <div className={cn(
              "grid size-11 place-items-center rounded-2xl transition-all shadow-xs",
              isDraggingOver ? "bg-primary text-primary-foreground scale-110" : "bg-primary/10 text-primary group-hover:scale-105"
            )}>
              <Upload className="size-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                <span>{isDraggingOver ? "Release to drop & diagnose leaf" : "Drag & drop leaf photo here, or browse files"}</span>
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">DRAG & DROP</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drop your photo here from computer or gallery · 100% On-device offline MobileNetV3 diagnosis
              </p>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Native Mobile Camera Input */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Photography Coaching Tips Card */}
        <div className="rounded-2xl border border-line bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="flex items-center gap-1.5 font-bold text-foreground">
            <Lightbulb className="size-4 text-amber" /> Field Photography Tips
          </p>
          <ul className="mt-2 space-y-1.5 pl-5 list-disc text-muted-foreground">
            <li>{t("camTip1")}</li>
            <li>{t("camTip2")}</li>
            <li>{t("camTip3")}</li>
          </ul>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 4: IMAGE QUALITY CHECK
  // ==========================================
  if (step === "quality") {
    return (
      <div className={cn("space-y-6", enter)}>
        <PageHeader
          eyebrow="Verification"
          title={t("previewTitle")}
          sub="Checking image sharpness, illumination and subject clarity."
        />

        {/* Captured image display with quality metrics */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured crop"
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <div className="p-3 text-center border-t border-line">
              <button
                type="button"
                onClick={retakePhoto}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" /> {t("retake")}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className={cn(card, "p-5")}>
              <h3 className="font-bold text-base text-foreground">
                {t("checking")}
              </h3>

              {isCheckingQuality ? (
                <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
                  <RefreshCw className="size-7 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Calculating sharpness and contrast metrics...
                  </p>
                </div>
              ) : qualityReport ? (
                <div className="mt-4 space-y-3">
                  {qualityReport.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={cn(
                        "rounded-xl border p-3 text-xs leading-relaxed transition-all",
                        chk.pass
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-amber/30 bg-amber/10 text-amber",
                      )}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          {chk.pass ? (
                            <CheckCircle2 className="size-4 text-primary" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber" />
                          )}
                          {chk.id === "blur"
                            ? t("qBlur")
                            : chk.id === "dark"
                              ? t("qDark")
                              : chk.id === "subject"
                                ? t("qSubject")
                                : t("qSuit")}
                        </span>
                        <span>{chk.pass ? t("qPass") : t("qFail")}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{chk.tip}</p>
                    </div>
                  ))}

                  {/* Summary metric numbers */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono text-[11px] text-muted-foreground">
                    <div className="rounded-lg bg-surface p-2">
                      <span className="block text-[10px] uppercase text-subtle">
                        Sharpness
                      </span>
                      <span className="font-semibold text-foreground">
                        {qualityReport.sharpness}
                      </span>
                    </div>
                    <div className="rounded-lg bg-surface p-2">
                      <span className="block text-[10px] uppercase text-subtle">
                        Light
                      </span>
                      <span className="font-semibold text-foreground">
                        {qualityReport.brightness}
                      </span>
                    </div>
                    <div className="rounded-lg bg-surface p-2">
                      <span className="block text-[10px] uppercase text-subtle">
                        Contrast
                      </span>
                      <span className="font-semibold text-foreground">
                        {qualityReport.contrast}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Quality report unavailable.
                </p>
              )}
            </div>

            {/* Quality check actions */}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={retakePhoto}
                className={cn(btnSecondary, "flex-1 min-h-12")}
              >
                <RotateCcw className="size-4" /> {t("retake")}
              </button>
              <button
                type="button"
                onClick={startLiveDiagnosis}
                disabled={isCheckingQuality}
                className={cn(btnPrimary, "flex-1 min-h-12")}
              >
                {t("analyse")} <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 5: MODEL STATUS & EXECUTION
  // ==========================================
  if (step === "model") {
    return (
      <div className={cn("space-y-6 max-w-xl mx-auto", enter)}>
        <PageHeader
          eyebrow="Diagnostic Engine"
          title="On-Device AI Connected"
          sub="MobileNetV3-Small vision model and Llama 3.2 1B are ready on this device."
        />

        <div className="space-y-4">
          {/* Card 1: Live AI Diagnosis */}
          <div className={cn(card, "p-6 border-primary/40 bg-card hover:border-primary transition-all")}>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    Run On-Device Diagnosis
                  </h3>
                  <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Active
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Execute transfer-learned MobileNetV3 pathology & IRRI SES severity estimation.
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Instant on-device vision inference with offline Llama 3.2 multilingual agronomic report.
            </p>

            <button
              type="button"
              onClick={startLiveDiagnosis}
              className={cn(btnPrimary, "mt-5 w-full min-h-12")}
            >
              Analyze Leaf Specimen <ArrowRight className="size-4" />
            </button>
          </div>

          {/* Card 2: Save photo only */}
          <div className={cn(card, "p-6")}>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-surface text-muted-foreground">
                <FileImage className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("savePhotoOnly")}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Keep this photo in your scan history without AI analysis.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t("unanalysedSub")}
            </p>

            <button
              type="button"
              onClick={saveWithoutDiagnosis}
              className={cn(btnSecondary, "mt-5 w-full min-h-12")}
            >
              {t("savePhotoOnly")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 6: SAMPLE WALKTHROUGH ANIMATION
  // ==========================================
  if (step === "analysing") {
    const steps = [
      { num: 1, label: t("step1") },
      { num: 2, label: t("step2") },
      { num: 3, label: t("step3") },
      { num: 4, label: t("step4") },
      { num: 5, label: t("step5") },
    ];

    return (
      <div className={cn("max-w-md mx-auto py-8 text-center space-y-6", enter)}>
        <span className="grid size-16 mx-auto place-items-center rounded-2xl bg-primary/15 text-primary animate-pulse">
          <Cpu className="size-8" />
        </span>

        <div>
          <span className="inline-block"><SampleBadge /></span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {t("analysing")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("analysingSub")}
          </p>
        </div>

        <div className={cn(card, "p-4 space-y-3 text-left divide-y divide-line")}>
          {steps.map((st) => {
            const isDone = analysisStep > st.num;
            const isCurrent = analysisStep === st.num;

            return (
              <div
                key={st.num}
                className={cn(
                  "flex items-center gap-3 pt-3 first:pt-0 transition-opacity",
                  analysisStep < st.num ? "opacity-40" : "opacity-100",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold font-mono",
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary/20 text-primary ring-2 ring-primary animate-pulse"
                        : "bg-surface text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-4" /> : st.num}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary font-bold" : "text-foreground",
                  )}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
