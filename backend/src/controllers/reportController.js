
const pool = require("../config/db");

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function addDays(date, days) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function getDateRanges(date) {
  const [year, month] = date.split("-").map(Number);

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;

  const previousMonthStart = new Date(
    Date.UTC(year, month - 2, 1)
  ).toISOString().slice(0, 10);

  return {
    daily: {
      start: date,
      end: addDays(date, 1),
    },
    mtd: {
      start: monthStart,
      end: addDays(date, 1),
    },
    monthly: {
      start: previousMonthStart,
      end: monthStart,
    },
  };
}

async function generateReport(req, res, type) {
  const { date } = req.query;

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "A valid date in YYYY-MM-DD format is required",
    });
  }

  try {
    const ranges = getDateRanges(date);
    const { start, end } = ranges[type];

    const result = await pool.query(
      `SELECT
         COALESCE(
           json_agg(
             json_build_object(
               'id', id,
               'reading_date', reading_date,
               'time_slot', time_slot,
               'glucose_level', glucose_level
             )
             ORDER BY reading_date DESC, time_slot
           ),
           '[]'::json
         ) AS readings,
         COUNT(*)::INTEGER AS total_readings,
         MAX(glucose_level) AS highest,
         MIN(glucose_level) AS lowest,
         ROUND(AVG(glucose_level), 1) AS average
       FROM readings
       WHERE user_id = $1
         AND reading_date >= $2
         AND reading_date < $3`,
      [req.user.id, start, end]
    );

    const report = result.rows[0];

    res.json({
      reportType: type,
      period: {
        start,
        endExclusive: end,
      },
      summary: {
        highest: report.highest,
        lowest: report.lowest,
        average:
          report.average === null
            ? null
            : Number(report.average),
        totalReadings: report.total_readings,
      },
      readings: report.readings,
    });
  } catch (error) {
    console.error("Report error:", error.message);

    res.status(500).json({
      message: "Unable to generate report",
    });
  }
}

async function getDailyReport(req, res) {
  return generateReport(req, res, "daily");
}

async function getMonthToDateReport(req, res) {
  return generateReport(req, res, "mtd");
}

async function getPreviousMonthReport(req, res) {
  return generateReport(req, res, "monthly");
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
