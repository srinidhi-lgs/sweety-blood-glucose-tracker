const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} = require("../controllers/reportController");

const router = express.Router();

router.use(authenticateToken);

router.get("/daily", getDailyReport);
router.get("/mtd", getMonthToDateReport);
router.get("/monthly", getPreviousMonthReport);

module.exports = router;