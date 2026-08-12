import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Sprout } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { CropCard } from "@/components/CropCard";
import { Button } from "@/components/ui/button";
import { useHarvest } from "@/lib/harvest-store";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/crops/")({
  head: () => ({
    meta: [
      { title: "My Crops — HarvestID" },
      {
        name: "description",
        content: "Every crop you grow, with growth stage, location and live traceability score.",
      },
      { property: "og:title", content: "My Crops — HarvestID" },
      { property: "og:description", content: "Manage registered crops and their digital identities." },
    ],
  }),
  component: CropsPage,
});

function CropsPage() {
  const { crops, loading, error } = useHarvest();
  const { t } = useI18n();

  return (
    <AppLayout title={t("crops.title")} subtitle={t("crops.subtitle", { count: crops.length })}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-semibold">{t("crops.heading")}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {t("crops.tagline")}
          </p>
        </div>
        <Button asChild className="h-12 rounded-2xl">
          <Link to="/crops/new">
            <Plus className="size-5" /> {t("crops.registerCrop")}
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("crops.loading")}
        </div>
      ) : crops.length === 0 ? (
        <div className="card-soft mt-6 grid place-items-center gap-3 p-16 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-lg font-semibold">{t("crops.emptyTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("crops.emptyDesc")}
          </p>
          <Button asChild className="mt-2 rounded-2xl">
            <Link to="/crops/new">
              <Sprout className="size-4" /> {t("crops.registerCrop")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {crops.map((c) => (
            <CropCard key={c.id} crop={c} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
