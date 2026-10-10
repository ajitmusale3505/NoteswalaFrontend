import { useMemo, useState } from "react";
import { FiClock, FiFileText, FiMoreVertical, FiUsers, FiLayers, FiBell, FiBookOpen } from "react-icons/fi";

const initialResources = [
  { id: 1, title: "DBMS Handwritten Notes", category: "Handwritten Notes", subject: "DBMS", date: "30 Sep 2026", status: "Published", tone: "blue" },
  { id: 2, title: "TOC Question Paper (2023)", category: "PYQ", subject: "TOC", date: "29 Sep 2026", status: "Published", tone: "amber" },
  { id: 3, title: "Operating System Manual", category: "Manual", subject: "OS", date: "28 Sep 2026", status: "Draft", tone: "green" },
  { id: 4, title: "CN Lab Record", category: "Practical", subject: "Computer Networks", date: "27 Sep 2026", status: "Published", tone: "purple" },
];
const activities = [
  { title: "New resource uploaded", description: "DBMS Handwritten Notes", time: "2 hours ago", icon: FiUsers, tone: "red" },
  { title: "Subject updated", description: "Operating System (Credits & Marks)", time: "4 hours ago", icon: FiLayers, tone: "purple" },
  { title: "University update published", description: "SPPU Sem Exam Timetable", time: "1 day ago", icon: FiBell, tone: "amber" },
  { title: "Resource published", description: "TOC Question Paper (2023)", time: "1 day ago", icon: FiBookOpen, tone: "green" },
];

export default function DashboardTables({ searchValue, onViewAll }) {
  const [resources, setResources] = useState(initialResources);
  const [openMenu, setOpenMenu] = useState(null);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const filteredResources = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return resources.filter((item) => !search || [item.title,item.category,item.subject,item.status].some((value) => value.toLowerCase().includes(search)));
  }, [resources, searchValue]);

  const toggleStatus = (id) => {
    setResources((current) => current.map((item) => item.id === id
      ? { ...item, status: item.status === "Draft" ? "Published" : "Draft" }
      : item));
    setOpenMenu(null);
  };

  return (
    <div className="admin-bottom-grid">
      <section className="admin-card admin-recent-resources">
        <div className="admin-section-heading">
          <div className="admin-section-icon amber"><FiFileText /></div>
          <div><h2>Recent Resources</h2><p>Latest uploaded or updated resources.</p></div>
          <button type="button" className="admin-outline-button" onClick={() => onViewAll("Resource Library")}>View All</button>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-resource-table">
            <thead><tr><th>Title</th><th>Category</th><th>Subject</th><th>Uploaded On</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {filteredResources.map((item) => <tr key={item.id}>
                <td><span className="admin-pdf-icon"><FiFileText /></span><span className="admin-resource-title">{item.title}</span></td>
                <td><span className={`admin-category-chip category-${item.tone}`}>{item.category}</span></td>
                <td>{item.subject}</td><td>{item.date}</td>
                <td><span className={`admin-status ${item.status === "Draft" ? "draft" : "published"}`}>{item.status}</span></td>
                <td className="admin-action-cell"><button type="button" className="admin-table-menu-button" aria-label={`Actions for ${item.title}`} onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}><FiMoreVertical /></button>
                  {openMenu === item.id && <div className="admin-table-menu"><button type="button" onClick={() => toggleStatus(item.id)}>{item.status === "Draft" ? "Mark as published" : "Move to drafts"}</button><button type="button" onClick={() => onViewAll("Resource Library")}>Open library</button></div>}
                </td>
              </tr>)}
              {filteredResources.length === 0 && <tr><td colSpan="6" className="admin-empty-table">No resources match “{searchValue}”.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card admin-recent-activity">
        <div className="admin-section-heading">
          <div className="admin-section-icon amber"><FiClock /></div>
          <div><h2>Recent Activity</h2><p>Latest actions performed in the system.</p></div>
          <button type="button" className="admin-outline-button" onClick={() => setActivityExpanded((expanded) => !expanded)}>{activityExpanded ? "Show Less" : "View All"}</button>
        </div>
        <div className="admin-activity-list">
          {(activityExpanded ? [...activities, ...activities.slice(0, 2)] : activities).map((activity, index) => {
            const Icon = activity.icon;
            return <article className="admin-activity-item" key={`${activity.title}-${index}`}>
              <span className={`admin-activity-dot tone-${activity.tone}`}><Icon /></span>
              <div><strong>{activity.title}</strong><small>{activity.description}</small></div><time>{activity.time}</time>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
