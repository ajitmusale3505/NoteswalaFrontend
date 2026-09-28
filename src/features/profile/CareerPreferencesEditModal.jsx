import { useEffect, useMemo, useRef, useState } from "react";
import { FiBriefcase, FiCalendar, FiCheck, FiChevronDown, FiInfo, FiMapPin, FiSave, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getPersonalProfile, updateCareerPreferences } from "../../services/profileService";
import { CAREER_LOCATIONS, EMPLOYMENT_TYPES, AVAILABILITY_OPTIONS, PREDEFINED_CAREER_ROLES } from "./careerPreferencesData";

const normalize = (value) => String(value || "").trim();

function FieldSelect({ label, icon: Icon, value, onChange, options, placeholder }) {
  return (
    <label className="career-field">
      <span><Icon />{label}<b>*</b></span>
      <div className="career-select">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <FiChevronDown />
      </div>
    </label>
  );
}

function EditShell({ onClose, onSave, saving, children }) {
  return (
    <div className="profile-edit-overlay" role="dialog" aria-modal="true" aria-label="Update Career Preferences">
      <div className="profile-edit-modal career-preferences-edit-modal">
        <aside className="profile-edit-art career-preferences-edit-art">
          <div className="profile-edit-brand"><FiBriefcase /> EduHub</div>
          <div className="profile-edit-art-copy">
            <small>Choose your path</small>
            <h2>Update Your<br />Career Preferences</h2>
            <p>Help us understand your career goals so we can provide better opportunities and relevant recommendations.</p>
          </div>
          <img
            src="/images/profile-edit/career-preferences-update-art.svg"
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </aside>

        <section className="profile-edit-main">
          <button type="button" className="profile-edit-close" onClick={onClose} aria-label="Close"><FiX /></button>
          <header className="profile-edit-heading career-heading">
            <h1><FiBriefcase /> Career Preferences</h1>
            <p>Let us know your career interests, preferred location, work type and availability.</p>
          </header>

          <div className="profile-edit-scroll career-preferences-scroll">{children}</div>

          <footer className="profile-edit-actions">
            <button type="button" className="profile-edit-cancel" onClick={onClose}><FiX /> Cancel</button>
            <button type="button" className="profile-edit-save career-save" onClick={onSave} disabled={saving}>
              <FiCheck /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export function CareerPreferencesEditModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    preferredRole: "",
    preferredLocation: [],
    employmentType: "",
    availability: ""
  });
  const initialForm = useRef(null);

  useEffect(() => {
    getPersonalProfile()
      .then((response) => {
        const data = response.data?.data || {};
        const existingLocations = normalize(data.preferredLocation)
          .split(",")
          .map(normalize)
          .filter(Boolean);

        const locations = existingLocations.filter((item) =>
          CAREER_LOCATIONS.some((location) => location.toLowerCase() === item.toLowerCase())
        );

        const loaded = {
          preferredRole: normalize(data.preferredRole),
          preferredLocation: locations,
          employmentType: normalize(data.employmentType),
          availability: normalize(data.availability)
        };

        initialForm.current = loaded;
        setForm(loaded);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Unable to load career preferences.");
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const availableLocations = useMemo(
    () => CAREER_LOCATIONS.filter((location) =>
      !form.preferredLocation.some((selected) => selected.toLowerCase() === location.toLowerCase())
    ),
    [form.preferredLocation]
  );

  const addLocation = (location) => {
    if (!location || form.preferredLocation.length >= 5) return;
    set("preferredLocation", [...form.preferredLocation, location]);
  };

  const removeLocation = (location) => {
    set("preferredLocation", form.preferredLocation.filter((item) => item !== location));
  };

  const save = async () => {
    const initial = initialForm.current || {};
    const payload = {};

    if (form.preferredRole && form.preferredRole !== initial.preferredRole) {
      payload.preferredRole = form.preferredRole;
    }

    const locations = form.preferredLocation.join(", ");
    const previousLocations = (initial.preferredLocation || []).join(", ");
    if (locations && locations !== previousLocations) {
      payload.preferredLocation = locations;
    }

    if (form.employmentType && form.employmentType !== initial.employmentType) {
      payload.employmentType = form.employmentType;
    }

    if (form.availability && form.availability !== initial.availability) {
      payload.availability = form.availability;
    }

    if (!Object.keys(payload).length) {
      toast("No changes to save.");
      onClose();
      return;
    }

    try {
      setSaving(true);
      const response = await updateCareerPreferences(payload);
      toast.success("Career preferences updated successfully.");

      const refreshed = await getPersonalProfile();
      onSaved(refreshed.data?.data || response.data?.data || {});
    } catch (error) {
      const data = error?.response?.data;
      const details = data?.data && typeof data.data === "object"
        ? Object.values(data.data).filter(Boolean).join(" • ")
        : "";
      toast.error(details || data?.message || "Unable to update career preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditShell onClose={onClose} onSave={save} saving={saving || loading}>
      {loading ? (
        <div className="profile-edit-loading">Loading your career preferences...</div>
      ) : (
        <div className="career-preferences-editor">
          <FieldSelect
            label="Preferred Role"
            icon={FiBriefcase}
            value={form.preferredRole}
            onChange={(value) => set("preferredRole", value)}
            options={PREDEFINED_CAREER_ROLES}
            placeholder="Select your preferred role"
          />

          <div className="career-field">
            <span><FiMapPin />Preferred Location<b>*</b></span>
            <div className="career-location-select">
              <div className="career-location-chips">
                {form.preferredLocation.map((location) => (
                  <span key={location}>
                    {location}
                    <button type="button" onClick={() => removeLocation(location)} aria-label={"Remove " + location}><FiX /></button>
                  </span>
                ))}
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value) addLocation(event.target.value);
                  }}
                  disabled={form.preferredLocation.length >= 5}
                  aria-label="Add preferred location"
                >
                  <option value="">Add location</option>
                  {availableLocations.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
                <FiChevronDown />
              </div>
            </div>
            <small className="career-field-hint">Select up to 5 preferred locations.</small>
          </div>

          <div className="career-field">
            <span><FiBriefcase />Employment Type<b>*</b></span>
            <div className="career-employment-options">
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={form.employmentType === type ? "selected" : ""}
                  onClick={() => set("employmentType", type)}
                >
                  <span className="career-radio">{form.employmentType === type ? <FiCheck /> : null}</span>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <FieldSelect
            label="Availability"
            icon={FiCalendar}
            value={form.availability}
            onChange={(value) => set("availability", value)}
            options={AVAILABILITY_OPTIONS}
            placeholder="Select availability"
          />

          <div className="career-info">
            <FiInfo />
            <span>Select the month from which you are available to join.</span>
          </div>
        </div>
      )}
    </EditShell>
  );
}
