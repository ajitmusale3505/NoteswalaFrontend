import {
  FiBarChart2, FiBookOpen, FiCalendar, FiCode, FiFileText,
  FiFlag, FiGitBranch, FiHome, FiLayers, FiList, FiSettings,
  FiUploadCloud, FiUsers, FiBell, FiChevronLeft, FiMenu,
} from "react-icons/fi";

const dashboardNavigationGroups = [
  { title: "Academic Management", items: [
    { label: "Universities & Colleges", icon: FiHome },
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
    { label: "University Updates", icon: FiBell },
    { label: "Users & Roles", icon: FiUsers },
    { label: "Reports & Moderation", icon: FiFlag },
    { label: "Analytics & Reports", icon: FiBarChart2 },
  ]},
  { title: "System", items: [
    { label: "Settings & Audit Logs", icon: FiSettings },
  ]},
];

const uploadNavigationGroups = [
  { title: "Academic Management", items: [
    { label: "Universities & Colleges", icon: FiHome },
    { label: "Branches & Exam Patterns", icon: FiGitBranch },
    { label: "Academic Years", icon: FiCalendar },
    { label: "Semesters", icon: FiBookOpen },
    { label: "Subjects & Curriculum", icon: FiBookOpen },
    { label: "Units, Topics & Subtopics", icon: FiList },
  ]},
  { title: "Resource Management", items: [
    { label: "Upload Resources", icon: FiUploadCloud },
    { label: "Resource Library", icon: FiFileText },
    { label: "Manage Categories", icon: FiLayers },
  ]},
  { title: "Users & Platform", items: [
    { label: "Users & Roles", icon: FiUsers },
    { label: "Reviews & Reports", icon: FiFlag },
    { label: "Analytics & Insights", icon: FiBarChart2 },
  ]},
  { title: "System", items: [
    { label: "Settings & Audit Logs", icon: FiSettings },
  ]},
];

export default function AdminSidebar({ collapsed, onToggle, activeItem, onSelect, variant = "dashboard" }) {
  const navigationGroups = variant === "upload" ? uploadNavigationGroups : dashboardNavigationGroups;

  return (
    <aside className={`admin-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Administrator navigation">
      <div className="admin-sidebar-brand">
        <span className="admin-brand-mark"><FiBookOpen /></span>
        {!collapsed && <span className="admin-brand-copy"><strong>NotesWala</strong><small>Admin Panel</small></span>}
        <button className="admin-sidebar-toggle" type="button" onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <FiMenu /> : <FiChevronLeft />}
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
