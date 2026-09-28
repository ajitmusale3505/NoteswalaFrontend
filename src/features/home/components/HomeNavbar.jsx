import { FiBell, FiBookOpen, FiChevronDown } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentUser, getUserAcademicProfile } from "../../../services/profileService";
import { homeNavItems } from "../homeData";

export default function HomeNavbar({ user: userProp = null, academic: academicProp = null, loading: userLoading = false }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState(userProp);
  const [academic, setAcademic] = useState(academicProp);

  useEffect(() => {
    if (userProp || userLoading) {
      setUser(userProp);
      setAcademic(academicProp);
      return;
    }

    if (!localStorage.getItem("noteswala_access_token")) return;

    let mounted = true;
    getCurrentUser()
      .then(async (response) => {
        if (!mounted) return;
        const currentUser = response.data?.data || null;
        setUser(currentUser);

        if (currentUser?.userId) {
          try {
            const profileResponse = await getUserAcademicProfile(currentUser.userId);
            if (mounted) setAcademic(profileResponse.data?.data || null);
          } catch {
            if (mounted) setAcademic(null);
          }
        }
      })
      .catch(() => {
        // Keep the navbar available even when the current-user request fails.
      });

    return () => {
      mounted = false;
    };
  }, [userProp, academicProp, userLoading]);
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
            <small>{academic?.branchName || "Student"}</small>
          </span>
          <FiChevronDown />
        </a>
      </div>
    </header>
  );
}