import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  Plus,
  QrCode,
  ScanLine,
  Sparkles,
  Sprout,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { AddActivityDialog } from "@/components/AddActivityDialog";
import { CropCard } from "@/components/CropCard";
import { QrScannerDialog } from "@/components/QrScannerDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { activityMeta, timeAgo, useHarvest } from "@/lib/harvest-store";
import { parseCropIdFromQr } from "@/lib/crop-images";
import { useI18n, type TranslationKey } from "@/i18n";
import { localizeCropName } from "@/lib/crop-l10n";
import hero from "@/assets/hero-farm.jpg";

/** Time-aware greeting period, based on the device's local time. */
function greetingKeyForHour(hour: number): TranslationKey {
  if (hour >= 5 && hour < 12) return "dashboard.greetingMorning";
  if (hour >= 12 && hour < 17) return "dashboard.greetingAfternoon";
  if (hour >= 17 && hour < 21) return "dashboard.greetingEvening";
  return "dashboard.greetingNight";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farmer Dashboard — HarvestID" },
      {
        name: "description",
        content:
          "Track crops, record field activities and generate AI-powered digital crop passports from one dashboard.",
      },
      { property: "og:title", content: "Farmer Dashboard — HarvestID" },
      {
        property: "og:description",
        content: "AI-powered crop traceability for farmers and buyers.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { crops, activities, error, loading, profile, refreshData } = useHarvest();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  // Refresh once a minute so the greeting follows the actual time.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const greetingKey = greetingKeyForHour(now.getHours());
  const recent = [...activities].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4);
  const avg = Math.round(crops.reduce((s, c) => s + c.score, 0) / Math.max(crops.length, 1));

  const stats = [
    { label: t("dashboard.totalCrops"), value: crops.length, icon: Sprout },
    {
      label: t("dashboard.activeCrops"),
      value: crops.filter((c) => c.stage !== "Harvested").length,
      icon: TrendingUp,
    },
    {
      label: t("dashboard.harvestReady"),
      value: crops.filter((c) => c.stage === "Harvest Ready").length,
      icon: Wheat,
    },
    { label: t("dashboard.avgTraceability"), value: `${avg}%`, icon: Sparkles },
  ];

  // Crop with the oldest (or missing) activity record — drives the AI card.
  const stale = useMemo(() => {
    if (!crops.length) return null;
    const byCrop = crops.map((c) => ({
      crop: c,
      lastDate: activities
        .filter((a) => a.cropId === c.id)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]?.date,
    }));
    byCrop.sort((a, b) => {
      const ad = a.lastDate ? +new Date(a.lastDate) : 0;
      const bd = b.lastDate ? +new Date(b.lastDate) : 0;
      return ad - bd;
    });
    return byCrop[0] ?? null;
  }, [crops, activities]);

  const daysSince = (date?: string) => {
    if (!date) return null;
    const d = +new Date(date);
    if (Number.isNaN(d)) return null;
    return Math.max(0, Math.floor((Date.now() - d) / 86_400_000));
  };

  const handleScanned = useCallback(
    (decodedText: string) => {
      const cropId = parseCropIdFromQr(decodedText);
      if (!cropId) {
        toast.error(t("qr.notRecognised"), {
          description: t("qr.notRecognisedDesc"),
        });
        return;
      }
      setScannerOpen(false);
      navigate({ to: "/passport/$cropId", params: { cropId } });
    },
    [navigate, t],
  );

  return (
    <AppLayout title={t("dashboard.title")} subtitle={t("dashboard.subtitle")}>
      <section className="relative overflow-hidden rounded-3xl glass-hero shadow-lift">
        <img
          src={hero}
          alt=""
          aria-hidden="true"
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div aria-hidden="true" className="field-glow pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden select-none sm:block"
        >
          <span className="animate-float absolute left-[6%] top-8 text-3xl opacity-25">🌾</span>
          <span
            className="animate-float absolute right-[26%] top-12 text-2xl opacity-20"
            style={{ animationDelay: "1.2s" }}
          >
            🌱
          </span>
          <span
            className="animate-float absolute bottom-10 left-[22%] text-2xl opacity-20"
            style={{ animationDelay: "2s" }}
          >
            ☀️
          </span>
          <span
            className="animate-float absolute bottom-12 right-[10%] text-3xl opacity-25"
            style={{ animationDelay: "0.6s" }}
          >
            💧
          </span>
        </div>
        <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              <Sparkles className="size-3" /> {t("dashboard.aiBadge")}
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              {t(greetingKey, {
                name: profile.fullName.split(" ")[0] || t("dashboard.greetingDefaultName"),
              })}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-primary-foreground/85 sm:text-base">
              {t("dashboard.heroText")}
            </p>
          </div>
          <div className="glass-panel rounded-3xl p-5 text-foreground">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("dashboard.farmScore")}</p>
            <p className="font-display text-4xl font-semibold">{avg}%</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.acrossCrops", { count: crops.length })}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <span className="min-w-0">{error}</span>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-2xl"
            onClick={() => void refreshData()}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t("dashboard.loadingFarmData")}
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, index) => (
          <div
            key={s.label}
            className="card-soft lift animate-fade-up p-5"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <s.icon className="size-5" />
            </div>
            <p className="mt-4 font-display text-3xl font-semibold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-soft p-5 lg:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h3 className="truncate text-lg font-semibold">{t("dashboard.recentActivities")}</h3>
            <Button asChild variant="ghost" size="sm" className="rounded-2xl">
              <Link to="/activities">
                {t("dashboard.viewAll")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {recent.map((a) => (
              <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-lg">
                  {activityMeta[a.kind].emoji}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {(() => {
                      const crop = crops.find((c) => c.id === a.cropId);
                      return crop ? localizeCropName(crop.name, crop.variety, lang) : "";
                    })()}
                    {a.note ? ` · ${a.note}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.date, t)}</span>
              </li>
            ))}
          </ul>
        </div>

        {stale ? (
          <div className="card-soft border-gold/40 bg-gold/10 p-5">
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              🤖 {t("dashboard.aiRecommendation")}
            </Badge>
            <p className="mt-4 text-sm leading-relaxed">                  {(() => {
                    const days = daysSince(stale.lastDate);
                    const cropName = localizeCropName(stale.crop.name, stale.crop.variety, lang);
                    if (days === null) {
                      return <>{t("dashboard.noActivityYet", { crop: cropName })}</>;
                    }
                    return <>{t("dashboard.staleActivity", { crop: cropName, days })}</>;
                  })()}
            </p>
            <AddActivityDialog
              cropId={stale.crop.id}
              trigger={
                <Button className="mt-4 w-full rounded-2xl">
                  <Plus className="size-4" /> {t("dashboard.recordNow")}
                </Button>
              }
            />
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild size="lg" className="h-14 rounded-2xl">
          <Link to="/crops/new">
            <Sprout className="size-5" /> {t("dashboard.registerCrop")}
          </Link>
        </Button>
        <AddActivityDialog
          cropId={crops[0]?.id ?? ""}
          trigger={
            <Button
              size="lg"
              variant="secondary"
              className="h-14 rounded-2xl"
              disabled={!crops.length}
              title={crops.length ? undefined : t("dashboard.addActivityDisabled")}
            >
              <Plus className="size-5" /> {t("dashboard.addActivity")}
            </Button>
          }
        />
        <Button asChild size="lg" variant="secondary" className="h-14 rounded-2xl">
          <Link to="/passports">
            <FileText className="size-5" /> {t("dashboard.generatePassport")}
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-2xl"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-5" /> {t("dashboard.scanQr")}
        </Button>
      </section>

      <section className="mt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h3 className="truncate text-lg font-semibold">{t("dashboard.activeCropsTitle")}</h3>
          <Button asChild variant="ghost" size="sm" className="rounded-2xl">
            <Link to="/crops">
              {t("dashboard.allCrops")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {crops.slice(0, 3).map((c) => (
            <CropCard key={c.id} crop={c} />
          ))}
        </div>
      </section>

      <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScanned={handleScanned} />

      <section className="mt-8 card-soft grid gap-4 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
          <QrCode className="size-7" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{t("dashboard.buyersVerify")}</h3>
          <p className="text-sm text-muted-foreground">{t("dashboard.buyersVerifyDesc")}</p>
        </div>
      </section>
    </AppLayout>
  );
}
