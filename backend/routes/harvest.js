const express = require("express");
const router = express.Router();

const { createHarvest } = require("../controllers/harvestController");

router.post("/", createHarvest);

module.exports = router;
