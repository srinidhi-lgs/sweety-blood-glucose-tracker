
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <h2>💜 Sweety</h2>

      <nav>
        <NavLink to="/" end>
          Overview
        </NavLink>

        <NavLink to="/add-reading">
          My Readings
        </NavLink>

        <NavLink to="/reports">
          Reports
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <p>Take care of yourself 🌷</p>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
