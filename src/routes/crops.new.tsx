import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHarvest } from "@/lib/harvest-store";
import { fileToResizedDataUrl } from "@/lib/crop-images";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/crops/new")({
  head: () => ({
    meta: [
      { title: "Register a Crop — HarvestID" },
      {
        name: "description",
        content: "Register a new crop in under two minutes and start its digital passport.",
      },
      { property: "og:title", content: "Register a Crop — HarvestID" },
      { property: "og:description", content: "Give your next harvest a digital identity." },
    ],
  }),
  component: RegisterCrop,
});

const blank = {
  name: "",
  variety: "",
  category: "Vegetable",
  area: "",
  farmer: "",
  farmName: "",
  location: "",
  gps: "",
  plantedOn: "",
  harvestOn: "",
  image: "",
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function RegisterCrop() {
  const { addCrop, profile } = useHarvest();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    ...blank,
    // Prefill with the saved profile so the passport always carries the real farmer identity.
    farmer: profile.fullName,
    farmName: profile.farmName,
    location: profile.location,
  }));
  const [saving, setSaving] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // One-shot browser geolocation — never continuous tracking. If permission is
  // denied or the lookup fails, the farmer can continue manually.
  const useMyLocation = () => {
    setGpsError(null);
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGpsError(t("gps.unsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setForm((f) => ({ ...f, gps: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        // Best-effort reverse geocode (village/town, district/state, country).
        // A failure here never blocks registration — coordinates remain set.
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          if (response.ok) {
            const place = (await response.json()) as {
              city?: string;
              locality?: string;
              principalSubdivision?: string;
              countryName?: string;
            };
            const parts = [place.city || place.locality, place.principalSubdivision, place.countryName].filter(
              Boolean,
            );
            if (parts.length) setForm((f) => ({ ...f, location: parts.join(", ") }));
          }
        } catch {
          // coordinates are enough
        }
        setLocating(false);
      },
      (error) => {
        // 1 = permission denied, 2 = unavailable, 3 = timeout
        if (error.code === 1) setGpsError(t("gps.denied"));
        else if (error.code === 3) setGpsError(t("gps.timeout"));
        else setGpsError(t("gps.unavailable"));
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const attachImage = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("crop.imageError"), {
        description: t("crop.imageErrorDesc"),
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t("crop.imageTooLarge"), { description: t("crop.imageTooLargeDesc") });
      return;
    }
    setReadingImage(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch {
      toast.error(t("crop.imageReadError"), { description: t("crop.imageReadErrorDesc") });
    } finally {
      setReadingImage(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.location.trim()) {
      toast.error(t("crop.needNameLocation"), {
        description: t("crop.needNameLocationDesc"),
      });
      return;
    }

    setSaving(true);
    try {
      const crop = await addCrop({
        ...form,
        plantedOn: form.plantedOn || new Date().toISOString(),
        harvestOn: form.harvestOn || new Date().toISOString(),
      });
      toast.success(t("crop.registered"), { description: t("crop.registeredDesc", { name: crop.name, id: crop.id }) });
      navigate({ to: "/crops/$cropId", params: { cropId: crop.id } });
    } catch {
      toast.error(t("crop.registerError"), {
        description: t("crop.registerErrorDesc"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title={t("crops.registerCrop")} subtitle={t("crop.registerSubtitle")}>
      <form onSubmit={submit} className="mx-auto max-w-3xl">
        <h2 className="font-display text-2xl font-semibold">{t("crop.registerTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("crop.registerSubtitle")}
        </p>

        <Section title={t("crop.details")}>
          <Field id="name" label={t("crop.name")} value={form.name} onChange={set("name")} placeholder={t("crop.namePlaceholder")} />
          <Field id="variety" label={t("crop.variety")} value={form.variety} onChange={set("variety")} placeholder={t("crop.varietyPlaceholder")} />
          <Field id="category" label={t("crop.category")} value={form.category} onChange={set("category")} />
          <Field id="area" label={t("crop.farmSize")} value={form.area} onChange={set("area")} placeholder={t("crop.farmSizePlaceholder")} />
        </Section>

        <Section title={t("crop.photo")}>
          <div className="grid gap-3 sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              {t("crop.photoHelp")}
            </p>
            {form.image ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <img
                  src={form.image}
                  alt={t("crop.photoAttached")}
                  className="max-h-64 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">{t("crop.photoAttached")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 rounded-xl text-destructive"
                    onClick={() => setForm((f) => ({ ...f, image: "" }))}
                  >
                    <Trash2 className="size-3.5" /> {t("common.remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <label
                className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm transition-colors hover:border-primary hover:bg-accent ${
                  readingImage ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {readingImage ? (
                  <>
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">{t("crop.preparingImage")}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-6 text-primary" />
                    <span className="font-medium">{t("crop.uploadPhoto")}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("crop.photoHint")}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={readingImage}
                  onChange={(e) => {
                    void attachImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </Section>

        <Section title={t("crop.farmInfo")}>
          <Field id="farmer" label={t("crop.farmerName")} value={form.farmer} onChange={set("farmer")} />
          <Field id="farmName" label={t("crop.farmName")} value={form.farmName} onChange={set("farmName")} />
          <Field id="location" label={t("crop.farmLocation")} value={form.location} onChange={set("location")} placeholder={t("crop.farmLocationPlaceholder")} />
          <div className="grid gap-2">
            <Field
              id="gps"
              label={t("crop.gps")}
              value={form.gps}
              onChange={set("gps")}
              placeholder={t("crop.gpsPlaceholder")}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start gap-1.5 rounded-xl"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MapPin className="size-4" />
              )}
              {locating ? t("gps.locating") : t("gps.useMyLocation")}
            </Button>
            {gpsError ? (
              <p role="alert" className="text-xs text-destructive">
                {gpsError}
              </p>
            ) : null}
          </div>
        </Section>

        <Section title={t("crop.dates")}>
          <Field id="plantedOn" label={t("crop.plantingDate")} type="date" value={form.plantedOn} onChange={set("plantedOn")} />
          <Field id="harvestOn" label={t("crop.expectedHarvest")} type="date" value={form.harvestOn} onChange={set("harvestOn")} />
        </Section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-2xl sm:flex-none"
            onClick={() => navigate({ to: "/crops" })}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-10"
            disabled={saving}
          >
            {saving ? t("common.saving") : t("crop.save")}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-soft mt-5 p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-12 rounded-2xl" {...props} />
    </div>
  );
}
