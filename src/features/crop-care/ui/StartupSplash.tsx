import { useEffect, useState } from "react";
import { Leaf, Sparkles, ShieldCheck, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

let hasShownSplash = false;

export function StartupSplash() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(!hasShownSplash);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (hasShownSplash) {
      setVisible(false);
      return;
    }
    hasShownSplash = true;
    setMounted(true);

    // Fast progressive progress animation
    const p1 = setTimeout(() => setProgress(55), 200);
    const p2 = setTimeout(() => setProgress(88), 450);
    const p3 = setTimeout(() => setProgress(100), 750);

    // Start fade out after initialization completes
    const tFade = setTimeout(() => {
      setFading(true);
    }, 900);

    // Complete removal from DOM
    const tRemove = setTimeout(() => {
      setVisible(false);
    }, 1250);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(tFade);
      clearTimeout(tRemove);
    };
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas/95 backdrop-blur-2xl transition-opacity duration-350 ease-out select-none",
        fading ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      )}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Glowing Logo */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
          <img
            src="/icon-192.png"
            alt="KisanAI"
            className="relative size-20 rounded-3xl object-contain shadow-[0_10px_35px_-8px] shadow-emerald-950/50 bg-[#eae6db] p-1.5"
          />
        </div>

        {/* Brand Title */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-foreground font-apple">
            Kisan <span className="text-primary font-black">AI</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c57833] dark:text-amber-400">
            Smarter Ways, Richer Harvests
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Offline Vision &amp; Local Agronomic Reasoning
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-48 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>READYING OFFLINE AI</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-2">
          <span className="inline-flex items-center gap-1">
            <Cpu className="size-3 text-primary" /> MobileNetV3
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500" /> Llama 3.2
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-500" /> 100% Offline
          </span>
        </div>
      </div>
    </div>
  );
}

