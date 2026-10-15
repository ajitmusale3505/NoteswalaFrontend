export function unwrapResponse(response) {
  let value = response;
  let guard = 0;
  while (value && typeof value === "object" && !Array.isArray(value)
    && Object.prototype.hasOwnProperty.call(value, "data") && guard < 4) {
    value = value.data;
    guard += 1;
  }
  return value;
}

export function asItems(value) {
  const payload = unwrapResponse(value);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export function sameId(left, right) {
  if (left == null || right == null) return false;
  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
}

export function initials(name) {
  const parts = String(name || "Student").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "S";
}

export function formatDate(value, options = {}) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  // Intl forbids dateStyle/timeStyle alongside individual date fields.
  const formatOptions = options.dateStyle || options.timeStyle
    ? options
    : { day: "2-digit", month: "short", year: "numeric", ...options };
  try {
    return new Intl.DateTimeFormat("en-IN", formatOptions).format(date);
  } catch {
    return date.toLocaleDateString("en-IN");
  }
}

export function formatShortDate(value) {
  if (!value) return { day: "—", month: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "" };
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
  };
}

export function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getNoticeCategory(notice) {
  const text = `${notice?.title || ""} ${notice?.message || ""}`.toLowerCase();
  if (/(result|grade|marksheet|marks declared)/.test(text)) return "Results";
  if (/(exam|examination|hall.?ticket|timetable|time table|backlog|revaluation)/.test(text)) return "Examination";
  if (/(holiday|vacation|closed|diwali|break)/.test(text)) return "Holiday";
  if (/(form|deadline|last date|submission|registration|fee)/.test(text)) return "Deadline";
  if (/(scholarship|admission|eligibility|enrolment)/.test(text)) return "Admissions";
  return "Academic";
}

export function getNoticeTone(category) {
  const key = String(category || "").toLowerCase();
  if (key === "examination" || key === "results") return "red";
  if (key === "deadline") return "green";
  if (key === "holiday") return "orange";
  if (key === "admissions") return "gold";
  return "blue";
}

export function matchesSearch(values, query) {
  const term = String(query || "").trim().toLocaleLowerCase();
  if (!term) return true;
  return values.some((value) => String(value ?? "").toLocaleLowerCase().includes(term));
}

export function safeReadLocalStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function safeWriteLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be disabled or at quota; UI functionality should continue.
  }
}
