import { useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CROP_IMAGE_UNAVAILABLE,
  resolveCropImage,
} from "@/lib/crop-images";

type CropLike = {
  name: string;
  variety: string;
  category: string;
  image: string;
};

/**
 * Single component for every crop photo in the app (dashboard, crop cards,
 * crop details, passport). Resolves the image through the centralized
 * resolver, shows an honest "Crop image unavailable" placeholder for unknown
 * crops, and falls back to the placeholder if a URL ever breaks — it never
 * crashes and never shows a photo of a different crop.
 */
export function CropImage({
  crop,
  alt,
  className,
  loading = "lazy",
  width,
  height,
}: {
  crop: CropLike;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
}) {
  const src = useMemo(
    () => resolveCropImage(crop.name, crop.variety, crop.category, crop.image),
    [crop.name, crop.variety, crop.category, crop.image],
  );
  const [failed, setFailed] = useState(false);

  if (src === CROP_IMAGE_UNAVAILABLE || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "grid place-items-center overflow-hidden bg-muted/70 text-center",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 p-6">
          <span className="grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <Sprout className="size-5" />
          </span>
          <p className="text-xs font-medium text-muted-foreground">Crop image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
