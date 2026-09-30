import { useEffect, useState } from "react";
import {
  FiArrowRight, FiBookOpen, FiBox, FiCalendar, FiChevronDown, FiClock, FiCloud,
  FiCode, FiDatabase, FiDownload, FiFileText, FiGitBranch, FiGrid,
  FiMonitor, FiSearch, FiSettings, FiShield, FiStar, FiTarget,
  FiUploadCloud
} from "react-icons/fi";
import HomeNavbar from "../home/components/HomeNavbar";
import { Link } from "react-router-dom";
import { getCurrentAcademicSubjects } from "../../services/academicService";

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

function mapAcademicSubjects(response) {
  const data = response?.data?.data || response?.data || [];

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((subject, index) => {
    const presentation = subjectPresentation[index % subjectPresentation.length];

    return [
      subject.subjectCode || subject.code || "—",
      subject.subjectName || subject.name || "Subject",
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
      <div className="resource-subject-copy"><b>{code}</b><small>{name}</small></div>
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

  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      try {
        const response = await getCurrentAcademicSubjects();

        if (!cancelled) {
          setSubjects(mapAcademicSubjects(response));
        }
      } catch (error) {
        if (!cancelled) {
          setSubjects([]);
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
          <div className="resource-subject-grid">{subjects.map((item) => <SubjectCard item={item} key={item[0]} />)}</div>
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
