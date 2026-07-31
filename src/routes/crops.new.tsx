import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHarvest } from "@/lib/harvest-store";

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

const initial = {
  name: "",
  variety: "",
  category: "Vegetable",
  area: "",
  farmer: "Ramesh Kumar",
  farmName: "Green Valley Farms",
  location: "",
  gps: "",
  plantedOn: "",
  harvestOn: "",
};

function RegisterCrop() {
  const { addCrop } = useHarvest();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);

  const set = (key: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      toast.error("A crop name and location are needed", {
        description: "These appear on the passport.",
      });
      return;
    }
    const crop = addCrop({
      ...form,
      plantedOn: form.plantedOn || new Date().toISOString(),
      harvestOn: form.harvestOn || new Date().toISOString(),
    });
    toast.success("Crop registered", { description: `${crop.name} now has ID ${crop.id}` });
    navigate({ to: "/crops/$cropId", params: { cropId: crop.id } });
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
          <Button type="submit" className="h-12 flex-1 rounded-2xl sm:flex-none sm:px-10">
            Save crop
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
