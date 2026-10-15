import { memo } from "react";
import { FiUsers } from "react-icons/fi";

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-IN");
}

function MetricCard({ icon, tone, label, value, note }) {
  return (
    <article className="admin-community-metric">
      <span className={`admin-community-metric-icon tone-${tone}`}>{icon}</span>
      <span className="admin-community-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </span>
    </article>
  );
}

function AdminCommunityGroupMetrics({ summary }) {
  return (
    <section className="admin-community-metrics" aria-label="Community group statistics">
                  <MetricCard icon={<FiUsers />} tone="amber" label="Total Groups" value={formatNumber(summary.totalGroups)} note="All university groups" />
                  <MetricCard icon={<span className="admin-community-metric-dot" />} tone="green" label="Active Groups" value={formatNumber(summary.activeGroups)} note={`${summary.activePercentage}% active`} />
                  <MetricCard icon={<span className="admin-community-metric-dot" />} tone="red" label="Inactive Groups" value={formatNumber(summary.inactiveGroups)} note={`${summary.inactivePercentage}% inactive`} />
                  <MetricCard icon={<FiUsers />} tone="blue" label="Total Members" value={formatNumber(summary.totalMembers)} note="Across all university groups" />
                </section>
  );
}

export default memo(AdminCommunityGroupMetrics);
