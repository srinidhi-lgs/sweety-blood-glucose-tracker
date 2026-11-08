
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const TIME_SLOTS = [
  "Morning fasting",
  "After breakfast",
  "After lunch",
  "After dinner",
];

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

function getDateKey(date) {
  if (!date) return "";

  // PostgreSQL DATE values are best handled as date strings.
  if (typeof date === "string") {
    return date.slice(0, 10);
  }

  return new Date(date).toISOString().slice(0, 10);
}

function ReadingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    reading_date: getToday(),
    time_slot: "Morning fasting",
    glucose_level: "",
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    let isActive = true;

    async function fetchReading() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/readings");
        const data = response.data;

        const readingList = Array.isArray(data)
          ? data
          : Array.isArray(data?.readings)
            ? data.readings
            : [];

        const reading = readingList.find(
          (item) => String(item.id) === String(id)
        );

        if (!reading) {
          throw new Error("Reading not found.");
        }

        if (isActive) {
          setForm({
            reading_date: getDateKey(reading.reading_date),
            time_slot: reading.time_slot,
            glucose_level: String(reading.glucose_level),
          });
        }
      } catch (err) {
        if (isActive) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this reading."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchReading();

    return () => {
      isActive = false;
    };
  }, [id, isEditing]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const glucoseLevel = Number(form.glucose_level);
    const today = getToday();

    if (!form.reading_date || !form.time_slot || !form.glucose_level) {
      setError("Please complete all required fields.");
      return;
    }

    if (!TIME_SLOTS.includes(form.time_slot)) {
      setError("Please select a valid time slot.");
      return;
    }

    if (
      !Number.isInteger(glucoseLevel) ||
      glucoseLevel < 40 ||
      glucoseLevel > 600
    ) {
      setError("Glucose level must be a whole number between 40 and 600.");
      return;
    }

    if (form.reading_date > today) {
      setError("Future dates are not allowed.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        reading_date: form.reading_date,
        time_slot: form.time_slot,
        glucose_level: glucoseLevel,
      };

      if (isEditing) {
        await api.put(`/readings/${id}`, payload);
      } else {
        await api.post("/readings", payload);
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to ${isEditing ? "update" : "save"} the reading.`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="reading-form-page">
        <p>Loading reading...</p>
      </div>
    );
  }

  return (
    <div className="reading-form-page">
      <div className="form-heading">
        <h1>{isEditing ? "Edit Reading ✏️" : "Add New Reading 💜"}</h1>

        <p>
          {isEditing
            ? "Update your glucose record."
            : "Record your blood glucose level."}
        </p>
      </div>

      <form className="reading-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reading_date">Reading Date</label>

          <input
            id="reading_date"
            type="date"
            name="reading_date"
            value={form.reading_date}
            max={getToday()}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="time_slot">Time Slot</label>

          <select
            id="time_slot"
            name="time_slot"
            value={form.time_slot}
            onChange={handleChange}
            required
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="glucose_level">
            Glucose Level (mg/dL)
          </label>

          <input
            id="glucose_level"
            type="number"
            name="glucose_level"
            min="40"
            max="600"
            step="1"
            value={form.glucose_level}
            onChange={handleChange}
            placeholder="Enter glucose level"
            required
          />

          <small>Enter a whole number between 40 and 600.</small>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="save-reading-btn"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : isEditing
              ? "Update Reading"
              : "Save Reading"}
        </button>
      </form>
    </div>
  );
}

export default ReadingForm;
