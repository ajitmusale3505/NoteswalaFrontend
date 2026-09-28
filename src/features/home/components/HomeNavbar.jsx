import { FiBell, FiBookOpen, FiChevronDown } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentUser } from "../../../services/profileService";
import { homeNavItems } from "../homeData";

export default function HomeNavbar({ user: userProp = null }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(userProp);

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }

    if (!localStorage.getItem("noteswala_access_token")) return;

    let mounted = true;
    getCurrentUser()
      .then((response) => {
        if (mounted) setUser(response.data?.data || null);
      })
      .catch(() => {
        // Keep the navbar available even when the current-user request fails.
      });

    return () => {
      mounted = false;
    };
  }, [userProp]);
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
        <a className="home-profile" href="/profile" aria-label="Open profile">
          <span className="home-avatar">{(user?.fullName || "Student").trim().charAt(0).toUpperCase() || "S"}</span>
          <span className="home-profile-copy">
            <strong>{user?.fullName || "Student"}</strong>
            <small>{user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : "Student"}</small>
          </span>
          <FiChevronDown />
        </a>
      </div>
    </header>
  );
}