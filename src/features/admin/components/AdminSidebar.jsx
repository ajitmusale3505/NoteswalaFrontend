import {
  FiActivity, FiBarChart2, FiBookOpen, FiCalendar, FiCode, FiFileText,
  FiFlag, FiGitBranch, FiHome, FiLandmark, FiLayers, FiList, FiSettings,
  FiUploadCloud, FiUsers, FiMegaphone, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

const navigationGroups = [
  { title: "Academic Management", items: [
    { label: "Universities & Colleges", icon: FiLandmark },
    { label: "Branches & Exam Patterns", icon: FiGitBranch },
    { label: "Academic Years & Semesters", icon: FiCalendar },
    { label: "Subjects & Curriculum", icon: FiBookOpen },
    { label: "Units, Topics & Subtopics", icon: FiList },
  ]},
  { title: "Resource Management", items: [
    { label: "Resource Library", icon: FiFileText },
    { label: "Upload Resources", icon: FiUploadCloud },
    { label: "Code & SQL Lab Content", icon: FiCode },
  ]},
  { title: "University & Platform", items: [
    { label: "University Updates", icon: FiMegaphone },
    { label: "Users & Roles", icon: FiUsers },
    { label: "Reports & Moderation", icon: FiFlag },
    { label: "Analytics & Reports", icon: FiBarChart2 },
  ]},
  { title: "System", items: [
    { label: "Settings & Audit Logs", icon: FiSettings },
  ]},
];

export default function AdminSidebar({ collapsed, onToggle, activeItem, onSelect }) {
  return (
    <aside className={`admin-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Administrator navigation">
      <div className="admin-sidebar-brand">
        <span className="admin-brand-mark"><FiBookOpen /></span>
        {!collapsed && <span className="admin-brand-copy"><strong>NotesWala</strong><small>Admin Panel</small></span>}
        <button className="admin-sidebar-toggle" type="button" onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        <button type="button" className={`admin-nav-item ${activeItem === "Dashboard" ? "active" : ""}`}
          onClick={() => onSelect("Dashboard")} title={collapsed ? "Dashboard" : undefined}>
          <FiHome /><span>Dashboard</span>
        </button>

        {navigationGroups.map((group) => (
          <div className="admin-nav-group" key={group.title}>
            {!collapsed && <div className="admin-nav-group-heading"><span>{group.title}</span><i /></div>}
            {group.items.map(({ label, icon: Icon }) => (
              <button type="button" key={label}
                className={`admin-nav-item ${activeItem === label ? "active" : ""}`}
                onClick={() => onSelect(label)} title={collapsed ? label : undefined}>
                <Icon /><span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
