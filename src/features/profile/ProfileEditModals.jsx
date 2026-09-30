import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAward, FiBookOpen, FiCalendar, FiCheck, FiChevronDown, FiFileText, FiBriefcase, FiCode, FiTarget,
  FiMapPin, FiPhone, FiSave, FiUpload, FiUser, FiUsers, FiX, FiInfo, FiBold, FiItalic, FiUnderline, FiList, FiLink, FiZap
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getAcademicYearsByUniversity, getBranchesByCollege, getCollegesByUniversity,
  getExamPatternsByUniversity, getSemestersByAcademicYear, getUniversities, patchAcademicProfile
} from "../../services/academicService";
import { getPersonalProfile, updatePersonalProfile, updateAboutMe } from "../../services/profileService";
import { CITY_BY_STATE, INDIAN_STATES } from "./locationData";

const list = (r) => Array.isArray(r?.data) ? r.data : r?.data?.data || [];
const id = (x) => x?.id ?? x?.universityId ?? x?.collegeId ?? x?.branchId ?? x?.academicYearId ?? x?.semesterId;
const name = (x) => x?.name ?? x?.universityName ?? x?.collegeName ?? x?.branchName ?? x?.academicYearName ?? x?.semesterName;

function SelectField({ label, icon: Icon, value, onChange, options, placeholder, disabled = false }) {
  return (
    <label className="profile-edit-field">
      <span><Icon />{label}</span>
      <div className="profile-edit-select">
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="">{placeholder}</option>
          {options.map((x) => <option key={String(x.value ?? id(x))} value={x.value ?? id(x)}>{x.label ?? name(x)}</option>)}
        </select>
        <FiChevronDown />
      </div>
    </label>
  );
}

function InputField({ label, icon: Icon, value, onChange, type = "text", disabled = false, placeholder = "", required = false, ...rest }) {
  return (
    <label className="profile-edit-field">
      <span><Icon />{label}{required && <b>*</b>}</span>
      <div className={"profile-edit-input " + (disabled ? "muted" : "")}>
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} {...rest} />
      </div>
    </label>
  );
}

function GenderField({ value, onChange }) {
  return (
    <div className="profile-edit-field">
      <span><FiUsers />Gender<b>*</b></span>
      <div className="profile-edit-genders">
        {["MALE", "FEMALE", "OTHER"].map((item) => (
          <button type="button" key={item} className={value === item ? "selected" : ""} onClick={() => onChange(item)}>
            {value === item && <FiCheck />}{item[0] + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditShell({ title, artTitle, subtitle, eyebrow, image, onClose, children, onSave, saving }) {
  return (
    <div className="profile-edit-overlay" role="dialog" aria-modal="true">
      <div className="profile-edit-modal">
        <aside className="profile-edit-art">
          <div className="profile-edit-brand"><FiBookOpen /> EduHub</div>
          <div className="profile-edit-art-copy">
            <small>{eyebrow}</small>
            <h2>{artTitle || title}</h2>
            <p>{subtitle}</p>
          </div>
          <img src={image} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </aside>
        <section className="profile-edit-main">
          <button type="button" className="profile-edit-close" onClick={onClose}><FiX /></button>
          <header className="profile-edit-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          <div className="profile-edit-scroll">{children}</div>
          <footer className="profile-edit-actions">
            <button type="button" className="profile-edit-cancel" onClick={onClose}>Cancel</button>
            <button type="button" className="profile-edit-save" onClick={onSave} disabled={saving}>
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export function PersonalProfileEditModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phoneNumber: "", dateOfBirth: "", gender: "",
    state: "", city: "", address: "", aboutMe: "", skills: [], interests: [],
    preferredRole: "", preferredLocation: "", employmentType: "", availability: ""
  });
  const initialForm = useRef(null);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    getPersonalProfile()
      .then((r) => {
        const d = r.data?.data || {};
        const loaded = {
          fullName: d.fullName || "",
          email: d.email || "",
          phoneNumber: d.phoneNumber || "",
          dateOfBirth: d.dateOfBirth || "",
          gender: d.gender || "",
          state: d.state || "",
          city: d.city || "",
          address: d.address || "",
          aboutMe: d.aboutMe || "",
          skills: Array.isArray(d.skills) ? d.skills : [],
          interests: Array.isArray(d.interests) ? d.interests : [],
          preferredRole: d.preferredRole || "",
          preferredLocation: d.preferredLocation || "",
          employmentType: d.employmentType || "",
          availability: d.availability || ""
        };
        initialForm.current = loaded;
        setForm(loaded);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Unable to load personal profile."))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => CITY_BY_STATE[form.state] || [], [form.state]);

  const save = async () => {
    const initial = initialForm.current || {};
    const payload = {};
    const keys = ["fullName", "phoneNumber", "dateOfBirth", "gender", "state", "city", "address", "aboutMe", "preferredRole", "preferredLocation", "employmentType", "availability"];

    keys.forEach((key) => {
      const current = typeof form[key] === "string" ? form[key].trim() : form[key];
      const previous = typeof initial[key] === "string" ? initial[key].trim() : initial[key];
      if (current && current !== previous) {
        payload[key] = current;
      }
    });

    if (payload.phoneNumber && !/^[6-9]\d{9}$/.test(payload.phoneNumber)) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (Array.isArray(form.skills) && JSON.stringify(form.skills) !== JSON.stringify(initial.skills || [])) {
      payload.skills = form.skills.filter(Boolean);
    }
    if (Array.isArray(form.interests) && JSON.stringify(form.interests) !== JSON.stringify(initial.interests || [])) {
      payload.interests = form.interests.filter(Boolean);
    }

    if (!Object.keys(payload).length) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);
      const r = await updatePersonalProfile(payload);
      toast.success("Personal information updated.");
      onSaved(r.data?.data);
    } catch (e) {
      const data = e?.response?.data;
      toast.error(data?.message || "Unable to update personal information.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditShell
      eyebrow="Keep your profile up to date"
      title="Personal Information"
      artTitle="Update Your Personal Information"
      subtitle="Update your basic details. This information will be visible on your profile."
      image="/images/profile-edit/personal-information-art.png"
      onClose={onClose}
      onSave={save}
      saving={saving || loading}
    >
      {loading ? <div className="profile-edit-loading">Loading your personal information...</div> : (
        <>
          <div className="profile-photo-row">
            <div className="profile-photo-placeholder">{form.fullName.trim().charAt(0).toUpperCase() || "A"}</div>
            <div><strong>Profile Photo</strong><button type="button" className="profile-photo-button"><FiUpload /> Upload New Photo</button><small>JPG, PNG (Max 2MB)</small></div>
          </div>
          <div className="profile-edit-grid two">
            <InputField label="Full Name" icon={FiUser} value={form.fullName} onChange={(v) => set("fullName", v)} />
            <InputField label="Email Address" icon={FiBookOpen} value={form.email} disabled onChange={() => {}} />
            <InputField label="Phone Number" icon={FiPhone} value={form.phoneNumber} onChange={(v) => set("phoneNumber", v.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" />
            <InputField label="Date of Birth" icon={FiCalendar} value={form.dateOfBirth} type="date" onChange={(v) => set("dateOfBirth", v)} />
            <GenderField value={form.gender} onChange={(v) => set("gender", v)} />
            <div className="profile-edit-field"><span><FiMapPin />Location<b>*</b></span><div className="profile-edit-location"><SelectField label="" icon={FiMapPin} value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v, city: "" }))} options={INDIAN_STATES.map((x) => ({ value: x, label: x }))} placeholder="State" /><SelectField label="" icon={FiMapPin} value={form.city} onChange={(v) => set("city", v)} options={cities.map((x) => ({ value: x, label: x }))} placeholder="City" disabled={!form.state} /></div></div>
          </div>
          <label className="profile-edit-field full"><span><FiMapPin />Address <small>(Optional)</small></span><div className="profile-edit-textarea"><textarea maxLength={200} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Enter your address (Optional)" /><small>{form.address.length}/200</small></div></label>
          <div className="profile-edit-section-label">Career Preferences</div>
          <div className="profile-edit-grid two">
            <InputField label="Preferred Role" icon={FiBriefcase} value={form.preferredRole} onChange={(v) => set("preferredRole", v)} placeholder="e.g. Java Full Stack Developer" />
            <InputField label="Preferred Location" icon={FiMapPin} value={form.preferredLocation} onChange={(v) => set("preferredLocation", v)} placeholder="e.g. Pune, Bengaluru, Remote" />
            <InputField label="Employment Type" icon={FiBriefcase} value={form.employmentType} onChange={(v) => set("employmentType", v)} placeholder="e.g. Full Time / Internship" />
            <InputField label="Availability" icon={FiCalendar} value={form.availability} onChange={(v) => set("availability", v)} placeholder="e.g. Available to join from Oct 2026" />
          </div>
          <label className="profile-edit-field full"><span><FiCode />Skills <small>(comma separated)</small></span><div className="profile-edit-input"><input value={form.skills.join(", ")} onChange={(e) => set("skills", e.target.value.split(",").map(x => x.trim()).filter(Boolean))} placeholder="Java, Spring Boot, React.js" /></div></label>
          <label className="profile-edit-field full"><span><FiTarget />Interests <small>(comma separated)</small></span><div className="profile-edit-input"><input value={form.interests.join(", ")} onChange={(e) => set("interests", e.target.value.split(",").map(x => x.trim()).filter(Boolean))} placeholder="Web Development, AI & ML" /></div></label>
        </>
      )}
    </EditShell>
  );
}

export function AcademicProfileEditModal({ academic, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [years, setYears] = useState([]);
  const [examPatterns, setExamPatterns] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [form, setForm] = useState({
    universityId: academic?.universityId || "",
    collegeId: academic?.collegeId || "",
    branchId: academic?.branchId || "",
    academicYearId: academic?.academicYearId || "",
    examPatternId: academic?.examPatternId || "",
    semesterId: academic?.semesterId || "",
    currentStatus: academic?.currentStatus === "Studying" ? "Pursuing" : (academic?.currentStatus || ""),
    graduationYear: academic?.graduationYear ? String(academic.graduationYear) : "",
    cgpa: academic?.cgpa ?? ""
  });
  const initialForm = useRef({ ...form });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    getUniversities()
      .then((r) => setUniversities(list(r)))
      .catch(() => toast.error("Unable to load universities."));
  }, []);

  useEffect(() => {
    if (!form.universityId) {
      setColleges([]);
      setYears([]);
      setExamPatterns([]);
      setSemesters([]);
      return;
    }

    Promise.all([
      getCollegesByUniversity(form.universityId),
      getAcademicYearsByUniversity(form.universityId),
      getExamPatternsByUniversity(form.universityId)
    ])
      .then(([collegeResponse, yearResponse, examPatternResponse]) => {
        setColleges(list(collegeResponse));
        setYears(list(yearResponse));
        setExamPatterns(list(examPatternResponse));
      })
      .catch(() => toast.error("Unable to load academic options."));
  }, [form.universityId]);

  useEffect(() => {
    if (!form.collegeId) {
      setBranches([]);
      return;
    }

    getBranchesByCollege(form.collegeId)
      .then((r) => setBranches(list(r)))
      .catch(() => toast.error("Unable to load branches."));
  }, [form.collegeId]);

  useEffect(() => {
    if (!form.academicYearId) {
      setSemesters([]);
      return;
    }

    getSemestersByAcademicYear(form.academicYearId)
      .then((r) => {
        const available = list(r);
        setSemesters(available);
        if (form.semesterId && !available.some((semester) => String(id(semester)) === String(form.semesterId))) {
          set("semesterId", "");
        }
      })
      .catch(() => {
        setSemesters([]);
        toast.error("Unable to load semesters.");
      });
  }, [form.academicYearId]);

  const save = async () => {
    const initial = initialForm.current || {};
    const payload = {};

    ["universityId", "collegeId", "branchId", "academicYearId", "examPatternId", "semesterId"].forEach((key) => {
      if (form[key] && form[key] !== initial[key]) {
        payload[key] = form[key];
      }
    });

    if (form.currentStatus && form.currentStatus !== initial.currentStatus) {
      payload.currentStatus = form.currentStatus;
    }

    if (
      form.graduationYear !== "" &&
      String(form.graduationYear) !== String(initial.graduationYear ?? "")
    ) {
      payload.graduationYear = Number(form.graduationYear);
    }

    if (
      form.cgpa !== "" &&
      form.cgpa != null &&
      String(form.cgpa) !== String(initial.cgpa ?? "")
    ) {
      payload.cgpa = Number(form.cgpa);
    }

    const hierarchyChanged = ["universityId", "collegeId", "branchId", "academicYearId", "examPatternId", "semesterId"]
      .some((key) => Object.prototype.hasOwnProperty.call(payload, key));

    if (hierarchyChanged) {
      if (!form.universityId || !form.collegeId || !form.branchId || !form.academicYearId || !form.examPatternId || !form.semesterId) {
        toast.error("Please select University, College, Branch, Academic Year, Exam Pattern and Semester.");
        return;
      }
      // PATCH the complete academic context so backend hierarchy validation
      // always evaluates one consistent university/branch/pattern/semester set.
      payload.universityId = form.universityId;
      payload.collegeId = form.collegeId;
      payload.branchId = form.branchId;
      payload.academicYearId = form.academicYearId;
      payload.examPatternId = form.examPatternId;
      payload.semesterId = form.semesterId;
    }

    if (!Object.keys(payload).length) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);
      const response = await patchAcademicProfile(academic.userId, payload);
      toast.success("Academic information updated.");
      onSaved(response.data?.data);
    } catch (e) {
      const details = e?.response?.data?.data && typeof e.response.data.data === "object"
        ? Object.values(e.response.data.data).filter(Boolean).join(" • ")
        : "";
      toast.error(details || e?.response?.data?.message || "Unable to update academic information.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditShell
      eyebrow=""
      title="Academic Information"
      artTitle="Update Your Academic Information"
      subtitle="Update your academic details. This information will be visible on your profile."
      image="/illustrations/engineering-campus.svg"
      onClose={onClose}
      onSave={save}
      saving={saving}
    >
      <div className="profile-edit-grid academic-exact-grid">
        <SelectField
          label="University"
          icon={FiBookOpen}
          value={form.universityId}
          onChange={(value) => setForm((current) => ({
            ...current,
            universityId: value,
            collegeId: value === current.universityId ? current.collegeId : "",
            branchId: value === current.universityId ? current.branchId : "",
            academicYearId: value === current.universityId ? current.academicYearId : ""
          }))}
          options={universities}
          placeholder="Select university"
        />

        <SelectField
          label="College"
          icon={FiBookOpen}
          value={form.collegeId}
          onChange={(value) => setForm((current) => ({
            ...current,
            collegeId: value,
            branchId: value === current.collegeId ? current.branchId : ""
          }))}
          options={colleges}
          placeholder="Select college"
          disabled={!form.universityId}
        />

        <div className="profile-edit-field academic-full">
          <SelectField
            label="Branch"
            icon={FiBookOpen}
            value={form.branchId}
            onChange={(value) => set("branchId", value)}
            options={branches}
            placeholder="Select branch"
            disabled={!form.collegeId}
          />
        </div>

        <div className="profile-edit-field academic-full">
          <SelectField
            label="Current Status"
            icon={FiAward}
            value={form.currentStatus}
            onChange={(value) => set("currentStatus", value)}
            options={[
              { value: "Pursuing", label: "Pursuing" },
              { value: "Completed", label: "Completed" }
            ]}
            placeholder="Select current status"
          />
        </div>

        <SelectField
          label="Academic Year"
          icon={FiCalendar}
          value={form.academicYearId}
          onChange={(value) => setForm((current) => ({
            ...current,
            academicYearId: value,
            semesterId: ""
          }))}
          options={years}
          placeholder="Select academic year"
          disabled={!form.universityId}
        />

        <SelectField
          label="Exam Pattern"
          icon={FiBookOpen}
          value={form.examPatternId}
          onChange={(value) => set("examPatternId", value)}
          options={examPatterns.map((pattern) => ({
            value: pattern.id,
            label: pattern.name
          }))}
          placeholder="Select exam pattern"
          disabled={!form.universityId}
        />

        <SelectField
          label="Semester"
          icon={FiCalendar}
          value={form.semesterId}
          onChange={(value) => set("semesterId", value)}
          options={semesters}
          placeholder={form.academicYearId ? "Select semester" : "Select academic year first"}
          disabled={!form.academicYearId}
        />

        <InputField
          label="CGPA"
          icon={FiAward}
          value={form.cgpa}
          onChange={(value) => set("cgpa", value)}
          type="number"
          min="0"
          max="10"
          step="0.01"
          placeholder="Enter CGPA"
        />

        <InputField
          label="Expected Passout Year"
          icon={FiCalendar}
          value={form.graduationYear}
          onChange={(value) => set("graduationYear", value.replace(/\D/g, "").slice(0, 4))}
          type="number"
          min="2020"
          max="2100"
          placeholder="YYYY"
        />
      </div>

      <div className="academic-edit-info">
        <FiInfo />
        <span>Please make sure the information you enter is correct and matches your official academic records.</span>
      </div>
    </EditShell>
  );
}


export function AboutMeEditModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutMe, setAboutMe] = useState("");
  const editorRef = useRef(null);
  const initialValue = useRef("");

  useEffect(() => {
    getPersonalProfile()
      .then((r) => {
        const value = r.data?.data?.aboutMe || "";
        initialValue.current = value;
        setAboutMe(value);
        if (editorRef.current) editorRef.current.textContent = value;
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Unable to load About Me."))
      .finally(() => setLoading(false));
  }, []);

  const syncEditor = () => {
    const value = editorRef.current?.innerText || "";
    setAboutMe(value.slice(0, 500));
  };

  const command = (name, value = null) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    syncEditor();
  };

  const save = async () => {
    const current = String(aboutMe || "").replace(/\u0000/g, "").trim();
    const previous = initialValue.current.trim();

    if (current === previous) {
      toast("No changes to save.");
      onClose();
      return;
    }

    if (!current) {
      toast.error("Please enter something in About Me.");
      return;
    }

    if (current.length > 500) {
      toast.error("About Me cannot exceed 500 characters.");
      return;
    }

    try {
      setSaving(true);
      await updateAboutMe(current);

      // Read the saved profile again so the parent receives the database value,
      // not a possibly stale PATCH response.
      const refreshed = await getPersonalProfile();
      const refreshedProfile = refreshed.data?.data || {};
      initialValue.current = refreshedProfile.aboutMe || "";
      setAboutMe(refreshedProfile.aboutMe || "");

      toast.success("About Me updated successfully.");
      onSaved(refreshedProfile);
    } catch (e) {
      const data = e?.response?.data;
      const details = data?.data && typeof data.data === "object"
        ? Object.values(data.data).filter(Boolean).join(" • ")
        : "";
      toast.error(details || data?.message || "Unable to update About Me.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditShell
      eyebrow=""
      title="About Me"
      artTitle="Update Your About Me"
      subtitle="Write a short introduction about yourself, your interests, goals, and what you’re passionate about."
      image="/images/profile-edit/about-me-art.png"
      onClose={onClose}
      onSave={save}
      saving={saving || loading}
    >
      {loading ? (
        <div className="profile-edit-loading">Loading your About Me...</div>
      ) : (
        <>
          <div className="about-me-editor-section">
            <label className="profile-edit-field full">
              <span><FiFileText />About Me<b>*</b></span>
              <div className="about-me-editor">
                <div className="about-me-toolbar" role="toolbar" aria-label="About Me formatting">
                  <button type="button" onClick={() => command("formatBlock", "p")} aria-label="Normal">Normal <FiChevronDown /></button>
                  <i />
                  <button type="button" onClick={() => command("bold")} aria-label="Bold"><FiBold /></button>
                  <button type="button" onClick={() => command("italic")} aria-label="Italic"><FiItalic /></button>
                  <button type="button" onClick={() => command("underline")} aria-label="Underline"><FiUnderline /></button>
                  <button type="button" onClick={() => command("insertUnorderedList")} aria-label="Bulleted list"><FiList /></button>
                  <button type="button" onClick={() => command("insertOrderedList")} aria-label="Numbered list"><FiList /></button>
                  <button type="button" onClick={() => {
                    const url = window.prompt("Enter URL");
                    if (url) command("createLink", url);
                  }} aria-label="Insert link"><FiLink /></button>
                  <button type="button" onClick={() => command("removeFormat")} aria-label="Clear formatting"><FiZap /></button>
                  <small>{aboutMe.length}/500</small>
                </div>
                <div
                  ref={editorRef}
                  className="about-me-editor-body"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  data-placeholder={"Tell us about yourself...\\n e.g. your background, interests, skills, goals, or anything you’d like others to know about you."}
                  onInput={syncEditor}
                  onKeyDown={(e) => {
                    if ((editorRef.current?.innerText || "").length >= 500 &&
                        e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </label>
          </div>

          <div className="about-me-tips">
            <div className="about-me-tips-title"><FiInfo /> <strong>Tips for a great About Me</strong></div>
            <ul>
              <li>Keep it concise and genuine (2–4 short paragraphs).</li>
              <li>Mention your interests, skills, and future goals.</li>
              <li>You can also highlight your projects, achievements or what motivates you.</li>
            </ul>
          </div>
        </>
      )}
    </EditShell>
  );
}
