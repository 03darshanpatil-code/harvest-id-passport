import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
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
import hero from "@/assets/hero-farm.jpg";

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
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const recent = [...activities].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4);
  const avg = Math.round(crops.reduce((s, c) => s + c.score, 0) / Math.max(crops.length, 1));

  const stats = [
    { label: "Total crops", value: crops.length, icon: Sprout },
    {
      label: "Active crops",
      value: crops.filter((c) => c.stage !== "Harvested").length,
      icon: TrendingUp,
    },
    {
      label: "Harvest ready",
      value: crops.filter((c) => c.stage === "Harvest Ready").length,
      icon: Wheat,
    },
    { label: "Avg. traceability", value: `${avg}%`, icon: Sparkles },
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
        toast.error("QR code not recognised", {
          description: "This doesn't look like a HarvestID passport code.",
        });
        return;
      }
      setScannerOpen(false);
      navigate({ to: "/passport/$cropId", params: { cropId } });
    },
    [navigate],
  );

  return (
    <AppLayout title="Dashboard" subtitle="Your farm at a glance">
      <section className="relative overflow-hidden rounded-3xl glass-hero shadow-lift">
        <img
          src={hero}
          alt="Aerial view of terraced green farmland"
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              <Sparkles className="size-3" /> AI documentation active
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              Good morning, {profile.fullName.split(" ")[0] || "Farmer"} 👋
            </h2>
            <p className="mt-2 max-w-lg text-sm text-primary-foreground/85 sm:text-base">
              Let's grow with confidence. Every note you record today becomes verifiable proof for
              your buyers tomorrow.
            </p>
          </div>
          <div className="glass-panel rounded-3xl p-5 text-foreground">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Farm score</p>
            <p className="font-display text-4xl font-semibold">{avg}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Across {crops.length} registered crops</p>
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
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Loading farm data from the API…
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-soft lift p-5">
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
            <h3 className="truncate text-lg font-semibold">Recent activities</h3>
            <Button asChild variant="ghost" size="sm" className="rounded-2xl">
              <Link to="/activities">
                View all <ArrowRight className="size-4" />
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
                    {crops.find((c) => c.id === a.cropId)?.name} · {a.note}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.date)}</span>
              </li>
            ))}
          </ul>
        </div>

        {stale ? (
          <div className="card-soft border-gold/40 bg-gold/10 p-5">
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              🤖 AI recommendation
            </Badge>
            <p className="mt-4 text-sm leading-relaxed">
              {(() => {
                const days = daysSince(stale.lastDate);
                if (days === null) {
                  return (
                    <>
                      Your <strong>{stale.crop.name}</strong> crop has no documented activity yet.
                      Record the first field note to start building its passport.
                    </>
                  );
                }
                return (
                  <>
                    Your <strong>{stale.crop.name}</strong> crop has not received an activity update
                    for {days} day{days === 1 ? "" : "s"}. Record today's progress to keep the
                    traceability score climbing.
                  </>
                );
              })()}
            </p>
            <AddActivityDialog
              cropId={stale.crop.id}
              trigger={
                <Button className="mt-4 w-full rounded-2xl">
                  <Plus className="size-4" /> Record now
                </Button>
              }
            />
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild size="lg" className="h-14 rounded-2xl">
          <Link to="/crops/new">
            <Sprout className="size-5" /> Register crop
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
              title={crops.length ? undefined : "Register a crop before adding activities"}
            >
              <Plus className="size-5" /> Add activity
            </Button>
          }
        />
        <Button asChild size="lg" variant="secondary" className="h-14 rounded-2xl">
          <Link to="/passports">
            <FileText className="size-5" /> Generate passport
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-2xl"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-5" /> Scan QR
        </Button>
      </section>

      <section className="mt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h3 className="truncate text-lg font-semibold">Active crops</h3>
          <Button asChild variant="ghost" size="sm" className="rounded-2xl">
            <Link to="/crops">
              All crops <ArrowRight className="size-4" />
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
          <h3 className="text-lg font-semibold">Buyers verify in one scan</h3>
          <p className="text-sm text-muted-foreground">
            Every passport is a read-only page with origin, timeline, media evidence and an AI
            traceability summary.
          </p>
        </div>
      </section>
    </AppLayout>
  );
}
