import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBookOpen, FiBell, FiCalendar, FiCheckCircle, FiChevronDown, FiDownload,
  FiFileText, FiGrid, FiHome, FiInfo, FiLogOut, FiMenu, FiSearch, FiSettings,
  FiUser, FiUsers, FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCurrentUser, getUserAcademicProfile } from "../../services/profileService";
import { getUniversities } from "../../services/academicService";
import { downloadResource } from "../../services/resourceService";
import { logout } from "../../services/authService";
import { getUniversityDocuments, getUniversityNotifications, markUniversityNotificationRead } from "./universityService";
import {
  asItems, formatBytes, formatDate, getNoticeCategory, initials, matchesSearch, safeReadLocalStorage,
  safeWriteLocalStorage, sameId, unwrapResponse,
} from "./universityUtils";
import { UniversityHero, UniversityTabs } from "./components/UniversityHeroTabs";
import UniversityOverviewTab from "./components/UniversityOverviewTab";
import UniversityAnnouncementsTab from "./components/UniversityAnnouncementsTab";
import UniversityExaminationsTab from "./components/UniversityExaminationsTab";
import UniversityResultsTab from "./components/UniversityResultsTab";
import UniversityCalendarTab from "./components/UniversityCalendarTab";
import UniversityDocumentsTab from "./components/UniversityDocumentsTab";
import {
  UniversityEmptyState, UniversityPanel, UniversitySectionTitle,
} from "./components/UniversityUI";
import "./university.css";

const UNIVERSITY_TABS = new Set(["overview", "announcements", "examinations", "results", "calendar", "documents"]);
const UNIVERSITY_NOTICE_TYPE = "UNIVERSITY_UPDATE";

function normalizeNotice(notice) {
  return {
    ...notice,
    id: notice?.id ?? notice?.notificationId ?? notice?.referenceId ?? `${notice?.title || "notice"}-${notice?.createdAt || ""}`,
    title: notice?.title || notice?.subject || "University update",
    message: notice?.message || notice?.description || "",
    read: Boolean(notice?.read),
  };
}

function isUniversityNotice(notice) {
  const type = String(notice?.type || "").toUpperCase();
  const referenceType = String(notice?.referenceType || "").toUpperCase();
  return type === UNIVERSITY_NOTICE_TYPE || referenceType === "UNIVERSITY";
}

function isRelevantDocument(resource, academic) {
  const resourceUniversity = resource?.universityId ?? resource?.university?.id ?? null;
  if (resourceUniversity != null && academic?.universityId != null) {
    return sameId(resourceUniversity, academic.universityId);
  }
  const resourceBranch = resource?.branchId ?? resource?.branch?.id ?? null;
  if (resourceBranch != null && academic?.branchId != null) {
    return sameId(resourceBranch, academic.branchId);
  }
  // Global published resources remain discoverable; explicit records belonging to
  // another university are excluded above.
  return true;
}

function getFileName(resource) {
  const title = String(resource?.title || resource?.fileName || "university-document")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150) || "university-document";
  return /\.[a-z0-9]{2,8}$/i.test(title) ? title : `${title}.pdf`;
}

function UniversitySideNav({ collapsed, setCollapsed, activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const items = [
    ["Home", FiHome, "/home"],
    ["Resource", FiFileText, "/resources"],
    ["Practical", FiBookOpen, "/resources"],
    ["Library", FiBookOpen, "/resources"],
    ["Chat", FiUsers, "/community"],
    ["University", FiGrid, "/university"],
    ["About", FiInfo, "/home"],
    ["Settings", FiSettings, "/profile"],
  ];

  return (
    <aside className={`univ-side-nav ${collapsed ? "is-collapsed" : ""}`} aria-label="Main navigation">
      <button type="button" className="univ-sidebar-toggle" onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"}>
        <FiMenu />
      </button>
      <nav>
        {items.map(([label, Icon, href]) => {
          const active = label === "University";
          return (
            <Link key={label} to={href} className={active ? "is-active" : ""} title={collapsed ? label : undefined}
              onClick={(event) => {
                if (label === "University") {
                  event.preventDefault();
                  setActiveTab("overview");
                }
              }}>
              <Icon /><span>{label}</span>{active && !collapsed && <i />}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="univ-sidebar-promo">
          <span><FiBell /></span>
          <strong>Stay informed</strong>
          <p>Check verified university updates and published resources in one place.</p>
          <button type="button" onClick={() => setActiveTab("announcements")}>View updates <span>→</span></button>
        </div>
      )}
    </aside>
  );
}

function UniversityTopBar({ user, academic, query, setQuery, unreadCount, onNotifications, onProfile, onToggleSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem("noteswala_refresh_token");
      if (refreshToken) await logout({ refreshToken });
    } catch {
      // Clear a local session even if the refresh token has expired.
    } finally {
      localStorage.removeItem("noteswala_access_token");
      localStorage.removeItem("noteswala_refresh_token");
      localStorage.removeItem("noteswala_user");
      localStorage.removeItem("noteswala_personal_profile");
      sessionStorage.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="univ-topbar">
      <div className="univ-brand-cluster">
        <button type="button" className="univ-topbar-menu" onClick={onToggleSidebar} title="Toggle navigation" aria-label="Toggle navigation"><FiMenu /></button>
        <Link to="/home" className="univ-brand" aria-label="NotesWala home">
          <span className="univ-brand-mark"><FiBookOpen /></span><span>NotesWala</span>
        </Link>
      </div>
      <label className="univ-global-search">
        <FiSearch /><input className="univ-global-search-input" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Search announcements, exams, documents..." aria-label="Search university information" />
        {query && <button type="button" aria-label="Clear university search" title="Clear search" onClick={() => setQuery("")}><FiX /></button>}
        <kbd>Ctrl</kbd><kbd>K</kbd>
      </label>
      <div className="univ-topbar-actions">
        <button className="univ-topbar-icon-button" type="button" aria-label="Open university announcements"
          title="Notifications and university updates" onClick={onNotifications}><FiBell />{unreadCount > 0 && <i>{unreadCount > 99 ? "99+" : unreadCount}</i>}</button>
        <div className={`univ-profile-menu ${profileOpen ? "is-open" : ""}`}>
          <button className="univ-profile-button" type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} aria-label="Open account menu">
            <span className="univ-user-avatar">{initials(user?.fullName)}</span>
            <span><strong>{user?.fullName || "Student"}</strong><small>{academic?.branchName || "Student account"}</small></span>
            <FiChevronDown />
          </button>
          {profileOpen && <div className="univ-profile-dropdown" role="menu">
            <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); onProfile(); }}><FiUser /> My Profile</button>
            <button type="button" role="menuitem" disabled={loggingOut} onClick={handleLogout}><FiLogOut /> {loggingOut ? "Signing out…" : "Log out"}</button>
          </div>}
        </div>
      </div>
    </header>
  );
}

function NoticeModal({ notice, saved, onClose, onMarkRead, onToggleSaved }) {
  if (!notice) return null;
  const category = getNoticeCategory(notice);
  return (
    <div className="univ-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="univ-detail-modal" role="dialog" aria-modal="true" aria-labelledby="univ-notice-modal-title">
        <header><span className="univ-modal-symbol"><FiBell /></span><div><small>{category} · Published update</small><h2 id="univ-notice-modal-title">{notice.title}</h2></div>
          <button type="button" className="univ-close-button" aria-label="Close notice" onClick={onClose}><FiX /></button></header>
        <div className="univ-modal-body"><p className="univ-modal-meta"><FiCalendar /> {formatDate(notice.createdAt, { dateStyle: "full", timeStyle: "short" })}</p>
          <p className="univ-notice-full-message">{notice.message || "No additional description was provided with this notification."}</p>
          {notice.referenceType && <div className="univ-modal-reference"><strong>Reference type</strong><span>{notice.referenceType}</span></div>}
        </div>
        <footer>
          <button type="button" className="univ-secondary-button" onClick={() => onToggleSaved(notice)}>{saved ? "Remove saved" : "Save update"}</button>
          {notice.read === false && <button type="button" className="univ-primary-button" onClick={() => onMarkRead(notice)}><FiCheckCircle /> Mark read</button>}
          <button type="button" className="univ-primary-button" onClick={onClose}>Done</button>
        </footer>
      </section>
    </div>
  );
}

function DocumentModal({ resource, onClose, onDownload, downloadingId }) {
  if (!resource) return null;
  const id = String(resource.id ?? resource.resourceId ?? "");
  return (
    <div className="univ-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="univ-detail-modal" role="dialog" aria-modal="true" aria-labelledby="univ-document-modal-title">
        <header><span className="univ-modal-symbol tone-blue"><FiFileText /></span><div><small>Published resource</small><h2 id="univ-document-modal-title">{resource.title || "University document"}</h2></div>
          <button type="button" className="univ-close-button" aria-label="Close document details" onClick={onClose}><FiX /></button></header>
        <div className="univ-modal-body">
          <p className="univ-notice-full-message">{resource.description || "This published resource is available through the NotesWala resource catalogue."}</p>
          <dl className="univ-document-meta">
            <div><dt>Category</dt><dd>{resource.categoryName || resource.materialType || "Published resource"}</dd></div>
            <div><dt>Subject</dt><dd>{resource.subjectName || "Not specified"}</dd></div>
            <div><dt>Size</dt><dd>{formatBytes(resource.fileSizeBytes)}</dd></div>
            <div><dt>Published</dt><dd>{formatDate(resource.publishedAt || resource.createdAt || resource.updatedAt)}</dd></div>
            <div><dt>Access</dt><dd>{resource.accessType || (resource.free ? "FREE" : "Restricted by server policy")}</dd></div>
          </dl>
        </div>
        <footer><button type="button" className="univ-secondary-button" onClick={onClose}>Close</button>
          <button type="button" className="univ-primary-button" onClick={() => onDownload(resource)} disabled={!id || downloadingId === id}>
            {downloadingId === id ? <span className="univ-mini-spinner" /> : <FiDownload />} {downloadingId === id ? "Preparing…" : "Download document"}
          </button></footer>
      </section>
    </div>
  );
}

export default function UniversityPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [university, setUniversity] = useState(null);
  const [notices, setNotices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadWarnings, setLoadWarnings] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches);
  const [savedIds, setSavedIds] = useState(() => safeReadLocalStorage("noteswala_saved_university_notices", []));
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [savedDocumentsOnly, setSavedDocumentsOnly] = useState(false);

  const savedNoticeIds = useMemo(() => (Array.isArray(savedIds) ? savedIds.map(String) : []), [savedIds]);
  const unreadCount = useMemo(() => notices.filter((notice) => notice.read === false).length, [notices]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [userResult, universityResult, noticeResult, documentResult] = await Promise.allSettled([
        getCurrentUser(),
        getUniversities(),
        getUniversityNotifications(0, 50),
        getUniversityDocuments(0, 50),
      ]);
      if (!active) return;
      const currentUser = userResult.status === "fulfilled" ? unwrapResponse(userResult.value) : null;
      setUser(currentUser && !Array.isArray(currentUser) ? currentUser : null);
      const profileId = currentUser?.userId ?? currentUser?.id;
      let academicProfile = null;
      if (profileId != null) {
        try {
          academicProfile = unwrapResponse(await getUserAcademicProfile(profileId));
        } catch {
          academicProfile = null;
        }
      }
      if (!active) return;
      setAcademic(academicProfile && !Array.isArray(academicProfile) ? academicProfile : null);
      const universityItems = universityResult.status === "fulfilled" ? asItems(universityResult.value) : [];
      const selectedUniversity = universityItems.find((item) => sameId(item.id, academicProfile?.universityId))
        || universityItems.find((item) => academicProfile?.universityName && String(item.name).toLowerCase() === String(academicProfile.universityName).toLowerCase())
        || null;
      setUniversity(selectedUniversity);

      const rawNotices = noticeResult.status === "fulfilled" ? asItems(noticeResult.value) : [];
      const universityNotices = rawNotices.filter(isUniversityNotice).map(normalizeNotice)
        .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
      setNotices(universityNotices);

      const rawDocuments = documentResult.status === "fulfilled" ? asItems(documentResult.value) : [];
      setDocuments(rawDocuments.filter((resource) => isRelevantDocument(resource, academicProfile)));

      const warnings = [];
      if (userResult.status === "rejected") warnings.push("Your account details could not be refreshed.");
      if (noticeResult.status === "rejected") warnings.push("University notifications could not be loaded.");
      if (documentResult.status === "rejected") warnings.push("Published resources could not be loaded.");
      if (universityResult.status === "rejected") warnings.push("University directory data could not be loaded.");
      setLoadWarnings(warnings);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".univ-global-search-input")?.focus();
      }
      if (event.key === "Escape") {
        setSelectedNotice(null);
        setSelectedDocument(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleTabChange = useCallback((tab) => {
    if (UNIVERSITY_TABS.has(tab)) {
      setActiveTab(tab);
      if (tab === "calendar") {
        setSelectedDate((date) => date || new Date());
      }
    }
  }, []);

  const handleMarkRead = useCallback(async (notice) => {
    if (!notice || notice.read || notice.id == null) return;
    const id = notice.id;
    try {
      await markUniversityNotificationRead(id);
      setNotices((current) => current.map((item) => String(item.id) === String(id) ? { ...item, read: true } : item));
      setSelectedNotice((current) => current && String(current.id) === String(id) ? { ...current, read: true } : current);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not mark this update as read.");
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const unreadNotices = notices.filter((notice) => notice.read === false && notice.id != null);
    if (!unreadNotices.length) return;

    const results = await Promise.allSettled(
      unreadNotices.map((notice) => markUniversityNotificationRead(notice.id))
    );
    const successfulIds = new Set(unreadNotices
      .filter((notice, index) => results[index].status === "fulfilled")
      .map((notice) => String(notice.id)));

    if (successfulIds.size) {
      setNotices((current) => current.map((notice) =>
        successfulIds.has(String(notice.id)) ? { ...notice, read: true } : notice));
      toast.success(`${successfulIds.size} university update${successfulIds.size === 1 ? "" : "s"} marked as read.`);
    }
    if (successfulIds.size !== unreadNotices.length) {
      toast.error("Some updates could not be marked as read. You can retry them individually.");
    }
  }, [notices]);

  const handleToggleSaved = useCallback((notice) => {
    if (!notice?.id) return;
    const id = String(notice.id);
    setSavedIds((current) => {
      const base = Array.isArray(current) ? current.map(String) : [];
      const next = base.includes(id) ? base.filter((value) => value !== id) : [...base, id];
      safeWriteLocalStorage("noteswala_saved_university_notices", next);
      return next;
    });
  }, []);

  const handleDownload = useCallback(async (resource) => {
    const rawId = resource?.id ?? resource?.resourceId;
    if (rawId == null || downloadingId != null) return;
    const id = String(rawId);
    setDownloadingId(id);
    try {
      const response = await downloadResource(rawId);
      const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
      if (!blob.size) throw new Error("The server returned an empty file.");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getFileName(resource);
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success("Download started.");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Download is not available for this resource.");
    } finally {
      setDownloadingId(null);
    }
  }, [downloadingId]);

  const filteredNotices = useMemo(() => notices.filter((notice) =>
    matchesSearch([notice.title, notice.message, notice.type, notice.referenceType], query)), [notices, query]);
  const filteredDocuments = useMemo(() => documents.filter((resource) =>
    matchesSearch([resource.title, resource.description, resource.subjectName, resource.categoryName, resource.materialType], query)), [documents, query]);

  const onQuickSearch = (phrase) => setQuery(phrase);
  const selectedSaved = selectedNotice && savedNoticeIds.includes(String(selectedNotice.id));

  return (
    <div className={`univ-app ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <UniversityTopBar user={user} academic={academic} query={query} setQuery={setQuery}
        unreadCount={unreadCount} onNotifications={() => handleTabChange("announcements")} onProfile={() => navigate("/profile")}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
      <div className="univ-body">
        <UniversitySideNav collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
          activeTab={activeTab} setActiveTab={handleTabChange} />
        <main className="univ-page-content">
          <div className="univ-breadcrumb"><Link to="/home"><FiHome /> Home</Link><span>›</span><strong>University</strong>{activeTab !== "overview" && <><span>›</span><strong>{activeTab === "calendar" ? "Academic Calendar" : activeTab[0].toUpperCase() + activeTab.slice(1)}</strong></>}</div>
          <UniversityHero university={university} academic={academic} user={user} />
          <UniversityTabs activeTab={activeTab} onChange={handleTabChange} unreadCount={unreadCount} />

          {loadWarnings.length > 0 && <div className="univ-load-warning"><FiInfo /><span>{loadWarnings.join(" ")}</span><button type="button" onClick={() => window.location.reload()}>Retry</button></div>}
          {loading ? <div className="univ-loading-state"><span className="univ-spinner" /><p>Loading your university workspace…</p></div> : (
            <>
              {activeTab === "overview" && <UniversityOverviewTab academic={academic} university={university}
                notices={filteredNotices} documents={filteredDocuments} query={query} onTabChange={handleTabChange}
                onOpenNotice={(notice) => { setSelectedNotice(notice); if (!notice.read) handleMarkRead(notice); }}
                onMarkRead={handleMarkRead} onToggleSaved={handleToggleSaved} savedIds={savedNoticeIds}
                onOpenDocument={setSelectedDocument} onDownload={handleDownload} downloadingId={downloadingId} />}
              {activeTab === "announcements" && <UniversityAnnouncementsTab notices={filteredNotices} query={query}
                onOpenNotice={(notice) => { setSelectedNotice(notice); if (!notice.read) handleMarkRead(notice); }}
                onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} savedIds={savedNoticeIds} onToggleSaved={handleToggleSaved} />}
              {activeTab === "examinations" && <UniversityExaminationsTab notices={filteredNotices} documents={filteredDocuments} query={query}
                onTabChange={handleTabChange} onQuickSearch={onQuickSearch}
                onOpenNotice={(notice) => { setSelectedNotice(notice); if (!notice.read) handleMarkRead(notice); }}
                onMarkRead={handleMarkRead} savedIds={savedNoticeIds} onToggleSaved={handleToggleSaved}
                onOpenDocument={setSelectedDocument} onDownload={handleDownload} downloadingId={downloadingId} />}
              {activeTab === "results" && <UniversityResultsTab notices={filteredNotices} documents={filteredDocuments} query={query}
                onTabChange={handleTabChange} onOpenNotice={(notice) => { setSelectedNotice(notice); if (!notice.read) handleMarkRead(notice); }}
                onMarkRead={handleMarkRead} savedIds={savedNoticeIds} onToggleSaved={handleToggleSaved}
                onOpenDocument={setSelectedDocument} onDownload={handleDownload} downloadingId={downloadingId} />}
              {activeTab === "calendar" && <UniversityCalendarTab notices={filteredNotices} selectedDate={selectedDate}
                onSelectDate={setSelectedDate} monthDate={monthDate} onChangeMonth={setMonthDate} />}
              {activeTab === "documents" && <UniversityDocumentsTab documents={filteredDocuments} query={query}
                onOpenDocument={setSelectedDocument} onDownload={handleDownload} downloadingId={downloadingId} />}
            </>
          )}
          <footer className="univ-page-footer"><span>© {new Date().getFullYear()} NotesWala</span><span>University information workspace <i /> Data from your account and published resources</span></footer>
        </main>
      </div>

      <NoticeModal notice={selectedNotice} saved={Boolean(selectedSaved)} onClose={() => setSelectedNotice(null)}
        onMarkRead={handleMarkRead} onToggleSaved={handleToggleSaved} />
      <DocumentModal resource={selectedDocument} onClose={() => setSelectedDocument(null)} onDownload={handleDownload} downloadingId={downloadingId} />
    </div>
  );
}
