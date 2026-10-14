import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowRight, FiLoader } from "react-icons/fi";
import { quickAccess } from "../homeData";
import { getCurrentUserSyllabus } from "../../../services/resourceService";

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getSyllabusErrorMessage(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.response?.data?.error;
  if (status === 404) {
    return message || "No published syllabus is available for your current academic profile yet.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  return message || "Could not find your syllabus. Please try again.";
}

export default function QuickAccess() {
  const navigate = useNavigate();
  const [openingSyllabus, setOpeningSyllabus] = useState(false);

  const handleQuickAccess = async (event, title) => {
    if (title !== "Syllabus") return;
    event.preventDefault();
    if (openingSyllabus) return;

    setOpeningSyllabus(true);
    try {
      const response = await getCurrentUserSyllabus();
      const syllabus = unwrapResponse(response);
      if (!syllabus?.id) {
        toast.error("No syllabus resource was found for your academic profile.");
        return;
      }
      // The shared resource viewer streams the original PDF and keeps all
      // existing authentication, entitlement and download-permission checks.
      navigate(`/resources/view/${encodeURIComponent(syllabus.id)}`);
    } catch (error) {
      toast.error(getSyllabusErrorMessage(error), { duration: 4500 });
    } finally {
      setOpeningSyllabus(false);
    }
  };

  return (
    <section className="home-panel quick-access-panel" id="resources">
      <div className="panel-title"><h2><span />Quick Access</h2><a href="#resources">View All <FiArrowRight /></a></div>
      <div className="quick-grid">
        {quickAccess.map(([title, text, Icon, tone]) => (
          <a
            className={`quick-card quick-${tone} ${title === "Syllabus" && openingSyllabus ? "is-opening" : ""}`}
            href="#resources"
            key={title}
            onClick={(event) => { void handleQuickAccess(event, title); }}
            aria-busy={title === "Syllabus" && openingSyllabus}
          >
            <span className="quick-icon"><Icon /></span>
            <span className="quick-copy"><b>{title}</b><small>{title === "Syllabus" && openingSyllabus ? "Finding your syllabus…" : text}</small></span>
            {title === "Syllabus" && openingSyllabus ? <FiLoader className="quick-card-spinner" /> : <FiArrowRight />}
          </a>
        ))}
      </div>
    </section>
  );
}
