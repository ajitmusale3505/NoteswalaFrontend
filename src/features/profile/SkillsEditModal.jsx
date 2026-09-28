import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiCode, FiPlus, FiSearch, FiSave, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getPersonalProfile, updateSkills } from "../../services/profileService";
import { PREDEFINED_SKILLS, SUGGESTED_SKILLS } from "./skillsData";

const normalize = (value) => String(value || "").trim();

function EditShell({ onClose, onSave, saving, children }) {
  return (
    <div className="profile-edit-overlay" role="dialog" aria-modal="true" aria-label="Update Skills">
      <div className="profile-edit-modal skills-edit-modal">
        <aside className="profile-edit-art skills-edit-art">
          <div className="profile-edit-brand"><FiCode /> EduHub</div>
          <div className="profile-edit-art-copy">
            <small>Build your strengths</small>
            <h2>Update Your<br />Skills</h2>
            <p>Add, remove or update your skills to show your strengths and get better opportunities.</p>
          </div>
          <img
            src="/images/profile-edit/skills-update-art.svg"
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </aside>
        <section className="profile-edit-main">
          <button type="button" className="profile-edit-close" onClick={onClose} aria-label="Close"><FiX /></button>
          <header className="profile-edit-heading skills-edit-heading">
            <h1><FiCode /> Skills</h1>
            <p>Add the technologies, tools and skills you are proficient in.</p>
          </header>
          <div className="profile-edit-scroll skills-edit-scroll">{children}</div>
          <footer className="profile-edit-actions">
            <button type="button" className="profile-edit-cancel" onClick={onClose}><FiX /> Cancel</button>
            <button type="button" className="profile-edit-save" onClick={onSave} disabled={saving}>
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export function SkillsEditModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const initialSkills = useRef([]);

  useEffect(() => {
    getPersonalProfile()
      .then((response) => {
        const existing = Array.isArray(response.data?.data?.skills)
          ? response.data.data.skills.map(normalize).filter(Boolean)
          : [];
        const allowed = existing.filter((skill) =>
          PREDEFINED_SKILLS.some((item) => item.toLowerCase() === skill.toLowerCase())
        );
        initialSkills.current = allowed;
        setSkills(allowed);
      })
      .catch((error) => toast.error(error?.response?.data?.message || "Unable to load your skills."))
      .finally(() => setLoading(false));
  }, []);

  const availableSkills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PREDEFINED_SKILLS
      .filter((skill) => !skills.some((selected) => selected.toLowerCase() === skill.toLowerCase()))
      .filter((skill) => !query || skill.toLowerCase().includes(query))
      .slice(0, 8);
  }, [search, skills]);

  const exactSkill = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PREDEFINED_SKILLS.find((skill) => skill.toLowerCase() === query);
  }, [search]);

  const addSkill = (skill) => {
    const value = normalize(skill);
    const predefined = PREDEFINED_SKILLS.find((item) => item.toLowerCase() === value.toLowerCase());

    if (!predefined) {
      toast.error("Only predefined skills can be added.");
      return;
    }
    if (skills.length >= 30) {
      toast.error("You can add at most 30 skills.");
      return;
    }
    if (skills.some((item) => item.toLowerCase() === predefined.toLowerCase())) return;

    setSkills((current) => [...current, predefined]);
    setSearch("");
  };

  const removeSkill = (skill) => {
    setSkills((current) => current.filter((item) => item !== skill));
  };

  const dropSkill = (targetIndex) => {
    if (draggedIndex == null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    setSkills((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
    setDraggedIndex(null);
  };

  const save = async () => {
    if (JSON.stringify(skills) === JSON.stringify(initialSkills.current || [])) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);
      const response = await updateSkills(skills);
      toast.success("Skills updated successfully.");
      onSaved(response.data?.data || {});
    } catch (error) {
      const data = error?.response?.data;
      const details = data?.data && typeof data.data === "object"
        ? Object.values(data.data).filter(Boolean).join(" • ")
        : "";
      toast.error(details || data?.message || "Unable to update skills.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditShell onClose={onClose} onSave={save} saving={saving || loading}>
      {loading ? (
        <div className="profile-edit-loading">Loading your skills...</div>
      ) : (
        <div className="skills-editor">
          <div className="skills-search-row">
            <div className="skills-search-box">
              <FiSearch />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search and add skills (e.g., Java, React, Python...)"
                autoComplete="off"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (exactSkill) addSkill(exactSkill);
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="skills-add-button"
              onClick={() => exactSkill && addSkill(exactSkill)}
              disabled={!exactSkill}
            >
              <FiPlus /> Add Skill
            </button>
          </div>

          {search.trim() && availableSkills.length > 0 && (
            <div className="skills-search-results">
              {availableSkills.map((skill) => (
                <button type="button" key={skill} onClick={() => addSkill(skill)}>
                  <span>{skill}</span><FiPlus />
                </button>
              ))}
            </div>
          )}

          <div className="skills-section-heading">
            <div><FiCode /><strong>Your Skills ({skills.length})</strong></div>
            <span>☰&nbsp; Drag to reorder</span>
          </div>

          <div className="skills-selected-list">
            {skills.length === 0 ? (
              <div className="skills-empty">No skills selected yet. Search from the predefined list above.</div>
            ) : (
              skills.map((skill, index) => (
                <div
                  className="skills-chip"
                  key={skill}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropSkill(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <span>{skill}</span>
                  <button type="button" onClick={() => removeSkill(skill)} aria-label="Remove skill"><FiX /></button>
                </div>
              ))
            )}
          </div>

          <div className="skills-divider" />

          <div className="skills-section-heading suggested-heading">
            <div><FiCode /><strong>Suggested Skills</strong></div>
            <button
              type="button"
              onClick={() => setSkills((current) => {
                const next = [...current];
                SUGGESTED_SKILLS.forEach((skill) => {
                  if (next.length < 30 && !next.some((selected) => selected.toLowerCase() === skill.toLowerCase())) next.push(skill);
                });
                return next;
              })}
              disabled={SUGGESTED_SKILLS.every((skill) =>
                skills.some((selected) => selected.toLowerCase() === skill.toLowerCase())
              )}
            >
              Add All
            </button>
          </div>

          <div className="skills-suggested-list">
            {SUGGESTED_SKILLS.map((skill) => {
              const selected = skills.some((item) => item.toLowerCase() === skill.toLowerCase());
              return (
                <button type="button" key={skill} className={selected ? "selected" : ""} onClick={() => addSkill(skill)} disabled={selected}>
                  {selected ? <FiCheck /> : <FiPlus />} {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </EditShell>
  );
}
