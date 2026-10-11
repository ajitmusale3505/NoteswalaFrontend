import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { getCurrentUser } from "../services/profileService";

const ACCESS_TOKEN_KEY = "noteswala_access_token";
const REFRESH_TOKEN_KEY = "noteswala_refresh_token";
const USER_CACHE_KEY = "noteswala_user";

function clearInvalidSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
}

function getHttpStatus(error) {
  return error?.response?.status ?? error?.status ?? null;
}

export default function AuthRoute() {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [retryCount, setRetryCount] = useState(0);

  const verifySession = useCallback(async (signal) => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("checking");
    try {
      const response = await getCurrentUser();
      if (signal.aborted) return;

      const currentUser = response?.data?.data ?? response?.data ?? null;
      if (!currentUser) {
        clearInvalidSession();
        setStatus("unauthenticated");
        return;
      }

      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(currentUser));
      setStatus("authenticated");
    } catch (error) {
      if (signal.aborted) return;

      const httpStatus = getHttpStatus(error);
      if (httpStatus === 401 || httpStatus === 403) {
        clearInvalidSession();
        setStatus("unauthenticated");
        return;
      }

      // Do not misclassify a backend outage as a signed-out user and discard
      // their session. Give them a retry state instead of mounting protected UI.
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    verifySession(controller.signal);
    return () => controller.abort();
  }, [verifySession, retryCount]);

  const retry = () => setRetryCount((count) => count + 1);

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === "checking") {
    return (
      <main className="auth-route-state" role="status" aria-live="polite">
        <span className="auth-route-spinner" />
        <p>Verifying your session…</p>
      </main>
    );
  }

  if (status === "unavailable") {
    return (
      <main className="auth-route-state" role="alert">
        <section className="auth-route-message">
          <FiAlertCircle aria-hidden="true" />
          <h1>Unable to verify your session</h1>
          <p>NotesWala could not reach the authentication service. Check your connection and try again.</p>
          <button type="button" onClick={retry}><FiRefreshCw /> Try again</button>
          <button type="button" className="auth-route-login-link" onClick={() => { clearInvalidSession(); window.location.assign("/login"); }}>
            Go to login
          </button>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
