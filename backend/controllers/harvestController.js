const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

const harvestStorePath = path.join(__dirname, "../data/harvest.json");

const normalizeCrop = (row) => ({
  id: String(row.id),
  createdAt: row.created_at,
  name: row.crop_name || row.name || "",
  variety: row.variety || "",
  category: row.category || "Vegetable",
  stage: row.status || "Growing",
  farmer: row.farmer_name || "",
  farmName: row.farm_name || row.farmName || "",
  location: row.location || "",
  gps: row.gps || "",
  area: row.area || "",
  plantedOn: row.planting_date || row.planted_on || "",
  harvestOn: row.harvest_date || row.harvest_on || "",
  score: typeof row.score === "number" ? row.score : 70,
  passport: Boolean(row.passport),
  image: row.image || undefined,
  note: row.note || "",
});

const readHarvestStore = () => {
  try {
    const raw = fs.readFileSync(harvestStorePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHarvestStore = (records) => {
  fs.writeFileSync(harvestStorePath, JSON.stringify(records, null, 2));
};

const getHarvests = async (req, res) => {
  try {
    const { data, error } = await supabase.from("harvest").select("*").order("created_at", { ascending: false });

    if (error) {
      const fallback = readHarvestStore().map(normalizeCrop);
      return res.json({ success: true, data: fallback });
    }

    res.json({ success: true, data: (data || []).map(normalizeCrop) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getHarvestById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid harvest id" });
    }

    const { data, error } = await supabase.from("harvest").select("*").eq("id", id).single();

    if (error) {
      const fallback = readHarvestStore().find((row) => String(row.id) === String(id));
      if (!fallback) {
        return res.status(404).json({ success: false, error: error.message });
      }
      return res.json({ success: true, data: normalizeCrop(fallback) });
    }

    res.json({ success: true, data: normalizeCrop(data) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createHarvest = async (req, res) => {
  try {
    const basePayload = Object.fromEntries(
      Object.entries({
        farmer_name: req.body.farmer_name || req.body.farmer || "",
        crop_name: req.body.crop_name || req.body.name || "",
        location: req.body.location || "",
        planting_date: req.body.planting_date || req.body.plantedOn || null,
        harvest_date: req.body.harvest_date || req.body.harvestOn || null,
        status: req.body.status || "Growing",
      }).filter(([, value]) => value !== undefined && value !== null),
    );

    const extraPayload = Object.fromEntries(
      Object.entries({
        variety: req.body.variety || null,
        category: req.body.category || null,
        farm_name: req.body.farm_name || req.body.farmName || null,
        gps: req.body.gps || null,
        area: req.body.area || null,
        score: typeof req.body.score === "number" ? req.body.score : 70,
        passport: typeof req.body.passport === "boolean" ? req.body.passport : false,
        image: req.body.image || null,
        note: req.body.note || "",
      }).filter(([, value]) => value !== undefined && value !== null),
    );

    const { data, error } = await supabase.from("harvest").insert([basePayload]).select("*");

    if (error) {
      const fallbackRecord = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        ...basePayload,
        ...extraPayload,
      };
      const nextRecords = [fallbackRecord, ...readHarvestStore()];
      writeHarvestStore(nextRecords);
      return res.status(201).json({ success: true, message: "Harvest record created successfully", data: [normalizeCrop(fallbackRecord)] });
    }

    res.status(201).json({ success: true, message: "Harvest record created successfully", data: (data || []).map(normalizeCrop) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateHarvest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid harvest id" });
    }

    const payload = Object.fromEntries(
      Object.entries({
        farmer_name: req.body.farmer_name || req.body.farmer || undefined,
        crop_name: req.body.crop_name || req.body.name || undefined,
        location: req.body.location || undefined,
        planting_date: req.body.planting_date || req.body.plantedOn || undefined,
        harvest_date: req.body.harvest_date || req.body.harvestOn || undefined,
        status: req.body.status || undefined,
        variety: req.body.variety || undefined,
        category: req.body.category || undefined,
        farm_name: req.body.farm_name || req.body.farmName || undefined,
        gps: req.body.gps || undefined,
        area: req.body.area || undefined,
        score: typeof req.body.score === "number" ? req.body.score : undefined,
        passport: typeof req.body.passport === "boolean" ? req.body.passport : undefined,
        image: req.body.image || undefined,
        note: req.body.note || undefined,
      }).filter(([, value]) => value !== undefined && value !== null),
    );

    const { data, error } = await supabase.from("harvest").update(payload).eq("id", id).select("*");

    if (error) {
      const existing = readHarvestStore();
      const nextRecords = existing.map((row) =>
        String(row.id) === String(id) ? { ...row, ...payload, id: row.id, created_at: row.created_at || new Date().toISOString() } : row,
      );
      writeHarvestStore(nextRecords);
      const updated = nextRecords.find((row) => String(row.id) === String(id));
      return res.json({ success: true, data: updated ? [normalizeCrop(updated)] : [] });
    }

    res.json({ success: true, data: (data || []).map(normalizeCrop) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteHarvest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: "Invalid harvest id" });
    }

    const { error } = await supabase.from("harvest").delete().eq("id", id);

    if (error) {
      const existing = readHarvestStore();
      writeHarvestStore(existing.filter((row) => String(row.id) !== String(id)));
      return res.json({ success: true, message: "Harvest deleted" });
    }

    res.json({ success: true, message: "Harvest deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getHarvests,
  getHarvestById,
  createHarvest,
  updateHarvest,
  deleteHarvest,
};