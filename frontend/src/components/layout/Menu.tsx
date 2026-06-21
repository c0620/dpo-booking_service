import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function initials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return (email ?? "Г").slice(0, 2).toUpperCase();
}

export function Menu() {
  const auth = useAuth();

  return (
    <nav className="side-menu">
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `menu-btn h1 profile-btn ${isActive ? "active" : ""}`
        }
      >
        {initials(auth.displayName, auth.email)}
      </NavLink>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `menu-btn ${isActive ? "active" : ""}`}
      >
        <img src="/assets/icons/icon-map.svg" alt="Карта" />
      </NavLink>
      {auth.isAuthenticated && (
        <NavLink
          to="/history"
          className={({ isActive }) => `menu-btn ${isActive ? "active" : ""}`}
        >
          <img src="/assets/icons/icon-history.svg" alt="История" />
        </NavLink>
      )}

      {auth.isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) => `menu-btn ${isActive ? "active" : ""}`}
        >
          <img src="/assets/icons/icon-admin.svg" alt="Админ" />
        </NavLink>
      )}
    </nav>
  );
}
