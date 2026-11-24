import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Bookmark,
  CircleHelp,
  CloudSun,
  History,
  Home,
  Leaf,
  Menu,
  MessageCircle,
  Moon,
  ScanLine,
  ShieldCheck,
  Sun,
  UserRound,
  WifiOff,
  Calculator,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Download,
  Smartphone,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCropCare } from "./context";
import { langs, type Lang } from "./i18n";
import { getApkDownloadUrl, triggerApkDownload } from "./ui/DownloadAppCard";
import { PrivacyConsentBanner } from "./ui/PrivacyConsentBanner";
import { StartupSplash } from "./ui/StartupSplash";
import { isNativeApp } from "./services/native";

export function Logo({ compact }: { compact?: boolean }) {
  const { t } = useCropCare();
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label={t("appName")}>
      <img
        src="/icon-192.png"
        alt="KisanAI"
        className="size-9 shrink-0 rounded-xl object-contain shadow-xs border border-line bg-[#eae6db]"
      />
      {!compact && (
        <span className="truncate leading-tight">
          <span className="flex items-center text-base font-extrabold tracking-[-0.03em] text-foreground font-apple">
            <span>Kisan</span>
            <span className="text-primary font-black ml-0.5">AI</span>
          </span>
          <span className="block text-[8.5px] font-semibold tracking-[-0.01em] text-[#c57833] dark:text-amber-400">
            Smarter Ways, Richer Harvests
          </span>
        </span>
      )}
    </Link>
  );
}

export function LangSwitch() {
  const { settings, updateSettings } = useCropCare();
  return (
    <label className="relative flex h-9 sm:h-10 items-center rounded-xl border border-line bg-card px-2.5 sm:px-3 text-xs sm:text-sm font-semibold cursor-pointer">
      {langs.find((x) => x.code === settings.lang)?.short}
      <select value={settings.lang} onChange={(e) => updateSettings({ lang: e.target.value as Lang })} aria-label="Language" className="absolute inset-0 cursor-pointer opacity-0">
        {langs.map((x) => <option key={x.code} value={x.code}>{x.native}</option>)}
      </select>
    </label>
  );
}

export function ThemeToggle() {
  const { settings, updateSettings } = useCropCare();
  const isDark = settings.theme === "dark";
  const toggle = () => {
    updateSettings({ theme: isDark ? "light" : "dark" });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="relative grid size-9 sm:size-10 place-items-center rounded-xl border border-line bg-card text-muted-foreground hover:text-foreground transition-all active:scale-95"
    >
      {isDark ? <Sun className="size-4 sm:size-[18px] text-amber" /> : <Moon className="size-4 sm:size-[18px] text-primary" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, ready, settings, online, reminders } = useCropCare();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const bare = pathname.startsWith("/welcome") || /^\/diagnose\/[^/]+\/[^/]+/.test(pathname) || pathname.endsWith("/report");
  const isAssistant = pathname.startsWith("/assistant");

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  useEffect(() => {
    if (ready && !settings.onboarded && !pathname.startsWith("/welcome")) void navigate({ to: "/welcome" });
  }, [ready, settings.onboarded, pathname, navigate]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const nav = [
    { to: "/", label: t("navHome"), icon: Home, exact: true },
    { to: "/library", label: t("navKnowledge"), icon: BookOpen, exact: false },
    { to: "/diagnose", label: t("navDiagnose"), icon: ScanLine, exact: false, primary: true },
    { to: "/history", label: t("navHistory"), icon: History, exact: false },
    { to: "/profile", label: t("navProfile"), icon: UserRound, exact: false },
  ] as const;
  const more = [
    { to: "/abstract", label: "Research Abstract", icon: Sparkles },
    { to: "/weather", label: t("navWeather"), icon: CloudSun },
    { to: "/calculator", label: t("navCalculator"), icon: Calculator },
    { to: "/yield-estimator", label: t("navYield"), icon: TrendingUp },
    { to: "/market", label: t("navMarket"), icon: DollarSign },
    { to: "/assistant", label: t("navAssistant"), icon: MessageCircle },
    { to: "/saved", label: t("navSaved"), icon: Bookmark },
    { to: "/notifications", label: t("navNotifications"), icon: Bell },
    { to: "/help", label: t("navHelp"), icon: CircleHelp },
  ];
  const due = reminders.filter((r) => !r.done && r.dueDate <= new Date().toISOString().slice(0, 10)).length;

  if (bare) return <div className="min-h-dvh bg-canvas text-foreground">{children}</div>;

  const side = "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground data-[status=active]:bg-primary/12 data-[status=active]:text-primary";

  return (
    <div className="min-h-dvh bg-canvas text-foreground">
      <StartupSplash />
      <a href="#main" className="visually-hidden focus:not-sr-only">Skip to content</a>
      <header className={cn("sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-lg pt-[max(0px,env(safe-area-inset-top),var(--sat,0px))]", isAssistant && "hidden lg:block")}>
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1440px] items-center gap-2 px-3 sm:px-6">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-xl border border-line bg-card text-muted-foreground hover:text-foreground lg:hidden transition-all active:scale-95"
          >
            <Menu className="size-5" />
          </button>

          <Logo />
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {isNative ? (
              <span
                className="hidden md:inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                title="KisanAI Native Android App is running offline"
              >
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Installed</span>
              </span>
            ) : (
              <a
                href={getApkDownloadUrl()}
                onClick={triggerApkDownload}
                download="kisanai-offline-ai.apk"
                title="Download KisanAI Offline Android APK (~396.6 MB)"
                className="hidden md:inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/20 transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>{t("downloadApp")}</span>
              </a>
            )}
            <Link to="/profile/offline" className="hidden h-9 sm:h-10 items-center gap-2 rounded-xl border border-line bg-card px-3 text-xs font-semibold text-muted-foreground md:flex">
              {online ? <span className="size-2 rounded-full bg-primary shadow-[0_0_0_4px] shadow-primary/20" /> : <WifiOff className="size-3.5 text-amber" />}
              {online ? t("offlineReady") : t("offlineNow").split(".")[0]}
            </Link>
            <LangSwitch />
            <ThemeToggle />
            <Link to="/notifications" aria-label={t("navNotifications")} className="relative grid size-9 sm:size-10 place-items-center rounded-xl border border-line bg-card text-muted-foreground hover:text-foreground">
              <Bell className="size-4 sm:size-[18px]" />
              {due > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{due}</span>}
            </Link>
          </div>
        </div>
        {!online && <p className="border-t border-amber/30 bg-amber/10 px-4 py-1.5 text-center text-xs sm:text-sm font-medium text-amber">{t("offlineNow")}</p>}
      </header>

      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] flex-col gap-1 border-r border-line px-3 py-6 lg:flex">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <Link key={to} to={to} activeOptions={{ exact }} className={side}><Icon className="size-[18px]" />{label}</Link>
          ))}
          <div className="my-3 border-t border-line" />
          {more.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={side}><Icon className="size-[18px]" />{label}</Link>
          ))}
          <div className="mt-auto flex gap-2.5 rounded-xl bg-card p-3 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" />{t("obOff3")}</div>
        </aside>
        <main
          id="main"
          className={cn(
            "min-w-0 flex-1",
            isAssistant
              ? "p-0 h-[100dvh] lg:h-[calc(100dvh-4rem)] overflow-hidden"
              : "px-4 pb-[calc(6rem+max(0.75rem,env(safe-area-inset-bottom),var(--sab,0px)))] pt-4 sm:pt-6 sm:px-6 lg:px-10 lg:pb-16"
          )}
        >
          <div className={cn("w-full", isAssistant ? "h-full max-w-none" : "mx-auto max-w-5xl")}>{children}</div>
        </main>
      </div>

      {/* Mobile Drawer / Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-canvas border-r border-line p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="grid size-9 place-items-center rounded-xl bg-surface text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Core Navigation */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Navigation
                </p>
                {nav.map(({ to, label, icon: Icon, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact }}
                    onClick={() => setMobileMenuOpen(false)}
                    className={side}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Agronomic Intelligence Tools */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Field Tools & Intelligence
                </p>
                {more.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={side}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile App Download Action */}
            <div className="pt-2">
              {isNativeApp() ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-xs cursor-default">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>App Installed & Offline Active</span>
                </div>
              ) : (
                <a
                  href={getApkDownloadUrl()}
                  download="kisanai-offline-ai.apk"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    triggerApkDownload(e);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="size-4" />
                  <span>{t("downloadApkBtn")}</span>
                </a>
              )}
            </div>

            {/* Offline footer badge */}
            <div className="pt-4 border-t border-line mt-6">
              <div className="flex items-center gap-2 rounded-xl bg-card p-3 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <span>100% Offline Capable &bull; On-Device Inference</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAssistant && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 pb-[max(0.6rem,env(safe-area-inset-bottom),var(--sab,0px))] backdrop-blur-lg lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="mx-auto grid max-w-xl grid-cols-5 items-end px-2 pb-1 pt-1">
            {nav.map((item) => {
              const Icon = item.icon;
              if ("primary" in item) {
                return (
                  <Link key={item.to} to={item.to} className="group flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground data-[status=active]:text-primary">
                    <span className="-mt-4 grid size-13 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_-6px] shadow-primary ring-4 ring-canvas transition-transform group-active:scale-95"><Icon className="size-6" /></span>
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} className="group flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground data-[status=active]:text-primary">
                  <span className="grid h-7 w-12 place-items-center rounded-full transition-colors group-data-[status=active]:bg-primary/15"><Icon className="size-5" /></span>
                  <span className={cn("max-w-full truncate px-0.5")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Global Cookie & Privacy Policy Consent */}
      <PrivacyConsentBanner />
    </div>
  );
}
