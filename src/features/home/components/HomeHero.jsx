import { FiArrowRight, FiCalendar, FiBookOpen, FiCheckCircle, FiClock } from "react-icons/fi";

export default function HomeHero() {
  return (
    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="home-kicker"><span /> Good Morning</p>
        <h1>Welcome back!</h1>
        <h2>Continue your engineering journey with EduHub.</h2>
        <p>Access study materials, solve doubts, stay updated with university announcements and prepare for your career — all in one place.</p>
        <div className="home-hero-actions">
          <a className="home-primary-button" href="#resources">Explore Resources <FiArrowRight /></a>
          <a className="home-secondary-button" href="#tasks"><FiCalendar /> View Today's Tasks</a>
        </div>
      </div>

      <div className="home-quote">
        <b>“</b>
        <p>Small consistent efforts<br />today create a better<br />engineer tomorrow.</p>
        <span />
      </div>

      <div className="semester-card">
        <h3>Semester Progress</h3>
        <strong>68%</strong>
        <div className="semester-progress"><span /></div>
        <p>Semester VI <i /> Computer Engineering</p>
        <small>Savitribai Phule Pune University</small>
        <div className="semester-stats">
          <span><FiBookOpen /><b>12</b><small>Resources</small></span>
          <span><FiCheckCircle /><b>8</b><small>Tasks</small></span>
          <span><FiBookOpen /><b>6</b><small>Subjects</small></span>
        </div>
      </div>
    </section>
  );
}