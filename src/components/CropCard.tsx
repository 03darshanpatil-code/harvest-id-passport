import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Crop } from "@/lib/harvest-store";
import { CropImage } from "@/components/CropImage";

export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Traceability score ${score} percent`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        transform="rotate(-90 32 32)"
        className="transition-all duration-700"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        className="fill-foreground font-display text-[15px] font-semibold"
      >
        {score}
      </text>
    </svg>
  );
}

export function CropCard({ crop }: { crop: Crop }) {
  return (
    <article className="card-soft lift group overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <CropImage
          crop={crop}
          alt={`${crop.variety} crop at ${crop.farmName}`}
          width={1024}
          height={768}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="rounded-full bg-card/90 text-foreground hover:bg-card/90">
            {crop.stage}
          </Badge>
          {crop.passport ? (
            <Badge className="gap-1 rounded-full bg-gold text-gold-foreground hover:bg-gold">
              <ShieldCheck className="size-3.5" /> Passport
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-5">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{crop.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{crop.variety}</p>
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {crop.location}
          </p>
        </div>
        <ScoreRing score={crop.score} />
      </div>

      <div className="px-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-gold" /> Traceability
          </span>
          <span>{crop.score}%</span>
        </div>
        <Progress value={crop.score} className="h-2" />
      </div>

      <div className="flex flex-wrap gap-2 p-5">
        <Button asChild className="flex-1 rounded-2xl">
          <Link to="/crops/$cropId" params={{ cropId: crop.id }}>
            View details
          </Link>
        </Button>
        <Button asChild variant="secondary" className="flex-1 rounded-2xl">
          <Link to="/passport/$cropId" params={{ cropId: crop.id }}>
            {crop.passport ? "View passport" : "Generate passport"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
