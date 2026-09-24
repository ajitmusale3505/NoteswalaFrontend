import { platformItems } from "../landingData";

export default function PlatformOverview() {
  return (
    <section className="overview-section">
      <div className="shell">
        <div className="section-heading center reveal">
          <p className="kicker">Trusted by engineering students</p>
          <h2>One platform for every step of your journey.</h2>
          <p>From academic resources to career preparation, EduHub brings everything you need into a single, organized platform.</p>
        </div>
        <div className="platform-grid reveal reveal-delay">
          {platformItems.map(({ icon: Icon, title, text }) => (
            <a className="platform-item" href="#resources" key={title}>
              <span className="platform-icon"><Icon /></span>
              <b>{title}</b>
              <small>{text}</small>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}