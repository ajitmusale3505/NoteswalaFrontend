import { useEffect, useMemo, useState } from "react";
import {
  FiActivity, FiBookOpen, FiCheck, FiEdit3, FiFlag,
  FiLayers, FiSave, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getCurrentAcademicSubjects,
  getCurrentSubjectSelections,
  updateCurrentSubjectSelections
} from "../../services/academicService";

const CATEGORY = {
  REGULAR: "REGULAR",
  ELECTIVE: "ELECTIVE",
  HONOR: "HONOR",
  PRACTICAL: "PRACTICAL"
};

const categoryOf = (subject) => {
  const code = String(subject?.categoryCode || "").trim().toUpperCase();
  const id = String(subject?.categoryId || "").trim().toUpperCase();

  // Subject offerings use normalized category codes (REGULAR/ELECTIVE/
  // PRACTICAL). Keep compatibility with legacy/core/lab values and the
  // seeded CAT identifiers so the UI never hides valid offerings.
  if (code === "REGULAR" || code === "CORE" || id === "CAT10001") return CATEGORY.REGULAR;
  if (code === "ELECTIVE" || code === "OPEN_ELECTIVE" || id === "CAT10002") return CATEGORY.ELECTIVE;
  if (code === "HONOR" || code === "HONOURS" || id === "CAT10004") return CATEGORY.HONOR;
  if (code === "PRACTICAL" || code === "LAB" || code === "PRACTICAL_ONLY" || id === "CAT10003") return CATEGORY.PRACTICAL;

  return code;
};

function responseList(response, ...keys) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  for (const key of keys) {
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function subjectLabel(subject) {
  return subject?.subjectName || subject?.subjectCode || "Unnamed subject";
}

function SubjectChip({ subject, removable = false, onRemove }) {
  return (
    <span className="semester-subject-chip">
      <span>{subjectLabel(subject)}</span>
      {removable && (
        <button type="button" onClick={() => onRemove(subject.subjectOfferingId)} aria-label={"Remove " + subjectLabel(subject)}>
          <FiX />
        </button>
      )}
    </span>
  );
}

function CategoryCard({ title, icon: Icon, subjects, tone, selectable = false, selectedIds, onToggle, options }) {
  return (
    <section className={"semester-category semester-category-" + tone}>
      <header>
        <div className="semester-category-title">
          <span className="semester-category-icon"><Icon /></span>
          <div>
            <h3>{title}</h3>
            <p>{selectable ? "Select from the available options." : "Loaded automatically from your current semester."}</p>
          </div>
        </div>
        <b>{selectable ? "Selected " + subjects.filter((s) => selectedIds.has(s.subjectOfferingId)).length : subjects.length}</b>
      </header>

      {!selectable ? (
        <div className="semester-subject-list">
          {subjects.length ? subjects.map((subject) => <SubjectChip key={subject.subjectOfferingId} subject={subject} />) :
            <span className="semester-empty-inline">No subjects configured for this semester.</span>}
        </div>
      ) : (
        <div className="semester-select-area">
          {options.length ? options.map((subject) => {
            const selected = selectedIds.has(subject.subjectOfferingId);
            return (
              <button
                type="button"
                key={subject.subjectOfferingId}
                className={"semester-option " + (selected ? "selected" : "")}
                onClick={() => onToggle(subject.subjectOfferingId)}
              >
                <span className="semester-option-check">{selected ? <FiCheck /> : null}</span>
                <span>
                  <strong>{subjectLabel(subject)}</strong>
                  <small>{subject.subjectCode}{subject.credits != null ? " • " + subject.credits + " credits" : ""}</small>
                </span>
              </button>
            );
          }) : (
            <span className="semester-empty-inline">No {title.toLowerCase()} options are configured for this semester.</span>
          )}
        </div>
      )}
    </section>
  );
}

function SubjectSelectionModal({ subjects, selectedIds, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => new Set(selectedIds));
  const [saving, setSaving] = useState(false);

  const selectable = useMemo(
    () => subjects.filter((subject) => [CATEGORY.ELECTIVE, CATEGORY.HONOR, CATEGORY.PRACTICAL].includes(categoryOf(subject))),
    [subjects]
  );

  const groups = {
    [CATEGORY.ELECTIVE]: selectable.filter((s) => categoryOf(s) === CATEGORY.ELECTIVE),
    [CATEGORY.HONOR]: selectable.filter((s) => categoryOf(s) === CATEGORY.HONOR),
    [CATEGORY.PRACTICAL]: selectable.filter((s) => categoryOf(s) === CATEGORY.PRACTICAL)
  };

  const toggle = (id) => {
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      const response = await updateCurrentSubjectSelections([...draft]);
      const saved = response.data?.data?.selectedSubjectOfferingIds || [];
      toast.success("Current semester subjects updated.");
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update subjects.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="semester-subject-overlay" role="dialog" aria-modal="true" aria-label="Current Semester Subjects">
      <div className="semester-subject-modal">
        <aside className="semester-subject-art">
          <div className="semester-subject-brand"><FiBookOpen /> Noteswala</div>
          <div className="semester-subject-art-copy">
            <small>Academic profile</small>
            <h2>Update Your<br /><em>Current Semester</em><br />Subjects</h2>
            <p>Regular subjects are loaded automatically. Select only the elective, honor and practical subjects you are currently studying.</p>
          </div>
          <div className="semester-subject-art-books" aria-hidden="true">
            <span>NOTES</span><span>PRACTICAL</span><span>PYQ</span><span>REFERENCES</span>
          </div>
        </aside>

        <section className="semester-subject-main">
          <button type="button" className="semester-subject-close" onClick={onClose} aria-label="Close"><FiX /></button>
          <header className="semester-subject-heading">
            <h1><FiBookOpen /> Current Semester Subjects</h1>
            <p>Select your current subjects. Regular subjects cannot be manually changed.</p>
          </header>

          <div className="semester-subject-scroll">
            <div className="semester-subject-info">
              <FiFlag />
              <span><strong>Regular subjects are automatic.</strong> They come directly from your current academic context. Only optional categories can be selected below.</span>
            </div>

            <CategoryCard
              title="Regular Subjects"
              icon={FiBookOpen}
              tone="blue"
              subjects={subjects.filter((subject) => categoryOf(subject) === CATEGORY.REGULAR && subject.mandatory)}
            />

            {groups[CATEGORY.ELECTIVE].length > 0 && (
              <CategoryCard title="Elective Subjects" icon={FiLayers} tone="purple" selectable
                subjects={groups[CATEGORY.ELECTIVE]} options={groups[CATEGORY.ELECTIVE]}
                selectedIds={draft} onToggle={toggle} />
            )}
            {groups[CATEGORY.HONOR].length > 0 && (
              <CategoryCard title="Honor Subjects" icon={FiFlag} tone="green" selectable
                subjects={groups[CATEGORY.HONOR]} options={groups[CATEGORY.HONOR]}
                selectedIds={draft} onToggle={toggle} />
            )}
            {groups[CATEGORY.PRACTICAL].length > 0 && (
              <CategoryCard title="Practical Subjects" icon={FiActivity} tone="gold" selectable
                subjects={groups[CATEGORY.PRACTICAL]} options={groups[CATEGORY.PRACTICAL]}
                selectedIds={draft} onToggle={toggle} />
            )}

            {!selectable.length && (
              <div className="semester-no-options">
                <FiBookOpen />
                <strong>No optional subjects are configured for this semester.</strong>
                <span>Your regular subjects will still be displayed automatically.</span>
              </div>
            )}
          </div>

          <footer className="semester-subject-actions">
            <button type="button" className="semester-subject-cancel" onClick={onClose}><FiX /> Cancel</button>
            <button type="button" className="semester-subject-save" onClick={save} disabled={saving}>
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export default function CurrentSemesterSubjectsCard({ academic }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    if (!academic?.semesterId) {
      setSubjects([]);
      setSelectedIds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [subjectsResponse, selectionsResponse] = await Promise.all([
        getCurrentAcademicSubjects(),
        getCurrentSubjectSelections()
      ]);
      setSubjects(responseList(subjectsResponse, "subjects"));
      const selectionPayload = selectionsResponse?.data?.data ?? selectionsResponse?.data ?? {};
      setSelectedIds(
        Array.isArray(selectionPayload)
          ? selectionPayload
          : (selectionPayload.selectedSubjectOfferingIds || [])
      );
    } catch (error) {
      setSubjects([]);
      setSelectedIds([]);
      toast.error(error?.response?.data?.message || "Unable to load current semester subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [
    academic?.universityId,
    academic?.branchId,
    academic?.programId,
    academic?.examPatternId,
    academic?.academicYearId,
    academic?.semesterId,
    academic?.currentYear
  ]);

  const regular = useMemo(
    () => subjects.filter((s) => categoryOf(s) === CATEGORY.REGULAR && s.mandatory),
    [subjects]
  );

  const byId = useMemo(
    () => new Map(subjects.map((subject) => [subject.subjectOfferingId, subject])),
    [subjects]
  );

  const selected = useMemo(
    () => selectedIds.map((id) => byId.get(id)).filter(Boolean),
    [selectedIds, byId]
  );

  const elective = selected.filter((s) => categoryOf(s) === CATEGORY.ELECTIVE);
  const honor = selected.filter((s) => categoryOf(s) === CATEGORY.HONOR);
  const practical = selected.filter((s) => categoryOf(s) === CATEGORY.PRACTICAL);

  return (
    <>
      <section className="profile-card semester-subject-card">
        <header>
          <div>
            <h2><FiBookOpen /> Current Semester Subjects</h2>
            <p>Manage your current semester subjects. Regular subjects are loaded automatically.</p>
          </div>
          <div className="semester-subject-header-actions">
            {academic?.semesterName && <span className="semester-badge"><FiBookOpen /> {academic.semesterName}</span>}
            <button type="button" className="profile-edit-btn" onClick={() => setEditing(true)} disabled={loading || !academic?.semesterId}>
              <FiEdit3 /> Edit
            </button>
          </div>
        </header>

        {!academic?.semesterId ? (
          <div className="semester-subject-state"><FiBookOpen /><strong>Select your current semester in Academic Information first.</strong></div>
        ) : loading ? (
          <div className="semester-subject-state"><span className="semester-loading-dot" /> Loading subjects for {academic.semesterName || "your semester"}...</div>
        ) : (
          <div className="semester-category-grid">
            <CategoryCard title="Regular" icon={FiBookOpen} tone="blue" subjects={regular} />
            <CategoryCard title="Elective" icon={FiLayers} tone="purple" subjects={elective} selectable={false} selectedIds={new Set()} onToggle={() => {}} options={[]} />
            <CategoryCard title="Honor" icon={FiFlag} tone="green" subjects={honor} selectable={false} selectedIds={new Set()} onToggle={() => {}} options={[]} />
            <CategoryCard title="Practical" icon={FiActivity} tone="gold" subjects={practical} selectable={false} selectedIds={new Set()} onToggle={() => {}} options={[]} />
          </div>
        )}
      </section>

      {editing && (
        <SubjectSelectionModal
          subjects={subjects}
          selectedIds={selectedIds}
          onClose={() => setEditing(false)}
          onSaved={(ids) => {
            setSelectedIds(ids);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
