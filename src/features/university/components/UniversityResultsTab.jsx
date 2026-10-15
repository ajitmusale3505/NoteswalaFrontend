import { FiAward, FiCheckCircle, FiFileText } from "react-icons/fi";
import { UniversityEmptyState, UniversityNoticeRow, UniversityPanel, UniversityResourceRow, UniversitySectionTitle } from "./UniversityUI";
import { matchesSearch, getNoticeCategory } from "../universityUtils";

export default function UniversityResultsTab({ notices, documents, query, onOpenNotice, onMarkRead, savedIds, onToggleSaved, onOpenDocument, onDownload, downloadingId, onTabChange }) {
  const resultNotices = notices.filter((notice) => getNoticeCategory(notice) === "Results" && matchesSearch([notice.title, notice.message], query));
  const resultDocuments = documents.filter((item) => matchesSearch([item.title, item.description, item.categoryName], query) && /(result|marksheet|grade|revaluation|score card)/i.test(`${item.title || ""} ${item.description || ""} ${item.categoryName || ""}`));

  return (
    <div className="univ-overview-grid">
      <div className="univ-main-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiAward} title="Results" subtitle="Result-related university notifications and published materials" />
          {resultNotices.length ? <div className="univ-notice-list">{resultNotices.map((notice) => <UniversityNoticeRow key={notice.id} notice={notice} onOpen={onOpenNotice} onMarkRead={onMarkRead} saved={savedIds.includes(String(notice.id))} onToggleSaved={onToggleSaved} />)}</div>
            : <UniversityEmptyState icon={FiAward} title="No result notifications found" message="When a result announcement is sent to your account, it will appear here." compact />}
        </UniversityPanel>
        <UniversityPanel>
          <UniversitySectionTitle icon={FiFileText} title="Result Documents" subtitle="Published resources related to marks, grades or result instructions" />
          {resultDocuments.length ? <div className="univ-resource-list">{resultDocuments.map((resource) => <UniversityResourceRow key={resource.id || resource.resourceId} resource={resource} onOpen={onOpenDocument} onDownload={onDownload} downloading={downloadingId === String(resource.id || resource.resourceId)} />)}</div>
            : <UniversityEmptyState icon={FiFileText} title="No result documents found" message="No result-related document is currently available in the loaded published resources." compact />}
          <button type="button" className="univ-secondary-button" onClick={() => onTabChange("announcements")}>Check all university notices <FiCheckCircle /></button>
        </UniversityPanel>
      </div>
      <aside className="univ-right-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiInfo} title="Result safety" />
          <p className="univ-panel-copy">This page does not access private university result portals or calculate marks. It only displays results-related notices and documents that are actually available in NotesWala.</p>
        </UniversityPanel>
      </aside>
    </div>
  );
}
