import {
  FiArrowRight, FiBookOpen, FiCalendar, FiCode, FiFileText, FiGitBranch,
  FiLandmark, FiLayers, FiList, FiMegaphone, FiUploadCloud, FiUsers,
} from "react-icons/fi";

const categoryLegend = [
  ["Notes", "420", "blue"],
  ["Handwritten Notes", "310", "sky"],
  ["PYQ", "260", "sand"],
  ["Solutions", "180", "cream"],
  ["Manuals", "120", "green"],
  ["Books", "90", "purple"],
];
const monthlyData = [
  { month: "Apr", values: [18, 28, 34, 24, 0, 0] },
  { month: "May", values: [0, 16, 24, 15, 12, 0] },
  { month: "Jun", values: [10, 25, 42, 22, 10, 0] },
  { month: "Jul", values: [0, 26, 45, 40, 22, 0] },
  { month: "Aug", values: [0, 27, 54, 31, 19, 0] },
  { month: "Sep", values: [0, 0, 39, 24, 20, 40] },
];
const structureItems = [
  ["Universities", "4", FiLandmark, "green"],
  ["Colleges", "12", FiLandmark, "purple"],
  ["Branches", "28", FiGitBranch, "amber"],
  ["Exam Patterns", "42", FiFileText, "purple"],
  ["Academic Years", "8", FiCalendar, "green"],
  ["Semesters", "64", FiLayers, "purple"],
  ["Subjects", "186", FiBookOpen, "green"],
  ["Topics & Subtopics", "540", FiList, "blue"],
];
const quickActions = [
  ["Upload Resource", "Add notes, PYQs, books and more", FiUploadCloud, "blue"],
  ["Add Subject", "Create and configure a new subject", FiBookOpen, "amber"],
  ["Post University Update", "Share notices, timetables and results", FiMegaphone, "green"],
  ["Manage Curriculum", "Units, topics and subtopics", FiList, "purple"],
];

export function ResourceOverview({ period, onPeriodChange }) {
  return (
    <section className="admin-card admin-resource-overview">
      <div className="admin-section-heading">
        <div className="admin-section-icon amber"><FiFileText /></div>
        <div><h2>Resource Overview</h2><p>Distribution of resources by category.</p></div>
        <select value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Resource overview period">
          <option>Last 6 Months</option><option>Last 12 Months</option><option>This Year</option>
        </select>
      </div>
      <div className="admin-chart-content">
        <div className="admin-chart" role="img" aria-label="Stacked bar chart showing resources added between April and September">
          <div className="admin-chart-y-axis"><span>250</span><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
          <div className="admin-chart-plot">
            {[250,200,150,100,50,0].map((tick) => <i className="admin-chart-gridline" key={tick} style={{ bottom: `${tick / 250 * 100}%` }} />)}
            <div className="admin-bars">
              {monthlyData.map((month) => <div className="admin-bar-column" key={month.month}>
                <div className="admin-stacked-bar">
                  {month.values.map((value, index) => <span key={categoryLegend[index][0]} className={`bar-${categoryLegend[index][2]}`} style={{ height: `${value / 250 * (period === "Last 12 Months" ? 100 : 155)}px` }} />)}
                </div><small>{month.month}</small>
              </div>)}
            </div>
          </div>
        </div>
        <div className="admin-chart-legend">{categoryLegend.map(([label,value,tone]) => <div key={label}><i className={`legend-${tone}`} /><span>{label}</span><strong>{value}</strong></div>)}</div>
      </div>
    </section>
  );
}

export function AcademicStructure({ onViewAll }) {
  return (
    <section className="admin-card admin-academic-structure">
      <div className="admin-section-heading">
        <div className="admin-section-icon amber"><FiLandmark /></div>
        <div><h2>Academic Structure</h2><p>Current academic data overview.</p></div>
        <button className="admin-outline-button" type="button" onClick={onViewAll}>View All</button>
      </div>
      <div className="admin-structure-grid">
        {structureItems.map(([label,value,Icon,tone]) => <button type="button" className="admin-structure-tile" key={label} onClick={() => onViewAll(label)}>
          <span className={`admin-structure-icon tone-${tone}`}><Icon /></span><strong>{value}</strong><small>{label}</small>
        </button>)}
      </div>
    </section>
  );
}

export function QuickActions({ onAction }) {
  return (
    <section className="admin-card admin-quick-actions">
      <div className="admin-section-heading">
        <div className="admin-section-icon amber"><FiCode /></div>
        <div><h2>Quick Actions</h2><p>Common tasks to manage content and academic data.</p></div>
      </div>
      <div className="admin-quick-grid">
        {quickActions.map(([label,description,Icon,tone]) => <button type="button" key={label} className={`admin-quick-action quick-${tone}`} onClick={() => onAction(label)}>
          <span className={`admin-quick-icon tone-${tone}`}><Icon /></span><span className="admin-quick-copy"><strong>{label}</strong><small>{description}</small></span><span className="admin-quick-arrow"><FiArrowRight /></span>
        </button>)}
      </div>
    </section>
  );
}
