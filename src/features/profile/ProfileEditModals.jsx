import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAward, FiBookOpen, FiCalendar, FiCheck, FiChevronDown, FiFileText,
  FiMapPin, FiPhone, FiSave, FiUpload, FiUser, FiUsers, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  getAcademicYearsByUniversity, getBranchesByCollege, getCollegesByUniversity,
  getSemestersByAcademicYear, getUniversities, patchAcademicProfile
} from "../../services/academicService";
import { getPersonalProfile, updatePersonalProfile } from "../../services/profileService";
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
    state: "", city: "", address: ""
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
          address: d.address || ""
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
    const keys = ["fullName", "phoneNumber", "dateOfBirth", "gender", "state", "city", "address"];

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
  const [semesters, setSemesters] = useState([]);
  const [form, setForm] = useState({
    universityId: academic?.universityId || "", collegeId: academic?.collegeId || "",
    branchId: academic?.branchId || "", academicYearId: academic?.academicYearId || "",
    semesterId: academic?.semesterId || "", degree: academic?.degree || "",
    mode: academic?.mode || "", currentStatus: academic?.currentStatus || "",
    graduationYear: academic?.graduationYear ? String(academic.graduationYear) : "",
    currentYear: academic?.currentYear ? String(academic.currentYear) : "",
    cgpa: academic?.cgpa ?? "", lastYearSgpa: academic?.lastYearSgpa ?? "",
    tenthPercentage: academic?.tenthPercentage ?? "", twelfthPercentage: academic?.twelfthPercentage ?? "",
    diplomaDetails: academic?.diplomaDetails || "", additionalInformation: academic?.additionalInformation || ""
  });
  const initialForm = useRef(null);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    initialForm.current = { ...form };
  }, []);

  useEffect(() => { getUniversities().then((r) => setUniversities(list(r))).catch(() => toast.error("Unable to load universities.")); }, []);
  useEffect(() => {
    if (!form.universityId) return;
    Promise.all([getCollegesByUniversity(form.universityId), getAcademicYearsByUniversity(form.universityId)])
      .then(([a, b]) => { setColleges(list(a)); setYears(list(b)); }).catch(() => toast.error("Unable to load academic data."));
  }, [form.universityId]);
  useEffect(() => {
    if (!form.collegeId) return;
    getBranchesByCollege(form.collegeId).then((r) => setBranches(list(r))).catch(() => toast.error("Unable to load branches."));
  }, [form.collegeId]);
  useEffect(() => {
    if (!form.academicYearId) return;
    getSemestersByAcademicYear(form.academicYearId).then((r) => setSemesters(list(r))).catch(() => toast.error("Unable to load semesters."));
  }, [form.academicYearId]);

  const save = async () => {
    const initial = initialForm.current || {};
    const payload = {};

    const hierarchyKeys = ["universityId", "collegeId", "branchId", "academicYearId", "semesterId"];
    const hierarchyChanged = hierarchyKeys.some((key) => form[key] !== initial[key]);

    if (hierarchyChanged) {
      if (!hierarchyKeys.every((key) => String(form[key] || "").trim())) {
        toast.error("Please keep the academic hierarchy complete when changing university, college, branch, academic year, or semester.");
        return;
      }
      hierarchyKeys.forEach((key) => {
        if (form[key] !== initial[key]) payload[key] = form[key];
      });
    }

    const textKeys = ["degree", "mode", "currentStatus", "diplomaDetails", "additionalInformation"];
    textKeys.forEach((key) => {
      const current = typeof form[key] === "string" ? form[key].trim() : form[key];
      const previous = typeof initial[key] === "string" ? initial[key].trim() : initial[key];
      if (current && current !== previous) payload[key] = current;
    });

    const numericKeys = [
      ["graduationYear", "graduationYear"],
      ["currentYear", "currentYear"],
      ["cgpa", "cgpa"],
      ["lastYearSgpa", "lastYearSgpa"],
      ["tenthPercentage", "tenthPercentage"],
      ["twelfthPercentage", "twelfthPercentage"]
    ];
    numericKeys.forEach(([key, apiKey]) => {
      if (form[key] !== "" && form[key] != null && String(form[key]) !== String(initial[key] ?? "")) {
        payload[apiKey] = Number(form[key]);
      }
    });

    if (!Object.keys(payload).length) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);
      const r = await patchAcademicProfile(academic.userId, payload);
      toast.success("Academic information updated.");
      onSaved(r.data?.data);
    } catch (e) {
      const details = e?.response?.data?.data && typeof e.response.data.data === "object"
        ? Object.values(e.response.data.data).filter(Boolean).join(" • ") : "";
      toast.error(details || e?.response?.data?.message || "Unable to update academic information.");
    } finally { setSaving(false); }
  };

  return (
    <EditShell
      eyebrow="Keep your academic details updated"
      title="Academic Information"
      artTitle="Update Your Academic Information"
      subtitle="Update your academic details. This information will be visible on your profile."
      image="/images/profile-edit/academic-information-art.png"
      onClose={onClose}
      onSave={save}
      saving={saving}
    >
      <div className="profile-edit-grid two">
        <SelectField label="University" icon={FiBookOpen} value={form.universityId} onChange={(v) => setForm((f) => ({ ...f, universityId: v, collegeId: "", branchId: "", academicYearId: "", semesterId: "" }))} options={universities} placeholder="Select university" />
        <SelectField label="College" icon={FiBookOpen} value={form.collegeId} onChange={(v) => setForm((f) => ({ ...f, collegeId: v, branchId: "" }))} options={colleges} placeholder="Select college" disabled={!form.universityId} />
        <SelectField label="Branch / Department" icon={FiBookOpen} value={form.branchId} onChange={(v) => set("branchId", v)} options={branches} placeholder="Select branch" disabled={!form.collegeId} />
        <SelectField label="Degree" icon={FiAward} value={form.degree} onChange={(v) => set("degree", v)} options={["B.E. (Bachelor of Engineering)", "B.Tech (Bachelor of Technology)", "M.E. (Master of Engineering)", "M.Tech (Master of Technology)"].map((x) => ({ value: x, label: x }))} placeholder="Select degree" />
        <SelectField label="Mode" icon={FiBookOpen} value={form.mode} onChange={(v) => set("mode", v)} options={["Regular", "Distance"].map((x) => ({ value: x, label: x }))} placeholder="Select mode" />
        <SelectField label="Academic Year" icon={FiCalendar} value={form.academicYearId} onChange={(v) => setForm((f) => ({ ...f, academicYearId: v, semesterId: "" }))} options={years} placeholder="Select academic year" disabled={!form.universityId} />
        <SelectField label="Current Status" icon={FiAward} value={form.currentStatus} onChange={(v) => set("currentStatus", v)} options={["Studying", "Completed", "On Hold", "Dropped"].map((x) => ({ value: x, label: x }))} placeholder="Select status" />
        <InputField label="Expected / Actual Passout Year" icon={FiCalendar} value={form.graduationYear} onChange={(v) => set("graduationYear", v.replace(/\D/g, "").slice(0, 4))} />
        <InputField label="CGPA / Percentage" icon={FiAward} value={form.cgpa} onChange={(v) => set("cgpa", v)} type="number" step="0.01" />
        <InputField label="Last Year SGPA / Percentage" icon={FiAward} value={form.lastYearSgpa} onChange={(v) => set("lastYearSgpa", v)} type="number" step="0.01" />
        <InputField label="10th Percentage" icon={FiBookOpen} value={form.tenthPercentage} onChange={(v) => set("tenthPercentage", v)} type="number" step="0.01" />
        <InputField label="12th Percentage" icon={FiBookOpen} value={form.twelfthPercentage} onChange={(v) => set("twelfthPercentage", v)} type="number" step="0.01" />
        <SelectField label="Diploma Details" icon={FiFileText} value={form.diplomaDetails} onChange={(v) => set("diplomaDetails", v)} options={["None", "Diploma in Engineering", "Other Diploma"].map((x) => ({ value: x, label: x }))} placeholder="Select diploma" />
        <label className="profile-edit-field full"><span><FiFileText />Additional Information <small>(Optional)</small></span><div className="profile-edit-textarea"><textarea maxLength={300} value={form.additionalInformation} onChange={(e) => set("additionalInformation", e.target.value)} placeholder="Add any additional academic information (e.g., achievements, scholarships, etc.)" /><small>{form.additionalInformation.length}/300</small></div></label>
      </div>
      <div className="profile-edit-semester"><SelectField label="Current Semester" icon={FiCalendar} value={form.semesterId} onChange={(v) => set("semesterId", v)} options={semesters} placeholder="Select current semester" disabled={!form.academicYearId} /><InputField label="Current Year" icon={FiBookOpen} value={form.currentYear} onChange={(v) => set("currentYear", v)} type="number" min="1" max="10" /></div>
    </EditShell>
  );
}
