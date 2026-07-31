import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import tomato from "@/assets/crop-tomato.jpg";
import wheat from "@/assets/crop-wheat.jpg";
import chili from "@/assets/crop-chili.jpg";

export type ActivityKind =
  | "sowing"
  | "irrigation"
  | "fertilizer"
  | "pest"
  | "weeding"
  | "flowering"
  | "photo"
  | "harvest";

export type Activity = {
  id: string;
  cropId: string;
  kind: ActivityKind;
  title: string;
  note: string;
  date: string; // ISO
  media: "photo" | "voice" | "text" | "mixed";
  aiEnhanced: boolean;
  aiSummary?: string;
  confidence?: number;
  photo?: string;
};

export type Crop = {
  id: string;
  name: string;
  variety: string;
  category: string;
  stage: "Sowing" | "Growing" | "Flowering" | "Harvest Ready" | "Harvested";
  farmer: string;
  farmName: string;
  location: string;
  gps: string;
  area: string;
  plantedOn: string;
  harvestOn: string;
  score: number;
  passport: boolean;
  image: string;
};

const iso = (d: string) => new Date(d).toISOString();

const seedCrops: Crop[] = [
  {
    id: "HID-TOM-2481",
    name: "Tomato",
    variety: "Cherry Tomato",
    category: "Vegetable",
    stage: "Growing",
    farmer: "Ramesh Kumar",
    farmName: "Green Valley Farms",
    location: "Bengaluru, Karnataka",
    gps: "12.9716° N, 77.5946° E",
    area: "2.5 acres",
    plantedOn: iso("2026-04-15"),
    harvestOn: iso("2026-08-20"),
    score: 96,
    passport: true,
    image: tomato,
  },
  {
    id: "HID-WHT-1130",
    name: "Wheat",
    variety: "Sharbati",
    category: "Cereal",
    stage: "Harvest Ready",
    farmer: "Ramesh Kumar",
    farmName: "Green Valley Farms",
    location: "Belagavi, Karnataka",
    gps: "15.8497° N, 74.4977° E",
    area: "6 acres",
    plantedOn: iso("2026-02-02"),
    harvestOn: iso("2026-08-05"),
    score: 88,
    passport: false,
    image: wheat,
  },
  {
    id: "HID-CHI-0774",
    name: "Green Chili",
    variety: "Byadgi",
    category: "Spice",
    stage: "Flowering",
    farmer: "Ramesh Kumar",
    farmName: "Sunrise Plot 3",
    location: "Mysuru, Karnataka",
    gps: "12.2958° N, 76.6394° E",
    area: "1.2 acres",
    plantedOn: iso("2026-05-10"),
    harvestOn: iso("2026-09-12"),
    score: 79,
    passport: false,
    image: chili,
  },
];

const seedActivities: Activity[] = [
  {
    id: "a1",
    cropId: "HID-TOM-2481",
    kind: "sowing",
    title: "Seed Planted",
    note: "Cherry tomato seedlings transplanted across 2.5 acres in raised beds.",
    date: iso("2026-04-15T07:10:00"),
    media: "text",
    aiEnhanced: true,
    aiSummary: "Transplanting completed on schedule with healthy nursery stock.",
    confidence: 97,
  },
  {
    id: "a2",
    cropId: "HID-TOM-2481",
    kind: "irrigation",
    title: "Drip Irrigation",
    note: "Drip lines run for 45 minutes, soil moisture verified at 60%.",
    date: iso("2026-04-18T06:40:00"),
    media: "voice",
    aiEnhanced: true,
    aiSummary: "Controlled irrigation cycle, moisture within optimum band.",
    confidence: 94,
  },
  {
    id: "a3",
    cropId: "HID-TOM-2481",
    kind: "photo",
    title: "Crop Photo Uploaded",
    note: "Field photo captured to document canopy development.",
    date: iso("2026-05-22T17:05:00"),
    media: "photo",
    aiEnhanced: false,
    photo: tomato,
  },
  {
    id: "a4",
    cropId: "HID-TOM-2481",
    kind: "fertilizer",
    title: "Fertilizer Application",
    note: "Organic vermicompost applied at 2 tonnes per acre.",
    date: iso("2026-05-25T08:30:00"),
    media: "mixed",
    aiEnhanced: true,
    aiSummary: "Organic nutrition applied; no synthetic inputs recorded.",
    confidence: 98,
  },
  {
    id: "a5",
    cropId: "HID-TOM-2481",
    kind: "pest",
    title: "Pest Inspection",
    note: "Checked for leaf miner. Only trace activity, no spray required.",
    date: iso("2026-07-02T09:15:00"),
    media: "text",
    aiEnhanced: true,
    aiSummary: "Preventive scouting; pest pressure below action threshold.",
    confidence: 91,
  },
  {
    id: "a6",
    cropId: "HID-TOM-2481",
    kind: "flowering",
    title: "Flowering Stage",
    note: "Uniform flowering observed across all beds.",
    date: iso("2026-07-20T07:50:00"),
    media: "photo",
    aiEnhanced: false,
    photo: tomato,
  },
  {
    id: "a7",
    cropId: "HID-WHT-1130",
    kind: "harvest",
    title: "Pre-harvest Check",
    note: "Grain moisture measured at 13.5%, ready for combine harvesting.",
    date: iso("2026-07-28T11:00:00"),
    media: "text",
    aiEnhanced: true,
    aiSummary: "Crop matured and within safe harvest moisture range.",
    confidence: 95,
    photo: wheat,
  },
  {
    id: "a8",
    cropId: "HID-CHI-0774",
    kind: "weeding",
    title: "Manual Weeding",
    note: "Inter-row weeding completed by a team of four.",
    date: iso("2026-07-30T08:00:00"),
    media: "voice",
    aiEnhanced: true,
    aiSummary: "Mechanical weed control, no herbicide used.",
    confidence: 89,
  },
];

type Store = {
  crops: Crop[];
  activities: Activity[];
  addCrop: (crop: Omit<Crop, "id" | "score" | "passport" | "image" | "stage">) => Crop;
  addActivity: (activity: Omit<Activity, "id">) => void;
  generatePassport: (cropId: string) => void;
};

const HarvestContext = createContext<Store | null>(null);

export function HarvestProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>(seedCrops);
  const [activities, setActivities] = useState<Activity[]>(seedActivities);

  const addCrop: Store["addCrop"] = useCallback((data) => {
    const crop: Crop = {
      ...data,
      id: `HID-${data.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`,
      stage: "Sowing",
      score: 42,
      passport: false,
      image: chili,
    };
    setCrops((prev) => [crop, ...prev]);
    return crop;
  }, []);

  const addActivity: Store["addActivity"] = useCallback((data) => {
    setActivities((prev) => [{ ...data, id: crypto.randomUUID() }, ...prev]);
    setCrops((prev) =>
      prev.map((c) => (c.id === data.cropId ? { ...c, score: Math.min(99, c.score + 2) } : c)),
    );
  }, []);

  const generatePassport: Store["generatePassport"] = useCallback((cropId) => {
    setCrops((prev) => prev.map((c) => (c.id === cropId ? { ...c, passport: true } : c)));
  }, []);

  const value = useMemo(
    () => ({ crops, activities, addCrop, addActivity, generatePassport }),
    [crops, activities, addCrop, addActivity, generatePassport],
  );

  return <HarvestContext.Provider value={value}>{children}</HarvestContext.Provider>;
}

export function useHarvest() {
  const ctx = useContext(HarvestContext);
  if (!ctx) throw new Error("useHarvest must be used inside HarvestProvider");
  return ctx;
}

export function useCrop(cropId: string) {
  const { crops, activities } = useHarvest();
  return {
    crop: crops.find((c) => c.id === cropId),
    timeline: activities
      .filter((a) => a.cropId === cropId)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
  };
}

export const activityMeta: Record<ActivityKind, { label: string; emoji: string }> = {
  sowing: { label: "Sowing", emoji: "🌱" },
  irrigation: { label: "Irrigation", emoji: "💧" },
  fertilizer: { label: "Fertilizer", emoji: "🪴" },
  pest: { label: "Pest Monitoring", emoji: "🐛" },
  weeding: { label: "Weeding", emoji: "🌿" },
  flowering: { label: "Flowering", emoji: "🌼" },
  photo: { label: "Photo Record", emoji: "📷" },
  harvest: { label: "Harvest", emoji: "🌾" },
};

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: string) {
  const diff = Date.now() - +new Date(d);
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
