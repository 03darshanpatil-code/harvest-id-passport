const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./config/supabase");
const harvestRoutes = require("./routes/harvest");
const activityRoutes = require("./routes/activities");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/harvest", harvestRoutes);
app.use("/api/activities", activityRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to HarvestID API 🌱" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Backend is healthy" });
});

app.get("/add-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("harvest")
      .insert([
        {
          farmer_name: "Darshan",
          crop_name: "Rice",
          location: "Bangalore",
          planting_date: "2026-08-01",
          harvest_date: "2026-11-15",
          status: "Growing",
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});