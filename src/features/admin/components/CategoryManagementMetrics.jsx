import { FiBookOpen, FiFileText, FiCheckCircle, FiXCircle } from "react-icons/fi";

const METRIC_CONFIG = [
  { key: "totalCategories", label: "Total Categories", hint: "All resource categories", Icon: FiBookOpen, tone: "amber" },
  { key: "activeCategories", label: "Active Categories", hint: "Currently available", Icon: FiCheckCircle, tone: "green" },
  { key: "inactiveCategories", label: "Inactive Categories", hint: "Hidden from students", Icon: FiXCircle, tone: "red" },
  { key: "totalResources", label: "Total Resources", hint: "Across all categories", Icon: FiFileText, tone: "blue" },
];

export default function CategoryManagementMetrics({ categories }) {
  const totalCategories = categories.length;
  const activeCategories = categories.reduce((count, category) => count + (category.active ? 1 : 0), 0);
  const inactiveCategories = totalCategories - activeCategories;
  const totalResources = categories.reduce((count, category) => count + (Number(category.resourceCount) || 0), 0);
  const activePercent = totalCategories ? ((activeCategories / totalCategories) * 100).toFixed(1) : "0.0";
  const values = { totalCategories, activeCategories, inactiveCategories, totalResources };

  return (
    <section className="admin-category-metrics" aria-label="Category statistics">
      {METRIC_CONFIG.map(({ key, label, hint, Icon, tone }) => (
        <article className="admin-category-metric" key={key}>
          <span className={`admin-category-metric-icon tone-${tone}`}><Icon aria-hidden="true" /></span>
          <div className="admin-category-metric-copy">
            <span>{label}</span>
            <strong>{values[key].toLocaleString("en-IN")}</strong>
            <small>{key === "activeCategories" ? `${activePercent}% active` : key === "inactiveCategories" && totalCategories ? `${(100 - Number(activePercent)).toFixed(1)}% inactive` : hint}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
