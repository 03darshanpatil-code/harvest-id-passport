const express = require("express");
const router = express.Router();

const {
  getHarvests,
  getHarvestById,
  createHarvest,
  updateHarvest,
  deleteHarvest,
} = require("../controllers/harvestController");

router.get("/", getHarvests);
router.get("/:id", getHarvestById);
router.post("/", createHarvest);
router.put("/:id", updateHarvest);
router.delete("/:id", deleteHarvest);

module.exports = router;
