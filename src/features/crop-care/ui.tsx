import { Link, useRouter, type LinkProps } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Bookmark, BookmarkCheck, ChevronRight, FlaskConical, Search, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useCropCare } from "./context";
import type { Key } from "./i18n";
import { getTopic, l, type CropKey, type Topic } from "./knowledge";
import { confidenceLevel, severityLabel } from "./services/diagnosis";
import type { Band, SavedKind, Scan, SeverityResult } from "./services/types";

export const enter = "animate-in fade-in slide-in-from-bottom-2 duration-300";
export const btn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50";
export const btnPrimary = cn(btn, "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_24px_-12px] shadow-primary/60");
export const btnSecondary = cn(btn, "border border-border bg-card text-foreground hover:bg-accent");
export const btnGhost = cn(btn, "text-muted-foreground hover:bg-accent hover:text-foreground");
export const card = "rounded-2xl border border-line bg-card";

export function BackButton({ label }: { label?: string }) {
  const router = useRouter();
  const { t } = useCropCare();
  return (
    <button onClick={() => router.history.back()} className="-ml-2 mb-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> {label ?? t("back")}
    </button>
  );
}

export function PageHeader({ eyebrow, title, sub, action, back }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode; back?: boolean }) {
  return (
    <header className={cn("mb-6", enter)}>
      {back && <BackButton />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
          <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight text-balance sm:text-4xl">{title}</h1>
          {sub && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mt-8", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-end justify-between gap-3">
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className={cn(card, "flex flex-col items-center px-6 py-12 text-center")}>
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-6" /></span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", icon: Icon = AlertTriangle, title, children }: { tone?: "info" | "warn" | "danger" | "sample"; icon?: LucideIcon; title?: string; children: ReactNode }) {
  const tones = {
    info: "border-line bg-surface text-foreground [&_svg]:text-primary",
    warn: "border-amber/30 bg-amber/10 [&_svg]:text-amber",
    danger: "border-coral/30 bg-coral/10 [&_svg]:text-coral",
    sample: "border-amber/30 bg-amber/10 [&_svg]:text-amber",
  };
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", tones[tone])}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{title && <p className="font-semibold">{title}</p>}<div className="text-muted-foreground">{children}</div></div>
    </div>
  );
}

export function SampleBadge() {
  const { t } = useCropCare();
  return <span className="inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber"><FlaskConical className="size-3" />{t("sample")}</span>;
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cn("min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors", active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-12 items-center gap-2.5 rounded-xl border border-border bg-card px-4 focus-within:border-primary">
      <Search className="size-4 text-muted-foreground" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle" />
    </label>
  );
}

export const bandKey: Record<Band, Key> = { mild: "mild", moderate: "moderate", severe: "severe" };
export const bandColor: Record<Band, string> = { mild: "text-leaf", moderate: "text-amber", severe: "text-coral" };
const bandBg: Record<Band, string> = { mild: "bg-leaf", moderate: "bg-amber", severe: "bg-coral" };

export function SeverityMeter({ severity, large }: { severity: SeverityResult; large?: boolean }) {
  const { t } = useCropCare();
  const band: Band = severity.band || (severity.areaPercent && severity.areaPercent > 25 ? "severe" : severity.areaPercent && severity.areaPercent > 10 ? "moderate" : "mild");
  const pct = severity.scale === "area-band" ? Math.min(100, (severity.areaPercent ?? severity.score ?? 15) * 2) : severity.max ? ((severity.score || 0) / severity.max) * 100 : 25;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <span className={cn("font-bold tabular-nums tracking-tight", large ? "text-5xl" : "text-2xl", bandColor[band] || "text-amber")}>{severityLabel(severity)}</span>
        <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", bandColor[band] || "text-amber", "bg-current/10")}><span className="text-current">{t(bandKey[band] || "moderate")}</span></span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-700", bandBg[band] || "bg-amber")} style={{ width: `${Math.max(6, Math.min(100, pct || 15))}%` }} />
      </div>
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const { t } = useCropCare();
  const level = confidenceLevel(value);
  const label = level === "high" ? t("highConf") : level === "moderate" ? t("modConf") : t("lowConf");
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm"><span className="font-semibold">{label}</span><span className="tabular-nums text-muted-foreground">{Math.round(value * 100)}%</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} /></div>
    </div>
  );
}

export function TopicRow({ topic }: { topic: Topic }) {
  const { lang, t } = useCropCare();
  return (
    <Link to="/library/$crop/$slug" params={{ crop: topic.crop, slug: topic.slug }} className={cn(card, "group flex items-center gap-3 p-4 transition-colors hover:border-primary/40")}>
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold uppercase", topic.kind === "disease" ? "bg-coral/12 text-coral" : "bg-amber/12 text-amber")}>{topic.kind === "disease" ? "Dx" : "Px"}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{l(lang, topic.name)}</span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{t(topic.crop)} · {t(topic.kind)} · {l(lang, topic.summary)}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function scanTitle(scan: Scan, lang: Parameters<typeof l>[0], t: (k: Key) => string): string {
  if (scan.outcome === "unanalysed") return t("unanalysedTitle");
  if (scan.outcome === "unknown") {
    const isHuman = scan.quality?.checks?.find((c) => c.id === "leaf")?.tip?.includes("Human face");
    if (isHuman) return lang === "te" ? "మనిషి ముఖం లేదా చర్మం గుర్తించబడింది" : lang === "hi" ? "मानव चेहरा या त्वचा पहचानी गई" : "Non-Crop: Human Face Detected";
    const isWall = scan.quality?.checks?.find((c) => c.id === "leaf")?.tip?.includes("Indoor wall");
    if (isWall) return lang === "te" ? "గోడ అలంకరణ / అసలైన పంట కాదు" : lang === "hi" ? "दीवार की सजावट / गैर-फसल वस्तु" : "Indoor Wall Decor / Non-Crop";
    const isNonLeaf = scan.quality ? scan.quality.checks.find((c) => c.id === "leaf")?.pass === false : false;
    return isNonLeaf ? t("oodTitle") : t("inconclusiveScanTitle");
  }
  const topic = scan.topicSlug ? getTopic(scan.crop, scan.topicSlug) : undefined;
  if (topic) return l(lang, topic.name);
  if (scan.topicSlug) {
    return scan.topicSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return lang === "te" ? "పరీక్షించిన పంట స్కాన్" : lang === "hi" ? "जाँची गई फसल स्कैन" : "Diagnosed Crop Scan";
}

export function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-IN" : `${lang}-IN`, { day: "numeric", month: "short", year: "numeric" });
}

export function ScanRow({ scan, grid }: { scan: Scan; grid?: boolean }) {
  const { lang, t } = useCropCare();
  const sev = scan.severity;
  const isUnknown = scan.outcome === "unknown";
  return (
    <Link to="/scans/$scanId" params={{ scanId: scan.id }} className={cn(card, "group overflow-hidden transition-colors hover:border-primary/40", grid ? "block" : "flex items-center gap-3 p-3")}>
      <img src={scan.image} alt="" className={cn("object-cover", grid ? "aspect-[4/3] w-full" : "size-16 shrink-0 rounded-xl")} />
      <div className={cn("min-w-0 flex-1", grid && "p-3")}>
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{scanTitle(scan, lang, t)}</p>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{t(scan.crop)} · {fmtDate(scan.createdAt, lang)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {scan.source === "sample" && <SampleBadge />}
          {isUnknown ? (
            <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {t("needsRetakeBadge")}
            </span>
          ) : sev ? (
            <span className={cn("text-xs font-semibold", bandColor[sev.band])}>{t(bandKey[sev.band])} · {severityLabel(sev)}</span>
          ) : (
            <span className="text-xs text-subtle">{t("notAssessed")}</span>
          )}
        </div>
      </div>
      {!grid && <ChevronRight className="size-4 shrink-0 text-subtle" />}
    </Link>
  );
}

export function SaveButton({ kind, crop, slug, scanId, compact }: { kind: SavedKind; crop: CropKey; slug?: string; scanId?: string; compact?: boolean }) {
  const { isSaved, toggleSaved, t } = useCropCare();
  const key = { crop, ...(slug ? { slug } : {}), ...(scanId ? { scanId } : {}) };
  const on = isSaved(kind, key);
  const Icon = on ? BookmarkCheck : Bookmark;
  return (
    <button
      onClick={() => { const added = toggleSaved(kind, key); toast.success(added ? t("saved") : t("remove")); }}
      aria-pressed={on}
      aria-label={on ? t("saved") : t("save")}
      className={cn(compact ? "grid size-11 place-items-center rounded-xl border border-border bg-card" : btnSecondary, on && "border-primary/50 text-primary")}
    >
      <Icon className="size-5" />{!compact && (on ? t("saved") : t("save"))}
    </button>
  );
}

export function Confirm({ trigger, title, body, confirmLabel, onConfirm, destructive = true }: { trigger: ReactNode; title: string; body: string; confirmLabel: string; onConfirm: () => void; destructive?: boolean }) {
  const { t } = useCropCare();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{body}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={cn("min-h-11", destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ListCard({ items, ordered }: { items?: string[] | null; ordered?: boolean }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;
  return (
    <ul className={cn(card, "divide-y divide-line")}>
      {safeItems.map((item, i) => (
        <li key={`${i}-${item}`} className="flex gap-3 p-4 text-[15px] leading-relaxed">
          {ordered ? <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span> : <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NavRow({ to, icon: Icon, label, detail }: { to: NonNullable<LinkProps["to"]>; icon: LucideIcon; label: string; detail?: string }) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
      <span className="grid size-9 place-items-center rounded-lg bg-surface text-primary"><Icon className="size-[18px]" /></span>
      <span className="min-w-0 flex-1"><span className="block font-medium">{label}</span>{detail && <span className="block truncate text-sm text-muted-foreground">{detail}</span>}</span>
      <ChevronRight className="size-4 text-subtle" />
    </Link>
  );
}
