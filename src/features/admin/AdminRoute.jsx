import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../services/profileService";

function normalizeRole(role) {
  if (typeof role === "string") return role.toUpperCase();
  if (role && typeof role === "object") {
    return String(role.name ?? role.roleName ?? role.authority ?? role.code ?? "").toUpperCase();
  }
  return "";
}

function userHasAdminRole(user) {
  if (!user) return false;
  const roleValues = [
    user.role,
    user.roles,
    user.authorities,
    user.userRole,
  ].flat(Infinity);
  return roleValues.some((role) => normalizeRole(role).includes("ADMIN"));
}

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    const verifyAdminAccess = async () => {
      if (!localStorage.getItem("noteswala_access_token")) {
        if (active) setStatus("unauthenticated");
        return;
      }

      try {
        // Never trust a client-stored role: validate the active session with the API.
        const response = await getCurrentUser();
        const currentUser = response?.data?.data ?? response?.data ?? null;

        if (!active) return;
        if (!currentUser) {
          setStatus("unauthenticated");
          return;
        }

        localStorage.setItem("noteswala_user", JSON.stringify(currentUser));
        setStatus(userHasAdminRole(currentUser) ? "authorized" : "forbidden");
      } catch {
        if (active) setStatus("unauthenticated");
      }
    };

    verifyAdminAccess();
    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <main className="admin-route-check" role="status" aria-live="polite">
        <span className="admin-route-spinner" />
        <p>Verifying administrator access…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  }

  if (status === "forbidden") {
    return <Navigate to="/home" replace />;
  }

  return children;
}
