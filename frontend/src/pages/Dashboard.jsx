
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function getDateKey(date) {
  if (!date) return "";

  if (typeof date === "string") {
    return date.slice(0, 10);
  }

  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function formatDate(date) {
  const dateKey = getDateKey(date);

  if (!dateKey) return "—";

  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getToday();

  async function fetchReadings() {
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

      setReadings(readingList);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your readings."
      );
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReadings();
  }, []);

  const todayReadings = readings.filter(
    (reading) => getDateKey(reading.reading_date) === today
  );

  const glucoseValues = todayReadings
    .map((reading) => Number(reading.glucose_level))
    .filter(Number.isFinite);

  const highest =
    glucoseValues.length > 0 ? Math.max(...glucoseValues) : "—";

  const lowest =
    glucoseValues.length > 0 ? Math.min(...glucoseValues) : "—";

  const average =
    glucoseValues.length > 0
      ? (
          glucoseValues.reduce((total, value) => total + value, 0) /
          glucoseValues.length
        ).toFixed(1)
      : "—";

  const recentReadings = [...readings]
    .sort((a, b) => {
      const dateDifference = getDateKey(b.reading_date).localeCompare(
        getDateKey(a.reading_date)
      );

      if (dateDifference !== 0) return dateDifference;

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })
    .slice(0, 10);

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reading?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/readings/${id}`);

      setReadings((previous) =>
        previous.filter((reading) => reading.id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this reading."
      );
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Good day! 🌷</h1>
          <p>Here's an overview of your blood glucose readings.</p>
          <span>{formatDate(today)}</span>
        </div>

        <button
          className="add-reading-btn"
          onClick={() => navigate("/add-reading")}
        >
          + Add New Reading
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="summary-section">
        <h2>Today's Summary</h2>

        <div className="summary-cards">
          <div className="summary-card">
            <p>Readings Today</p>
            <h2>{todayReadings.length}/4</h2>
            <span>Daily readings</span>
          </div>

          <div className="summary-card">
            <p>Highest Reading</p>
            <h2>{highest}</h2>
            <span>mg/dL</span>
          </div>

          <div className="summary-card">
            <p>Lowest Reading</p>
            <h2>{lowest}</h2>
            <span>mg/dL</span>
          </div>

          <div className="summary-card">
            <p>Average Reading</p>
            <h2>{average}</h2>
            <span>mg/dL</span>
          </div>
        </div>
      </section>

      <section className="readings-section" id="readings">
        <div className="section-heading">
          <div>
            <h2>Recent Readings</h2>
            <p>Your latest blood glucose records.</p>
          </div>

          <button
            className="view-reports-btn"
            onClick={() => navigate("/reports")}
          >
            View Reports →
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading your readings...</div>
        ) : recentReadings.length === 0 ? (
          <div className="empty-state">
            <h3>No readings yet 💜</h3>
            <p>Add your first glucose reading to get started.</p>

            <button
              className="add-reading-btn"
              onClick={() => navigate("/add-reading")}
            >
              Add Reading
            </button>
          </div>
        ) : (
          <div className="readings-table">
            <div className="reading-row reading-table-header">
              <span>Date</span>
              <span>Time Slot</span>
              <span>Glucose Level</span>
              <span>Actions</span>
            </div>

            {recentReadings.map((reading) => (
              <div className="reading-row" key={reading.id}>
                <span>{formatDate(reading.reading_date)}</span>

                <span>{reading.time_slot}</span>

                <strong>{reading.glucose_level} mg/dL</strong>

                <div className="reading-actions">
                  <button
                    className="edit-reading-btn"
                    onClick={() =>
                      navigate(`/edit-reading/${reading.id}`)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-reading-btn"
                    onClick={() => handleDelete(reading.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
