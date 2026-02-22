import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV_ITEMS = [
  { to: "/overview", label: "Overview" },
  { to: "/events", label: "Events" },
  { to: "/quizzes", label: "Quizzes" },
  { to: "/analytics", label: "Analytics" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>EcoAct Admin</h1>
          <p>Community Control Center</p>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-meta">
            <strong>{user?.name ?? "Admin"}</strong>
            <small>{user?.community?.name ?? "No community assigned"}</small>
          </div>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>{user?.community?.name ?? "Community"}</h2>
            <p>Admin dashboard (Web only)</p>
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
