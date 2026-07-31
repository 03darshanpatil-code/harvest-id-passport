import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileText } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { QrCode } from "@/components/QrCode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHarvest } from "@/lib/harvest-store";

export const Route = createFileRoute("/passports")({
  head: () => ({
    meta: [
      { title: "Crop Passports — HarvestID" },
      {
        name: "description",
        content: "Issue and share QR-verified digital crop passports with your buyers.",
      },
      { property: "og:title", content: "Crop Passports — HarvestID" },
      { property: "og:description", content: "One click turns your records into buyer-ready proof." },
    ],
  }),
  component: PassportsPage,
});

function PassportsPage() {
  const { crops } = useHarvest();

  return (
    <AppLayout title="Passports" subtitle="Buyer-ready crop identities">
      <h2 className="font-display text-2xl font-semibold">Digital crop passports</h2>
      <p className="text-sm text-muted-foreground">
        Each passport is a read-only page buyers open by scanning a QR code.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {crops.map((c) => (
          <article key={c.id} className="card-soft lift grid grid-cols-[auto_minmax(0,1fr)] gap-4 p-5">
            <div className="rounded-2xl border border-border p-2">
              <QrCode value={c.id} size={104} />
            </div>
            <div className="min-w-0">
              <Badge
                className={
                  c.passport
                    ? "gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold"
                    : "rounded-full"
                }
                variant={c.passport ? "default" : "secondary"}
              >
                {c.passport ? (
                  <>
                    <ShieldCheck className="size-3" /> Issued
                  </>
                ) : (
                  "Pending"
                )}
              </Badge>
              <h3 className="mt-2 truncate text-lg font-semibold">{c.name}</h3>
              <p className="truncate text-sm text-muted-foreground">
                {c.variety} · {c.id}
              </p>
              <Button asChild className="mt-3 w-full rounded-2xl">
                <Link to="/passport/$cropId" params={{ cropId: c.id }}>
                  <FileText className="size-4" />
                  {c.passport ? "Open passport" : "Generate passport"}
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}
