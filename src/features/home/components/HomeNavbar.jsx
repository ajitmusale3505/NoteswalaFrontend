import { FiBell, FiBookOpen, FiChevronDown } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { homeNavItems } from "../homeData";

export default function HomeNavbar() {
  const { pathname } = useLocation();
  return (
    <header className="home-navbar">
      <a className="home-brand" href="/home" aria-label="EduHub home">
        <span className="home-brand-mark"><FiBookOpen /></span>
        <span>EduHub</span>
      </a>
      <nav className="home-nav">
        {homeNavItems.map(([label, href, Icon]) => {
          const target = label === "Home" ? "/home" : label === "Resources" ? "/resources" : href;
          const active = label === "Home" ? pathname === "/home" || pathname === "/dashboard" : label === "Resources" && pathname.startsWith("/resources");
          return <a key={label} href={target} className={active ? "active" : ""}><Icon /><span>{label}</span></a>;
        })}
      </nav>
      <div className="home-user">
        <button className="home-notification" type="button" aria-label="Notifications"><FiBell /><b>5</b></button>
        <button className="home-profile" type="button"><span className="home-avatar">S</span><span className="home-profile-copy"><strong>Student</strong><small>Computer Engineering</small></span><FiChevronDown /></button>
      </div>
    </header>
  );
}