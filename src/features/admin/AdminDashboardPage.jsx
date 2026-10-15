import { useState } from "react";
import { FiArrowRight, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import DashboardMetrics from "./components/DashboardMetrics";
import DashboardTables from "./components/DashboardTables";
import { AcademicStructure, QuickActions, ResourceOverview } from "./components/DashboardInsights";
import "./admin-dashboard.css";

function formatToday() {
  const now = new Date();
  return {
    date: new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(now),
    time: new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(now),
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("noteswala_admin_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [searchValue, setSearchValue] = useState("");
  const [period, setPeriod] = useState("Last 6 Months");
  const [today] = useState(formatToday);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try { localStorage.setItem("noteswala_admin_sidebar_collapsed", String(next)); } catch { /* Storage may be unavailable. */ }
      return next;
    });
  };

  const selectNavigation = (label) => {
    setActiveItem(label);
    if (label === "Upload Resources") {
      navigate("/admin/resources/upload");
      return;
    }
    if (label === "Manage Categories") {
      navigate("/admin/categories");
      return;
    }
    if (label === "Manage Groups") {
      navigate("/admin/community-groups");
      return;
    }
    if (label !== "Dashboard") {
      toast(label === "Settings & Audit Logs" ? "System settings are selected." : `${label} selected.`, { icon: "↗" });
    }
  };

  const showModuleNotice = (label) => {
    if (label === "Upload Resource") {
      navigate("/admin/resources/upload");
      return;
    }
    toast(`${label} is part of the admin workspace. Its management screen can be connected next.`, { icon: "ℹ️", duration: 3000 });
  };

  return (
    <div className={`admin-app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        activeItem={activeItem}
        onSelect={selectNavigation}
      />
      <div className="admin-workspace">
        <AdminTopbar
          collapsed={sidebarCollapsed}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        <main className="admin-dashboard-content">
          <section className="admin-welcome-banner">
            <div className="admin-welcome-copy">
              <p>Welcome back, Admin <span aria-hidden="true">👋</span></p>
              <h1>Dashboard</h1>
              <span>Manage academic content, resources and platform information for NotesWala.</span>
              <button
                type="button"
                className="admin-dashboard-community-link"
                onClick={() => navigate("/admin/community-groups")}
              >
                <FiUsers />
                <span>Manage Community Groups</span>
                <FiArrowRight />
              </button>
            </div>
            <div className="admin-date-display">
              <span className="admin-date-icon"><i /></span>
              <div><strong>{today.date}</strong><small>{today.time} <i /> Pune, Maharashtra</small></div>
            </div>
            <div className="admin-book-illustration" aria-hidden="true">
              <div className="admin-plant"><i /><i /><i /><b /></div>
              <div className="admin-book-stack">
                <span className="spine-notes">NOTES</span>
                <span className="spine-pyq">PYQ</span>
                <span className="spine-solutions">SOLUTIONS</span>
                <span className="spine-manual">MANUALS</span>
              </div>
              <p>Share<br />Knowledge<br /><em>Empower</em><br />Students</p>
            </div>
          </section>

          <DashboardMetrics onMetricSelect={(label) => showModuleNotice(label)} />

          <div className="admin-insights-grid">
            <ResourceOverview period={period} onPeriodChange={setPeriod} />
            <AcademicStructure onViewAll={(label = "Academic Structure") => showModuleNotice(label)} />
          </div>

          <QuickActions onAction={showModuleNotice} />

          <DashboardTables searchValue={searchValue} onViewAll={showModuleNotice} />

          <footer className="admin-dashboard-footer">
            <span>© {new Date().getFullYear()} NotesWala Admin</span>
            <span>Academic management workspace</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
