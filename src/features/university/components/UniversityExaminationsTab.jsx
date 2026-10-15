import { FiBookOpen, FiCalendar, FiFileText, FiInfo, FiSearch } from "react-icons/fi";
import { UniversityEmptyState, UniversityNoticeRow, UniversityPanel, UniversityResourceRow, UniversitySectionTitle } from "./UniversityUI";
import { getNoticeCategory, matchesSearch } from "../universityUtils";

export default function UniversityExaminationsTab({ notices, documents, query, onTabChange, onQuickSearch, onOpenNotice, onMarkRead, savedIds, onToggleSaved, onOpenDocument, onDownload, downloadingId }) {
  const examNotices = notices.filter((notice) => getNoticeCategory(notice) === "Examination" && matchesSearch([notice.title, notice.message], query));
  const examDocuments = documents.filter((item) => matchesSearch([item.title, item.description, item.categoryName, item.materialType], query) && /(exam|timetable|time table|hall.?ticket|revaluation|backlog|supplementary|admit card)/i.test(`${item.title || ""} ${item.description || ""} ${item.categoryName || ""} ${item.materialType || ""}`));
  const quickLinks = [
    ["Exam timetables", "timetable"],
    ["Exam forms & deadlines", "form"],
    ["Hall ticket guidance", "hall ticket"],
    ["Revaluation information", "revaluation"],
  ];

  return (
    <div className="univ-overview-grid">
      <div className="univ-main-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiBookOpen} title="Examinations" subtitle="Examination notices and related published documents" />
          <div className="univ-exam-shortcuts">{quickLinks.map(([label, term], index) => <button type="button" key={term} className={`univ-exam-shortcut tone-${["red","blue","green","orange"][index]}`} onClick={() => {
            onQuickSearch(term);
            onTabChange("documents");
          }}><span>{index === 0 ? <FiCalendar /> : index === 1 ? <FiFileText /> : index === 2 ? <FiBookOpen /> : <FiInfo />}</span><div className="univ-exam-shortcut-copy"><strong>{label}</strong><small>Search published items</small></div></button>)}</div>
        </UniversityPanel>
        <UniversityPanel>
          <UniversitySectionTitle icon={FiCalendar} title="Official Exam Schedule" subtitle="Timetable data must come from a published university schedule" />
          <UniversityEmptyState icon={FiInfo} title="No structured timetable feed is connected" message="This NotesWala backend currently exposes exam-pattern metadata and notifications, but not exam dates, subjects, times, or hall allocations. We will show those here when an official schedule is available instead of generating sample dates." action="Browse examination notices" onAction={() => onTabChange("announcements")} />
        </UniversityPanel>
        <UniversityPanel>
          <UniversitySectionTitle icon={FiFileText} title="Examination Notices" subtitle="Published updates categorized as examination-related" />
          {examNotices.length ? <div className="univ-notice-list">{examNotices.map((notice) => <UniversityNoticeRow key={notice.id} notice={notice} onOpen={onOpenNotice} onMarkRead={onMarkRead} saved={savedIds.includes(String(notice.id))} onToggleSaved={onToggleSaved} />)}</div>
            : <UniversityEmptyState icon={FiBookOpen} title="No exam notices found" message="Examination updates will appear when they are delivered to your account." compact />}
        </UniversityPanel>
        <UniversityPanel>
          <UniversitySectionTitle icon={FiFileText} title="Exam-related Documents" subtitle="Published resources matched by their title and category" action="View all" onAction={() => onTabChange("documents")} />
          {examDocuments.length ? <div className="univ-resource-list">{examDocuments.slice(0, 10).map((resource) => <UniversityResourceRow key={resource.id || resource.resourceId} resource={resource} onOpen={onOpenDocument} onDownload={onDownload} downloading={downloadingId === String(resource.id || resource.resourceId)} />)}</div>
            : <UniversityEmptyState icon={FiSearch} title="No exam documents found" message="Try the Documents tab to browse the published resource catalogue." action="Browse documents" onAction={() => onTabChange("documents")} compact />}
        </UniversityPanel>
      </div>
      <aside className="univ-right-stack"><UniversityPanel><UniversitySectionTitle icon={FiInfo} title="Before your exam" />
        <ul className="univ-checklist"><li>Verify the date from the official university notice.</li><li>Read form deadlines carefully, including any late-fee period.</li><li>Check your personal semester and exam-pattern details.</li><li>Only rely on published documents for subject and timetable information.</li></ul>
        <button type="button" className="univ-secondary-button univ-full-button" onClick={() => onTabChange("calendar")}>Open academic calendar <FiCalendar /></button></UniversityPanel></aside>
    </div>
  );
}
