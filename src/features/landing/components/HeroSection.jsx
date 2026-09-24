import { FiArrowRight, FiCheck } from "react-icons/fi";
import DashboardPreview from "./DashboardPreview";
import { stats } from "../landingData";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="shell hero-grid">
        <div className="hero-copy reveal">
          <p className="kicker">Your complete engineering companion</p>
          <h1>Your engineering<br /><span>journey, organized.</span></h1>
          <p className="hero-description">Access academic resources, solve doubts, stay updated, prepare for your career and use essential student tools — all in one place.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#resources">Explore Resources <FiArrowRight /></a>
            <a className="button button-outline" href="#cta">Create Free Account</a>
          </div>
          <div className="hero-trust"><FiCheck /> Free to start · Built for engineering students</div>
          <div className="stats-row">
            {stats.map(([label, value]) => <div className="stat" key={label}><span>{value}</span><small>{label}</small></div>)}
          </div>
        </div>
        <div className="hero-visual reveal reveal-delay"><DashboardPreview /></div>
      </div>
    </section>
  );
}