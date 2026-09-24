import { FiBell, FiBookOpen, FiChevronDown } from "react-icons/fi";
import { homeNavItems } from "../homeData";

export default function HomeNavbar() {
  return (
    <header className="home-navbar">
      <a className="home-brand" href="/home" aria-label="EduHub home">
        <span className="home-brand-mark"><FiBookOpen /></span>
        <span>EduHub</span>
      </a>

      <nav className="home-nav">
        {homeNavItems.map(([label, href, Icon]) => (
          <a key={label} href={label === "Home" ? "/home" : href} className={label === "Home" ? "active" : ""}>
            <Icon />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="home-user">
        <button className="home-notification" type="button" aria-label="Notifications">
          <FiBell /><b>5</b>
        </button>
        <button className="home-profile" type="button">
          <span className="home-avatar">S</span>
          <span className="home-profile-copy"><strong>Student</strong><small>Computer Engineering</small></span>
          <FiChevronDown />
        </button>
      </div>
    </header>
  );
}