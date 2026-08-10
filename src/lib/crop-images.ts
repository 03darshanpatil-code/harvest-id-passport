const GENERIC_IMAGE =
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80";

const IMAGE_MAP: Record<string, string> = {
  tomato: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=80",
  wheat: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80",
  onion: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=1200&q=80",
  carrot: "https://images.unsplash.com/photo-1447175008436-2f2c0974b286?auto=format&fit=crop&w=1200&q=80",
  cabbage: "https://images.unsplash.com/photo-1583207816774-7f1d5d5fbad7?auto=format&fit=crop&w=1200&q=80",
  cauliflower: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  broccoli: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=1200&q=80",
  spinach: "https://images.unsplash.com/photo-1576045051382-3b8c4d8f4b2b?auto=format&fit=crop&w=1200&q=80",
  chilli: "https://images.unsplash.com/photo-1580740446493-0bf2aadda4c5?auto=format&fit=crop&w=1200&q=80",
  chili: "https://images.unsplash.com/photo-1580740446493-0bf2aadda4c5?auto=format&fit=crop&w=1200&q=80",
  pepper: "https://images.unsplash.com/photo-1580740446493-0bf2aadda4c5?auto=format&fit=crop&w=1200&q=80",
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80",
  banana: "https://images.unsplash.com/photo-1574226516833-0f3b4f5f8e4d?auto=format&fit=crop&w=1200&q=80",
  apple: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=1200&q=80",
  orange: "https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=1200&q=80",
  lemon: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80",
  watermelon: "https://images.unsplash.com/photo-1629084092232-b7b3f3f2c3bc?auto=format&fit=crop&w=1200&q=80",
  pineapple: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1200&q=80",
  grapes: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
  coconut: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  sugarcane: "https://images.unsplash.com/photo-1492496913989-0d0a3f0b1c8e?auto=format&fit=crop&w=1200&q=80",
  corn: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
  maize: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
  cotton: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
  coffee: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=1200&q=80",
  tea: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
};

export function resolveCropImage(name = "", variety = "", category = "", existingImage?: string) {
  const haystack = [name, variety, category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [key, image] of Object.entries(IMAGE_MAP)) {
    if (haystack.includes(key)) return image;
  }

  if (existingImage && typeof existingImage === "string" && existingImage.trim()) {
    return existingImage;
  }

  return GENERIC_IMAGE;
}

const FALLBACK_SITE_URL = "https://harvest-id-passport.vercel.app";

export function getPublicSiteUrl(path = "") {
  const configured = (import.meta.env["VITE_PUBLIC_SITE_URL"] || import.meta.env["VITE_APP_URL"] || "")
    .trim()
    .replace(/\/$/, "");

  // Prefer the origin the app is actually served from, so QR codes resolve to
  // the deployed (Vercel) domain in production and to the dev/preview origin
  // locally. The hardcoded fallback is only used server-side (no window) when
  // no env override is configured.
  const browserOrigin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  const origin = configured || browserOrigin || FALLBACK_SITE_URL;
  const normalized = origin.replace(/\/$/, "");
  return `${normalized}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPassportUrl(cropId: string) {
  const normalizedId = String(cropId || "").trim();
  if (!normalizedId) return getPublicSiteUrl();
  return getPublicSiteUrl(`/passport/${encodeURIComponent(normalizedId)}`);
}

export function parseCropIdFromQr(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];
  try {
    const url = new URL(trimmed);
    candidates.push(url.pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    // ignore
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.match(/(?:^|\/)([A-Za-z0-9._-]+)$/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}
