import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Download,
  Leaf,
  MapPin,
  Share2,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode } from "@/components/QrCode";
import { Timeline } from "@/components/Timeline";
import { ScoreRing } from "@/components/CropCard";
import { formatDate, useCrop, useHarvest } from "@/lib/harvest-store";
import { CropImage } from "@/components/CropImage";
import { buildPassportUrl } from "@/lib/crop-images";
import { useI18n } from "@/i18n";
import { localizeCropName } from "@/lib/crop-l10n";

export const Route = createFileRoute("/passport/$cropId")({
  head: () => ({
    meta: [
      { title: "Digital Crop Passport — HarvestID" },
      {
        name: "description",
        content:
          "Read-only crop passport with verified origin, cultivation timeline, media evidence and AI traceability score.",
      },
      { property: "og:title", content: "Digital Crop Passport — HarvestID" },
      {
        property: "og:description",
        content: "Verify where this harvest came from and how it was grown.",
      },
    ],
  }),
  component: PassportPage,
});

function PassportPage() {
  const { cropId } = useParams({ from: "/passport/$cropId" });
  const { crop, timeline } = useCrop(cropId);
  const { generatePassport, error } = useHarvest();
  const { t, locale, lang } = useI18n();
  const [generating, setGenerating] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const displayName = crop ? localizeCropName(crop.name, crop.variety, lang) : "";

  if (!crop) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <p className="text-5xl">📄</p>
          <h1 className="mt-4 font-display text-2xl font-semibold">{t("passport.notFound")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("passport.notFoundDesc")}
          </p>
          <Button asChild className="mt-6 rounded-2xl">
            <Link to="/">{t("passport.goToApp")}</Link>
          </Button>
        </div>
      </main>
    );
  }

  const generate = async () => {
    setGenerating(true);
    try {
      await generatePassport(crop.id);
      setCelebrate(true);
    } catch {
      toast.error(t("passport.generateError"), { description: t("passport.generateErrorDesc") });
    } finally {
      setGenerating(false);
    }
  };

  const copyPassportLink = async () => {
    const url = buildPassportUrl(crop.id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("passport.linkCopied"), { description: url });
    } catch {
      toast.error(t("passport.copyError"), {
        description: t("passport.copyErrorDesc"),
      });
    }
  };

  const printPassport = () => {
    toast.info(t("passport.printToast"));
    window.setTimeout(() => window.print(), 400);
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="relative overflow-hidden">
        <CropImage
          crop={crop}
          alt={t("cropImage.alt", { name: displayName })}
          width={1024}
          height={768}
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-6 sm:px-6">
          <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
            <BadgeCheck className="size-3.5" /> {t("passport.badge")}
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            {displayName} · {crop.variety}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="size-4" /> {crop.location} · ID {crop.id}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {error ? (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {!crop.passport ? (
          <section className="card-soft -mt-6 relative grid gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            {generating ? (
              <div className="grid gap-3 sm:col-span-2">
                <p className="text-sm font-medium">{t("passport.generating")}</p>
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{t("passport.noPassportTitle")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("passport.noPassportDesc")}
                  </p>
                </div>
                <Button className="h-12 rounded-2xl sm:px-8" onClick={generate}>
                  <FileText className="size-5" /> {t("passport.generate")}
                </Button>
              </>
            )}
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="card-soft p-6">
            <h2 className="text-lg font-semibold">{t("passport.cropIdentity")}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                [t("passport.farmer"), crop.farmer],
                [t("passport.farm"), crop.farmName],
                [t("passport.category"), crop.category],
                [t("passport.farmSize"), crop.area],
                [t("passport.gps"), crop.gps || t("passport.notProvided")],
                [t("passport.growthStage"), crop.stage],
                [t("passport.plantedOn"), formatDate(crop.plantedOn, locale)],
                [t("passport.expectedHarvest"), formatDate(crop.harvestOn, locale)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="truncate text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card-soft grid place-items-center gap-3 p-6 text-center">
            <QrCode value={crop.id} />
            <p className="text-xs text-muted-foreground">{t("passport.scanToVerify")}</p>
            <div className="flex w-full gap-2">
              <Button variant="secondary" className="flex-1 rounded-2xl" onClick={copyPassportLink}>
                <Share2 className="size-4" /> {t("passport.share")}
              </Button>
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={printPassport}>
                <Download className="size-4" /> {t("passport.pdf")}
              </Button>
            </div>
          </div>
        </section>

        <section className="card-soft mt-4 grid gap-4 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <ScoreRing score={crop.score} size={84} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{t("passport.traceabilityScore")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("passport.scoreDesc")}
            </p>
            <Progress value={crop.score} className="mt-3 h-2.5" />
          </div>
        </section>

        <section className="card-soft mt-4 border-gold/40 bg-gold/10 p-6">
          <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
            <Sparkles className="size-3" /> {t("passport.aiSummaryBadge")}
          </Badge>
          <p className="mt-3 text-sm leading-relaxed">
            {t("passport.aiSummaryText", {
              variety: crop.variety.toLowerCase(),
              farm: crop.farmName,
              location: crop.location,
              area: crop.area,
              count: timeline.length,
              planted: formatDate(crop.plantedOn, locale),
              stage: crop.stage.toLowerCase(),
            })}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("passport.cultivationTimeline")}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {t("passport.timelineDesc")}
          </p>
          <Timeline items={timeline} />
        </section>

        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Leaf className="size-4 text-primary" />
          {t("passport.footer")}
        </footer>
      </div>

      <Dialog open={celebrate} onOpenChange={setCelebrate}>
        <DialogContent className="rounded-3xl text-center sm:max-w-md">
          <DialogHeader>
            <span className="mx-auto text-6xl animate-in zoom-in duration-500">🎉</span>
            <DialogTitle className="mt-2 text-center font-display text-2xl">
              {t("passport.readyTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("passport.readyDesc", { name: displayName })}
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto"><QrCode value={crop.id} size={140} /></div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              className="rounded-2xl"
              onClick={() => {
                printPassport();
                setCelebrate(false);
              }}
            >
              {t("passport.downloadPdf")}
            </Button>
            <Button variant="secondary" className="rounded-2xl" onClick={copyPassportLink}>
              {t("passport.shareQr")}
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => setCelebrate(false)}>
              {t("passport.viewPassport")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
