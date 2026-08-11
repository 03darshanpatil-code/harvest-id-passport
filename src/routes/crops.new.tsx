import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHarvest } from "@/lib/harvest-store";
import { fileToResizedDataUrl } from "@/lib/crop-images";

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
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const attachImage = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file", {
        description: "The crop photo must be a JPG, PNG or similar image.",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image is too large", { description: "Keep the photo under 8 MB." });
      return;
    }
    setReadingImage(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch {
      toast.error("Could not read that image", { description: "Please try another photo." });
    } finally {
      setReadingImage(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.location.trim()) {
      toast.error("A crop name and location are needed", {
        description: "These appear on the passport.",
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
      toast.success("Crop registered", { description: `${crop.name} now has ID ${crop.id}` });
      navigate({ to: "/crops/$cropId", params: { cropId: crop.id } });
    } catch {
      toast.error("Could not register crop", {
        description: "Please check the backend connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Register crop" subtitle="Takes under two minutes">
      <form onSubmit={submit} className="mx-auto max-w-3xl">
        <h2 className="font-display text-2xl font-semibold">Register a new crop</h2>
        <p className="text-sm text-muted-foreground">
          These details form the identity section of the digital crop passport.
        </p>

        <Section title="Crop details">
          <Field id="name" label="Crop name" value={form.name} onChange={set("name")} placeholder="Tomato" />
          <Field id="variety" label="Variety" value={form.variety} onChange={set("variety")} placeholder="Cherry Tomato" />
          <Field id="category" label="Category" value={form.category} onChange={set("category")} />
          <Field id="area" label="Farm size" value={form.area} onChange={set("area")} placeholder="2.5 acres" />
        </Section>

        <Section title="Crop photo (optional)">
          <div className="grid gap-3 sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              Add a photo of your crop. If you skip this, HarvestID automatically picks a matching
              crop image from the crop name.
            </p>
            {form.image ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <img
                  src={form.image}
                  alt="Crop photo preview"
                  className="max-h-64 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Custom crop photo attached</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 rounded-xl text-destructive"
                    onClick={() => setForm((f) => ({ ...f, image: "" }))}
                  >
                    <Trash2 className="size-3.5" /> Remove
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
                    <span className="text-muted-foreground">Preparing image…</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-6 text-primary" />
                    <span className="font-medium">Upload a crop photo</span>
                    <span className="text-xs text-muted-foreground">
                      JPG or PNG, up to 8 MB — resized automatically
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

        <Section title="Farm information">
          <Field id="farmer" label="Farmer name" value={form.farmer} onChange={set("farmer")} />
          <Field id="farmName" label="Farm name" value={form.farmName} onChange={set("farmName")} />
          <Field id="location" label="Farm location" value={form.location} onChange={set("location")} placeholder="Bengaluru, Karnataka" />
          <Field id="gps" label="GPS coordinates (optional)" value={form.gps} onChange={set("gps")} placeholder="12.9716° N, 77.5946° E" />
        </Section>

        <Section title="Dates">
          <Field id="plantedOn" label="Planting date" type="date" value={form.plantedOn} onChange={set("plantedOn")} />
          <Field id="harvestOn" label="Expected harvest" type="date" value={form.harvestOn} onChange={set("harvestOn")} />
        </Section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-2xl sm:flex-none"
            onClick={() => navigate({ to: "/crops" })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-10"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save crop"}
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
