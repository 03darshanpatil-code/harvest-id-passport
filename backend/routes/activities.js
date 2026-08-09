const express = require("express");
const router = express.Router();

const {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} = require("../controllers/activitiesController");

router.get("/", getActivities);
router.get("/:id", getActivityById);
router.post("/", createActivity);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

module.exports = router;
