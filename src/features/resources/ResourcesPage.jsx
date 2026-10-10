import { useEffect, useState } from "react";
import {
  FiArrowRight, FiBookOpen, FiBox, FiCalendar, FiChevronDown, FiClock, FiCloud,
  FiCode, FiDatabase, FiDownload, FiFileText, FiGitBranch, FiGrid,
  FiMonitor, FiSearch, FiSettings, FiShield, FiStar, FiTarget,
  FiUploadCloud
} from "react-icons/fi";
import HomeNavbar from "../home/components/HomeNavbar";
import { Link } from "react-router-dom";
import { getCurrentAcademicSubjects, getCurrentSubjectSelections } from "../../services/academicService";

const subjectPresentation = [
  { Icon: FiDatabase, tone: "blue" },
  { Icon: FiMonitor, tone: "green" },
  { Icon: FiGitBranch, tone: "orange" },
  { Icon: FiCode, tone: "purple" },
  { Icon: FiBox, tone: "violet" },
  { Icon: FiShield, tone: "red" },
  { Icon: FiCloud, tone: "sky" },
  { Icon: FiTarget, tone: "green" },
];

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response ?? [];
}

function normalizeCategory(value) {
  return String(value ?? "").trim().toUpperCase().replace(/[\\s-]+/g, "_");
}

function collectSelectionEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const groups = [
    "subjects", "regular", "regularSubjects", "regularSubjectOfferings",
    "elective", "electiveSubjects", "electiveSubjectOfferings",
    "honor", "honour", "honorSubjects", "honourSubjects", "honorSubjectOfferings",
    "practical", "practicalSubjects", "practicalSubjectOfferings",
    "selections", "subjectSelections", "selectedSubjects", "items",
  ];
  const entries = [];
  groups.forEach((key) => {
    if (Array.isArray(payload[key])) {
      const category = normalizeCategory(key.replace(/Subjects?$|SubjectOfferings$/i, ""));
      payload[key].forEach((entry) => entries.push(
        entry && typeof entry === "object" && !entry.category && !entry.subjectCategory && !entry.selectionType
          ? { ...entry, __selectionCategory: category }
          : entry
      ));
    }
  });
  return entries;
}

function collectSelectedIds(payload) {
  const ids = new Set();
  if (!payload || typeof payload !== "object") return ids;
  const idKeys = [
    "subjectOfferingIds", "selectedSubjectOfferingIds", "selectedIds", "ids",
    "regularSubjectOfferingIds", "regularSubjectIds",
    "electiveSubjectOfferingIds", "electiveSubjectIds",
    "honorSubjectOfferingIds", "honourSubjectOfferingIds", "honorSubjectIds", "honourSubjectIds",
    "practicalSubjectOfferingIds", "practicalSubjectIds",
  ];
  idKeys.forEach((key) => {
    if (Array.isArray(payload[key])) payload[key].forEach((item) => {
      const id = getOfferingId(item);
      if (id) ids.add(id);
    });
  });
  return ids;
}

function getOfferingId(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  const id = value?.subjectOfferingId ?? value?.subject_offering_id ??
    value?.offeringId ?? value?.offering?.id ??
    value?.subjectOffering?.id ?? value?.subjectOffering?.subjectOfferingId ??
    value?.id;
  return id == null ? null : String(id);
}

function getSubjectDetails(entry) {
  if (!entry || typeof entry !== "object") return null;
  const subject = entry?.subjectOffering || entry?.subject || entry?.offering || entry;
  const details = subject?.subjectDetails || subject?.academicSubject || subject?.subject;
  const code = subject?.subjectCode || subject?.code || subject?.offering?.subjectCode ||
    details?.subjectCode || details?.code;
  const name = subject?.subjectName || subject?.name || subject?.offering?.subjectName ||
    details?.subjectName || details?.name;
  const category = normalizeCategory(
    entry?.__selectionCategory || entry?.subjectCategory || entry?.category ||
    entry?.subjectType || entry?.selectionType || subject?.subjectCategory ||
    subject?.category || subject?.subjectType || subject?.offeringType
  );
  return code && name
    ? { code: String(code), name: String(name), id: getOfferingId(entry) || getOfferingId(subject), category }
    : null;
}

function mapSelectedSubjects(selectionResponse, academicResponse) {
  const selectionPayload = unwrapResponse(selectionResponse);
  const catalogPayload = unwrapResponse(academicResponse);
  const selectionEntries = collectSelectionEntries(selectionPayload);
  const catalogEntries = Array.isArray(catalogPayload)
    ? catalogPayload
    : collectSelectionEntries(catalogPayload);

  const selectedIds = collectSelectedIds(selectionPayload);
  selectionEntries.forEach((entry) => {
    const id = getOfferingId(entry);
    if (id) selectedIds.add(id);
  });

  const selectedDetails = selectionEntries.map(getSubjectDetails).filter(Boolean);

  // Regular subjects are mandatory for the user's academic context and are often returned
  // by /academic-context/subjects rather than by the custom subject-selection endpoint.
  catalogEntries.forEach((entry) => {
    const details = getSubjectDetails(entry);
    if (!details) return;
    const id = details.id;
    const isRegular = details.category === "REGULAR" ||
      details.category === "REGULAR_SUBJECT" ||
      details.category === "REGULAR_SUBJECT_OFFERING";
    if (isRegular || (id && selectedIds.has(id))) {
      selectedDetails.push(details);
    }
  });

  const uniqueSubjects = new Map();
  selectedDetails.forEach((subject) => {
    const key = subject.id || subject.code;
    if (!uniqueSubjects.has(key)) uniqueSubjects.set(key, subject);
  });

  return Array.from(uniqueSubjects.values()).map((subject, index) => {
    const presentation = subjectPresentation[index % subjectPresentation.length];
    return [
      subject.code,
      subject.name,
      0,
      presentation.Icon,
      presentation.tone,
      [0, 0, 0],
    ];
  });
}

const viewed = [
  ["DBMS - Normalization Notes", "DBMS · Unit II · Notes", "68%", "blue"],
  ["OS - Process Synchronization", "Operating Systems · Unit III · Notes", "42%", "green"],
  ["CN - 2024 End Sem Paper", "Computer Networks · PYQ", "100%", "red"],
];

const recommended = [
  ["DBMS - 2024 PYQ", "Database Management Systems", "4.8", "2.4 MB", "PYQ"],
  ["OS - Handwritten Notes (Unit III)", "Operating Systems", "4.6", "4.1 MB", "Notes"],
  ["CN - Important Questions", "Computer Networks", "4.7", "1.8 MB", "Important"],
];

const recent = [
  ["WT - 2025 PYQ", "Web Technologies · PYQ", "2 hours ago", "4.2 MB"],
  ["STQA - Unit I Notes", "Software Testing & QA · Notes", "5 hours ago", "3.1 MB"],
  ["Cloud Computing - Practical Manual", "Cloud Computing · Manual", "8 hours ago", "5.6 MB"],
];

function SubjectCard({ item }) {
  const [code, name, count, Icon, tone, stats] = item;
  return (
    <Link className={`resource-subject resource-tone-${tone}`} to={`/resources/${code}`} aria-label={`Open ${code} resources`}>
      <div className="resource-subject-icon"><Icon /></div>
      <div className="resource-subject-copy"><b>{name}</b><small>{code}</small></div>
      <div className="resource-subject-count"><strong>{count}</strong><small>resources</small></div>
      <div className="resource-subject-meta">
        <span>PYQs&nbsp; {stats[0]}</span><span>Notes&nbsp; {stats[1]}</span><span>Practicals&nbsp; {stats[2]}</span><span>+3</span>
      </div>
      <span className="resource-subject-open" aria-hidden="true"><FiArrowRight /></span>
    </Link>
  );
}

function ResourceListCard({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`resource-panel ${className}`}>
      <header className="resource-panel-title">
        <h2><Icon /> {title}</h2>
        <a href="#resources">{action} <FiArrowRight /></a>
      </header>
      {children}
    </section>
  );
}

export default function ResourcesPage() {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      try {
        const [selectionResponse, academicResponse] = await Promise.all([
          getCurrentSubjectSelections(),
          getCurrentAcademicSubjects(),
        ]);

        if (!cancelled) {
          setSubjects(mapSelectedSubjects(selectionResponse, academicResponse));
          setSubjectsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSubjects([]);
          setSubjectsLoading(false);
        }
      }
    };

    loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="resources-page">
      <HomeNavbar />
      <main className="resources-main">
        <section className="resources-hero">
          <div className="resources-hero-copy">
            <p className="resources-kicker"><span /> Resource Hub</p>
            <h1>Your Academic Library</h1>
            <p>Explore study materials, previous year papers, notes, books and more organized by your subjects.</p>
            <div className="resource-filters">
              <button><FiGrid /> Savitribai Phule Pune University (SPPU) <FiChevronDown /></button>
              <button><FiFileText /> Computer Engineering <FiChevronDown /></button>
              <button><FiCalendar /> Semester VI <FiChevronDown /></button>
            </div>
          </div>
        </section>

        <section className="resource-search-row">
          <div className="resource-search"><FiSearch /><input placeholder="Search subjects, notes, pyqs, books or any topic..." /><button>Search</button></div>
          <div className="resource-actions"><button><FiUploadCloud /> Contribute Resource</button><button><FiFileText /> Request Resource</button></div>
        </section>

        <section className="resource-subject-section">
          <header className="resource-section-heading">
            <div><FiBookOpen /><h2>My Subjects</h2><span>Select a subject to explore study materials, PYQs, notes, practicals and more.</span></div>
            <button><FiSettings /> Manage Subjects</button>
          </header>
          <div className="resource-subject-grid">
            {subjectsLoading ? (
              <p role="status">Loading your current semester subjects…</p>
            ) : subjects.length ? (
              subjects.map((item) => <SubjectCard item={item} key={item[0]} />)
            ) : (
              <p role="status">No subjects are selected for your current semester yet. Update your Current Semester Subjects in your profile.</p>
            )}
          </div>
        </section>

        <section className="resource-content-grid">
          <ResourceListCard title="My Resources" icon={FiBookOpen} action="View All" className="resource-my">
            <div className="resource-tabs"><span className="active">Recently Viewed</span><span>Saved</span><span>Downloaded</span><span>In Progress</span><span>Uploaded</span></div>
            <div className="resource-viewed-list">{viewed.map(([title, meta, progress, tone]) => (
              <div className="resource-viewed-row" key={title}><span className={`resource-file-icon ${tone}`}><FiFileText /></span><div><b>{title}</b><small>{meta}</small></div><div className="resource-progress"><span style={{width:progress}} /></div><strong>{progress}</strong><FiArrowRight /></div>
            ))}</div>
          </ResourceListCard>

          <ResourceListCard title="Recommended for You" icon={FiStar} action="View All">
            <div className="resource-recommended-list">{recommended.map(([title, meta, rating, size, tag]) => (
              <div className="resource-recommended-row" key={title}><div className="resource-book-cover"><FiBookOpen /></div><div><b>{title}</b><small>{meta}</small><span><em>★ {rating}</em><i />{size}<i />PDF</span></div><label>{tag}</label><FiDownload /></div>
            ))}</div>
          </ResourceListCard>

          <ResourceListCard title="Recently Added" icon={FiClock} action="View All">
            <div className="resource-recent-list">{recent.map(([title, meta, time, size], index) => (
              <div className="resource-recent-row" key={title}><div className={`resource-book-cover recent-${index}`}><FiBookOpen /></div><div><b>{title}</b><small>{meta}</small><span>{time} <i /> {size} <i /> PDF</span></div><label>New</label><FiDownload /></div>
            ))}</div>
          </ResourceListCard>
        </section>
      </main>
    </div>
  );
}
