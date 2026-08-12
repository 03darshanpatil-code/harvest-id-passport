import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Timeline } from "@/components/Timeline";
import { Badge } from "@/components/ui/badge";
import { useHarvest } from "@/lib/harvest-store";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: "Field Activities — HarvestID" },
      {
        name: "description",
        content: "Every documented field activity across your farm, organised by AI.",
      },
      { property: "og:title", content: "Field Activities — HarvestID" },
      { property: "og:description", content: "A single feed of all your farm records." },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { activities, crops, loading, error } = useHarvest();
  const { t } = useI18n();
  const sorted = [...activities].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <AppLayout title={t("activities.title")} subtitle={t("activities.subtitle", { count: activities.length })}>
      <h2 className="font-display text-2xl font-semibold">{t("activities.heading")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("activities.tagline")}
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {crops.map((c) => (
          <Badge key={c.id} variant="secondary" className="rounded-full px-3 py-1.5">
            {c.name} · {activities.filter((a) => a.cropId === c.id).length}
          </Badge>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t("activities.loading")}
          </div>
        ) : (
          <Timeline items={sorted} />
        )}
      </div>
    </AppLayout>
  );
}
