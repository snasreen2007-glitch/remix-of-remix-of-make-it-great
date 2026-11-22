import { useState } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  WifiOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCropCare } from "../context";
import { isNativeApp } from "../services/native";

export const APK_FILE_SIZE = "396.6 MB";
export const APK_SHA256 = "64a4c241d855aeb2f515a3c29c88fbe00f0459049f6b84e6e0df86511d05075c";
export const CLOUD_APK_DOWNLOAD_URL =
  "https://github.com/Ayubshaik01/remix-of-remix-of-make-it-great/releases/download/v1.0.0/kisanai-offline-ai.apk";

export function getApkDownloadUrl(): string {
  return CLOUD_APK_DOWNLOAD_URL;
}

export function triggerApkDownload(e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
  }
  const url = getApkDownloadUrl();
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}

export const APK_DOWNLOAD_URL = CLOUD_APK_DOWNLOAD_URL;

export function DownloadAppCard({ className }: { className?: string }) {
  const { t } = useCropCare();
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const isInsideAndroidApp = isNativeApp();

  const handleCopyHash = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(APK_SHA256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isInsideAndroidApp) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-6 text-foreground shadow-xs",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Native Android App Active
            </h3>
            <p className="text-xs text-muted-foreground">
              You are running the verified offline KisanAI release with on-device PyTorch &amp; Llama 3.2 1B engines.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/15 p-6 sm:p-8 shadow-forest transition-all",
        className
      )}
    >
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Smartphone className="size-3.5" />
            Official Android Release · v1.0
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            CIB&amp;RC Safety Compliant
          </span>
        </div>

        <div className="mt-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("downloadApp")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-2xl">
            {t("downloadAppSub")}
          </p>
        </div>

        {/* Highlight Feature Badges */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-surface/80 p-2.5 border border-line">
            <Cpu className="size-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">MobileNetV3 Small</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-surface/80 p-2.5 border border-line">
            <Sparkles className="size-4 text-amber-500 shrink-0" />
            <span className="font-medium text-foreground">Llama 3.2 1B On-Device</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-surface/80 p-2.5 border border-line">
            <WifiOff className="size-4 text-sky-500 shrink-0" />
            <span className="font-medium text-foreground">100% Airplane Mode</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-surface/80 p-2.5 border border-line">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span className="font-medium text-foreground">Zero Cloud Dependency</span>
          </div>
        </div>

        {/* Action Button & Instructions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isNativeApp() ? (
            <div className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 px-6 py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
              <span>Installed on this Device (Offline Active)</span>
            </div>
          ) : (
            <a
              href={getApkDownloadUrl()}
              onClick={triggerApkDownload}
              download="kisanai-offline-ai.apk"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="size-5" />
              {t("downloadApkBtn")}
            </a>
          )}

          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-line bg-card/80 px-4 py-3.5 text-xs font-semibold text-foreground hover:bg-accent/60 transition-colors"
          >
            Installation Guide
            {showInstructions ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {/* Collapsible Installation Guide */}
        {showInstructions && (
          <div className="mt-5 space-y-3 rounded-2xl border border-line bg-surface/60 p-4 text-xs text-foreground animate-in fade-in duration-200">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <Smartphone className="size-4 text-primary" />
              Easy 3-Step Phone Installation:
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground leading-relaxed">
              <li>
                Tap <strong className="text-foreground">Download Offline APK</strong> above. The {APK_FILE_SIZE} package will save to your downloads.
              </li>
              <li>
                Open your phone’s <strong className="text-foreground">Files</strong> or <strong className="text-foreground">Downloads</strong> app and tap <code className="bg-canvas px-1 rounded">kisanai-offline-ai.apk</code>.
              </li>
              <li>
                If prompted, tap <strong className="text-foreground">Allow from this source</strong> or <strong className="text-foreground">Install anyway</strong> to install the offline release.
              </li>
            </ol>
            <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="font-mono truncate max-w-xs sm:max-w-md">
                SHA-256: {APK_SHA256.slice(0, 16)}...{APK_SHA256.slice(-8)}
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy Full Hash"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Decorative blurred background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 size-80 rounded-full bg-primary/10 blur-3xl"
      />
    </div>
  );
}

