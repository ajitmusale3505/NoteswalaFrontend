import { useMemo } from "react";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiClock, FiInfo } from "react-icons/fi";
import { UniversityEmptyState, UniversityPanel, UniversitySectionTitle } from "./UniversityUI";
import { formatDate } from "../universityUtils";

function makeCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const relative = index - startOffset + 1;
    if (relative < 1) return { date: new Date(year, month - 1, previousMonthDays + relative), inMonth: false };
    if (relative > lastDay) return { date: new Date(year, month + 1, relative - lastDay), inMonth: false };
    return { date: new Date(year, month, relative), inMonth: true };
  });
}

function keyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function UniversityCalendarTab({ notices, selectedDate, onSelectDate, monthDate, onChangeMonth }) {
  const days = useMemo(() => makeCalendarDays(monthDate.getFullYear(), monthDate.getMonth()), [monthDate]);
  const dateKey = keyOf(selectedDate);
  const noticeDates = useMemo(() => {
    const counts = new Map();
    notices.forEach((notice) => {
      const value = notice.createdAt;
      if (!value) return;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return;
      const key = keyOf(date);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [notices]);
  const selectedNotices = notices.filter((notice) => notice.createdAt && keyOf(new Date(notice.createdAt)) === dateKey);
  const monthTitle = monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const todayKey = keyOf(new Date());

  return (
    <div className="univ-calendar-grid">
      <UniversityPanel className="univ-calendar-panel">
        <div className="univ-calendar-heading">
          <UniversitySectionTitle icon={FiCalendar} title="Academic Calendar" subtitle="Navigate dates and review when notices were published" />
          <div className="univ-calendar-actions">
            <button type="button" className="univ-secondary-button" onClick={() => { const now = new Date(); onChangeMonth(new Date(now.getFullYear(), now.getMonth(), 1)); onSelectDate(now); }}>Today</button>
            <button type="button" className="univ-calendar-arrow" title="Previous month" aria-label="Previous month" onClick={() => onChangeMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}><FiArrowLeft /></button>
            <button type="button" className="univ-calendar-arrow" title="Next month" aria-label="Next month" onClick={() => onChangeMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}><FiArrowRight /></button>
          </div>
        </div>
        <div className="univ-month-heading"><strong>{monthTitle}</strong><span>Notice publication dates</span></div>
        <div className="univ-calendar-grid-days">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          {days.map(({ date, inMonth }) => {
            const key = keyOf(date);
            const count = noticeDates.get(key) || 0;
            return <button type="button" key={key} className={`univ-calendar-day ${inMonth ? "" : "is-outside"} ${key === dateKey ? "is-selected" : ""} ${key === todayKey ? "is-today" : ""} ${count ? "has-notices" : ""}`}
              onClick={() => { onSelectDate(date); if (date.getMonth() !== monthDate.getMonth() || date.getFullYear() !== monthDate.getFullYear()) onChangeMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
              aria-pressed={key === dateKey} aria-label={`${formatDate(date)}; ${count} notices published`}>
              <span>{date.getDate()}</span>{count > 0 && <i aria-label={`${count} notices`} />}
            </button>;
          })}
        </div>
        <div className="univ-calendar-legend"><span><i className="legend-notice" /> Notice published</span><span><i className="legend-selected" /> Selected date</span></div>
      </UniversityPanel>
      <div className="univ-main-stack">
        <UniversityPanel>
          <UniversitySectionTitle icon={FiClock} title={`Updates published on ${formatDate(selectedDate)}`} subtitle="Publication timestamps are shown here; they are not exam or event dates." />
          {selectedNotices.length ? <div className="univ-calendar-notice-list">{selectedNotices.map((notice) => <article key={notice.id} className="univ-calendar-notice">
            <span><FiCalendar /></span><div><strong>{notice.title || "University update"}</strong><small>Published {formatDate(notice.createdAt, { hour: "2-digit", minute: "2-digit" })}</small><p>{notice.message || "Open this notice in Announcements for details."}</p></div>
          </article>)}</div> : <UniversityEmptyState icon={FiCalendar} title="No notices were published on this date" message="Select another date with a marker. The connected backend does not yet provide official event dates for exams or holidays." compact />}
        </UniversityPanel>
        <UniversityPanel>
          <UniversitySectionTitle icon={FiInfo} title="Official calendar status" />
          <p className="univ-panel-copy">The current university APIs expose notifications and academic profile data but do not provide a structured events feed. This calendar therefore marks notice publication dates only; it does not invent examination, holiday, or submission dates.</p>
        </UniversityPanel>
      </div>
    </div>
  );
}
