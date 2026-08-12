const express = require("express");
const router = express.Router();

const { chat } = require("../controllers/aiController");

router.post("/", chat);

module.exports = router;
