import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiHeart, FiPlus, FiSearch, FiSave, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getPersonalProfile, updateInterests } from "../../services/profileService";
import { PREDEFINED_INTERESTS, SUGGESTED_INTERESTS } from "./interestsData";

const normalize = (value) => String(value || "").trim();

function EditShell({ onClose, onSave, saving, children }) {
  return (
    <div className="profile-edit-overlay" role="dialog" aria-modal="true" aria-label="Update Interests">
      <div className="profile-edit-modal interests-edit-modal">
        <aside className="profile-edit-art interests-edit-art">
          <div className="profile-edit-brand"><FiHeart /> EduHub</div>
          <div className="profile-edit-art-copy">
            <small>Explore what you love</small>
            <h2>Update Your<br />Interests</h2>
            <p>Tell us what excites you! Adding your interests helps us personalize your experience and suggest relevant resources, communities and opportunities.</p>
          </div>
          <img
            src="/images/profile-edit/interests-update-art.svg"
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </aside>

        <section className="profile-edit-main">
          <button type="button" className="profile-edit-close" onClick={onClose} aria-label="Close"><FiX /></button>
          <header className="profile-edit-heading interests-edit-heading">
            <h1><FiHeart /> Interests</h1>
            <p>Select your interests to get personalized content, communities and recommendations.</p>
          </header>

          <div className="profile-edit-scroll interests-edit-scroll">{children}</div>

          <footer className="profile-edit-actions">
            <button type="button" className="profile-edit-cancel" onClick={onClose}><FiX /> Cancel</button>
            <button type="button" className="profile-edit-save interests-save" onClick={onSave} disabled={saving}>
              <FiCheck /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export function InterestsEditModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState([]);
  const [search, setSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const initialInterests = useRef([]);

  useEffect(() => {
    getPersonalProfile()
      .then((response) => {
        const existing = Array.isArray(response.data?.data?.interests)
          ? response.data.data.interests.map(normalize).filter(Boolean)
          : [];

        const allowed = existing.filter((interest) =>
          PREDEFINED_INTERESTS.some((item) => item.toLowerCase() === interest.toLowerCase())
        );

        initialInterests.current = allowed;
        setInterests(allowed);
      })
      .catch((error) => toast.error(error?.response?.data?.message || "Unable to load your interests."))
      .finally(() => setLoading(false));
  }, []);

  const availableInterests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PREDEFINED_INTERESTS
      .filter((interest) => !interests.some((selected) => selected.toLowerCase() === interest.toLowerCase()))
      .filter((interest) => !query || interest.toLowerCase().includes(query))
      .slice(0, 8);
  }, [search, interests]);

  const exactInterest = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PREDEFINED_INTERESTS.find((interest) => interest.toLowerCase() === query);
  }, [search]);

  const addInterest = (interest) => {
    const value = normalize(interest);
    const predefined = PREDEFINED_INTERESTS.find((item) => item.toLowerCase() === value.toLowerCase());

    if (!predefined) {
      toast.error("Only predefined interests can be added.");
      return;
    }
    if (interests.length >= 30) {
      toast.error("You can add at most 30 interests.");
      return;
    }
    if (interests.some((item) => item.toLowerCase() === predefined.toLowerCase())) return;

    setInterests((current) => [...current, predefined]);
    setSearch("");
  };

  const removeInterest = (interest) => {
    setInterests((current) => current.filter((item) => item !== interest));
  };

  const dropInterest = (targetIndex) => {
    if (draggedIndex == null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    setInterests((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
    setDraggedIndex(null);
  };

  const addAllSuggested = () => {
    setInterests((current) => {
      const next = [...current];

      SUGGESTED_INTERESTS.forEach((interest) => {
        if (
          next.length < 30 &&
          !next.some((selected) => selected.toLowerCase() === interest.toLowerCase())
        ) {
          next.push(interest);
        }
      });

      return next;
    });
  };

  const save = async () => {
    if (JSON.stringify(interests) === JSON.stringify(initialInterests.current || [])) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);
      const response = await updateInterests(interests);
      toast.success("Interests updated successfully.");
      onSaved(response.data?.data || {});
    } catch (error) {
      const data = error?.response?.data;
      const details = data?.data && typeof data.data === "object"
        ? Object.values(data.data).filter(Boolean).join(" • ")
        : "";

      toast.error(details || data?.message || "Unable to update interests.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditShell onClose={onClose} onSave={save} saving={saving || loading}>
      {loading ? (
        <div className="profile-edit-loading">Loading your interests...</div>
      ) : (
        <div className="interests-editor">
          <div className="interests-search-box">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search and add interests (e.g. Web Development, AI, Cloud...)"
              autoComplete="off"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (exactInterest) addInterest(exactInterest);
                }
              }}
            />
          </div>

          {search.trim() && availableInterests.length > 0 && (
            <div className="interests-search-results">
              {availableInterests.map((interest) => (
                <button type="button" key={interest} onClick={() => addInterest(interest)}>
                  <span>{interest}</span><FiPlus />
                </button>
              ))}
            </div>
          )}

          <div className="interests-section-heading">
            <div><FiHeart /><strong>Selected Interests ({interests.length})</strong></div>
            <span>☰&nbsp; Drag to reorder</span>
          </div>

          <div className="interests-selected-list">
            {interests.length === 0 ? (
              <div className="interests-empty">No interests selected yet. Search from the predefined list above.</div>
            ) : (
              interests.map((interest, index) => (
                <div
                  className="interest-chip"
                  key={interest}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropInterest(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <span>{interest}</span>
                  <button type="button" onClick={() => removeInterest(interest)} aria-label="Remove interest"><FiX /></button>
                </div>
              ))
            )}
          </div>

          <div className="interests-divider" />

          <div className="interests-section-heading suggested-interests-heading">
            <div><span className="interest-bulb">♧</span><strong>Suggested Interests</strong></div>
            <button
              type="button"
              onClick={addAllSuggested}
              disabled={SUGGESTED_INTERESTS.every((interest) =>
                interests.some((selected) => selected.toLowerCase() === interest.toLowerCase())
              )}
            >
              Add All
            </button>
          </div>

          <div className="interests-suggested-list">
            {SUGGESTED_INTERESTS.map((interest) => {
              const selected = interests.some((item) => item.toLowerCase() === interest.toLowerCase());

              return (
                <button
                  type="button"
                  key={interest}
                  className={selected ? "selected" : ""}
                  onClick={() => addInterest(interest)}
                  disabled={selected}
                >
                  {selected ? <FiCheck /> : <FiPlus />}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </EditShell>
  );
}
