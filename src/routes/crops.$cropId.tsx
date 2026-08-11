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
  const [tab, setTab] = useState("timeline");

  if (!crop) {
    return (
      <AppLayout title="Crop">
        <div className="card-soft grid place-items-center gap-3 p-16 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-lg font-semibold">We couldn't find this crop.</p>
          <Button asChild className="rounded-2xl">
            <Link to="/crops">Back to my crops</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const info = [
    { label: "Farmer", value: crop.farmer, icon: User },
    { label: "Farm", value: crop.farmName, icon: Warehouse },
    { label: "Location", value: crop.location, icon: MapPin },
    { label: "Area", value: crop.area, icon: Ruler },
    { label: "Planted on", value: formatDate(crop.plantedOn), icon: CalendarDays },
    { label: "Expected harvest", value: formatDate(crop.harvestOn), icon: CalendarDays },
  ];

  return (
    <AppLayout title={crop.name} subtitle={crop.variety}>
      <section className="relative overflow-hidden rounded-3xl shadow-lift">
        <CropImage
          crop={crop}
          alt={`${crop.variety} growing at ${crop.farmName}`}
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
            <h2 className="mt-3 truncate font-display text-3xl font-semibold">{crop.name}</h2>
            <p className="truncate text-sm opacity-90">
              {crop.variety} · {crop.stage}
            </p>
          </div>
          <div className="glass-panel flex items-center gap-3 rounded-3xl p-3 text-foreground">
            <ScoreRing score={crop.score} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Traceability</p>
              <p className="truncate text-sm font-semibold">
                {crop.passport ? "Passport issued" : "Passport pending"}
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
              <Plus className="size-5" /> Add activity
            </Button>
          }
        />
        <Button
          variant="secondary"
          className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-6"
          onClick={() => setTab("timeline")}
        >
          <Sparkles className="size-5" /> View timeline
        </Button>
        <Button asChild variant="outline" className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-6">
          <Link to="/passport/$cropId" params={{ cropId: crop.id }}>
            <FileText className="size-5" /> Generate passport
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
            Timeline
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-xl">
            AI insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-5">
          <Timeline items={timeline} />
        </TabsContent>

        <TabsContent value="insights" className="mt-5 grid gap-4">
          <div className="card-soft border-gold/40 bg-gold/10 p-5">
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              <Sparkles className="size-3" /> AI traceability summary
            </Badge>
            <p className="mt-3 text-sm leading-relaxed">
              {crop.name} ({crop.variety}) was cultivated at {crop.farmName}, {crop.location} across{" "}
              {crop.area}. {timeline.length} field activities were documented between{" "}
              {formatDate(crop.plantedOn)} and today, including irrigation, organic nutrition and
              pest scouting. Records show consistent documentation with photo and voice evidence and
              no synthetic chemical applications logged.
            </p>
          </div>

          <div className="card-soft p-5">
            <h3 className="text-base font-semibold">Documentation quality</h3>
            <div className="mt-4 grid gap-4">
              {[
                { label: "Activity frequency", value: Math.min(99, 60 + timeline.length * 6) },
                { label: "Media evidence", value: crop.score - 4 },
                { label: "Origin verification", value: crop.gps ? 99 : 70 },
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
              Buyers see this summary as read-only inside the digital crop passport.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
