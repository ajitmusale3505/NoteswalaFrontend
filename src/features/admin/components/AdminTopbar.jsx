import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiBookOpen, FiChevronDown, FiLogOut, FiSearch } from "react-icons/fi";
import { logout } from "../../../services/authService";

function readCachedUser() {
  try {
    return JSON.parse(localStorage.getItem("noteswala_user") || "{}");
  } catch {
    return {};
  }
}

export default function AdminTopbar({ collapsed, searchValue, onSearchChange }) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const user = useMemo(readCachedUser, []);
  const displayName = user?.fullName || user?.name || "Admin";
  const avatarText = displayName.trim().charAt(0).toUpperCase() || "A";

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("noteswala_refresh_token");
    try {
      if (refreshToken) await logout({ refreshToken });
    } catch {
      // A local sign-out must still succeed if the refresh token is expired.
    } finally {
      localStorage.removeItem("noteswala_access_token");
      localStorage.removeItem("noteswala_refresh_token");
      localStorage.removeItem("noteswala_user");
      localStorage.removeItem("noteswala_personal_profile");
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-leading">
        <a className="admin-topbar-brand" href="/admin" aria-label="NotesWala Admin Dashboard"><FiBookOpen /><span>NotesWala<small>Admin Panel</small></span></a>
        <label className="admin-global-search">
          <FiSearch />
          <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search resources, subjects, universities, users, etc…" aria-label="Search admin dashboard" />
          <kbd>Ctrl</kbd><kbd>K</kbd>
        </label>
      </div>

      <div className="admin-topbar-actions">
        <div className="admin-popover-wrap">
          <button className="admin-notification-button" type="button" aria-label="Notifications"
            aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setUserMenuOpen(false); }}>
            <FiBell /><i />
          </button>
          {notificationsOpen && <div className="admin-popover admin-notification-popover">
            <strong>Notifications</strong>
            <p><span className="notification-dot" /> Your dashboard is up to date.</p>
            <p><span className="notification-dot amber-dot" /> 3 resources are waiting for review.</p>
          </div>}
        </div>
        <div className="admin-popover-wrap">
          <button className="admin-user-button" type="button" onClick={() => { setUserMenuOpen((open) => !open); setNotificationsOpen(false); }}
            aria-expanded={userMenuOpen}>
            <span className="admin-user-avatar">{avatarText}</span>
            <span className="admin-user-copy"><strong>{displayName}</strong><small>Administrator</small></span>
            <FiChevronDown />
          </button>
          {userMenuOpen && <div className="admin-popover admin-user-popover">
            <strong>{displayName}</strong>
            <span className="admin-user-email">{user?.email || "Administrator account"}</span>
            <button type="button" onClick={handleLogout}><FiLogOut /> Sign out</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
