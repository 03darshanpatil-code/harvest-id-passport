const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./config/supabase");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to HarvestID API 🌱"
    });
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
                    status: "Growing"
                }
            ])
            .select();

        if (error) {
            console.error("Supabase Error:", error);
            return res.status(500).json({
                success: false,
                error
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error("Caught Error:", err);

        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack
        });
    }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
console.log("END OF FILE");