import { FiArrowRight } from "react-icons/fi";
import { careerCards } from "../landingData";

export default function CareerSection() {
  return (
    <section className="feature-section feature-alt" id="career">
      <div className="shell feature-grid">
        <div className="feature-copy reveal">
          <span className="section-number">04</span><p className="section-tag">Career preparation</p>
          <h2>Prepare for what<br />comes after college.</h2>
          <p>DSA, subject-wise questions, company-wise preparation, resume builder and more.</p>
          <a className="button button-dark" href="#cta">Enter Career Lab <FiArrowRight /></a>
        </div>
        <div className="career-panel reveal reveal-delay">
          <div className="panel-tabs"><b>DSA</b><span>Development</span><span>Aptitude</span><span>Resume</span><span>Mock Interviews</span><span className="view-all">View all →</span></div>
          <div className="career-grid">{careerCards.map((card)=><div className="career-card" key={card.title}><span className="career-icon"><card.icon /></span><div><b>{card.title}</b><small>{card.text}</small><div className="mini-progress"><span style={{width:card.progress}} /></div><em>{card.progress}</em></div><FiArrowRight /></div>)}</div>
        </div>
      </div>
    </section>
  );
}