import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Sprout } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { CropCard } from "@/components/CropCard";
import { Button } from "@/components/ui/button";
import { useHarvest } from "@/lib/harvest-store";

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

  return (
    <AppLayout title="My Crops" subtitle={`${crops.length} registered crops`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-semibold">My crops</h2>
          <p className="truncate text-sm text-muted-foreground">
            Each crop carries its own verifiable identity.
          </p>
        </div>
        <Button asChild className="h-12 rounded-2xl">
          <Link to="/crops/new">
            <Plus className="size-5" /> Register crop
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
          Loading crops from the database…
        </div>
      ) : crops.length === 0 ? (
        <div className="card-soft mt-6 grid place-items-center gap-3 p-16 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-lg font-semibold">You haven't registered your first crop.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Register a crop to start building its digital identity.
          </p>
          <Button asChild className="mt-2 rounded-2xl">
            <Link to="/crops/new">
              <Sprout className="size-4" /> Register crop
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
