import { useEffect, useMemo, useState } from "react";
import {
  FiBookmark,
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiFilter,
  FiSearch,
  FiStar,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 250;
const toneClass = { cream: "cream", blue: "blue", red: "red", green: "green" };
const slugify = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getUnit(resource) {
  const metadata = parseMetadata(resource[13]);
  const metadataUnit = metadata.unitName || metadata.unit || metadata.unitTitle || metadata.unitNumber || metadata.unitNo;
  if (metadataUnit !== null && metadataUnit !== undefined && String(metadataUnit).trim()) {
    const value = String(metadataUnit).trim();
    return /^unit\b/i.test(value) ? value : `Unit ${value}`;
  }

  const content = [resource[0], resource[1], resource[12], resource[13]].filter(Boolean).join(" ");
  const match = content.match(/\bunit\s*(?:no\.?|number)?\s*[-:#]?\s*([ivxlcdm]+|\d+)\b/i);
  return match ? `Unit ${match[1].toUpperCase()}` : "Not specified";
}

function getResourceYear(resource) {
  const metadata = parseMetadata(resource[13]);
  const rawDate = resource[14] || metadata.publishedAt || metadata.uploadedAt || metadata.createdAt || metadata.year;
  if (rawDate) {
    const date = new Date(rawDate);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() >= 1990 && date.getFullYear() <= 2200) {
      return String(date.getFullYear());
    }
    const metadataYear = String(rawDate).match(/\b(?:19|20|21)\d{2}\b/);
    if (metadataYear) return metadataYear[0];
  }

  const content = [resource[0], resource[1], resource[12], resource[13]].filter(Boolean).join(" ");
  const match = content.match(/\b(?:19|20|21)\d{2}\b/);
  return match ? match[0] : "Not specified";
}

function getFileType(resource) {
  const metadata = parseMetadata(resource[13]);
  const fileName = metadata.originalFileName || metadata.originalFilename || metadata.fileName || metadata.filename || "";
  const rawType = metadata.fileExtension || metadata.extension || metadata.fileType || metadata.mimeType || fileName;
  const extension = String(rawType || "").match(/(?:^|[./\\])([a-z0-9]{2,5})$/i)?.[1];
  if (extension) return extension.toUpperCase();
  if (String(rawType).toLowerCase().includes("pdf")) return "PDF";
  // NotesWala's current upload workflow accepts PDFs only; keep this a real,
  // selectable format while allowing richer formats when the API exposes them.
  return "PDF";
}

function buildResourceRecord(row) {
  return {
    row,
    id: row[10] ?? row[11] ?? row[0],
    title: String(row[0] || "Untitled resource"),
    description: String(row[1] || ""),
    searchText: row.map((value) => value == null ? "" : String(value)).join(" ").toLowerCase(),
    unit: getUnit(row),
    year: getResourceYear(row),
    fileType: getFileType(row),
    rating: Number(row[18] ?? row[4] ?? 0) || 0,
    downloads: Number(row[19]) || Number.parseInt(String(row[6] || "").replace(/[^0-9]/g, ""), 10) || 0,
    publishedAt: row[14] || "",
    fileSizeBytes: Number(row[17]) || 0,
  };
}

function compareText(first, second) {
  return first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });
}

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => first + index);
}

export default function SubjectResourceList({ subject }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useState(() => new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const resources = useMemo(
    () => (Array.isArray(subject.resources) ? subject.resources : []).map(buildResourceRecord),
    [subject.resources]
  );

  const unitOptions = useMemo(
    () => [...new Set(resources.map((resource) => resource.unit))].sort(compareText),
    [resources]
  );
  const yearOptions = useMemo(
    () => [...new Set(resources.map((resource) => resource.year))].sort((a, b) => {
      if (a === "Not specified") return 1;
      if (b === "Not specified") return -1;
      return Number(b) - Number(a);
    }),
    [resources]
  );
  const fileTypeOptions = useMemo(
    () => [...new Set(resources.map((resource) => resource.fileType))].sort(compareText),
    [resources]
  );

  const filteredResources = useMemo(() => {
    const result = resources.filter((resource) => {
      if (debouncedQuery && !resource.searchText.includes(debouncedQuery)) return false;
      if (unitFilter && resource.unit !== unitFilter) return false;
      if (yearFilter && resource.year !== yearFilter) return false;
      if (fileTypeFilter && resource.fileType !== fileTypeFilter) return false;
      return true;
    });

    result.sort((first, second) => {
      if (sortBy === "title-asc") return compareText(first.title, second.title);
      if (sortBy === "title-desc") return compareText(second.title, first.title);
      if (sortBy === "popular") return second.downloads - first.downloads || compareText(first.title, second.title);
      if (sortBy === "rating") return second.rating - first.rating || compareText(first.title, second.title);
      if (sortBy === "size") return second.fileSizeBytes - first.fileSizeBytes || compareText(first.title, second.title);

      const dateDifference = new Date(second.publishedAt || 0).getTime() - new Date(first.publishedAt || 0).getTime();
      return (Number.isFinite(dateDifference) ? dateDifference : 0) || compareText(first.title, second.title);
    });
    return result;
  }, [resources, debouncedQuery, unitFilter, yearFilter, fileTypeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const visibleResources = useMemo(
    () => filteredResources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredResources, page]
  );

  const resetPagination = () => setPage(1);
  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setUnitFilter("");
    setYearFilter("");
    setFileTypeFilter("");
    setSortBy("newest");
    setPage(1);
  };
  const hasActiveFilters = Boolean(query || unitFilter || yearFilter || fileTypeFilter || sortBy !== "newest");
  const toggleBookmark = (id) => setBookmarks((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const start = filteredResources.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, filteredResources.length);
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <section className="subject-resource-area">
      <div className="resource-area-heading">
        <div>
          <span className="subject-section-icon"><FiBookOpen /></span>
          <div>
            <h2>Notes</h2>
            <p>Well-organized notes for easy learning and revision.</p>
          </div>
        </div>
      </div>

      <div className="subject-resource-search">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); resetPagination(); }}
          placeholder={`Search ${subject.code} notes by title, description, topic or tag…`}
          aria-label={`Search ${subject.code} resources`}
        />
        {query && (
          <button type="button" className="subject-search-clear" onClick={() => { setQuery(""); setDebouncedQuery(""); resetPagination(); }} aria-label="Clear search">
            <FiX />
          </button>
        )}
      </div>

      <div className="resource-filter-row" aria-label="Filter and sort resources">
        <label>
          <span className="sr-only">Filter by unit</span>
          <select value={unitFilter} onChange={(event) => { setUnitFilter(event.target.value); resetPagination(); }} aria-label="Filter by unit">
            <option value="">All Units</option>
            {unitOptions.map((unit) => <option key={unit} value={unit}>{unit === "Not specified" ? "Unit not specified" : unit}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by year</span>
          <select value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); resetPagination(); }} aria-label="Filter by year">
            <option value="">All Years</option>
            {yearOptions.map((year) => <option key={year} value={year}>{year === "Not specified" ? "Year not specified" : year}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by file type</span>
          <select value={fileTypeFilter} onChange={(event) => { setFileTypeFilter(event.target.value); resetPagination(); }} aria-label="Filter by file type">
            <option value="">File Type</option>
            {fileTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort resources</span>
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); resetPagination(); }} aria-label="Sort resources">
            <option value="newest">Sort By: Newest</option>
            <option value="title-asc">Title: A–Z</option>
            <option value="title-desc">Title: Z–A</option>
            <option value="popular">Most Downloaded</option>
            <option value="rating">Highest Rated</option>
            <option value="size">Largest File</option>
          </select>
        </label>
      </div>

      <div className="subject-resource-results-meta" aria-live="polite">
        <span>
          {debouncedQuery !== query.trim().toLowerCase() ? "Searching…" : `Showing ${start}–${end} of ${filteredResources.length} resources`}
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}><FiFilter /> Clear filters</button>
        )}
      </div>

      {visibleResources.length > 0 ? (
        <div className="subject-resource-list">
          {visibleResources.map((resource) => {
            const [title, description, unit, size, ratingLabel, reviews, downloads, type, badge, tone, resourceId, resourceSlug] = resource.row;
            const viewerId = resourceId != null && String(resourceId) !== "" ? String(resourceId) : (resourceSlug || slugify(title));
            const href = `/resources/${subject.code}/${viewerId}`;
            const isBookmarked = bookmarks.has(resource.id);
            return (
              <article className="subject-resource-card" key={resource.id}>
                <Link className="resource-card-link" to={href}>
                  <div className={`resource-cover ${toneClass[tone] || "blue"}`}>
                    <FiBookOpen />
                    <small>{subject.code}</small>
                  </div>
                  <div className="resource-card-main">
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="resource-card-meta">
                      <span><FiFileText /> {unit}</span>
                      <span>{size}</span>
                      <span>PDF</span>
                      <label className="resource-tag blue-tag">{type}</label>
                      <label className={`resource-tag ${badge === "Important" ? "red-tag" : "green-tag"}`}>{badge}</label>
                    </div>
                  </div>
                </Link>
                <div className="resource-card-side">
                  <div>
                    <span><FiStar /> {ratingLabel} ({reviews})</span>
                    <small>{downloads}</small>
                  </div>
                  <div className="resource-card-actions">
                    <button
                      type="button"
                      className={isBookmarked ? "bookmarked" : ""}
                      onClick={() => toggleBookmark(resource.id)}
                      aria-pressed={isBookmarked}
                      aria-label={isBookmarked ? `Remove bookmark for ${title}` : `Save ${title}`}
                    >
                      <FiBookmark />
                    </button>
                    <Link to={href} aria-label={`Open ${title}`} title="Open PDF resource"><FiDownload /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="subject-resource-empty" role="status">
          <FiSearch />
          <h3>No resources match these filters</h3>
          <p>Try a different keyword, unit, year or file type.</p>
          <button type="button" onClick={clearFilters}>Clear search and filters</button>
        </div>
      )}

      {filteredResources.length > 0 && (
        <div className="resource-pagination" aria-label="Resource pagination">
          <span>Showing {start}–{end} of {filteredResources.length} resources</span>
          <div>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} aria-label="Previous page"><FiChevronLeft /></button>
            {pageNumbers[0] > 1 && <span className="resource-pagination-ellipsis">…</span>}
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={pageNumber === page ? "active" : ""}
                aria-current={pageNumber === page ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="resource-pagination-ellipsis">…</span>}
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} aria-label="Next page"><FiChevronRight /></button>
          </div>
        </div>
      )}
    </section>
  );
}
