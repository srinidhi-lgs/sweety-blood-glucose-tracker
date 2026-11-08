
import { Routes, Route, Outlet, Navigate } from "react-router-dom";

import Sidebar from "./components/sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReadingForm from "./pages/ReadingForm";
import Reports from "./pages/Reports";

function DashboardLayout() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/add-reading" element={<ReadingForm />} />

          <Route
            path="/edit-reading/:id"
            element={<ReadingForm />}
          />

          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
