import { FiArrowRight, FiBookOpen, FiGithub, FiInstagram, FiLinkedin, FiYoutube } from "react-icons/fi";

export default function LandingFooter() {
  return (
    <>
      <section className="cta-section" id="cta">
        <div className="shell cta-inner reveal">
          <p className="kicker">Join EduHub</p>
          <h2>Your engineering journey starts here.</h2>
          <p>Everything you need. One organized place.</p>
          <div className="cta-actions"><a className="button button-dark" href="/register">Create Account <FiArrowRight /></a><a className="button button-outline" href="#resources">Explore Platform</a></div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand"><a className="brand" href="/"><span className="brand-mark"><FiBookOpen /></span><span>EduHub</span></a><p>Your Complete Engineering Companion</p><div className="socials"><a href="#top" aria-label="GitHub"><FiGithub /></a><a href="#top" aria-label="YouTube"><FiYoutube /></a><a href="#top" aria-label="LinkedIn"><FiLinkedin /></a><a href="#top" aria-label="Instagram"><FiInstagram /></a></div></div>
          <FooterColumn title="Platform" links={["Resources","Community","University","Career","Library","Tools"]} />
          <FooterColumn title="Resources" links={["PYQs","Notes","Books","Practicals","Important Questions","Syllabus"]} />
          <FooterColumn title="Company" links={["About","Contact","Privacy Policy","Terms of Service","Blog"]} />
          <div className="footer-newsletter"><b>Stay Updated</b><p>Get the latest updates and features.</p><label><input placeholder="Enter your email" type="email" /><button type="button"><FiArrowRight /></button></label></div>
        </div>
        <div className="shell footer-bottom"><span>© 2026 EduHub. All rights reserved.</span><span>Built for engineering students, by engineering students.</span></div>
      </footer>
    </>
  );
}

function FooterColumn({title,links}) {
  return <div className="footer-column"><b>{title}</b>{links.map((link)=><a href="#resources" key={link}>{link}</a>)}</div>;
}