import { FiArrowRight, FiFileText, FiBookOpen, FiUsers } from "react-icons/fi";

const defaultMetrics = [
  { title: "Total Resources", value: "1,248", trend: "+12%", note: "from last month", tone: "blue", icon: FiFileText },
  { title: "Subjects Added", value: "186", trend: "+5%", note: "from last month", tone: "amber", icon: FiBookOpen },
  { title: "Total Users", value: "2,856", trend: "+18%", note: "from last month", tone: "green", icon: FiUsers },
  { title: "Draft Resources", value: "24", trend: "+3 new drafts", note: "", tone: "amber", icon: FiFileText, alert: true },
];

export default function DashboardMetrics({ onMetricSelect }) {
  return (
    <section className="admin-metrics-grid" aria-label="Platform overview">
      {defaultMetrics.map(({ title, value, trend, note, tone, icon: Icon, alert }) => (
        <article className="admin-card admin-metric-card" key={title}>
          <div className={`admin-metric-icon tone-${tone}`}><Icon /></div>
          <div className="admin-metric-copy">
            <span>{title}</span>
            <strong>{value}</strong>
            <small className={alert ? "trend-alert" : "trend-positive"}>
              {!alert && <b aria-hidden="true">↗</b>} {trend} {note && <em>{note}</em>}
            </small>
          </div>
          <button className="admin-icon-button" type="button" aria-label={`View ${title}`}
            onClick={() => onMetricSelect(title)}><FiArrowRight /></button>
        </article>
      ))}
    </section>
  );
}
