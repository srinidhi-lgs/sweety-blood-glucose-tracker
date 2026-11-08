
import { useEffect, useState } from "react";
import api from "../services/api";

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const value = String(dateString).slice(0, 10);
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return "—";

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Backend uses exclusive end dates; display the previous day.
function formatLastIncludedDate(endExclusive) {
  if (!endExclusive) return "—";

  const [year, month, day] = endExclusive.split("-").map(Number);
  const previousDay = new Date(Date.UTC(year, month - 1, day - 1));

  return formatDate(previousDay.toISOString().slice(0, 10));
}

const reportOptions = [
  { value: "daily", label: "Daily Report" },
  { value: "mtd", label: "Month to Date" },
  { value: "monthly", label: "Previous Month" },
];

function Reports() {
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [reportType, setReportType] = useState("daily");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function fetchReport() {
      try {
        setLoading(true);
        setError("");
        setReport(null);

        const response = await api.get(`/reports/${reportType}`, {
          params: { date: selectedDate },
        });

        if (isActive) {
          setReport(response.data);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err.response?.data?.message || "Unable to load the report."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      isActive = false;
    };
  }, [selectedDate, reportType]);

  const summary = report?.summary;
  const readings = report?.readings || [];

  const periodLabel = report?.period
    ? `${formatDate(report.period.start)} – ${formatLastIncludedDate(
        report.period.endExclusive
      )}`
    : "";

  return (
    <div className="reports-page">
      <section className="reports-heading">
        <div>
          <h1>Reports & Insights 📊</h1>
          <p>Review your glucose tracking history and summaries.</p>
        </div>
      </section>

      <section className="report-filters">
        <div className="report-type-options">
          {reportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`report-type-btn ${
                reportType === option.value ? "active" : ""
              }`}
              onClick={() => setReportType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="report-date-filter">
          <label htmlFor="report-date">Reference Date</label>

          <input
            id="report-date"
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={(event) => setSelectedDate(event.target.value)}
          />

          <small>
            {reportType === "daily"
              ? "View readings for this date."
              : reportType === "mtd"
                ? "View this month's readings up to this date."
                : "View the complete previous calendar month."}
          </small>
        </div>
      </section>

      {loading && (
        <div className="report-message">
          Loading your report...
        </div>
      )}

      {error && !loading && (
        <div className="report-error">
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          <div className="report-period">
            <span>Report Period</span>
            <strong>{periodLabel}</strong>
          </div>

          <section className="report-stats">
            <div className="report-stat-card">
              <p>Total Readings</p>
              <h2>{summary?.totalReadings ?? 0}</h2>
              <small>Recorded entries</small>
            </div>

            <div className="report-stat-card">
              <p>Highest Reading</p>
              <h2>{summary?.highest ?? "--"}</h2>
              <small>mg/dL</small>
            </div>

            <div className="report-stat-card">
              <p>Lowest Reading</p>
              <h2>{summary?.lowest ?? "--"}</h2>
              <small>mg/dL</small>
            </div>

            <div className="report-stat-card">
              <p>Average Reading</p>
              <h2>{summary?.average ?? "--"}</h2>
              <small>mg/dL</small>
            </div>
          </section>

          <section className="readings-section report-readings">
            <div className="section-heading">
              <div>
                <h2>Reading History 🌷</h2>
                <p>
                  {readings.length} reading
                  {readings.length === 1 ? "" : "s"} in this period
                </p>
              </div>
            </div>

            {readings.length === 0 ? (
              <div className="empty-state">
                <p>No readings found for this period 💜</p>
                <small>
                  Try selecting another date or report period.
                </small>
              </div>
            ) : (
              <div className="readings-table">
                <div className="report-reading-row table-header">
                  <span>Date</span>
                  <span>Time Slot</span>
                  <span>Glucose Level</span>
                </div>

                {readings.map((reading) => (
                  <div
                    className="report-reading-row"
                    key={reading.id}
                  >
                    <span>{formatDate(reading.reading_date)}</span>
                    <span>{reading.time_slot}</span>
                    <strong>{reading.glucose_level} mg/dL</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Reports;
