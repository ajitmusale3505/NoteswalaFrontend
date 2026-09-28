import { FiBell, FiBookOpen, FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, getUserAcademicProfile, getPersonalProfile } from "../../../services/profileService";
import { homeNavItems } from "../homeData";
import { logout } from "../../../services/authService";

export default function HomeNavbar({ user: userProp = null, academic: academicProp = null, loading: userLoading = false }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(userProp);
  const [academic, setAcademic] = useState(academicProp);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

        // Keep the authenticated personal profile cache fresh after navigation/login.
        try {
          const personalResponse = await getPersonalProfile();
          const personalProfile = personalResponse.data?.data || null;
          if (personalProfile) {
            localStorage.setItem("noteswala_personal_profile", JSON.stringify(personalProfile));
          }
        } catch {
          // Navbar does not depend on personal profile loading.
        }
      })
      .catch(() => {
        // Keep the navbar available even when the current-user request fails.
      });

    return () => {
      mounted = false;
    };
  }, [userProp, academicProp, userLoading]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const refreshToken = localStorage.getItem("noteswala_refresh_token");

    try {
      if (refreshToken) {
        await logout({ refreshToken });
      }
    } catch {
      // Even if the server token is already expired/invalid, clear the local session.
    } finally {
      localStorage.removeItem("noteswala_access_token");
      localStorage.removeItem("noteswala_refresh_token");
      localStorage.removeItem("noteswala_user");
      localStorage.removeItem("noteswala_personal_profile");
      sessionStorage.clear();
      navigate("/", { replace: true });
    }
  };

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
        <div className={"home-profile-menu " + (profileOpen ? "open" : "")}>
          <button
            className="home-profile"
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen(open => !open)}
          >
            <span className="home-avatar">{(user?.fullName || "Student").trim().charAt(0).toUpperCase() || "S"}</span>
            <span className="home-profile-copy">
              <strong>{user?.fullName || "Student"}</strong>
              <small>{academic?.branchName || "Student"}</small>
            </span>
            <FiChevronDown />
          </button>

          {profileOpen && (
            <div className="home-profile-dropdown" role="menu">
              <div className="home-profile-dropdown-head">
                <span className="home-avatar large">{(user?.fullName || "Student").trim().charAt(0).toUpperCase() || "S"}</span>
                <div>
                  <strong>{user?.fullName || "Student"}</strong>
                  <small>{user?.email || "Account"}</small>
                </div>
              </div>
              <div className="home-profile-dropdown-divider" />
              <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); navigate("/profile"); }}>
                <FiUser /> <span>My Profile</span>
              </button>
              <button className="logout" type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut}>
                <FiLogOut /> <span>{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}