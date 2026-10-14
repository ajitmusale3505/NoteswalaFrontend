import { useCallback, useEffect, useState } from "react";
import {
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiFile,
  FiFileText,
  FiGitBranch,
  FiGlobe,
  FiGrid,
  FiClock,
  FiUser,
  FiStar,
  FiSend,
  FiMessageSquare,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { getCurrentUser } from "../../services/profileService";
import { recordRecentlyViewedResource, updateRecentlyViewedProgress } from "../home/services/recentlyViewedService";
import HomeNavbar from "../home/components/HomeNavbar";
import PdfReader from "./PdfReader";
import {
  createResourceReview,
  downloadResource,
  getMyResourceReview,
  getResourceById,
  getResourceReviewSummary,
  getResources,
  updateResourceReview,
  viewResource,
} from "../../services/resourceService";
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

function DocumentDetailsPanel({ resource, subjectCode }) {
  const isUniversityWideSyllabus = !resource.subjectName
    && String(resource.categoryName || "").toLowerCase().includes("syllabus");
  const rows = [
    ...(!isUniversityWideSyllabus ? [{ label: "Subject", value: resource.subjectName || subjectCode, Icon: FiGitBranch }] : []),
    { label: "Branch", value: resource.branchName, Icon: FiUser },
    { label: "Semester", value: resource.semesterNumber ? `Semester ${resource.semesterNumber}` : null, Icon: FiCalendar },
    { label: "Category", value: resource.categoryName, Icon: FiGrid },
    { label: "Document type", value: resource.documentType, Icon: FiFile },
    { label: "Material type", value: resource.materialType, Icon: FiBookOpen },
    { label: "File size", value: formatFileSize(resource.fileSizeBytes), Icon: FiFileText },
    { label: "Pages", value: resource.pageCount, Icon: FiBook },
    { label: "Language", value: resource.language, Icon: FiGlobe },
    { label: "Version", value: resource.version, Icon: FiClock },
  ];
  const fallbackTags = [
    !isUniversityWideSyllabus ? subjectCode?.split("-")[0] : null,
    isUniversityWideSyllabus ? "Syllabus" : (/note/i.test(`${resource.title || ""} ${resource.materialType || ""}`) ? "Notes" : resource.documentType),
  ].filter(Boolean);
  const tags = (resource.tags
    ? String(resource.tags).split(/[,;|]/).map((tag) => tag.trim()).filter(Boolean)
    : fallbackTags).slice(0, 4);

  return (
    <aside className="viewer-outline resource-document-details">
      <header className="resource-document-details-heading">
        <span className="resource-document-heading-icon"><FiFileText /></span>
        <div>
          <h2>Document Details</h2>
          <p>Complete information about this resource</p>
        </div>
      </header>

      <div className="resource-document-summary">
        <div className="resource-document-identity">
          <span className="resource-document-big-icon"><FiFileText /></span>
          <div className="resource-document-identity-copy">
            <h3>{resource.title || "Loading resource…"}</h3>
            <p>{resource.documentType || resource.materialType || "PDF document"}</p>
            {tags.length > 0 && (
              <div className="resource-document-tags">
                {tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="resource-document-detail-rows">
          {rows.map(({ label, value, Icon }) => (
            <div className="resource-document-detail-row" key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <strong>{displayValue(value, "—")}</strong>
            </div>
          ))}
        </div>
        <RatingFeedbackPanel resourceId={resource.id} />
      </div>
    </aside>
  );
}


function getReviewErrorMessage(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || "Your rating could not be submitted. Please try again.";
}

function RatingFeedbackPanel({ resourceId }) {
  const [summary, setSummary] = useState({ ratingAverage: 0, ratingCount: 0 });
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatusMessage("");
    setErrorMessage("");

    const loadReviewData = async () => {
      const [summaryResult, reviewResult] = await Promise.allSettled([
        getResourceReviewSummary(resourceId),
        getMyResourceReview(resourceId),
      ]);
      if (cancelled) return;

      if (summaryResult.status === "fulfilled") {
        const payload = unwrapResponse(summaryResult.value) || {};
        setSummary({
          ratingAverage: Number(payload.ratingAverage) || 0,
          ratingCount: Number(payload.ratingCount) || 0,
        });
      } else {
        setErrorMessage(getReviewErrorMessage(summaryResult.reason));
      }

      if (reviewResult.status === "fulfilled") {
        const review = unwrapResponse(reviewResult.value);
        setMyReview(review);
        setRating(Number(review?.rating) || 0);
        setFeedback(review?.review || "");
      } else {
        const status = reviewResult.reason?.response?.status;
        if (status === 404) {
          setMyReview(null);
          setRating(0);
          setFeedback("");
        } else if (!errorMessage) {
          setErrorMessage(getReviewErrorMessage(reviewResult.reason));
        }
      }
      setLoading(false);
    };

    loadReviewData();
    return () => { cancelled = true; };
  }, [resourceId]);

  const refreshSummary = async () => {
    try {
      const response = await getResourceReviewSummary(resourceId);
      const payload = unwrapResponse(response) || {};
      setSummary({
        ratingAverage: Number(payload.ratingAverage) || 0,
        ratingCount: Number(payload.ratingCount) || 0,
      });
    } catch {
      // Keep the last known summary if refreshing the aggregate fails.
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!rating || submitting) {
      if (!rating) setErrorMessage("Please choose a star rating from 1 to 5.");
      return;
    }
    if (feedback.length > 2000) {
      setErrorMessage("Feedback must be 2,000 characters or fewer.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");
    const payload = { rating, review: feedback.trim() || null };

    try {
      const response = myReview
        ? await updateResourceReview(resourceId, myReview.id, payload)
        : await createResourceReview(resourceId, payload);
      const savedReview = unwrapResponse(response);
      setMyReview(savedReview);
      setRating(Number(savedReview?.rating) || rating);
      setFeedback(savedReview?.review ?? payload.review ?? "");
      setStatusMessage(myReview ? "Your rating and feedback have been updated." : "Thank you! Your rating and feedback have been submitted.");
      await refreshSummary();
    } catch (error) {
      const status = error?.response?.status;
      const message = getReviewErrorMessage(error);
      if (status === 403) {
        setErrorMessage("You need access to this resource before you can submit a review.");
      } else if (status === 409 || /already reviewed/i.test(message)) {
        // Recover gracefully if the review was saved from another tab/session.
        try {
          const response = await getMyResourceReview(resourceId);
          const existingReview = unwrapResponse(response);
          setMyReview(existingReview);
          setRating(Number(existingReview?.rating) || rating);
          setFeedback(existingReview?.review || feedback);
          setErrorMessage("You already have a review for this resource. Your existing review has been loaded so you can update it.");
        } catch {
          setErrorMessage(message);
        }
      } else {
        setErrorMessage(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const average = summary.ratingAverage.toFixed(1);

  return (
    <section className="resource-rating-card" aria-labelledby="resource-rating-title">
      <header className="resource-rating-header">
        <div className="resource-rating-header-icon"><FiStar /></div>
        <div>
          <h3 id="resource-rating-title">Rate this PDF</h3>
          <p>Share your experience with other students</p>
        </div>
      </header>

      <div className="resource-rating-summary">
        <div className="resource-rating-average">
          <strong>{average}</strong>
          <span aria-label={`${average} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
              <FiStar key={index} className={index < Math.round(summary.ratingAverage) ? "is-filled" : ""} />
            ))}
          </span>
          <small>{summary.ratingCount} {summary.ratingCount === 1 ? "rating" : "ratings"}</small>
        </div>
      </div>

      {loading ? (
        <div className="resource-rating-loading" role="status">Loading your review…</div>
      ) : (
        <form className="resource-rating-form" onSubmit={submitReview}>
          <fieldset disabled={submitting}>
            <legend>{myReview ? "Update your rating" : "Your rating"}</legend>
            <div className="resource-rating-star-picker" role="group" aria-label="Choose a rating from one to five stars">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    type="button"
                    key={value}
                    className={value <= rating ? "is-selected" : ""}
                    onClick={() => { setRating(value); setErrorMessage(""); }}
                    aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                    aria-pressed={rating === value}
                    title={`${value} out of 5 stars`}
                  >
                    <FiStar />
                  </button>
                );
              })}
              <span className="resource-rating-selected-label">{rating ? `${rating}/5` : "Select stars"}</span>
            </div>
          </fieldset>

          <label className="resource-rating-feedback-label" htmlFor={`resource-feedback-${resourceId}`}>
            <span><FiMessageSquare /> Feedback <small>(optional)</small></span>
            <textarea
              id={`resource-feedback-${resourceId}`}
              value={feedback}
              onChange={(event) => { setFeedback(event.target.value); setErrorMessage(""); }}
              maxLength={2000}
              rows={3}
              placeholder="Was this PDF useful? Share feedback for other students…"
              disabled={submitting}
            />
            <small className="resource-rating-character-count">{feedback.length}/2000</small>
          </label>

          {errorMessage && <p className="resource-rating-message is-error" role="alert">{errorMessage}</p>}
          {statusMessage && <p className="resource-rating-message is-success" role="status">{statusMessage}</p>}

          <button className="resource-rating-submit" type="submit" disabled={loading || submitting || rating < 1 || rating > 5}>
            <FiSend />
            {submitting ? "Submitting…" : myReview ? "Update rating & feedback" : "Submit rating & feedback"}
          </button>
          {myReview && <p className="resource-rating-edit-note">You have already reviewed this PDF. You can update your rating and feedback at any time.</p>}
        </form>
      )}
    </section>
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
  const [currentUserId, setCurrentUserId] = useState(null);

  const retryLoad = useCallback(() => setReloadToken((value) => value + 1), []);

  const handleProgressChange = useCallback((progress) => {
    if (!currentUserId || !resource?.id || !progress?.totalPages) return;
    updateRecentlyViewedProgress(currentUserId, resource.id, progress.currentPage, progress.totalPages);
  }, [currentUserId, resource?.id]);

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

  useEffect(() => {
    let cancelled = false;
    if (!pdfUrl || !resource?.id) return undefined;

    getCurrentUser()
      .then((response) => {
        const user = response?.data?.data ?? response?.data ?? response;
        const userId = user?.userId ?? user?.id;
        if (cancelled || !userId) return;
        setCurrentUserId(userId);
        recordRecentlyViewedResource(userId, resource, subjectCode);
      })
      .catch(() => {
        // Opening the PDF must continue if the optional history request fails.
      });

    return () => { cancelled = true; };
  }, [pdfUrl, resource?.id, subjectCode]);

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
            {(subjectCode.toLowerCase() === "view" || (!resource?.subjectName && String(resource?.categoryName || "").toLowerCase().includes("syllabus")))
              ? <b>{title}</b>
              : <>
                  <Link to={`/resources/${subjectCode}`}>{resource?.subjectName || subjectCode || "Subject"}</Link><span>›</span>
                  <b>{title}</b>
                </>}
          </div>
          <div className="viewer-resource-head">
            <div className="viewer-cover"><FiBookOpen /></div>
            <div className="viewer-resource-info">
              <div className="viewer-title-line"><h1>{title}</h1><label>{category}</label></div>
              <div className="viewer-meta">
                {(subjectCode.toLowerCase() !== "view" && resource?.subjectName) && <span>{resource.subjectName}</span>}
                {semesterLabel && <><i /><span>{semesterLabel}</span></>}
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
          {resource
            ? <DocumentDetailsPanel resource={resource} subjectCode={subjectCode} />
            : <aside className="viewer-outline resource-document-details">
                <header className="resource-document-details-heading">
                  <span className="resource-document-heading-icon"><FiFileText /></span>
                  <div><h2>Document Details</h2><p>Complete information about this resource</p></div>
                </header>
                <div className="resource-document-loading"><span className="pdf-reader-spinner" /> Loading document details…</div>
              </aside>}

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
              onProgressChange={handleProgressChange}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
