const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const {
  getReadings,
  createReading,
  updateReading,
  deleteReading,
} = require("../controllers/readingController");

const router = express.Router();

router.use(authenticateToken);

router.get("/", getReadings);
router.post("/", createReading);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);

module.exports = router;