import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFileText,
  FiFlame,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../../services/profileService";
import { getPopularResources } from "../../../services/resourceService";
import { getRecentlyViewedResources } from "../services/recentlyViewedService";

const CARDS_PER_VIEW = 3;
const HISTORY_EVENT = "noteswala:recently-viewed-updated";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function asList(response) {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function formatSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "PDF document";
  if (size < 1024 * 1024) return "PDF · " + (size / 1024).toFixed(1) + " KB";
  return "PDF · " + (size / (1024 * 1024)).toFixed(1) + " MB";
}

function compactNumber(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (number >= 1000) return (number / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.max(0, Math.round(number)));
}

function timeAgo(value) {
  if (!value) return "Recently viewed";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (!Number.isFinite(elapsed)) return "Recently viewed";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Viewed just now";
  if (minutes < 60) return "Viewed " + minutes + (minutes === 1 ? " minute ago" : " minutes ago");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "Viewed " + hours + (hours === 1 ? " hour ago" : " hours ago");
  const days = Math.floor(hours / 24);
  return "Viewed " + days + (days === 1 ? " day ago" : " days ago");
}

function resourcePath(resource) {
  const subjectCode = resource?.subjectCode && String(resource.subjectCode).toLowerCase() !== "view"
    ? resource.subjectCode
    : "view";
  return "/resources/" + encodeURIComponent(subjectCode) + "/" + encodeURIComponent(resource.id);
}

function displayCategory(resource) {
  return resource?.subjectName || resource?.categoryName || resource?.materialType || "Study material";
}

function imageUrl(resource) {
  const value = resource?.coverImageUrl || resource?.thumbnailUrl || "";
  return /^(https?:\/\/|\/)/i.test(value) ? value : "";
}

function ResourceCover({ resource, rank }) {
  const source = imageUrl(resource);
  return (
    <div className={"home-resource-cover " + (rank ? "has-rank" : "")}>
      {rank ? <span className={"home-resource-rank rank-" + rank}>{rank}</span> : null}
      {source
        ? <img src={source} alt="" loading="lazy" />
        : <div className="home-resource-cover-placeholder">
            <FiBookOpen />
            <span>{String(resource?.title || "Study material").split(/\s+/).slice(0, 5).join(" ")}</span>
            <small>{resource?.documentType || "PDF"}</small>
          </div>}
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon, onViewAll, onPrevious, onNext, disableControls }) {
  return (
    <header className="home-resource-section-header">
      <span className="home-resource-section-icon"><Icon /></span>
      <div className="home-resource-section-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <button type="button" className="home-resource-view-all" onClick={onViewAll}>
        View All <FiArrowRight />
      </button>
      <div className="home-resource-carousel-controls">
        <button type="button" aria-label={"Previous " + title} onClick={onPrevious} disabled={disableControls}>
          <FiArrowLeft />
        </button>
        <button type="button" aria-label={"Next " + title} onClick={onNext} disabled={disableControls}>
          <FiArrowRight />
        </button>
      </div>
    </header>
  );
}

function ResourceCard({ resource, mode, rank, onOpen }) {
  const progress = Math.max(0, Math.min(100, Number(resource?.progressPercent) || 0));
  const viewedPage = Math.max(1, Number(resource?.currentPage) || 1);
  const pages = Math.max(0, Number(resource?.pageCount) || 0);
  const complete = progress >= 100;
  const popularity = Number(resource?.popularityScore) || 0;
  const downloads = Number(resource?.downloadsCount) || 0;

  return (
    <article className={"home-resource-card home-resource-card-" + mode}>
      <div className="home-resource-card-main">
        <ResourceCover resource={resource} rank={rank} />
        <div className="home-resource-card-details">
          <span className="home-resource-category">{displayCategory(resource)}</span>
          <h3 title={resource?.title || "Study resource"}>{resource?.title || "Study resource"}</h3>
          <p><FiFileText /> {formatSize(resource?.fileSizeBytes)}</p>
          <p><FiBookOpen /> {pages > 0 ? pages + " pages" : "Pages not available"}</p>
          {mode === "recent"
            ? <p><FiClock /> {timeAgo(resource?.lastViewedAt)}</p>
            : <p><FiEye /> {compactNumber(downloads)} downloads · {compactNumber(popularity)} popularity</p>}
        </div>
      </div>

      {mode === "recent" && (
        <div className="home-resource-progress">
          <div className="home-resource-progress-track"><span style={{ width: progress + "%" }} /></div>
          <strong>{progress}%</strong>
        </div>
      )}

      <button type="button" className={"home-resource-card-action " + (mode === "recent" && !complete ? "primary" : "")} onClick={() => onOpen(resource)}>
        {mode === "recent" ? (complete ? "View Again" : viewedPage > 1 ? "Continue Reading" : "Start Reading") : "View Resource"}
        <FiArrowRight />
      </button>
    </article>
  );
}

function ResourceSection({
  mode,
  resources,
  loading,
  error,
  startIndex,
  setStartIndex,
  onOpen,
  onViewAll,
  onRetry,
}) {
  const recent = mode === "recent";
  const title = recent ? "Recently Viewed Resources" : "Most Viewed Resources";
  const subtitle = recent ? "Continue where you left off" : "Popular among students";
  const Icon = recent ? FiClock : FiFlame;
  const pageCount = Math.max(1, Math.ceil(resources.length / CARDS_PER_VIEW));
  const maxStart = Math.max(0, (pageCount - 1) * CARDS_PER_VIEW);
  const visible = resources.slice(startIndex, startIndex + CARDS_PER_VIEW);

  const changeSlide = (direction) => {
    if (!resources.length) return;
    setStartIndex((current) => {
      if (direction === "next") return current >= maxStart ? 0 : Math.min(maxStart, current + CARDS_PER_VIEW);
      return current <= 0 ? maxStart : Math.max(0, current - CARDS_PER_VIEW);
    });
  };

  return (
    <section className={"home-panel home-resource-section home-resource-section-" + mode}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        onViewAll={onViewAll}
        onPrevious={() => changeSlide("previous")}
        onNext={() => changeSlide("next")}
        disableControls={resources.length <= CARDS_PER_VIEW}
      />

      {loading ? (
        <div className="home-resource-section-state"><FiLoader className="is-spinning" /> Loading resources…</div>
      ) : error ? (
        <div className="home-resource-section-state is-error">
          <span>{error}</span>
          <button type="button" onClick={onRetry}><FiRefreshCw /> Retry</button>
        </div>
      ) : resources.length === 0 ? (
        <div className="home-resource-section-state">
          {recent ? "Resources you open will appear here so you can continue reading." : "Published resources will appear here as students view and use them."}
        </div>
      ) : (
        <div className="home-resource-cards">
          {visible.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              mode={mode}
              rank={recent ? null : startIndex + index + 1}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomeResourceCollections() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [recentResources, setRecentResources] = useState([]);
  const [popularResources, setPopularResources] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState("");
  const [recentStart, setRecentStart] = useState(0);
  const [popularStart, setPopularStart] = useState(0);

  const refreshRecent = useCallback(() => {
    if (!userId) {
      setRecentResources([]);
      return;
    }
    setRecentResources(getRecentlyViewedResources(userId));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((response) => {
        const user = unwrap(response);
        if (!cancelled) setUserId(user?.userId ?? user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    refreshRecent();
    const handleHistoryUpdate = (event) => {
      if (!event.detail?.userId || String(event.detail.userId) === String(userId)) refreshRecent();
    };
    const handleStorage = (event) => {
      if (userId && event.key === "noteswala:recently-viewed:v1:" + String(userId)) refreshRecent();
    };
    window.addEventListener(HISTORY_EVENT, handleHistoryUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(HISTORY_EVENT, handleHistoryUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshRecent, userId]);

  const loadPopular = useCallback(async () => {
    setPopularLoading(true);
    setPopularError("");
    try {
      const response = await getPopularResources({ page: 0, size: 12 });
      setPopularResources(asList(response));
      setPopularStart(0);
    } catch (error) {
      setPopularError(error?.response?.data?.message || "Unable to load popular resources.");
    } finally {
      setPopularLoading(false);
    }
  }, []);

  useEffect(() => { void loadPopular(); }, [loadPopular]);

  const openResource = useCallback((resource) => {
    if (!resource?.id) return;
    navigate(resourcePath(resource));
  }, [navigate]);

  const openAllResources = useCallback(() => navigate("/resources"), [navigate]);

  const recentVisibleStart = useMemo(() => Math.min(recentStart, Math.max(0, Math.ceil(recentResources.length / CARDS_PER_VIEW) - 1) * CARDS_PER_VIEW), [recentStart, recentResources.length]);

  return (
    <div className="home-resource-collections">
      <ResourceSection
        mode="recent"
        resources={recentResources}
        loading={false}
        error=""
        startIndex={recentVisibleStart}
        setStartIndex={setRecentStart}
        onOpen={openResource}
        onViewAll={openAllResources}
        onRetry={refreshRecent}
      />
      <ResourceSection
        mode="popular"
        resources={popularResources}
        loading={popularLoading}
        error={popularError}
        startIndex={popularStart}
        setStartIndex={setPopularStart}
        onOpen={openResource}
        onViewAll={openAllResources}
        onRetry={() => { void loadPopular(); }}
      />
    </div>
  );
}
