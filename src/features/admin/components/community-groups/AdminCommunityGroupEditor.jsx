import { memo } from "react";
import {
  FiCheckCircle, FiImage, FiPlus, FiUploadCloud, FiUsers, FiX, FiXCircle,
} from "react-icons/fi";

function AdminCommunityGroupEditor(props) {
  const {
    formOpen, editingGroup, closeForm, saving, saveGroup, form, updateForm,
    universities, loadingMasterData, branches, loadingBranches, semesters,
    iconPreview, iconFile, setIconFile,
  } = props;

  if (!formOpen) return null;

  return (
    <aside className="admin-community-editor" aria-label={editingGroup ? "Edit community group" : "Create new community group"}>
                  <header className="admin-community-editor-heading">
                    <div className="admin-community-editor-title-icon"><FiUsers /></div>
                    <div><h2>{editingGroup ? "Edit Group" : "Create New Group"}</h2><p>{editingGroup ? "Update group details and student visibility." : "Create a university group for student discussions."}</p></div>
                    <button type="button" onClick={closeForm} disabled={saving} aria-label="Close form" title="Close"><FiX /></button>
                  </header>
    
                  <form className="admin-community-form" onSubmit={saveGroup}>
                    <label className="admin-community-field">
                      <span>University <b>*</b></span>
                      <select required value={form.universityId} onChange={(event) => updateForm("universityId", event.target.value)} disabled={saving || loadingMasterData}>
                        <option value="">Select university</option>
                        {universities.map((university) => <option value={university.id} key={university.id}>{university.name}</option>)}
                      </select>
                    </label>
    
                    <label className="admin-community-field">
                      <span>Branch <b>*</b></span>
                      <select required value={form.branchId} onChange={(event) => updateForm("branchId", event.target.value)} disabled={saving || !form.universityId || loadingBranches}>
                        <option value="">{loadingBranches ? "Loading branches…" : "Select branch"}</option>
                        {branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name}</option>)}
                      </select>
                    </label>
    
                    <label className="admin-community-field">
                      <span>Semester <b>*</b></span>
                      <select required value={form.semesterId} onChange={(event) => updateForm("semesterId", event.target.value)} disabled={saving || loadingMasterData}>
                        <option value="">Select semester</option>
                        {semesters.map((semester) => <option value={semester.id} key={semester.id}>{semester.name}</option>)}
                      </select>
                    </label>
    
                    <label className="admin-community-field">
                      <span>Group Name <b>*</b></span>
                      <input
                        value={form.name}
                        onChange={(event) => updateForm("name", event.target.value)}
                        maxLength={120}
                        required
                        autoComplete="off"
                        placeholder="e.g. SPPU Computer Engineering"
                        disabled={saving}
                      />
                    </label>
    
                    <label className="admin-community-field">
                      <span>Description</span>
                      <textarea
                        value={form.description}
                        onChange={(event) => updateForm("description", event.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="Provide a clear description about this group…"
                        disabled={saving}
                      />
                      <small className="admin-community-character-count">{form.description.length}/500</small>
                    </label>
    
                    <fieldset className="admin-community-icon-upload">
                      <legend>Group Icon</legend>
                      <label className={`admin-community-icon-drop ${iconPreview || editingGroup?.iconUrl ? "has-image" : ""}`}>
                        <input type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(event) => setIconFile(event.target.files?.[0] || null)} disabled={saving} />
                        {iconPreview || (!iconFile && editingGroup?.iconUrl) ? (
                          <img src={iconPreview || editingGroup.iconUrl} alt="Group icon preview" />
                        ) : <FiImage />}
                        <strong>{iconFile ? iconFile.name : "Click to upload group icon"}</strong>
                        <small>PNG, JPG or WebP up to 2 MB</small>
                        <span><FiUploadCloud /> Choose File</span>
                      </label>
                      {iconFile && <button className="admin-community-clear-icon" type="button" onClick={() => setIconFile(null)} disabled={saving}>Remove selected image</button>}
                    </fieldset>
    
                    <fieldset className="admin-community-status-field">
                      <legend>Status</legend>
                      <label className={form.active ? "is-selected" : ""}>
                        <input type="radio" name="community-group-status" checked={form.active} onChange={() => updateForm("active", true)} disabled={saving} />
                        <FiCheckCircle />
                        <span><strong>Active</strong><small>Group will be visible to eligible students.</small></span>
                      </label>
                      <label className={!form.active ? "is-selected is-inactive" : ""}>
                        <input type="radio" name="community-group-status" checked={!form.active} onChange={() => updateForm("active", false)} disabled={saving} />
                        <FiXCircle />
                        <span><strong>Inactive</strong><small>Group will be hidden from students.</small></span>
                      </label>
                    </fieldset>
    
                    <div className="admin-community-form-actions">
                      <button type="button" className="admin-community-secondary-button" onClick={closeForm} disabled={saving}>Cancel</button>
                      <button type="submit" className="admin-community-primary-button" disabled={saving || loadingMasterData || loadingBranches}>
                        {saving ? <span className="admin-community-button-spinner" /> : <FiPlus />}
                        {saving ? "Saving…" : editingGroup ? "Save Changes" : "Create Group"}
                      </button>
                    </div>
                  </form>
                </aside>
  );
}

export default memo(AdminCommunityGroupEditor);
