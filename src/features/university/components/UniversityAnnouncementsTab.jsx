import { useMemo, useState } from "react";
import { FiBell, FiBookmark, FiCheckCircle, FiFilter, FiSearch } from "react-icons/fi";
import { UniversityEmptyState, UniversityNoticeRow, UniversityPanel, UniversitySectionTitle } from "./UniversityUI";
import { getNoticeCategory, matchesSearch } from "../universityUtils";

const categories = ["All", "Examination", "Deadline", "Results", "Holiday", "Admissions", "Academic"];

export default function UniversityAnnouncementsTab({ notices, query, onOpenNotice, onMarkRead, onMarkAllRead, savedIds, onToggleSaved }) {
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("newest");
  const [localQuery, setLocalQuery] = useState("");
  const list = useMemo(() => notices
    .filter((notice) => category === "All" || getNoticeCategory(notice) === category)
    .filter((notice) => view !== "saved" || savedIds.includes(String(notice.id)))
    .filter((notice) => view !== "unread" || notice.read === false)
    .filter((notice) => matchesSearch([notice.title, notice.message, notice.type, notice.referenceType], query))
    .filter((notice) => matchesSearch([notice.title, notice.message, notice.type, notice.referenceType], localQuery))
    .slice()
    .sort((left, right) => {
      const dateDelta = new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
      return sort === "oldest" ? -dateDelta : dateDelta;
    }), [notices, category, view, savedIds, query, localQuery, sort]);
  const unreadCount = notices.filter((notice) => notice.read === false).length;

  return (
    <div className="univ-announcements-grid">
      <section className="univ-main-stack">
        <UniversityPanel>
          <div className="univ-announcements-head">
            <UniversitySectionTitle icon={FiBell} title="Announcements" subtitle="University notices and updates delivered to your account" />
            <button type="button" className="univ-primary-button" onClick={onMarkAllRead} disabled={!unreadCount}><FiCheckCircle /> Mark all read</button>
          </div>
          <div className="univ-filter-bar">
            <label className="univ-local-search"><FiSearch /><span className="sr-only">Search announcements</span>
              <input value={localQuery} onChange={(event) => setLocalQuery(event.target.value)} placeholder="Search by title or keywords…" aria-label="Search announcements" />
              {localQuery && <button type="button" aria-label="Clear announcement search" onClick={() => setLocalQuery("")}>×</button>}
            </label>
            <label className="univ-filter-select"><FiFilter /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter announcement category">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="univ-filter-select"><FiBookmark /><select value={view} onChange={(event) => setView(event.target.value)} aria-label="Filter announcement view"><option value="all">All updates</option><option value="unread">Unread</option><option value="saved">Saved</option></select></label>
            <label className="univ-filter-select"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort announcements"><option value="newest">Latest first</option><option value="oldest">Oldest first</option></select></label>
          </div>
          <div className="univ-category-chips">
            {categories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}{item === "All" && <span>{notices.length}</span>}</button>)}
          </div>
          {list.length ? <div className="univ-notice-list">
            {list.map((notice) => <UniversityNoticeRow key={notice.id} notice={notice} onOpen={onOpenNotice} onMarkRead={onMarkRead} saved={savedIds.includes(String(notice.id))} onToggleSaved={onToggleSaved} />)}
          </div> : <UniversityEmptyState icon={FiBell} title="No announcements match these filters" message={view === "saved" ? "Save an update to keep it in your personal list." : view === "unread" ? "You are all caught up." : "Try another category or a shorter search phrase."} compact />}
          <div className="univ-list-footer">{list.length.toLocaleString("en-IN")} update{list.length === 1 ? "" : "s"} shown · Source: account notifications</div>
        </UniversityPanel>
      </section>
      <aside className="univ-right-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiBookmark} title="Saved Updates" subtitle="Your saved notices" />
          {notices.filter((notice) => savedIds.includes(String(notice.id))).slice(0, 6).map((notice) =>
            <button className="univ-saved-row" key={notice.id} type="button" onClick={() => onOpenNotice(notice)}><strong>{notice.title}</strong><span>Open saved update →</span></button>)}
          {!savedIds.length && <UniversityEmptyState icon={FiBookmark} title="Nothing saved yet" message="Use Save on a notice to keep it here." compact />}
        </UniversityPanel>
        <UniversityPanel>
          <UniversitySectionTitle icon={FiCheckCircle} title="Reading progress" />
          <div className="univ-read-progress"><span style={{ width: notices.length ? `${Math.round(((notices.length - unreadCount) / notices.length) * 100)}%` : "0%" }} /></div>
          <div className="univ-read-progress-label"><strong>{notices.length ? Math.round(((notices.length - unreadCount) / notices.length) * 100) : 0}%</strong><span>updates read</span></div>
          <p className="univ-small-note">{unreadCount} unread of {notices.length} loaded updates.</p>
        </UniversityPanel>
      </aside>
    </div>
  );
}
