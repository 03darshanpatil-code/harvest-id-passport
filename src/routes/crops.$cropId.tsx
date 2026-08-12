import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  MapPin,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  User,
  Warehouse,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AddActivityDialog } from "@/components/AddActivityDialog";
import { Timeline } from "@/components/Timeline";
import { ScoreRing } from "@/components/CropCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, useCrop } from "@/lib/harvest-store";
import { CropImage } from "@/components/CropImage";
import { useI18n } from "@/i18n";
import { localizeCropName } from "@/lib/crop-l10n";

export const Route = createFileRoute("/crops/$cropId")({
  head: () => ({
    meta: [
      { title: "Crop Details — HarvestID" },
      {
        name: "description",
        content: "Full cultivation history, media evidence and AI insights for a registered crop.",
      },
      { property: "og:title", content: "Crop Details — HarvestID" },
      { property: "og:description", content: "Cultivation timeline and traceability score." },
    ],
  }),
  component: CropDetails,
});

function CropDetails() {
  const { cropId } = useParams({ from: "/crops/$cropId" });
  const { crop, timeline } = useCrop(cropId);
  const { t, locale, lang } = useI18n();
  const [tab, setTab] = useState("timeline");
  const displayName = crop ? localizeCropName(crop.name, crop.variety, lang) : "";

  if (!crop) {
    return (
      <AppLayout title={t("cropDetails.title")}>
        <div className="card-soft grid place-items-center gap-3 p-16 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-lg font-semibold">{t("crops.notFound")}</p>
          <Button asChild className="rounded-2xl">
            <Link to="/crops">{t("crops.backToMyCrops")}</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const info = [
    { label: t("cropDetails.farmer"), value: crop.farmer, icon: User },
    { label: t("cropDetails.farm"), value: crop.farmName, icon: Warehouse },
    { label: t("cropDetails.location"), value: crop.location, icon: MapPin },
    { label: t("cropDetails.area"), value: crop.area, icon: Ruler },
    { label: t("cropDetails.plantedOn"), value: formatDate(crop.plantedOn, locale), icon: CalendarDays },
    { label: t("cropDetails.expectedHarvest"), value: formatDate(crop.harvestOn, locale), icon: CalendarDays },
  ];

  return (
    <AppLayout title={displayName} subtitle={crop.variety}>
      <section className="relative overflow-hidden rounded-3xl shadow-lift">
        <CropImage
          crop={crop}
          alt={t("cropImage.alt", { name: displayName })}
          width={1024}
          height={768}
          className="h-64 w-full object-cover sm:h-80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-8">
          <div className="min-w-0 text-primary-foreground">
            <Badge className="rounded-full bg-card/90 text-foreground hover:bg-card/90">
              {crop.id}
            </Badge>
            <h2 className="mt-3 truncate font-display text-3xl font-semibold">{displayName}</h2>
            <p className="truncate text-sm opacity-90">
              {crop.variety} · {crop.stage}
            </p>
          </div>
          <div className="glass-panel flex items-center gap-3 rounded-3xl p-3 text-foreground">
            <ScoreRing score={crop.score} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("cropDetails.traceability")}</p>
              <p className="truncate text-sm font-semibold">
                {crop.passport ? t("cropDetails.passportIssued") : t("cropDetails.passportPending")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <AddActivityDialog
          cropId={crop.id}
          trigger={
            <Button className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-6">
              <Plus className="size-5" /> {t("cropDetails.addActivity")}
            </Button>
          }
        />
        <Button
          variant="secondary"
          className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-6"
          onClick={() => setTab("timeline")}
        >
          <Sparkles className="size-5" /> {t("cropDetails.viewTimeline")}
        </Button>
        <Button asChild variant="outline" className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-6">
          <Link to="/passport/$cropId" params={{ cropId: crop.id }}>
            <FileText className="size-5" /> {t("cropDetails.generatePassport")}
          </Link>
        </Button>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {info.map((i) => (
          <div key={i.label} className="card-soft flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <i.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{i.label}</p>
              <p className="truncate text-sm font-medium">{i.value}</p>
            </div>
          </div>
        ))}
      </section>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="timeline" className="rounded-xl">
            {t("cropDetails.timeline")}
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-xl">
            {t("cropDetails.aiInsights")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-5">
          <Timeline items={timeline} />
        </TabsContent>

        <TabsContent value="insights" className="mt-5 grid gap-4">
          <div className="card-soft border-gold/40 bg-gold/10 p-5">
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              <Sparkles className="size-3" /> {t("cropDetails.aiSummaryBadge")}
            </Badge>
            <p className="mt-3 text-sm leading-relaxed">
              {t("cropDetails.aiSummaryText", {
                name: displayName,
                variety: crop.variety,
                farm: crop.farmName,
                location: crop.location,
                area: crop.area,
                count: timeline.length,
                planted: formatDate(crop.plantedOn, locale),
              })}
            </p>
          </div>

          <div className="card-soft p-5">
            <h3 className="text-base font-semibold">{t("cropDetails.documentationQuality")}</h3>
            <div className="mt-4 grid gap-4">
              {[
                { label: t("cropDetails.activityFrequency"), value: Math.min(99, 60 + timeline.length * 6) },
                { label: t("cropDetails.mediaEvidence"), value: crop.score - 4 },
                { label: t("cropDetails.originVerification"), value: crop.gps ? 99 : 70 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{Math.max(0, Math.min(100, row.value))}%</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, row.value))} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft flex items-start gap-3 p-5">
            <ShieldCheck className="size-6 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("cropDetails.buyersReadOnly")}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
