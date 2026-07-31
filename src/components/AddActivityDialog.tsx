import { useState } from "react";
import { Camera, Mic, PenLine, Sparkles, Upload } from "lucide-react";
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

const guesses: { match: string[]; kind: ActivityKind; category: string }[] = [
  { match: ["fertil", "compost", "manure", "urea"], kind: "fertilizer", category: "Nutrition" },
  { match: ["water", "irrig", "drip"], kind: "irrigation", category: "Water Management" },
  { match: ["pest", "insect", "spray", "worm"], kind: "pest", category: "Crop Protection" },
  { match: ["weed"], kind: "weeding", category: "Field Maintenance" },
  { match: ["flower", "bloom"], kind: "flowering", category: "Growth Stage" },
  { match: ["harvest", "pick"], kind: "harvest", category: "Harvest" },
  { match: ["sow", "plant", "transplant", "seed"], kind: "sowing", category: "Establishment" },
];

export function AddActivityDialog({
  cropId,
  trigger,
}: {
  cropId: string;
  trigger: React.ReactNode;
}) {
  const { addActivity } = useHarvest();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<ActivityKind>("irrigation");
  const [media, setMedia] = useState<"text" | "photo" | "voice" | "mixed">("text");
  const [ai, setAi] = useState<{ title: string; description: string; category: string; confidence: number } | null>(
    null,
  );

  const enhance = () => {
    if (!note.trim()) {
      toast.error("Write a short note first", { description: "Even a few words are enough." });
      return;
    }
    const lower = note.toLowerCase();
    const found = guesses.find((g) => g.match.some((m) => lower.includes(m)));
    const resolved = found?.kind ?? kind;
    setKind(resolved);
    setAi({
      title: activityMeta[resolved].label,
      description:
        note.trim().replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\.?$/, "."),
      category: found?.category ?? "General Field Work",
      confidence: found ? 98 : 86,
    });
    toast.success("Enhanced by AI", { description: "Note formatted and categorised." });
  };

  const save = () => {
    if (!note.trim()) {
      toast.error("Nothing to save yet");
      return;
    }
    addActivity({
      cropId,
      kind,
      title: ai?.title ?? activityMeta[kind].label,
      note: ai?.description ?? note.trim(),
      date: new Date().toISOString(),
      media,
      aiEnhanced: Boolean(ai),
      ...(ai ? { aiSummary: `${ai.category} · recorded by farmer`, confidence: ai.confidence } : {}),
    });
    toast.success("Activity recorded", { description: "Timeline and score updated." });
    setNote("");
    setAi(null);
    setMedia("text");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add activity</DialogTitle>
          <DialogDescription>
            Record what happened in the field today. AI will format it for the passport.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { key: "photo", label: "Take photo", icon: Camera },
              { key: "photo", label: "Upload", icon: Upload },
              { key: "voice", label: "Record voice", icon: Mic },
              { key: "text", label: "Write note", icon: PenLine },
            ].map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setMedia((prev) =>
                    prev !== "text" && prev !== opt.key ? "mixed" : (opt.key as "photo" | "voice" | "text"),
                  );
                  toast(`${opt.label} attached to this activity`);
                }}
                className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 p-3 text-xs font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                <opt.icon className="size-5 text-primary" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`activity-type-${cropId}`}>Activity type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ActivityKind)}>
              <SelectTrigger id={`activity-type-${cropId}`} className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityMeta).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.emoji} {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`activity-note-${cropId}`}>Field note</Label>
            <Textarea
              id={`activity-note-${cropId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Applied fertilizer today."
              className="rounded-2xl"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={enhance}
            className="w-full gap-2 rounded-2xl"
          >
            <Sparkles className="size-4 text-gold" /> AI Enhance
          </Button>

          {ai ? (
            <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
              <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
                <Sparkles className="size-3" /> Enhanced by AI
              </Badge>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">Activity</dt>
                  <dd className="font-medium">{ai.title}</dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd>{ai.description}</dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>{ai.category}</dd>
                </div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">Confidence</dt>
                  <dd className="font-medium">{ai.confidence}%</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="rounded-2xl" onClick={save}>
            Save activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
