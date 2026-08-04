const supabase = require("../config/supabase");

const createHarvest = async (req, res) => {
    const {
        farmer_name,
        crop_name,
        location,
        planting_date,
        harvest_date,
        status
    } = req.body;

    const { data, error } = await supabase
        .from("harvest")
        .insert([
            {
                farmer_name,
                crop_name,
                location,
                planting_date,
                harvest_date,
                status
            }
        ])
        .select();

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.status(201).json({
        success: true,
        data
    });
};

module.exports = { createHarvest };