import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import tomato from "@/assets/crop-tomato.jpg";
import wheat from "@/assets/crop-wheat.jpg";
import chili from "@/assets/crop-chili.jpg";
import { resolveCropImage, buildPassportUrl, parseCropIdFromQr } from "@/lib/crop-images";

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
  date: string;
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

type CropDraft = Omit<Crop, "id" | "score" | "passport" | "image" | "stage"> & {
  image?: string;
  stage?: Crop["stage"];
  score?: number;
  passport?: boolean;
};

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string; message?: string };

type CropApiRow = Record<string, unknown>;
type ActivityApiRow = Record<string, unknown>;

const API_BASE_URL = (() => {
  const configured = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

  if (configured) return configured;

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:5000";
  }

  return "https://harvest-id-backend.onrender.com";
})();

function getFallbackImage(name = "") {
  const normalized = name.toLowerCase();
  if (normalized.includes("wheat") || normalized.includes("grain")) return wheat;
  if (normalized.includes("tom")) return tomato;
  return chili;
}

export type FarmerProfile = {
  fullName: string;
  farmName: string;
  phone: string;
  email: string;
  location: string;
  preferences: {
    reminders: boolean;
    aiFormatting: boolean;
    publicSharing: boolean;
  };
};

function normalizeStage(status?: string): Crop["stage"] {
  const value = (status || "").toLowerCase();
  if (value.includes("flower")) return "Flowering";
  if (value.includes("harvested")) return "Harvested";
  if (value.includes("ready") || value.includes("harvest")) return "Harvest Ready";
  if (value.includes("sow")) return "Sowing";
  return "Growing";
}

function normalizeCrop(row: CropApiRow): Crop {
  const name = String(row.crop_name || row.name || "");
  const image = typeof row.image === "string" && row.image.trim()
    ? row.image
    : resolveCropImage(name, String(row.variety || ""), String(row.category || ""), getFallbackImage(name));

  return {
    id: String(row.id ?? ""),
    name,
    variety: String(row.variety || ""),
    category: String(row.category || "Vegetable"),
    stage: normalizeStage(String(row.status || row.stage || "")),
    farmer: String(row.farmer_name || row.farmer || ""),
    farmName: String(row.farm_name || row.farmName || ""),
    location: String(row.location || ""),
    gps: String(row.gps || ""),
    area: String(row.area || ""),
    plantedOn: String(row.planting_date || row.plantedOn || row.planted_on || ""),
    harvestOn: String(row.harvest_date || row.harvestOn || row.harvest_on || ""),
    score: typeof row.score === "number" ? row.score : 70,
    passport: Boolean(row.passport),
    image,
  };
}

function normalizeActivity(row: ActivityApiRow): Activity {
  return {
    id: String(row.id ?? ""),
    cropId: String(row.crop_id || row.cropId || ""),
    kind: (row.kind as ActivityKind) || "sowing",
    title: String(row.title || "Field activity"),
    note: String(row.note || ""),
    date: String(row.date || row.created_at || new Date().toISOString()),
    media: (row.media as Activity["media"]) || "text",
    aiEnhanced: Boolean(row.ai_enhanced || row.aiEnhanced),
    aiSummary: typeof row.ai_summary === "string" ? row.ai_summary : undefined,
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
    photo: typeof row.photo === "string" ? row.photo : undefined,
  };
}

function sanitizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

function buildHarvestPayload(data: Partial<Crop> & Record<string, unknown>) {
  return sanitizePayload({
    farmer_name: data.farmer,
    crop_name: data.name,
    location: data.location,
    planting_date: data.plantedOn,
    harvest_date: data.harvestOn,
    status: data.stage,
    variety: data.variety,
    category: data.category,
    farm_name: data.farmName,
    gps: data.gps,
    area: data.area,
    score: data.score,
    passport: data.passport,
    image: data.image,
    note: data.note,
  });
}

function buildActivityPayload(data: Omit<Activity, "id">) {
  return sanitizePayload({
    crop_id: data.cropId,
    kind: data.kind,
    title: data.title,
    note: data.note,
    date: data.date,
    media: data.media,
    ai_enhanced: data.aiEnhanced,
    ai_summary: data.aiSummary,
    confidence: data.confidence,
    photo: data.photo,
  });
}

type Store = {
  crops: Crop[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
  profile: FarmerProfile;
  profileLoading: boolean;
  profileError: string | null;
  refreshData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (updates: Partial<FarmerProfile>) => Promise<FarmerProfile>;
  addCrop: (crop: CropDraft) => Promise<Crop>;
  updateCrop: (cropId: string, updates: Partial<Crop> & Record<string, unknown>) => Promise<Crop | null>;
  deleteCrop: (cropId: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, "id">) => Promise<void>;
  generatePassport: (cropId: string) => Promise<void>;
};

const HarvestContext = createContext<Store | null>(null);

export function HarvestProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<FarmerProfile>({
    fullName: "Ramesh Kumar",
    farmName: "Green Valley Farms",
    phone: "+91 98450 00000",
    email: "ramesh@greenvalley.in",
    location: "Bengaluru, Karnataka",
    preferences: { reminders: true, aiFormatting: true, publicSharing: true },
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cropPayload, activityPayload] = await Promise.all([
        apiRequest<ApiEnvelope<CropApiRow[]>>("/api/harvest"),
        apiRequest<ApiEnvelope<ActivityApiRow[]>>("/api/activities"),
      ]);
      setCrops((cropPayload.data || []).map(normalizeCrop));
      setActivities((activityPayload.data || []).map(normalizeActivity));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await apiRequest<ApiEnvelope<FarmerProfile>>("/api/profile");
      if (response.data) setProfile(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load profile";
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (updates) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await apiRequest<ApiEnvelope<FarmerProfile>>("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, ...updates, preferences: { ...profile.preferences, ...(updates.preferences || {}) } }),
      });
      const nextProfile = response.data || { ...profile, ...updates };
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save profile";
      setProfileError(message);
      throw new Error(message);
    } finally {
      setProfileLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void refreshData();
    void refreshProfile();
  }, [refreshData, refreshProfile]);

  const addCrop: Store["addCrop"] = useCallback(async (data) => {
    setError(null);
    try {
      const payloadImage = data.image || resolveCropImage(data.name, data.variety, data.category, "");
    const response = await apiRequest<ApiEnvelope<CropApiRow | CropApiRow[]>>("/api/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          name: data.name,
          farmer: data.farmer,
          farmName: data.farmName,
          plantedOn: data.plantedOn,
          harvestOn: data.harvestOn,
          image: payloadImage,
        }),
      });
      const created = Array.isArray(response.data) ? response.data[0] : response.data;
      const crop = normalizeCrop(created as CropApiRow);
      setCrops((prev) => [crop, ...prev]);
      return crop;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save crop";
      setError(message);
      throw err;
    }
  }, []);

  const updateCrop: Store["updateCrop"] = useCallback(async (cropId, updates) => {
    setError(null);
    try {
      const response = await apiRequest<ApiEnvelope<CropApiRow | CropApiRow[]>>(`/api/harvest/${cropId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHarvestPayload(updates as Partial<Crop> & Record<string, unknown>)),
      });
      const updated = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!updated) return null;
      const normalized = normalizeCrop(updated as CropApiRow);
      setCrops((prev) => prev.map((crop) => (crop.id === cropId ? normalized : crop)));
      return normalized;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update crop";
      setError(message);
      throw err;
    }
  }, []);

  const deleteCrop: Store["deleteCrop"] = useCallback(async (cropId) => {
    setError(null);
    try {
      await apiRequest<ApiEnvelope<null>>(`/api/harvest/${cropId}`, { method: "DELETE" });
      setCrops((prev) => prev.filter((crop) => crop.id !== cropId));
      setActivities((prev) => prev.filter((activity) => activity.cropId !== cropId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete crop";
      setError(message);
      throw err;
    }
  }, []);

  const addActivity: Store["addActivity"] = useCallback(async (data) => {
    setError(null);
    try {
      const response = await apiRequest<ApiEnvelope<ActivityApiRow | ActivityApiRow[]>>("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildActivityPayload(data)),
      });
      const created = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!created) return;
      const activity = normalizeActivity(created as ActivityApiRow);
      setActivities((prev) => [activity, ...prev]);
      setCrops((prev) =>
        prev.map((crop) => (crop.id === activity.cropId ? { ...crop, score: Math.min(99, crop.score + 2) } : crop)),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save activity";
      setError(message);
      throw err;
    }
  }, []);

  const generatePassport: Store["generatePassport"] = useCallback(async (cropId) => {
    setError(null);
    try {
      const response = await apiRequest<ApiEnvelope<CropApiRow | CropApiRow[]>>(`/api/harvest/${cropId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passport: true }),
      });
      const updated = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!updated) return;
      const normalized = normalizeCrop(updated as CropApiRow);
      setCrops((prev) => prev.map((crop) => (crop.id === cropId ? normalized : crop)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate passport";
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      crops,
      activities,
      loading,
      error,
      profile,
      profileLoading,
      profileError,
      refreshData,
      refreshProfile,
      saveProfile,
      addCrop,
      updateCrop,
      deleteCrop,
      addActivity,
      generatePassport,
    }),
    [activities, addActivity, addCrop, crops, deleteCrop, error, generatePassport, loading, profile, profileError, profileLoading, refreshData, refreshProfile, saveProfile, updateCrop],
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