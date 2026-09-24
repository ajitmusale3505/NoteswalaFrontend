import { FiBookOpen, FiGithub, FiInstagram, FiLinkedin, FiMail, FiPlay, FiShield, FiUsers, FiYoutube } from "react-icons/fi";

const columns = [
  ["Resources", ["Previous Year Papers", "Notes", "Books", "Practicals", "Important Questions", "Syllabus", "LaTeX Reports"]],
  ["Community", ["Discussions", "Ask a Question", "Trending Questions", "Study Groups", "Group Chat", "Contributors", "Community Guidelines"]],
  ["University", ["Latest Updates", "Exam Timetable", "Results", "Circulars", "Holidays", "Events", "Syllabus & Curriculum"]],
  ["Career", ["DSA Roadmap", "Interview Preparation", "Coding Practice", "Aptitude", "Resume Builder", "Internships & Jobs", "Student Experiences"]],
  ["Tools", ["CGPA Calculator", "Attendance Tracker", "Timetable", "Assignment Board", "LaTeX Reports", "Study Planner", "More Tools"]],
];

export default function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-top">
        <div className="home-footer-brand">
          <a href="/home" className="home-footer-logo"><span><FiBookOpen /></span>EduHub</a>
          <p>Your complete engineering companion for academic resources, community, university updates and career preparation.</p>
          <div className="home-footer-socials">
            <a href="#linkedin" aria-label="LinkedIn"><FiLinkedin /></a><a href="#github" aria-label="GitHub"><FiGithub /></a><a href="#instagram" aria-label="Instagram"><FiInstagram /></a><a href="#youtube" aria-label="YouTube"><FiYoutube /></a><a href="#x" aria-label="X">X</a>
          </div>
        </div>
        {columns.map(([title, links]) => <div className="home-footer-column" key={title}><h3>{title}</h3>{links.map((link) => <a href="#footer" key={link}>{link}</a>)}</div>)}
        <div className="home-footer-newsletter">
          <h3>Stay Updated</h3><p>Get the latest resources, university updates and career opportunities delivered to your inbox.</p>
          <form onSubmit={(event) => event.preventDefault()}><span><FiMail /></span><input type="email" placeholder="Enter your email address" aria-label="Email address" /><button type="submit">Subscribe</button></form>
          <div className="home-footer-download-title"><span />Download Our App<span /></div>
          <div className="home-footer-store"><a href="#google-play"><FiPlay /><b>GET IT ON<small>Google Play</small></b></a><a href="#app-store"><b className="apple-mark">●</b><b>Download on the<small>App Store</small></b></a></div>
        </div>
      </div>
      <div className="home-footer-trust">
        <div><span><FiBookOpen /></span><b>Trusted by<br />Engineering Students</b><small>From universities across India</small></div>
        <div><span><FiShield /></span><b>Quality Content</b><small>Verified and curated resources</small></div>
        <div><span><FiUsers /></span><b>Active Community</b><small>Learn, discuss and grow together</small></div>
        <div><span><FiBookOpen /></span><b>All in One Place</b><small>Academics, tools and career support</small></div>
      </div>
      <div className="home-footer-bottom"><span>© 2026 EduHub. All rights reserved.</span><nav><a href="#about">About Us</a><i /><a href="#contact">Contact Us</a><i /><a href="#terms">Terms of Service</a><i /><a href="#privacy">Privacy Policy</a><i /><a href="#support">Help & Support</a></nav></div>
    </footer>
  );
}