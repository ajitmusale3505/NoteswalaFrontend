import { FiArrowRight } from "react-icons/fi";
import { quickAccess } from "../homeData";

export default function QuickAccess() {
  return (
    <section className="home-panel quick-access-panel" id="resources">
      <div className="panel-title"><h2><span />Quick Access</h2><a href="#resources">View All <FiArrowRight /></a></div>
      <div className="quick-grid">
        {quickAccess.map(([title, text, Icon, tone]) => (
          <a className={`quick-card quick-${tone}`} href="#resources" key={title}>
            <span className="quick-icon"><Icon /></span>
            <span className="quick-copy"><b>{title}</b><small>{text}</small></span>
            <FiArrowRight />
          </a>
        ))}
      </div>
    </section>
  );
}