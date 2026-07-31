import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — HarvestID" },
      {
        name: "description",
        content: "Manage your farmer profile, notifications and passport sharing preferences.",
      },
      { property: "og:title", content: "Profile & Settings — HarvestID" },
      { property: "og:description", content: "Your HarvestID account preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppLayout title="Settings" subtitle="Profile & preferences">
      <div className="mx-auto max-w-2xl">
        <div className="card-soft flex items-center gap-4 p-6">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-secondary font-display text-xl font-semibold text-secondary-foreground">
            RK
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold">Ramesh Kumar</h2>
            <p className="truncate text-sm text-muted-foreground">
              Green Valley Farms · Bengaluru, Karnataka
            </p>
          </div>
        </div>

        <div className="card-soft mt-5 p-6">
          <h3 className="text-base font-semibold">Farmer profile</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="p-name">Full name</Label>
              <Input id="p-name" defaultValue="Ramesh Kumar" className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-farm">Farm name</Label>
              <Input id="p-farm" defaultValue="Green Valley Farms" className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" defaultValue="+91 98450 00000" className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" defaultValue="ramesh@greenvalley.in" className="h-12 rounded-2xl" />
            </div>
          </div>
          <Button
            className="mt-5 h-12 rounded-2xl sm:px-8"
            onClick={() => toast.success("Profile saved")}
          >
            Save changes
          </Button>
        </div>

        <div className="card-soft mt-5 p-6">
          <h3 className="text-base font-semibold">Preferences</h3>
          <div className="mt-2">
            {[
              { id: "s-remind", label: "Daily activity reminders", desc: "A nudge when a crop goes quiet." },
              { id: "s-ai", label: "AI note formatting", desc: "Automatically clean up field notes." },
              { id: "s-share", label: "Public passport sharing", desc: "Allow buyers to open QR links." },
            ].map((row, i) => (
              <div key={row.id}>
                {i > 0 ? <Separator /> : null}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
                  <div className="min-w-0">
                    <Label htmlFor={row.id} className="text-sm font-medium">
                      {row.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch id={row.id} defaultChecked />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
