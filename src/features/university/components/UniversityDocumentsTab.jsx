import { useMemo } from "react";
import { FiDownload, FiFileText, FiFilter, FiSearch } from "react-icons/fi";
import { UniversityEmptyState, UniversityPanel, UniversityResourceRow, UniversitySectionTitle } from "./UniversityUI";
import { matchesSearch } from "../universityUtils";

export default function UniversityDocumentsTab({ documents, query, onOpenDocument, onDownload, downloadingId }) {
  const sorted = useMemo(() => [...documents]
    .filter((resource) => matchesSearch([resource.title, resource.description, resource.subjectName, resource.categoryName, resource.materialType, resource.documentType, resource.tags], query))
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime()), [documents, query]);

  return (
    <div className="univ-overview-grid">
      <div className="univ-main-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiFileText} title="University Documents" subtitle="Published resources available to your account" />
          <div className="univ-documents-toolbar"><span><FiSearch /> Search is available from the top search field.</span><span><FiFilter /> {sorted.length} shown</span></div>
          {sorted.length ? <div className="univ-resource-list">{sorted.map((resource) => <UniversityResourceRow key={resource.id || resource.resourceId} resource={resource} onOpen={onOpenDocument} onDownload={onDownload} downloading={downloadingId === String(resource.id || resource.resourceId)} />)}</div>
            : <UniversityEmptyState icon={FiFileText} title="No documents found" message={query ? "No published resources match the current search." : "No published resources are available in the current catalogue response."} compact />}
          <div className="univ-list-footer">Showing {sorted.length.toLocaleString("en-IN")} loaded resources. The catalogue request is bounded to 50 records.</div>
        </UniversityPanel>
      </div>
      <aside className="univ-right-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiInfo} title="Access and downloads" />
          <p className="univ-panel-copy">Download access is checked by the backend. If a resource requires a purchase or entitlement, the download will show the server's access message rather than bypassing the restriction.</p>
        </UniversityPanel>
      </aside>
    </div>
  );
}
