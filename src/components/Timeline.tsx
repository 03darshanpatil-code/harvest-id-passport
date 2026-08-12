import { Sparkles, Mic, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { activityMeta, formatDate, formatTime, type Activity } from "@/lib/harvest-store";
import { useI18n } from "@/i18n";

export function Timeline({ items }: { items: Activity[] }) {
  const { t } = useI18n();
  if (items.length === 0) {
    return (
      <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
        <span className="text-4xl">🧾</span>
        <p className="text-sm font-medium">{t("timeline.emptyTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("timeline.emptyDesc")}</p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 border-l border-border">
      {items.map((a) => (
        <li key={a.id} className="relative pb-8 pl-8 last:pb-0">
          <span className="absolute -left-[19px] grid size-9 place-items-center rounded-full border border-border bg-card text-base shadow-soft">
            {activityMeta[a.kind].emoji}
          </span>
          <div className="card-soft p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold">{a.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDate(a.date)} · {formatTime(a.date)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {(a.media === "photo" || a.media === "mixed") && (
                  <span className="grid size-8 place-items-center rounded-xl bg-muted" title={t("timeline.photoEvidence")}>
                    <ImageIcon className="size-4 text-muted-foreground" />
                  </span>
                )}
                {(a.media === "voice" || a.media === "mixed") && (
                  <span className="grid size-8 place-items-center rounded-xl bg-muted" title={t("timeline.voiceNote")}>
                    <Mic className="size-4 text-muted-foreground" />
                  </span>
                )}
              </div>
            </div>

            <p className="mt-2 text-sm leading-relaxed">{a.note}</p>

            {a.photo ? (
              <img
                src={a.photo}
                alt={t("timeline.fieldEvidence", { title: a.title })}
                loading="lazy"
                onError={(event) => {
                  // A broken attachment disappears rather than showing an unrelated photo.
                  event.currentTarget.style.display = "none";
                }}
                width={1024}
                height={768}
                className="mt-3 aspect-[16/9] w-full rounded-2xl object-cover"
              />
            ) : null}

            {a.audio ? (
              <audio
                controls
                src={a.audio}
                preload="metadata"
                className="mt-3 w-full rounded-2xl"
              />
            ) : null}

            {a.aiEnhanced ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-gold/10 p-3">
                <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
                  <Sparkles className="size-3" /> {t("activity.enhancedByAi")}
                </Badge>
                <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {a.aiSummary}
                  {a.confidence ? ` · ${t("timeline.confidence", { confidence: a.confidence })}` : ""}
                </span>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
