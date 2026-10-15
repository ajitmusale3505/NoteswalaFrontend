import { FiArrowRight, FiBell, FiBookOpen, FiCalendar, FiCheckCircle, FiClock, FiDownload, FiFileText, FiInfo, FiSearch } from "react-icons/fi";
import { formatBytes, formatDate, getNoticeCategory, getNoticeTone } from "../universityUtils";

export function UniversitySectionTitle({ icon: Icon = FiBookOpen, title, subtitle, action, onAction }) {
  return (
    <div className="univ-section-title">
      <span className="univ-section-title-icon"><Icon /></span>
      <div className="univ-section-title-copy"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {action && <button className="univ-text-action" type="button" onClick={onAction}>{action}<FiArrowRight /></button>}
    </div>
  );
}

export function UniversityEmptyState({ icon: Icon = FiInfo, title, message, action, onAction, compact = false }) {
  return (
    <div className={`univ-empty-state ${compact ? "is-compact" : ""}`}>
      <span className="univ-empty-icon"><Icon /></span><strong>{title}</strong><p>{message}</p>
      {action && <button type="button" className="univ-secondary-button" onClick={onAction}>{action}<FiArrowRight /></button>}
    </div>
  );
}

export function UniversityMetric({ icon: Icon, label, value, detail, tone = "blue" }) {
  return <article className={`univ-metric tone-${tone}`}><span className="univ-metric-icon"><Icon /></span>
    <div className="univ-metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

export function UniversityNoticeRow({ notice, onOpen, compact = false, onMarkRead, saved = false, onToggleSaved }) {
  const category = getNoticeCategory(notice);
  const tone = getNoticeTone(category);
  const unread = notice?.read === false;
  return (
    <article className={`univ-notice-row tone-${tone} ${unread ? "is-unread" : ""} ${compact ? "is-compact" : ""}`}>
      <span className="univ-notice-icon">{category === "Examination" ? <FiCalendar /> : category === "Deadline" ? <FiClock /> : category === "Results" ? <FiCheckCircle /> : <FiBell />}</span>
      <button className="univ-notice-main" type="button" onClick={() => onOpen?.(notice)}>
        <span className="univ-notice-tags">{unread && <em>New</em>}<i>{category}</i>{saved && <small>Saved</small>}</span>
        <strong>{notice?.title || "University update"}</strong><p>{notice?.message || "Open this update to see the full notice."}</p>
        <span className="univ-notice-meta"><FiCalendar /> {formatDate(notice?.createdAt)} <i /> {notice?.read ? "Read" : "Official update"}</span>
      </button>
      <div className="univ-notice-actions">
        {onToggleSaved && <button type="button" title={saved ? "Remove saved notice" : "Save notice"} aria-label={saved ? "Remove saved notice" : "Save notice"} onClick={() => onToggleSaved(notice)} className={saved ? "is-saved" : ""}>{saved ? "Saved" : "Save"}</button>}
        <button type="button" title="View update" aria-label="View update" onClick={() => onOpen?.(notice)}><FiArrowRight /></button>
        {unread && onMarkRead && <button type="button" title="Mark as read" aria-label="Mark as read" onClick={() => onMarkRead(notice)}><FiCheckCircle /></button>}
      </div>
    </article>
  );
}

export function UniversityResourceRow({ resource, onOpen, onDownload, downloading = false, compact = false }) {
  const title = resource?.title || "University document";
  return (
    <article className={`univ-resource-row ${compact ? "is-compact" : ""}`}>
      <span className="univ-resource-icon"><FiFileText /></span>
      <button type="button" className="univ-resource-main" onClick={() => onOpen?.(resource)}>
        <strong>{title}</strong><span>{resource?.subjectName || resource?.categoryName || resource?.materialType || "University resource"}</span>
        <small>{resource?.fileSizeBytes ? formatBytes(resource.fileSizeBytes) : "Published resource"} <i /> {formatDate(resource?.publishedAt || resource?.updatedAt || resource?.createdAt)}</small>
      </button>
      <button type="button" className="univ-resource-download" aria-label={`Download ${title}`} title="Download document" onClick={() => onDownload?.(resource)} disabled={downloading}>
        {downloading ? <span className="univ-mini-spinner" /> : <FiDownload />}
      </button>
    </article>
  );
}

export function UniversityPanel({ children, className = "" }) {
  return <section className={`univ-panel ${className}`}>{children}</section>;
}
