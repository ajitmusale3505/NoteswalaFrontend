import {
  FiAward, FiBook, FiBookOpen, FiBriefcase, FiCheckCircle, FiCode,
  FiFile, FiFileText, FiFlask, FiHelpCircle, FiLayers, FiList,
  FiMessageCircle, FiPackage, FiPenTool, FiPuzzle, FiSave, FiXCircle,
} from "react-icons/fi";

export const CATEGORY_ICONS = [
  { value: "book-open", label: "Books", Icon: FiBookOpen },
  { value: "file-text", label: "Document", Icon: FiFileText },
  { value: "flask", label: "Lab", Icon: FiFlask },
  { value: "code", label: "Code", Icon: FiCode },
  { value: "help-circle", label: "Questions", Icon: FiHelpCircle },
  { value: "file", label: "File", Icon: FiFile },
  { value: "message-circle", label: "Discussion", Icon: FiMessageCircle },
  { value: "package", label: "Bundle", Icon: FiPackage },
  { value: "layers", label: "Materials", Icon: FiLayers },
  { value: "award", label: "Premium", Icon: FiAward },
  { value: "book", label: "Reference", Icon: FiBook },
  { value: "briefcase", label: "Career", Icon: FiBriefcase },
  { value: "list", label: "List", Icon: FiList },
  { value: "pen-tool", label: "Handwritten", Icon: FiPenTool },
  { value: "puzzle", label: "Practice", Icon: FiPuzzle },
];

export function CategoryIcon({ value, className = "" }) {
  const selected = CATEGORY_ICONS.find((item) => item.value === value) || CATEGORY_ICONS[0];
  const Icon = selected.Icon;
  return <Icon className={className} aria-hidden="true" />;
}

export default function CategoryEditorPanel({
  form,
  isEditing,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <aside className="admin-category-editor" aria-labelledby="admin-category-editor-title">
      <header className="admin-category-editor-heading">
        <div className="admin-category-editor-title-icon"><FiLayers /></div>
        <div>
          <h2 id="admin-category-editor-title">{isEditing ? "Edit Category" : "Add New Category"}</h2>
          <p>{isEditing ? "Update category information and availability." : "Create a new resource category to organize your content."}</p>
        </div>
        <button className="admin-category-icon-button" type="button" onClick={onClose} aria-label="Close category form" title="Close"><FiXCircle /></button>
      </header>

      <form className="admin-category-form" onSubmit={onSubmit}>
        <label className="admin-category-field">
          <span>Category Name <b>*</b></span>
          <input
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            maxLength={100}
            required
            autoComplete="off"
            placeholder="e.g. Class Notes"
          />
        </label>

        <label className="admin-category-field">
          <span>Slug <b>*</b></span>
          <input
            value={form.slug}
            onChange={(event) => onChange("slug", event.target.value)}
            maxLength={120}
            pattern="[a-zA-Z0-9]+([a-zA-Z0-9-]*[a-zA-Z0-9]+)?"
            title="Use lowercase letters, numbers, and hyphens."
            required
            autoComplete="off"
            placeholder="e.g. class-notes"
          />
          <small>Used in URLs (letters, numbers and hyphens).</small>
        </label>

        <label className="admin-category-field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Provide a short description about this category…"
          />
          <small className="admin-category-character-count">{form.description.length}/500</small>
        </label>

        <fieldset className="admin-category-icon-field">
          <legend>Icon</legend>
          <div className="admin-category-icon-grid">
            {CATEGORY_ICONS.map(({ value, label, Icon }) => (
              <button
                type="button"
                key={value}
                className={form.icon === value ? "is-selected" : ""}
                onClick={() => onChange("icon", value)}
                aria-label={label}
                aria-pressed={form.icon === value}
                title={label}
              >
                <Icon aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="admin-category-status-field">
          <legend>Status</legend>
          <label className={form.active ? "is-selected" : ""}>
            <input type="radio" name="category-status" value="active" checked={form.active} onChange={() => onChange("active", true)} />
            <FiCheckCircle />
            <span><strong>Active</strong><small>Category will be available for use.</small></span>
          </label>
          <label className={!form.active ? "is-selected is-inactive" : ""}>
            <input type="radio" name="category-status" value="inactive" checked={!form.active} onChange={() => onChange("active", false)} />
            <FiXCircle />
            <span><strong>Inactive</strong><small>Category will be hidden from students.</small></span>
          </label>
        </fieldset>

        <div className="admin-category-form-actions">
          <button type="button" className="admin-category-secondary-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="admin-category-primary-button" disabled={saving}>
            {saving ? <span className="admin-category-button-spinner" /> : <FiSave />}
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </aside>
  );
}
