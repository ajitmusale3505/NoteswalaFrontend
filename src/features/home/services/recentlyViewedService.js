const STORAGE_PREFIX = "noteswala:recently-viewed:v1:";
const HISTORY_EVENT = "noteswala:recently-viewed-updated";
const MAX_RECENT_RESOURCES = 12;

function getStorageKey(userId) {
  return userId ? `${STORAGE_PREFIX}${String(userId)}` : null;
}

function readHistory(userId) {
  if (typeof window === "undefined") return [];
  const key = getStorageKey(userId);
  if (!key) return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item) => item?.id != null) : [];
  } catch {
    return [];
  }
}

function writeHistory(userId, history) {
  if (typeof window === "undefined") return;
  const key = getStorageKey(userId);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(history.slice(0, MAX_RECENT_RESOURCES)));
    window.dispatchEvent(new CustomEvent(HISTORY_EVENT, { detail: { userId: String(userId) } }));
  } catch {
    // Storage may be disabled or full; never break PDF viewing for this.
  }
}

export function getRecentlyViewedResources(userId) {
  return readHistory(userId);
}

export function recordRecentlyViewedResource(userId, resource, subjectCode = "") {
  if (!userId || !resource?.id) return;
  const history = readHistory(userId);
  const existing = history.find((item) => String(item.id) === String(resource.id));
  const normalizedSubjectCode = subjectCode && subjectCode.toLowerCase() !== "view" ? subjectCode : "view";
  const nextResource = {
    id: resource.id,
    title: resource.title || "Study resource",
    slug: resource.slug || "",
    subjectCode: normalizedSubjectCode,
    subjectName: resource.subjectName || "",
    categoryName: resource.categoryName || "",
    documentType: resource.documentType || "PDF",
    materialType: resource.materialType || "",
    fileSizeBytes: Number(resource.fileSizeBytes) || 0,
    pageCount: Number(resource.pageCount) || 0,
    thumbnailUrl: resource.thumbnailUrl || "",
    coverImageUrl: resource.coverImageUrl || "",
    currentPage: Number(existing?.currentPage) || 1,
    progressPercent: Number(existing?.progressPercent) || 0,
    lastViewedAt: new Date().toISOString(),
  };
  const nextHistory = [nextResource, ...history.filter((item) => String(item.id) !== String(resource.id))];
  writeHistory(userId, nextHistory);
}

export function updateRecentlyViewedProgress(userId, resourceId, currentPage, pageCount) {
  if (!userId || !resourceId || !Number(pageCount)) return;
  const history = readHistory(userId);
  const index = history.findIndex((item) => String(item.id) === String(resourceId));
  if (index < 0) return;
  const nextHistory = [...history];
  const safePage = Math.min(Number(pageCount), Math.max(1, Number(currentPage) || 1));
  nextHistory[index] = {
    ...nextHistory[index],
    currentPage: safePage,
    pageCount: Number(pageCount),
    progressPercent: Math.min(100, Math.round((safePage / Number(pageCount)) * 100)),
  };
  writeHistory(userId, nextHistory);
}
