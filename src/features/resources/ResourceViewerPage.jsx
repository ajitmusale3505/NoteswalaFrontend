import { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiInfo,
  FiLock,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import HomeNavbar from "../home/components/HomeNavbar";
import PdfReader from "./PdfReader";
import { downloadResource, getResourceById, getResources, viewResource } from "../../services/resourceService";
import "../../styles/resource-viewer.css";

const slugify = (value = "") => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function unwrapList(response) {
  const payload = unwrapResponse(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function formatFileSize(bytes) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) < 0) return "Size unavailable";
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function displayValue(value, fallback = "Not provided") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

async function resolveResource(resourceId) {
  // Current links use the persisted resource ID. Older bookmarked slug links
  // are still resolved from the resource catalogue for backwards compatibility.
  if (/^\d+$/.test(String(resourceId))) {
    try {
      const response = await getResourceById(resourceId);
      const record = unwrapResponse(response);
      if (record?.id !== undefined && record?.id !== null) return record;
    } catch {
      // Fall through to the catalogue lookup below.
    }
  }

  const resources = unwrapList(await getResources());
  const selected = resources.find((item) =>
    String(item?.id ?? "") === String(resourceId) ||
    slugify(item?.slug) === slugify(resourceId) ||
    slugify(item?.title) === slugify(resourceId)
  );
  if (selected) return selected;

  throw new Error("This resource could not be found. Return to the subject page and open it again.");
}

function ResourceDetailsPanel({ resource, subjectCode, onDownload, downloading }) {
  const details = [
    ["Subject", resource.subjectName || subjectCode],
    ["Branch", resource.branchName],
    ["Semester", resource.semesterNumber ? `Semester ${resource.semesterNumber}` : null],
    ["Category", resource.categoryName],
    ["Document type", resource.documentType],
    ["Material type", resource.materialType],
    ["File size", formatFileSize(resource.fileSizeBytes)],
    ["Pages", resource.pageCount],
    ["Language", resource.language],
    ["Version", resource.version],
    ["Uploaded by", resource.uploadedByName],
    ["Availability", resource.published && resource.active ? "Published" : "Not currently published"],
  ];

  return (
    <aside className="viewer-right">
      <section className="viewer-side-card reading-card">
        <h3><FiFileText /> Resource Information</h3>
        <div className="resource-viewer-resource-name">
          <span className="resource-viewer-file-icon"><FiBookOpen /></span>
          <div><strong>{resource.title}</strong><small>{resource.documentType || resource.materialType || "Study material"}</small></div>
        </div>
        <div className="resource-viewer-detail-list">
          {details.map(([label, value]) => (
            <div className="resource-viewer-detail-row" key={label}>
              <span>{label}</span><strong>{displayValue(value)}</strong>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`download-pdf ${!resource.downloadable ? "is-download-restricted" : ""}`}
          onClick={() => { if (resource.downloadable && !downloading) onDownload(); }}
          disabled={!resource.downloadable || downloading}
          aria-disabled={!resource.downloadable || downloading}
          title={!resource.downloadable ? "Downloading is disabled by the resource administrator" : "Download the original uploaded PDF"}
        >
          {!resource.downloadable
            ? <FiLock />
            : downloading
              ? <FiRefreshCw className="resource-viewer-spinning" />
              : <FiDownload />}
          {!resource.downloadable ? "Download Disabled" : downloading ? "Preparing download…" : "Download PDF"}
        </button>
        {!resource.downloadable && (
          <p className="resource-viewer-inline-note"><FiLock /> You can read this document, but downloading is disabled by the resource owner.</p>
        )}
      </section>
      {resource.description && (
        <section className="viewer-side-card resource-viewer-description">
          <h3><FiInfo /> About this resource</h3>
          <p>{resource.description}</p>
          {resource.tags && <div className="resource-viewer-tags">{String(resource.tags).split(/[,;|]/).map((tag) => tag.trim()).filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </section>
      )}
    </aside>
  );
}

export default function ResourceViewerPage() {
  const { subjectCode = "", resourceId = "" } = useParams();
  const [resource, setResource] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const retryLoad = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    let createdObjectUrl = "";

    setResource(null);
    setPdfUrl("");
    setErrorMessage("");
    setLoading(true);

    const loadResourceAndPdf = async () => {
      try {
        const record = await resolveResource(resourceId);
        if (!record?.id) {
          throw new Error("The selected resource does not have a valid resource ID.");
        }
        if (cancelled) return;
        setResource(record);

        // This endpoint streams the actual stored PDF and enforces the signed-in
        // user's resource entitlement. Do not render fabricated/sample page content.
        const pdfResponse = await viewResource(record.id);
        const responseData = pdfResponse?.data;
        const pdfBlob = responseData instanceof Blob
          ? responseData
          : new Blob([responseData], { type: "application/pdf" });

        if (!pdfBlob.size) {
          throw new Error("The uploaded PDF returned an empty file. Please retry or contact the administrator.");
        }

        createdObjectUrl = URL.createObjectURL(pdfBlob);
        if (cancelled) {
          URL.revokeObjectURL(createdObjectUrl);
          return;
        }
        setPdfUrl(createdObjectUrl);
      } catch (error) {
        if (cancelled) return;
        const status = error?.response?.status;
        const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
        if (status === 401) {
          setErrorMessage("Your session has expired. Sign in again to open this resource.");
        } else if (status === 403) {
          setErrorMessage("You do not have full-view access to this resource. Check its access or purchase requirements.");
        } else {
          setErrorMessage(serverMessage || error?.message || "The PDF could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadResourceAndPdf();
    return () => {
      cancelled = true;
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
    };
  }, [resourceId, subjectCode, reloadToken]);

  const handleDownload = async () => {
    if (!resource?.id || !resource.downloadable || downloading) return;
    setDownloading(true);
    try {
      const response = await downloadResource(resource.id);
      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: "application/pdf" });
      if (!blob.size) throw new Error("The download returned an empty file.");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slugify(resource.title) || "study-resource"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      const status = error?.response?.status;
      const message = status === 403
        ? "You do not have download permission for this resource."
        : error?.response?.data?.message || error?.message || "The PDF could not be downloaded.";
      setErrorMessage(message);
    } finally {
      setDownloading(false);
    }
  };

  const title = resource?.title || (loading ? "Loading resource…" : "Resource unavailable");
  const category = resource?.materialType || resource?.documentType || "Study resource";
  const semesterLabel = resource?.semesterNumber ? `Semester ${resource.semesterNumber}` : null;

  return (
    <div className="resource-viewer-page">
      <HomeNavbar />
      <main>
        <header className="viewer-hero">
          <div className="viewer-breadcrumb">
            <Link to="/resources">Resources</Link><span>›</span>
            <Link to={`/resources/${subjectCode}`}>{resource?.subjectName || subjectCode || "Subject"}</Link><span>›</span>
            <b>{title}</b>
          </div>
          <div className="viewer-resource-head">
            <div className="viewer-cover"><FiBookOpen /></div>
            <div className="viewer-resource-info">
              <div className="viewer-title-line"><h1>{title}</h1><label>{category}</label></div>
              <div className="viewer-meta">
                <span>{subjectCode}</span>{semesterLabel && <><i /><span>{semesterLabel}</span></>}
                {resource?.branchName && <><i /><span>{resource.branchName}</span></>}
                {resource?.categoryName && <><i /><span>{resource.categoryName}</span></>}
              </div>
              <p>{resource?.description || "Open and read the original PDF uploaded for this subject."}</p>
              <div className="viewer-facts">
                <span><FiFileText />{formatFileSize(resource?.fileSizeBytes)}</span>
                {resource?.pageCount && <span><FiBookOpen />{resource.pageCount} pages</span>}
                {resource?.uploadedByName && <span><FiUser />{resource.uploadedByName}</span>}
                {resource?.published && resource?.active && <label><FiCheckCircle /> Published</label>}
              </div>
            </div>
          </div>
        </header>

        <div className="viewer-workspace resource-viewer-live-workspace">
          <aside className="viewer-outline resource-document-details">
            <div className="outline-tabs"><button type="button" className="active">Document</button><button type="button" disabled>Details</button></div>
            <div className="resource-document-summary">
              <span className="resource-document-big-icon"><FiFileText /></span>
              <h2>{title}</h2>
              <p>{resource?.description || "The original PDF stored for this resource will appear in the reader."}</p>
              <div className="resource-document-summary-meta">
                <div><span>File type</span><strong>PDF document</strong></div>
                <div><span>File size</span><strong>{formatFileSize(resource?.fileSizeBytes)}</strong></div>
                <div><span>Subject</span><strong>{resource?.subjectName || subjectCode}</strong></div>
                <div><span>Semester</span><strong>{semesterLabel || "Not specified"}</strong></div>
                <div><span>Access</span><strong>{resource?.free || resource?.accessType === "FREE" ? "Free" : displayValue(resource?.accessType)}</strong></div>
              </div>
            </div>
          </aside>

          <section className="resource-pdf-reader-shell" aria-label="Uploaded PDF reader">
            <PdfReader
              fileUrl={pdfUrl}
              title={title}
              onDownload={handleDownload}
              canDownload={Boolean(resource?.downloadable)}
              downloading={downloading}
              initialError={errorMessage}
              resourceLoading={loading}
              onRetry={retryLoad}
            />
          </section>

          {resource
            ? <ResourceDetailsPanel resource={resource} subjectCode={subjectCode} onDownload={handleDownload} downloading={downloading} />
            : <aside className="viewer-right"><section className="viewer-side-card"><h3><FiInfo /> Resource details</h3><p>The details will appear when the resource has loaded.</p></section></aside>}
        </div>
      </main>
    </div>
  );
}
