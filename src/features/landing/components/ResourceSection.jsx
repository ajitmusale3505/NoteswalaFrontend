import { FiDownload, FiFileText, FiSearch, FiSliders } from "react-icons/fi";
import { resourceRows } from "../landingData";

export default function ResourceSection() {
  return (
    <section className="feature-section" id="resources">
      <div className="shell feature-grid">
        <div className="feature-copy reveal">
          <span className="section-number">01</span><p className="section-tag">Academic resources</p>
          <h2>Find the material<br />you need.</h2>
          <p>Previous year papers, notes, books, practicals, important questions and more — organized by university, branch, semester and subject.</p>
          <a className="button button-dark" href="#cta">Explore Resources <span>→</span></a>
        </div>
        <div className="resource-panel reveal reveal-delay">
          <div className="resource-search"><FiSearch /><span>Search for PYQs, notes, books, practicals...</span></div>
          <div className="filter-row">{["SPPU","Computer Engineering","Semester VI","Resource Type"].map((x)=><button key={x}>{x}<FiSliders /></button>)}</div>
          <div className="resource-list">{resourceRows.map((row)=><div className="resource-row" key={row.title}><span className="resource-file"><FiFileText /></span><div><b>{row.title}</b><small>{row.meta}</small></div><span className={`resource-tag tag-${row.tag.toLowerCase()}`}>{row.tag}</span><span className="resource-size">{row.size}</span><FiDownload className="row-download" /></div>)}</div>
        </div>
      </div>
    </section>
  );
}