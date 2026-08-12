import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Mic,
  PenLine,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activityMeta, useHarvest, type ActivityKind } from "@/lib/harvest-store";
import { useI18n } from "@/i18n";

const guesses: { match: string[]; kind: ActivityKind; category: string }[] = [
  { match: ["fertil", "compost", "manure", "urea"], kind: "fertilizer", category: "Nutrition" },
  { match: ["water", "irrig", "drip"], kind: "irrigation", category: "Water Management" },
  { match: ["pest", "insect", "spray", "worm"], kind: "pest", category: "Crop Protection" },
  { match: ["weed"], kind: "weeding", category: "Field Maintenance" },
  { match: ["flower", "bloom"], kind: "flowering", category: "Growth Stage" },
  { match: ["harvest", "pick"], kind: "harvest", category: "Harvest" },
  { match: ["sow", "plant", "transplant", "seed"], kind: "sowing", category: "Establishment" },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

export function AddActivityDialog({
  cropId,
  trigger,
}: {
  cropId: string;
  trigger: React.ReactNode;
}) {
  const { addActivity } = useHarvest();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<ActivityKind>("irrigation");
  const [photo, setPhoto] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState<{ title: string; description: string; category: string; confidence: number } | null>(
    null,
  );

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Stop any in-progress recording when the dialog closes.
  useEffect(() => {
    if (!open) stopVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const media: "photo" | "voice" | "text" | "mixed" = photo && audio
    ? "mixed"
    : photo
      ? "photo"
      : audio
        ? "voice"
        : "text";

  const enhance = () => {
    if (!note.trim()) {
      toast.error(t("activity.writeNoteFirst"), { description: t("activity.writeNoteFirstDesc") });
      return;
    }
    const lower = note.toLowerCase();
    const found = guesses.find((g) => g.match.some((m) => lower.includes(m)));
    const resolved = found?.kind ?? kind;
    setKind(resolved);
    setAi({
      title: t(activityMeta[resolved].labelKey),
      description:
        note.trim().replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\.?$/, "."),
      category: found?.category ?? t("activity.categoryGeneral"),
      confidence: found ? 98 : 86,
    });
    toast.success(t("activity.enhancedByAi"), { description: t("activity.enhancedByAiDesc") });
  };

  const attachPhoto = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("activity.imageFileError"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("activity.imageTooLarge"), { description: t("activity.imageTooLargeDesc") });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhoto(dataUrl);
    } catch {
      toast.error(t("activity.imageReadError"), { description: t("activity.imageReadErrorDesc") });
    }
  };

  const startVoice = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error(t("activity.voiceUnsupported"), {
        description: t("activity.voiceUnsupportedDesc"),
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const reader = new FileReader();
        reader.onload = () => setAudio(String(reader.result));
        reader.onerror = () => toast.error(t("activity.voiceSaveError"));
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.onerror = () => {
        toast.error(t("activity.recordingFailed"), { description: t("activity.recordingFailedDesc") });
        setRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error(t("activity.micUnavailable"), {
        description: t("activity.micUnavailableDesc"),
      });
    }
  };

  const stopVoice = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setRecording(false);
  };

  const save = async () => {
    if (!note.trim()) {
      toast.error(t("activity.nothingToSave"));
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await addActivity({
        cropId,
        kind,
        title: ai?.title ?? t(activityMeta[kind].labelKey),
        note: ai?.description ?? note.trim(),
        date: new Date().toISOString(),
        media,
        aiEnhanced: Boolean(ai),
        ...(ai ? { aiSummary: `${ai.category} · recorded by farmer`, confidence: ai.confidence } : {}),
        ...(photo ? { photo } : {}),
        ...(audio ? { audio } : {}),
      });
      toast.success(t("activity.recorded"), { description: t("activity.recordedDesc") });
      setNote("");
      setAi(null);
      setPhoto(null);
      setAudio(null);
      setOpen(false);
    } catch {
      toast.error(t("activity.saveError"), { description: t("activity.saveErrorDesc") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("activity.add")}</DialogTitle>
          <DialogDescription>
            {t("activity.dialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium transition-colors hover:border-primary hover:bg-accent"
            >
              <Camera className="size-5 text-primary" />
              {t("activity.takePhoto")}
            </button>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium transition-colors hover:border-primary hover:bg-accent"
            >
              <Upload className="size-5 text-primary" />
              {t("activity.upload")}
            </button>
            <button
              type="button"
              onClick={() => (recording ? stopVoice() : void startVoice())}
              className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors ${
                recording
                  ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15"
                  : "border-border bg-muted/40 hover:border-primary hover:bg-accent"
              }`}
            >
              <Mic className={`size-5 ${recording ? "animate-pulse text-destructive" : "text-primary"}`} />
              {recording ? t("activity.stopRecording") : t("activity.recordVoice")}
            </button>
            <button
              type="button"
              onClick={() => noteRef.current?.focus()}
              className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium transition-colors hover:border-primary hover:bg-accent"
            >
              <PenLine className="size-5 text-primary" />
              {t("activity.writeNote")}
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void attachPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void attachPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {photo ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <img src={photo} alt={t("activity.photoAttached")} className="max-h-56 w-full object-cover" />
              <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">{t("activity.photoAttached")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-xl text-destructive"
                  onClick={() => setPhoto(null)}
                >
                  <Trash2 className="size-3.5" /> {t("common.remove")}
                </Button>
              </div>
            </div>
          ) : null}

          {audio ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-3">
              <audio controls src={audio} className="w-full" preload="metadata" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{t("activity.voiceAttached")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-xl text-destructive"
                  onClick={() => setAudio(null)}
                >
                  <Trash2 className="size-3.5" /> {t("common.remove")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor={`activity-type-${cropId}`}>{t("activity.type")}</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ActivityKind)}>
              <SelectTrigger id={`activity-type-${cropId}`} className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityMeta).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.emoji} {t(meta.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`activity-note-${cropId}`}>{t("activity.note")}</Label>
            <Textarea
              ref={noteRef}
              id={`activity-note-${cropId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t("activity.notePlaceholder")}
              className="rounded-2xl"
            />
          </div>

          <Button type="button" variant="secondary" onClick={enhance} className="w-full gap-2 rounded-2xl">
            <Sparkles className="size-4 text-gold" /> {t("activity.aiEnhance")}
          </Button>

          {ai ? (
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
              <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
                <Sparkles className="size-3" /> {t("activity.enhancedBadge")}
              </Badge>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">{t("activity.activity")}</dt>
                  <dd className="font-medium">{ai.title}</dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">{t("activity.description")}</dt>
                  <dd>{ai.description}</dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">{t("activity.category")}</dt>
                  <dd>{ai.category}</dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">{t("activity.confidence")}</dt>
                  <dd className="font-medium">{ai.confidence}%</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button className="rounded-2xl" onClick={() => void save()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("common.saving")}
              </>
            ) : (
              t("activity.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
