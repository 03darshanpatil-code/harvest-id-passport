const express = require("express");
const router = express.Router();

const { chat, health } = require("../controllers/aiController");

router.post("/", chat);
// Debug endpoint: { success: true, configured: true|false } — no secrets.
router.get("/health", health);

module.exports = router;
