import {
  FiActivity, FiBell, FiCalendar, FiCheckCircle, FiClock, FiFileText,
  FiInfo, FiList, FiTrendingUp,
} from "react-icons/fi";
import {
  UniversityEmptyState, UniversityMetric, UniversityNoticeRow, UniversityPanel,
  UniversityResourceRow, UniversitySectionTitle,
} from "./UniversityUI";
import { formatDate, getNoticeCategory, matchesSearch } from "../universityUtils";

export default function UniversityOverviewTab({
  academic, university, notices, documents, query, onTabChange,
  onOpenNotice, onMarkRead, onToggleSaved, savedIds, onOpenDocument, onDownload,
  downloadingId,
}) {
  const visibleNotices = notices.filter((notice) =>
    matchesSearch([notice.title, notice.message, notice.type], query)).slice(0, 4);
  const visibleDocuments = documents.filter((item) =>
    matchesSearch([item.title, item.description, item.subjectName, item.categoryName], query)).slice(0, 4);
  const unreadCount = notices.filter((notice) => notice.read === false).length;
  const examCount = notices.filter((notice) => getNoticeCategory(notice) === "Examination").length;
  const yearLabel = academic?.academicYearName || academic?.academicYearLabel || "Not set";

  return (
    <div className="univ-overview-grid">
      <div className="univ-main-stack">
        <div className="univ-metric-grid univ-metric-grid-four">
          <UniversityMetric icon={FiCalendar} label="Academic Year" value={yearLabel} detail="From your profile" tone="red" />
          <UniversityMetric icon={FiBell} label="University Updates" value={notices.length.toLocaleString("en-IN")} detail="Available in your account" tone="blue" />
          <UniversityMetric icon={FiActivity} label="Exam Notices" value={examCount.toLocaleString("en-IN")} detail="Published updates only" tone="green" />
          <UniversityMetric icon={FiFileText} label="Documents" value={documents.length.toLocaleString("en-IN")} detail="Published resources loaded" tone="purple" />
        </div>

        <UniversityPanel className="univ-overview-section">
          <UniversitySectionTitle icon={FiBell} title="Important Announcements" subtitle="Latest university updates delivered to your account" action="View all" onAction={() => onTabChange("announcements")} />
          {visibleNotices.length ? (
            <div className="univ-notice-list">
              {visibleNotices.map((notice) => <UniversityNoticeRow key={notice.id} notice={notice}
                onOpen={onOpenNotice} onMarkRead={onMarkRead}
                saved={savedIds.includes(String(notice.id))} onToggleSaved={onToggleSaved} compact />)}
            </div>
          ) : <UniversityEmptyState icon={FiBell} title={query ? "No matching announcements" : "No university announcements yet"}
            message={query ? "Try another search term." : "When university updates are published for your account, they will appear here."}
            action="Browse announcements" onAction={() => onTabChange("announcements")} compact />}
        </UniversityPanel>

        <UniversityPanel className="univ-quick-access-panel">
          <UniversitySectionTitle icon={FiTrendingUp} title="Quick Access" subtitle="Jump to the most-used university sections" />
          <div className="univ-quick-access-grid">
            {[
              ["Exam Notices", "examinations", FiCalendar, "red"],
              ["Results", "results", FiCheckCircle, "blue"],
              ["Academic Calendar", "calendar", FiList, "purple"],
              ["All Announcements", "announcements", FiBell, "gold"],
              ["University Documents", "documents", FiFileText, "green"],
            ].map(([label, tab, Icon, tone]) => (
              <button key={tab} type="button" className={`univ-quick-access tone-${tone}`} onClick={() => onTabChange(tab)}>
                <span><Icon /></span><strong>{label}</strong><small>Open section <span>↗</span></small>
              </button>
            ))}
          </div>
        </UniversityPanel>

        <UniversityPanel className="univ-overview-section">
          <UniversitySectionTitle icon={FiFileText} title="Recent Documents" subtitle="Published resources available through NotesWala" action="View all" onAction={() => onTabChange("documents")} />
          {visibleDocuments.length ? (
            <div className="univ-resource-list">
              {visibleDocuments.map((resource) => <UniversityResourceRow key={resource.id || resource.resourceId}
                resource={resource} onOpen={onOpenDocument} onDownload={onDownload}
                downloading={downloadingId === String(resource.id || resource.resourceId)} compact />)}
            </div>
          ) : <UniversityEmptyState icon={FiFileText} title={query ? "No matching documents" : "No published documents found"}
            message="Published resources will appear here when they are available from the resource library."
            action="Browse documents" onAction={() => onTabChange("documents")} compact />}
        </UniversityPanel>
      </div>

      <aside className="univ-right-stack">
        <UniversityPanel className="univ-updates-panel">
          <UniversitySectionTitle icon={FiClock} title="Latest Updates" subtitle="Recently published notices" action="View all" onAction={() => onTabChange("announcements")} />
          {notices.slice(0, 5).length ? notices.slice(0, 5).map((notice) => (
            <button key={notice.id} type="button" className="univ-timeline-row" onClick={() => onOpenNotice(notice)}>
              <span className="univ-timeline-date">{formatDate(notice.createdAt, { day: "2-digit", month: "short" }).split(" ").slice(0, 2).join(" ")}</span>
              <i />
              <span className="univ-timeline-copy"><strong>{notice.title || "University update"}</strong><small>{getNoticeCategory(notice)} · Published {formatDate(notice.createdAt)}</small></span>
            </button>
          )) : <UniversityEmptyState icon={FiInfo} title="No updates yet" message="Official updates will appear when they are published." compact />}
        </UniversityPanel>

        <UniversityPanel className="univ-profile-panel">
          <UniversitySectionTitle icon={FiActivity} title="Your Academic Details" />
          <dl className="univ-academic-details">
            <div><dt>University</dt><dd>{university?.shortCode || academic?.universityShortCode || "—"}</dd></div>
            <div><dt>College</dt><dd>{academic?.collegeName || "—"}</dd></div>
            <div><dt>Branch</dt><dd>{academic?.branchName || "—"}</dd></div>
            <div><dt>Current semester</dt><dd>{academic?.currentSemesterName || academic?.semesterName || "—"}</dd></div>
            <div><dt>Academic year</dt><dd>{yearLabel}</dd></div>
            <div><dt>Exam pattern</dt><dd>{academic?.examPatternName || "—"}</dd></div>
          </dl>
          <button type="button" className="univ-secondary-button univ-full-button" onClick={() => onTabChange("calendar")}>Explore Academic Calendar <FiCalendar /></button>
          {unreadCount > 0 && <p className="univ-hint"><FiInfo /> You have {unreadCount} unread university update{unreadCount === 1 ? "" : "s"}.</p>}
        </UniversityPanel>
      </aside>
    </div>
  );
}
