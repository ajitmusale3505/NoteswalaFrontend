import { FiArrowRight, FiHeart, FiMessageCircle, FiUsers } from "react-icons/fi";
import { communityRows } from "../landingData";

export default function CommunitySection() {
  return (
    <section className="feature-section feature-alt" id="community">
      <div className="shell feature-grid">
        <div className="feature-copy reveal">
          <span className="section-number">02</span><p className="section-tag">Community</p>
          <h2>Stuck on a concept?<br />Ask. Discuss. Understand.</h2>
          <p>Get help from peers, share knowledge and be part of a supportive engineering community.</p>
          <a className="button button-outline" href="#cta">Visit Community <FiArrowRight /></a>
        </div>
        <div className="community-panel reveal reveal-delay">
          <div className="panel-tabs"><b>Recent</b><span>Popular</span><span>Unanswered</span><span className="view-all">View all →</span></div>
          {communityRows.map((row)=><div className="community-row" key={row.title}><span className="avatar avatar-photo">{row.avatar}</span><div className="community-main"><b>{row.title}</b><small>{row.tags.join("   ·   ")}</small><span className="community-meta"><FiHeart /> {row.stats}</span></div><span className={`status ${row.status === "Active" ? "status-active" : ""}`}>{row.status}</span></div>)}
        </div>
      </div>
    </section>
  );
}