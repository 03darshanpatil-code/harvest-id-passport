import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Languages } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHarvest, type FarmerProfile } from "@/lib/harvest-store";
import { LANGUAGES, useI18n } from "@/i18n";

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
  const { profile, profileLoading, profileError, saveProfile, refreshProfile } = useHarvest();
  const { t, lang, setLang } = useI18n();
  const [form, setForm] = useState<FarmerProfile>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const updateField = (field: keyof FarmerProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePreference = (key: "reminders" | "aiFormatting" | "publicSharing", value: boolean) => {
    setForm((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      await saveProfile(form);
      toast.success(t("settings.saved"), { description: t("settings.savedDesc") });
    } catch (err) {
      toast.error(t("settings.saveError"), {
        description: err instanceof Error ? err.message : t("settings.saveErrorDesc"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="mx-auto max-w-2xl">
        <div className="card-soft flex items-center gap-4 p-6">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-secondary font-display text-xl font-semibold text-secondary-foreground">
            {profile.fullName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("") || "RK"}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold">{profile.fullName}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {profile.farmName} · {profile.location}
            </p>
          </div>
        </div>

        {profileError ? (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {profileError}
          </div>
        ) : null}

        <div className="card-soft mt-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">{t("settings.profile")}</h3>
            <Button variant="ghost" size="sm" onClick={() => void refreshProfile()}>
              {profileLoading ? t("common.refreshing") : t("common.refresh")}
            </Button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="p-name">{t("settings.fullName")}</Label>
              <Input id="p-name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-farm">{t("settings.farmName")}</Label>
              <Input id="p-farm" value={form.farmName} onChange={(e) => updateField("farmName", e.target.value)} className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-phone">{t("settings.phone")}</Label>
              <Input id="p-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-email">{t("settings.email")}</Label>
              <Input id="p-email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="p-location">{t("settings.location")}</Label>
              <Input id="p-location" value={form.location} onChange={(e) => updateField("location", e.target.value)} className="h-12 rounded-2xl" />
            </div>
          </div>
          <Button className="mt-5 h-12 rounded-2xl sm:px-8" onClick={() => void submit()} disabled={saving}>
            {saving ? t("common.saving") : t("settings.saveChanges")}
          </Button>
        </div>

        <div className="card-soft mt-5 p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <Languages className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{t("settings.language")}</h3>
              <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
            </div>
          </div>
          <div className="mt-4">
            <Select value={lang} onValueChange={(value) => setLang(value as typeof lang)}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.native}
                    <span className="ml-2 text-xs text-muted-foreground">({language.english})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="card-soft mt-5 p-6">
          <h3 className="text-base font-semibold">{t("settings.preferences")}</h3>
          <div className="mt-2">
            {[
              { id: "s-remind", label: t("settings.reminders"), desc: t("settings.remindersDesc"), key: "reminders" as const },
              { id: "s-ai", label: t("settings.aiFormatting"), desc: t("settings.aiFormattingDesc"), key: "aiFormatting" as const },
              { id: "s-share", label: t("settings.publicSharing"), desc: t("settings.publicSharingDesc"), key: "publicSharing" as const },
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
                  <Switch id={row.id} checked={form.preferences[row.key]} onCheckedChange={(value) => updatePreference(row.key, value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
