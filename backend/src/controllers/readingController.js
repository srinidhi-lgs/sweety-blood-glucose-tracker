
const pool = require("../config/db");

const VALID_SLOTS = [
  "Morning fasting",
  "After breakfast",
  "After lunch",
  "After dinner",
];

// Get today's date in Indian Standard Time.
function getToday() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

// Validate YYYY-MM-DD without timezone conversion.
function isValidDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isFutureDate(date) {
  return date > getToday();
}

function validateReading({
  reading_date,
  time_slot,
  glucose_level,
}) {
  if (
    !reading_date ||
    !time_slot ||
    glucose_level === undefined ||
    glucose_level === null ||
    glucose_level === ""
  ) {
    return "All reading fields are required";
  }

  if (!isValidDate(reading_date) || isFutureDate(reading_date)) {
    return "Please enter a valid date that is not in the future";
  }

  if (!VALID_SLOTS.includes(time_slot)) {
    return "Invalid time slot";
  }

  const value = Number(glucose_level);

  if (!Number.isInteger(value) || value < 40 || value > 600) {
    return "Glucose level must be a whole number between 40 and 600";
  }

  return null;
}

// Get all readings for the logged-in user.
async function getReadings(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_level,
         created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, created_at DESC`,
      [req.user.id]
    );

    res.json({
      readings: result.rows,
    });
  } catch (error) {
    console.error("Get readings error:", error.message);

    res.status(500).json({
      message: "Unable to fetch readings",
    });
  }
}

// Create a new glucose reading.
async function createReading(req, res) {
  const { reading_date, time_slot, glucose_level } = req.body;

  const validationError = validateReading(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO readings
         (user_id, reading_date, time_slot, glucose_level)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_level,
         created_at`,
      [
        req.user.id,
        reading_date,
        time_slot,
        Number(glucose_level),
      ]
    );

    res.status(201).json({
      message: "Reading saved successfully",
      reading: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A reading already exists for this time slot and date",
      });
    }

    console.error("Create reading error:", error.message);

    res.status(500).json({
      message: "Unable to save reading",
    });
  }
}

// Update an existing glucose reading.
async function updateReading(req, res) {
  const readingId = Number(req.params.id);

  if (!Number.isInteger(readingId) || readingId <= 0) {
    return res.status(400).json({
      message: "Invalid reading ID",
    });
  }

  const validationError = validateReading(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  const { reading_date, time_slot, glucose_level } = req.body;

  try {
    const result = await pool.query(
      `UPDATE readings
       SET reading_date = $1,
           time_slot = $2,
           glucose_level = $3
       WHERE id = $4 AND user_id = $5
       RETURNING
         id,
         TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
         time_slot,
         glucose_level,
         created_at`,
      [
        reading_date,
        time_slot,
        Number(glucose_level),
        readingId,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reading not found",
      });
    }

    res.json({
      message: "Reading updated successfully",
      reading: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A reading already exists for this time slot and date",
      });
    }

    console.error("Update reading error:", error.message);

    res.status(500).json({
      message: "Unable to update reading",
    });
  }
}

// Delete a reading belonging to the logged-in user.
async function deleteReading(req, res) {
  const readingId = Number(req.params.id);

  if (!Number.isInteger(readingId) || readingId <= 0) {
    return res.status(400).json({
      message: "Invalid reading ID",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [readingId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Reading not found",
      });
    }

    res.json({
      message: "Reading deleted successfully",
    });
  } catch (error) {
    console.error("Delete reading error:", error.message);

    res.status(500).json({
      message: "Unable to delete reading",
    });
  }
}

module.exports = {
  getReadings,
  createReading,
  updateReading,
  deleteReading,
};
