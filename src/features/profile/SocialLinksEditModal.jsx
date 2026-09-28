import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen, FiCode, FiExternalLink, FiGithub, FiLink, FiLinkedin, FiSave, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getSocialLinks, updateSocialLinks } from "../../services/profileService";

const SOCIAL_FIELDS = [
  {
    key: "linkedinUrl",
    label: "LinkedIn",
    description: "Add your LinkedIn profile to connect with recruiters and professionals.",
    icon: FiLinkedin,
    placeholder: "https://linkedin.com/in/yourprofile",
    color: "#0a78b9"
  },
  {
    key: "githubUrl",
    label: "GitHub",
    description: "Showcase your projects and code on GitHub.",
    icon: FiGithub,
    placeholder: "https://github.com/yourusername",
    color: "#1d3045"
  },
  {
    key: "portfolioUrl",
    label: "Portfolio",
    description: "Add your personal portfolio website.",
    icon: FiCode,
    placeholder: "https://yourportfolio.com",
    color: "#a8783d"
  },
  {
    key: "leetcodeUrl",
    label: "LeetCode",
    description: "Add your LeetCode profile to showcase your problem solving skills.",
    icon: FiCode,
    placeholder: "https://leetcode.com/u/yourusername",
    color: "#b27b28"
  }
];

const EMPTY_FORM = {
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  leetcodeUrl: ""
};

function normalize(value) {
  return String(value || "").trim();
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function Toggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      className={`social-toggle ${enabled ? "on" : ""}`}
      role="switch"
      aria-checked={enabled}
      aria-label={`${label} link ${enabled ? "enabled" : "disabled"}`}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

export function SocialLinksEditModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [enabledFields, setEnabledFields] = useState({
    linkedinUrl: false,
    githubUrl: false,
    portfolioUrl: false,
    leetcodeUrl: false
  });

  useEffect(() => {
    let mounted = true;

    getSocialLinks()
      .then((response) => {
        if (!mounted) return;
        const data = response.data?.data || {};
        const loaded = {
          linkedinUrl: normalize(data.linkedinUrl),
          githubUrl: normalize(data.githubUrl),
          portfolioUrl: normalize(data.portfolioUrl),
          leetcodeUrl: normalize(data.leetcodeUrl)
        };
        setForm(loaded);
        setInitialForm(loaded);
        setEnabledFields({
          linkedinUrl: Boolean(loaded.linkedinUrl),
          githubUrl: Boolean(loaded.githubUrl),
          portfolioUrl: Boolean(loaded.portfolioUrl),
          leetcodeUrl: Boolean(loaded.leetcodeUrl)
        });
      })
      .catch((error) => {
        if (mounted) {
          toast.error(error?.response?.data?.message || "Unable to load social links.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const enabledCount = useMemo(
    () => SOCIAL_FIELDS.filter(({ key }) => enabledFields[key]).length,
    [enabledFields]
  );

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleField = (key) => {
    const nextEnabled = !enabledFields[key];
    setEnabledFields((current) => ({ ...current, [key]: nextEnabled }));

    if (!nextEnabled) {
      setForm((current) => ({ ...current, [key]: "" }));
    }
  };

  const save = async () => {
    const normalized = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        enabledFields[key] ? normalize(value) : ""
      ])
    );

    for (const field of SOCIAL_FIELDS) {
      const value = normalized[field.key];
      if (value && !isValidHttpUrl(value)) {
        toast.error(`${field.label} must be a valid HTTP or HTTPS URL.`);
        return;
      }
    }

    const changed = Object.keys(EMPTY_FORM).some(
      (key) => normalized[key] !== normalize(initialForm[key])
    );

    if (!changed) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);

      const response = await updateSocialLinks(normalized);
      const saved = response.data?.data || normalized;

      const refreshed = await getSocialLinks();
      const refreshedData = refreshed.data?.data || saved;
      const finalData = {
        linkedinUrl: normalize(refreshedData.linkedinUrl),
        githubUrl: normalize(refreshedData.githubUrl),
        portfolioUrl: normalize(refreshedData.portfolioUrl),
        leetcodeUrl: normalize(refreshedData.leetcodeUrl)
      };

      setForm(finalData);
      setInitialForm(finalData);
      setEnabledFields({
        linkedinUrl: Boolean(finalData.linkedinUrl),
        githubUrl: Boolean(finalData.githubUrl),
        portfolioUrl: Boolean(finalData.portfolioUrl),
        leetcodeUrl: Boolean(finalData.leetcodeUrl)
      });
      toast.success("Social links updated successfully.");
      onSaved(finalData);
    } catch (error) {
      const data = error?.response?.data;
      const details = data?.data && typeof data.data === "object"
        ? Object.values(data.data).filter(Boolean).join(" • ")
        : "";
      toast.error(details || data?.message || "Unable to update social links.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-edit-overlay social-links-overlay" role="dialog" aria-modal="true" aria-labelledby="social-links-title">
      <div className="profile-edit-modal social-links-edit-modal">
        <aside className="profile-edit-art social-links-edit-art">
          <div className="profile-edit-brand"><FiBookOpen /> EduHub</div>
          <div className="profile-edit-art-copy social-links-art-copy">
            <h2>Update Your<br /><span>Social Links</span></h2>
            <p>Add your social profiles to showcase your work, connect with others and get noticed by opportunities.</p>
          </div>
          <img
            src="/images/profile-edit/social-links-update-art.png"
            alt=""
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
          <p className="social-links-quote">"Share your journey<br />and let your work<br />speak for you."</p>
        </aside>

        <section className="profile-edit-main social-links-edit-main">
          <button type="button" className="profile-edit-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>

          <header className="profile-edit-heading social-links-heading">
            <h1 id="social-links-title">Social Links</h1>
            <p>Add your social profiles so others can connect with you and explore your work.</p>
          </header>

          <div className="profile-edit-scroll social-links-scroll">
            {loading ? (
              <div className="profile-edit-loading">Loading your social links...</div>
            ) : (
              <>
                <div className="social-links-count">{enabledCount} of {SOCIAL_FIELDS.length} profiles added</div>

                <div className="social-links-fields">
                  {SOCIAL_FIELDS.map(({ key, label, description, icon: Icon, placeholder, color }) => {
                    const enabled = Boolean(enabledFields[key]);

                    return (
                      <article className={`social-link-field ${enabled ? "enabled" : "disabled"}`} key={key}>
                        <div className="social-link-top">
                          <div className="social-link-identity">
                            <span className="social-link-icon" style={{ color }}>
                              <Icon />
                            </span>
                            <div>
                              <h3>{label}</h3>
                              <p>{description}</p>
                            </div>
                          </div>
                          <Toggle
                            enabled={enabled}
                            onChange={() => toggleField(key)}
                            label={label}
                          />
                        </div>

                        <div className={`social-link-input ${enabled ? "" : "is-disabled"}`}>
                          <FiLink />
                          <input
                            type="url"
                            value={form[key]}
                            onChange={(event) => setField(key, event.target.value)}
                            disabled={!enabled}
                            placeholder={placeholder}
                            autoComplete="url"
                            spellCheck="false"
                            aria-label={`${label} URL`}
                          />
                          <a
                            href={enabled && isValidHttpUrl(form[key]) ? form[key] : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={enabled && isValidHttpUrl(form[key]) ? "social-link-open" : "social-link-open disabled"}
                            aria-label={`Open ${label} profile`}
                            onClick={(event) => {
                              if (!enabled || !isValidHttpUrl(form[key])) event.preventDefault();
                            }}
                          >
                            <FiExternalLink />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <footer className="profile-edit-actions social-links-actions">
            <button type="button" className="profile-edit-cancel" onClick={onClose}>
              <FiX /> Cancel
            </button>
            <button
              type="button"
              className="profile-edit-save social-links-save"
              onClick={save}
              disabled={saving || loading}
            >
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

