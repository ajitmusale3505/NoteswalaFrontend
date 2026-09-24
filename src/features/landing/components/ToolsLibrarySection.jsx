import { FiArrowRight, FiBookOpen } from "react-icons/fi";
import { libraryBooks, toolItems } from "../landingData";

export default function ToolsLibrarySection() {
  return (
    <section className="tools-library-section" id="tools">
      <div className="shell tools-library-grid">
        <div className="tools-block reveal">
          <div className="feature-copy compact"><span className="section-number">05</span><p className="section-tag">Student tools</p><h2>Work smarter.</h2><p>Useful tools for everyday engineering life.</p><a className="button button-outline" href="#cta">Explore Tools <FiArrowRight /></a></div>
          <div className="tool-grid">{toolItems.map(({icon:Icon,title})=><div className="tool-item" key={title}><Icon /><span>{title}</span></div>)}</div>
        </div>
        <div className="library-block reveal reveal-delay" id="library">
          <div className="feature-copy compact"><span className="section-number">06</span><p className="section-tag">Digital library</p><h2>Read. Explore. Learn<br />beyond the syllabus.</h2><p>Access a wide collection of textbooks, reference books and free learning resources.</p><a className="button button-outline" href="#cta">Explore Library <FiArrowRight /></a></div>
          <div className="books-visual">{libraryBooks.map((book)=><div className={`book book-${book.tone}`} key={book.title}><FiBookOpen /><span>{book.short}</span><small>{book.title}</small></div>)}</div>
        </div>
      </div>
    </section>
  );
}