import {
  FiActivity, FiBell, FiBookOpen, FiCalendar, FiCheckCircle,
  FiFileText, FiGrid, FiAward, FiMapPin, FiShield,
} from "react-icons/fi";

const tabs = [
  { id: "overview", label: "Overview", icon: FiGrid },
  { id: "announcements", label: "Announcements", icon: FiBell },
  { id: "examinations", label: "Examinations", icon: FiBookOpen },
  { id: "results", label: "Results", icon: FiAward },
  { id: "calendar", label: "Academic Calendar", icon: FiCalendar },
  { id: "documents", label: "Documents", icon: FiFileText },
];

export function UniversityHero({ university, academic, user }) {
  const title = university?.name || academic?.universityName || "Your University";
  const shortCode = university?.shortCode || academic?.universityShortCode || "University";
  const city = [university?.city || academic?.universityCity, university?.state || academic?.universityState]
    .filter(Boolean).join(", ") || "Location not provided";
  const verified = Boolean(university?.id || academic?.universityId);

  return (
    <section className="univ-hero">
      <div className="univ-hero-art" aria-hidden="true" />
      <div className="univ-hero-identity">
        <span className="univ-crest"><FiShield /></span>
        <div className="univ-hero-copy">
          <div className="univ-hero-title-row">
            <h1>{title}</h1>
            {verified && <span className="univ-verified"><FiCheckCircle /> Profile linked</span>}
          </div>
          <p>Official information and learning resources for {title} students</p>
          <div className="univ-hero-meta">
            <span><FiBookOpen /> {shortCode}</span>
            <span><FiMapPin /> {city}</span>
            {academic?.branchName && <span><FiActivity /> {academic.branchName}</span>}
            {academic?.currentSemesterName && <span><FiCalendar /> {academic.currentSemesterName}</span>}
          </div>
        </div>
      </div>
      <div className="univ-hero-profile">
        <span>{String(user?.fullName || "Student").trim().charAt(0).toUpperCase() || "S"}</span>
        <div><strong>{academic?.branchName || "Student workspace"}</strong><small>{academic?.academicYearName || academic?.examPatternName || "Academic information"}</small></div>
      </div>
    </section>
  );
}

export function UniversityTabs({ activeTab, onChange, unreadCount = 0 }) {
  return (
    <nav className="univ-tabs" aria-label="University sections">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={activeTab === id ? "is-active" : ""}
          aria-current={activeTab === id ? "page" : undefined} onClick={() => onChange(id)}>
          <Icon /><span>{label}</span>
          {id === "announcements" && unreadCount > 0 && <i>{unreadCount > 99 ? "99+" : unreadCount}</i>}
        </button>
      ))}
    </nav>
  );
}
