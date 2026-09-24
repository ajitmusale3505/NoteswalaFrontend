import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { universityRows } from "../landingData";

export default function UniversitySection() {
  return (
    <section className="feature-section" id="university">
      <div className="shell feature-grid">
        <div className="feature-copy reveal">
          <span className="section-number">03</span><p className="section-tag">University updates</p>
          <h2>Official information,<br />without the noise.</h2>
          <p>Results, circulars, timetables, exam updates, holidays and important announcements — all in one place.</p>
          <a className="button button-outline" href="#cta">View University Updates <FiArrowRight /></a>
        </div>
        <div className="updates-panel reveal reveal-delay">
          <div className="panel-tabs"><b>All</b><span>Results</span><span>Circulars</span><span>Timetables</span><span>Events</span><span>Holidays</span><span className="view-all">View all →</span></div>
          {universityRows.map((row)=><div className="update-row" key={row.title}><div className="date-box"><b>{row.date}</b><span>{row.month}</span></div><div><b>{row.title}</b><small>{row.source}</small></div><span className="update-type">{row.type}</span></div>)}
        </div>
      </div>
    </section>
  );
}