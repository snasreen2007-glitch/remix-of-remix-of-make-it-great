import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  Database,
  Eye,
  Leaf,
  MapPin,
  MessageCircle,
  ScanLine,
  Sparkles,
  WifiOff,
  CloudSun,
  Calculator,
  TrendingUp,
  Store,
  Download,
} from "lucide-react";
import { useCropCare } from "../context";
import { crops, getTopic, l, type CropKey } from "../knowledge";
import { LiveWeatherCard } from "../ui/LiveWeatherCard";
import { DownloadAppCard, getApkDownloadUrl, triggerApkDownload } from "../ui/DownloadAppCard";
import { isNativeApp } from "../services/native";
import {
  btnPrimary,
  btnSecondary,
  card,
  enter,
  PageHeader,
  ScanRow,
  Section,
} from "../ui";
import { cn } from "@/lib/utils";

export function HomePage() {
  const { t, settings, lang, scans, online } = useCropCare();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hour = mounted ? new Date().getHours() : 12;
  const greeting =
    hour < 12
      ? t("goodMorning")
      : hour < 17
        ? t("goodAfternoon")
        : t("goodEvening");

  const displayName = settings.name?.trim() || "";
  const recentScans = scans.slice(0, 3);
  const activeCrops = crops.filter((c) => settings.crops.includes(c.key));

  return (
    <div className={cn("space-y-8", enter)}>
      {/* Top Banner / Farm Location & Season Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground sm:text-sm">
          <span
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary"
          >
            <MapPin className="size-3.5" />
            {settings.district}, {settings.state}
          </span>
          <span
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1"
          >
            <Calendar className="size-3.5 text-muted-foreground" />
            {t(settings.season)} season
          </span>
          <span
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1"
          >
            {online ? (
              <span className="size-2 rounded-full bg-primary" />
            ) : (
              <WifiOff className="size-3.5 text-amber" />
            )}
            {online ? t("offlineReady") : t("offlineNow").split(".")[0]}
          </span>
        </div>

        <Link
          to="/profile"
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          {t("navProfile")} →
        </Link>
      </div>

      {/* Greeting and Hero Scan Call to Action */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 p-6 shadow-forest sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <Leaf className="size-3.5" />
            {t("homeTag")}
          </p>
          <h1
            suppressHydrationWarning
            className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {greeting}
            {displayName ? `, ${displayName}` : ""}.
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("heroSub")}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/diagnose"
              className={cn(
                btnPrimary,
                "h-12 px-6 text-base font-bold shadow-lg shadow-primary/20",
              )}
            >
              <ScanLine className="size-5" />
              {t("scanCrop")}
            </Link>
            <Link to="/library" className={cn(btnSecondary, "h-12 px-5")}>
              <BookOpen className="size-5 text-muted-foreground" />
              {t("exploreLibrary")}
            </Link>
            {isNativeApp() ? (
              <div
                className={cn(
                  btnSecondary,
                  "h-12 px-5 font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 cursor-default",
                )}
                title="KisanAI Native Android App is running offline"
              >
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                <span>App Installed & Offline</span>
              </div>
            ) : (
              <a
                href={getApkDownloadUrl()}
                onClick={triggerApkDownload}
                download="kisanai-offline-ai.apk"
                className={cn(
                  btnSecondary,
                  "h-12 px-5 font-bold border-primary/40 text-primary hover:bg-primary/10 transition-all cursor-pointer",
                )}
                title="Download KisanAI Offline Android APK (~396.6 MB)"
              >
                <Download className="size-5" />
                Download APK
              </a>
            )}
          </div>
        </div>

        {/* Decorative background element */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 size-80 rounded-full bg-primary/10 blur-3xl"
        />
      </div>

      {/* Live Cinematic Agricultural Weather Experience */}
      <LiveWeatherCard />

      {/* Quick Actions Grid */}
      <Section title={t("quickActions")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            to="/diagnose"
            search={{ mode: "disease" }}
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.98]",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-coral/15 text-coral">
              <Sparkles className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("qaDisease")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Spots, blight, mildew
              </span>
            </div>
          </Link>

          <Link
            to="/diagnose"
            search={{ mode: "pest" }}
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.98]",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-amber/15 text-amber">
              <Bug className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("qaPest")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Insects, leaf damage
              </span>
            </div>
          </Link>

          <Link
            to="/diagnose"
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.98]",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Activity className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("qaSeverity")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Damage area assessment
              </span>
            </div>
          </Link>

          <Link
            to="/assistant"
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.98]",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-surface text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("qaAssistant")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Offline AI questions
              </span>
            </div>
          </Link>
        </div>
      </Section>

      {/* Advanced Agricultural Tools */}
      <Section title={t("agronomicTools")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            to="/weather"
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-sky-500/50 hover:bg-sky-50/20 active:scale-[0.98] dark:hover:bg-sky-950/20",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <CloudSun className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("navWeather")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("weatherDesc")}
              </span>
            </div>
          </Link>

          <Link
            to="/calculator"
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-50/20 active:scale-[0.98] dark:hover:bg-emerald-950/20",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Calculator className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("navCalculator")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("fertilizerDesc")}
              </span>
            </div>
          </Link>

          <Link
            to="/yield-estimator"
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-amber-500/50 hover:bg-amber-50/20 active:scale-[0.98] dark:hover:bg-amber-950/20",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <TrendingUp className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("navYield")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("yieldDesc")}
              </span>
            </div>
          </Link>

          <Link
            to="/market"
            className={cn(
              card,
              "group flex flex-col justify-between p-4 transition-all hover:border-purple-500/50 hover:bg-purple-50/20 active:scale-[0.98] dark:hover:bg-purple-950/20",
            )}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Store className="size-5" />
            </span>
            <div className="mt-4">
              <span className="block text-sm font-bold text-foreground">
                {t("navMarket")}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t("marketDesc")}
              </span>
            </div>
          </Link>
        </div>
      </Section>

      {/* My Crops Section */}
      <Section
        title={t("myCrops")}
        action={
          <Link
            to="/library"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("seeAll")}
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {activeCrops.map((crop) => (
            <div
              key={crop.key}
              className={cn(
                card,
                "relative overflow-hidden transition-all hover:border-primary/40",
              )}
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={crop.closeup}
                  alt={l(lang, crop.name)}
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                  width={640}
                  height={360}
                />
                <div className="image-scrim absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="on-image text-2xl font-bold">
                        {l(lang, crop.name)}
                      </h3>
                      <p className="on-image-muted text-xs">
                        {t(settings.season)} season · {crop.stages.length}{" "}
                        growth stages
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {l(lang, crop.description)}
                </p>

                {/* Weekly Check Highlight */}
                <div className="rounded-xl border border-line bg-surface/50 p-3 text-xs leading-relaxed">
                  <p className="font-semibold text-foreground">
                    Recommended check this week:
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {crop.weeklyChecks[0]}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to="/diagnose"
                    search={{ crop: crop.key }}
                    className={cn(
                      btnPrimary,
                      "min-h-10 flex-1 text-xs font-bold",
                    )}
                  >
                    <ScanLine className="size-4" />
                    {t("diagnose")} {l(lang, crop.name)}
                  </Link>
                  <Link
                    to="/library"
                    search={{ crop: crop.key }}
                    className={cn(btnSecondary, "min-h-10 px-3 text-xs")}
                  >
                    <Compass className="size-4" />
                    {t("explore")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Recent Scans Section */}
      <Section
        title={t("recentActivity")}
        action={
          scans.length > 0 ? (
            <Link
              to="/history"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("seeAll")} ({scans.length})
            </Link>
          ) : null
        }
      >
        {recentScans.length > 0 ? (
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <ScanRow key={scan.id} scan={scan} />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              card,
              "flex flex-col items-center justify-center p-8 text-center",
            )}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ScanLine className="size-7" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t("noScans")}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("noScansSub")}
            </p>
            <Link to="/diagnose" className={cn(btnPrimary, "mt-5 min-h-11 px-5")}>
              <ScanLine className="size-4" />
              {t("diagnoseCrop")}
            </Link>
          </div>
        )}
      </Section>

      {/* Seasonal Field Guide Insights */}
      <Section title={t("insights")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/library/$crop/$slug"
            params={{ crop: "rice", slug: "rice-blast" }}
            className={cn(
              card,
              "group p-4 transition-all hover:border-primary/50 hover:bg-accent/30",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-coral/15 px-2 py-0.5 text-xs font-bold uppercase text-coral">
                High risk
              </span>
              <span className="text-xs text-muted-foreground">
                Rice · Kharif
              </span>
            </div>
            <h4 className="mt-2 text-base font-bold text-foreground group-hover:text-primary">
              Rice Blast (Pyricularia oryzae)
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              Spindle-shaped lesions with grey or whitish centres and brown
              margins on leaves and neck nodes during rainy humid weather.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Read guide <ChevronRight className="size-3.5" />
            </span>
          </Link>

          <Link
            to="/library/$crop/$slug"
            params={{ crop: "chilli", slug: "leaf-curl" }}
            className={cn(
              card,
              "group p-4 transition-all hover:border-primary/50 hover:bg-accent/30",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber/15 px-2 py-0.5 text-xs font-bold uppercase text-amber">
                Watch weekly
              </span>
              <span className="text-xs text-muted-foreground">
                Chilli · Vegetative
              </span>
            </div>
            <h4 className="mt-2 text-base font-bold text-foreground group-hover:text-primary">
              Chilli Leaf Curl & Vector Pests
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              Leaves curl upwards or downwards with puckering. Transmitted by
              sap-feeding whiteflies and thrips on young growing tips.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Read guide <ChevronRight className="size-3.5" />
            </span>
          </Link>
        </div>
      </Section>

      {/* Official Android Offline APK Download Card */}
      <DownloadAppCard />

      {/* Truthful Offline System Capabilities info */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/30 p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="size-4" />
          </span>
          <div>
            <p className="font-semibold text-foreground">
              Offline System Ready
            </p>
            <p className="text-[11px] text-muted-foreground">
              Knowledge library, scan history, notes and image quality check work
              on this device.
            </p>
          </div>
        </div>
        <Link
          to="/profile/offline"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          {t("modelInfo")} <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

