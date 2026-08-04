const express = require("express");
const router = express.Router();

const harvestRoutes = require("./harvest");

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to HarvestID API 🌱"
    });
});

router.use("/harvest", harvestRoutes);

module.exports = router;