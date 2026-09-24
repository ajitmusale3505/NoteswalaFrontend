import { FiBell, FiChevronRight, FiDownload, FiFileText, FiHome, FiMessageCircle, FiSearch, FiTool, FiTrendingUp, FiUser } from "react-icons/fi";
import { resourceRows } from "../landingData";

const menu = [
  [FiHome, "Home", true],
  [FiFileText, "Resources"],
  [FiMessageCircle, "Community"],
  [FiTrendingUp, "University"],
  [FiTool, "Career"],
  [FiBookIcon, "Library"],
];

function FiBookIcon() { return <FiFileText />; }

export default function DashboardPreview() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-shadow-card" />
      <div className="dashboard-window">
        <div className="dashboard-topbar">
          <span className="mini-brand"><FiBookIcon /> EduHub</span>
          <label className="mini-search"><FiSearch /><span>Search resources, questions, updates...</span></label>
          <span className="avatar">A</span>
          <FiBell className="muted-icon" />
        </div>
        <div className="dashboard-body">
          <aside className="dashboard-sidebar">
            {menu.map(([Icon, label, active]) => (
              <div className={`side-item ${active ? "active" : ""}`} key={label}><Icon /> <span>{label}</span></div>
            ))}
          </aside>
          <div className="dashboard-content">
            <div className="welcome-row">
              <div><span className="eyebrow">Computer Engineering · Semester VI</span><h3>Welcome back</h3></div>
              <span className="plus">+</span>
            </div>
            <div className="dashboard-grid">
              <div className="continue-card">
                <div className="card-label"><FiFileText /> Database Management Systems</div>
                <span className="muted-copy">Unit 5 · Normalization</span>
                <div className="progress-line"><span /></div>
                <div className="progress-meta"><b>60%</b><span>Continue <FiChevronRight /></span></div>
              </div>
              <div className="deadline-card">
                <span className="card-label">Upcoming Deadlines</span>
                <p><b>DBMS Assignment</b><small>2 days left</small></p>
                <p><b>CN Practical Report</b><small>5 days left</small></p>
                <p><b>SE Mini Project</b><small>12 days left</small></p>
              </div>
            </div>
            <div className="preview-list">
              <div className="list-heading"><b>Recommended Resources</b><span>View all →</span></div>
              {resourceRows.map((row) => (
                <div className="preview-row" key={row.title}>
                  <span className="pdf-icon"><FiFileText /></span>
                  <span><b>{row.title}</b><small>{row.meta.split(" · ")[0]} · {row.size}</small></span>
                  <FiDownload />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}