import {
  FiDownload, FiBookOpen, FiCalendar, FiCheckCircle,
  FiUploadCloud, FiEye, FiFileText, FiImage, FiInfo, FiHome, FiMapPin, FiTag, FiX,
} from "react-icons/fi";

const uploadSteps = [
  ["Resource File", "Upload your files"],
  ["Basic Details", "Title, type, description"],
  ["Academic Mapping", "University, branch, subject"],
  ["Access & Pricing", "Free or paid settings"],
  ["Additional Info", "Tags, preview, settings"],
];

export function UploadStepper({ activeStep = 1, onStepSelect }) {
  return (
    <nav className="admin-upload-stepper" aria-label="Upload resource steps">
      {uploadSteps.map(([title, subtitle], index) => (
        <button type="button" className={`admin-upload-step ${activeStep === index + 1 ? "is-active" : ""} ${activeStep > index + 1 ? "is-complete" : ""}`}
          key={title} onClick={() => onStepSelect(index + 1)}>
          <span className="admin-upload-step-number">{activeStep > index + 1 ? <FiCheckCircle /> : index + 1}</span>
          <span className="admin-upload-step-copy"><strong>{title}</strong><small>{subtitle}</small></span>
          {index < uploadSteps.length - 1 && <span className="admin-upload-step-connector" aria-hidden="true" />}
        </button>
      ))}
    </nav>
  );
}

export function UploadPanelHeading({ number, title, description, icon: Icon }) {
  return (
    <div className="admin-upload-panel-heading">
      {Icon ? <span className="admin-upload-heading-icon"><Icon /></span> : <span className="admin-upload-number">{number}</span>}
      <div><h2>{title}</h2><p>{description}</p></div>
    </div>
  );
}

function formatFileSize(size = 0) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadFilePanel({ pdfFile, onPdfSelect, onPdfRemove, thumbnail, coverImage, previewImage, onImageSelect, onImageRemove }) {
  const pick = (event, kind) => {
    const file = event.target.files?.[0];
    if (file) onImageSelect(kind, file);
    event.target.value = "";
  };

  return (
    <section className="admin-upload-card admin-upload-files-panel" id="upload-step-1">
      <UploadPanelHeading number="1" title="Upload Files" description="Upload PDF and optional images for preview" />
      <label className="admin-pdf-dropzone" onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) onPdfSelect(file); }}>
        <input type="file" accept="application/pdf,.pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPdfSelect(file); event.target.value = ""; }} />
        <FiFileText className="admin-pdf-drop-icon" />
        <strong>Drop PDF file here</strong><span>or click to browse</span><small>Only PDF files are allowed (Max 25 MB; total files under 29 MB)</small>
        <span className="admin-choose-file"><FiUploadCloud /> Choose PDF File</span>
      </label>

      {pdfFile && <div className="admin-selected-file">
        <span className="admin-selected-file-icon"><FiFileText /></span>
        <span className="admin-selected-file-copy"><strong title={pdfFile.name}>{pdfFile.name}</strong><small>{formatFileSize(pdfFile.size)}</small></span>
        <FiCheckCircle className="admin-file-valid-icon" />
        <button type="button" aria-label="Remove PDF" onClick={onPdfRemove}><FiX /></button>
      </div>}

      <div className="admin-upload-image-options">
        {[
          ["thumbnail", "Thumbnail", thumbnail],
          ["coverImage", "Cover Image", coverImage],
          ["previewImage", "Preview Image", previewImage],
        ].map(([kind, label, file]) => (
          <div className="admin-image-upload-option" key={kind}>
            <strong>{label}</strong><small>(Optional)</small>
            {file ? <div className="admin-image-file-pill" title={file.name}><FiImage /><span>{file.name}</span>
              <button type="button" aria-label={`Remove ${label}`} onClick={() => onImageRemove(kind)}><FiX /></button></div> :
              <label className="admin-image-upload-button"><FiImage /> Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => pick(event, kind)} />
              </label>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function getDetectedDocumentType(file) {
  if (!file) return "";
  if (file.type === "application/pdf") return "PDF";
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  const documentTypes = {
    pdf: "PDF",
    doc: "WORD",
    docx: "WORD",
    zip: "ZIP",
    rar: "RAR",
    "7z": "SEVEN_ZIP",
    ppt: "POWERPOINT",
    pptx: "POWERPOINT",
    xls: "EXCEL",
    xlsx: "EXCEL",
    txt: "TEXT",
    csv: "CSV",
  };
  return documentTypes[extension] || "OTHER";
}

export function getDetectedFileType(file) {
  if (!file) return "";
  if (file.type === "application/pdf") return "PDF document (.pdf)";
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  const knownTypes = {
    pdf: "PDF document (.pdf)",
    doc: "Microsoft Word document (.doc)",
    docx: "Microsoft Word document (.docx)",
    zip: "ZIP archive (.zip)",
    rar: "RAR archive (.rar)",
    "7z": "7-Zip archive (.7z)",
    ppt: "PowerPoint presentation (.ppt)",
    pptx: "PowerPoint presentation (.pptx)",
    xls: "Excel spreadsheet (.xls)",
    xlsx: "Excel spreadsheet (.xlsx)",
    txt: "Text document (.txt)",
    csv: "CSV spreadsheet (.csv)",
  };
  if (knownTypes[extension]) return knownTypes[extension];
  if (file.type === "application/pdf") return "PDF document (.pdf)";
  return file.type ? `${file.type} (.${extension})` : `File (.${extension})`;
}
function Field({ label, required = false, hint, className = "", children }) {
  return <label className={`admin-upload-field ${className}`}>
    <span className="admin-upload-field-label">{label}{required && <b> *</b>}{hint && <small>{hint}</small>}</span>
    {children}
  </label>;
}

export function BasicDetailsPanel({ values, onChange, categories, file }) {
  return (
    <section className="admin-upload-card admin-upload-basic-panel" id="upload-step-2">
      <UploadPanelHeading number="2" title="Basic Details" description="Add title, file type, description and category" />
      <div className="admin-upload-field-grid">
        <Field label="Resource Title" required className="span-2">
          <input maxLength={200} value={values.title} onChange={(event) => onChange("title", event.target.value)} placeholder="e.g. DBMS Previous Year Question Paper 2024" required />
          <small className="admin-character-count">{values.title.length}/200</small>
        </Field>
        <Field label="Document Type" required className="span-2">
          <input className="admin-detected-file-type" value={getDetectedFileType(file)} readOnly aria-readonly="true" placeholder="Upload a file to detect its type automatically" required />
          <small>Detected automatically from the uploaded file. This field cannot be changed manually.</small>
        </Field>
        <Field label="Category" required className="span-2">
          <select value={values.categoryId} onChange={(event) => onChange("categoryId", event.target.value)} required>
            <option value="">Select category</option>
            {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Description" className="span-2">
          <textarea maxLength={1000} rows={3} value={values.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Provide a clear description about this resource, what it covers and how it will be useful for students." />
          <small className="admin-character-count">{values.description.length}/1000</small>
        </Field>
        <Field label="Tags" hint=" (comma separated)" className="span-2">
          <div className="admin-upload-input-with-icon"><FiTag /><input maxLength={2000} value={values.tags} onChange={(event) => onChange("tags", event.target.value)} placeholder="e.g. dbms, pyq, semester-4, important" /></div>
        </Field>
      </div>
    </section>
  );
}

export function AcademicMappingPanel({ values, onChange, options, loading, disabled }) {
  const fields = [
    ["universityId", "University", options.universities, true],
    ["collegeId", "College", options.colleges, false],
    ["branchId", "Branch", options.branches, true],
    ["academicYearId", "Academic Year", options.academicYears, true],
    ["semesterId", "Semester", options.semesters, true],
    ["subjectOfferingId", "Subject", options.subjects, true],
  ];

  const emptyOptionLabel = (key, items) => {
    if (items.length > 0) return `Select ${key === "subjectOfferingId" ? "subject" : key.replace(/Id$/, "").replace(/([A-Z])/g, " $1").toLowerCase().trim()}`;
    if (key === "universityId") return "No universities available";
    if (!values.universityId && ["collegeId", "branchId", "academicYearId", "semesterId", "subjectOfferingId"].includes(key)) {
      return "Select university first";
    }
    if (key === "collegeId") return "No colleges available";
    if (key === "branchId") return loading ? "Loading branches…" : "No branches available";
    if (key === "academicYearId") return "No academic years available";
    if (key === "semesterId") {
      if (!values.academicYearId) return "Select academic year first";
      return loading ? "Loading semesters…" : "No semesters available";
    }
    if (key === "subjectOfferingId") {
      if (!values.branchId || !values.academicYearId || !values.semesterId) {
        return "Select branch, year and semester first";
      }
      return loading ? "Loading subjects…" : "No subjects found for selection";
    }
    return "No options available";
  };

  return (
    <section className="admin-upload-card" id="upload-step-3">
      <UploadPanelHeading number="3" title="Academic Mapping" description="Select university, branch, academic year, semester and subject" />
      {loading && <div className="admin-upload-inline-loading"><span /> Updating academic options…</div>}
      <div className="admin-upload-field-grid">
        {fields.map(([key, label, items, required]) => (
          <Field key={key} label={label} required={required}>
            <select value={values[key]} onChange={(event) => onChange(key, event.target.value)}
              required={required} disabled={disabled || (key !== "universityId" && !items.length)}>
              <option value="">{emptyOptionLabel(key, items)}</option>
              {items.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </Field>
        ))}
      </div>
      <p className="admin-upload-academic-note"><FiInfo /> Subject choices follow the selected branch, academic year and semester.</p>
    </section>
  );
}

export function AccessPricingPanel({ values, onChange }) {
  const accessTypes = [
    ["FREE", "Free", "♙"],
    ["DIRECT_PURCHASE", "Paid", "🛒"],
    ["SUBSCRIPTION", "Subscription", "♛"],
    ["BUNDLE_ONLY", "Bundle Only", "▱"],
  ];
  return (
    <section className="admin-upload-card" id="upload-step-4">
      <UploadPanelHeading number="4" title="Access & Pricing" description="Set access type and pricing details" />
      <Field label="Access Type" required className="span-2">
        <div className="admin-access-type-options">
          {accessTypes.map(([value, label, icon]) => <button type="button" key={value}
            className={values.accessType === value ? "selected" : ""} onClick={() => onChange("accessType", value)}>
            <span aria-hidden="true">{icon}</span>{label}
          </button>)}
        </div>
      </Field>
      <div className="admin-upload-field-grid">
        <Field label="Price (₹)" required>
          <input type="number" min="0" step="0.01" value={values.price} onChange={(event) => onChange("price", event.target.value)} disabled={values.accessType === "FREE"} required />
        </Field>
        <Field label="Discount Price (₹)">
          <input type="number" min="0" step="0.01" max={values.price || undefined} value={values.discountPrice} onChange={(event) => onChange("discountPrice", event.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <div className="admin-upload-info-box"><FiInfo /><span>{values.accessType === "FREE" ? "Free resources must have a price of ₹0." : values.accessType === "SUBSCRIPTION" ? "Access is managed through an active subscription." : values.accessType === "BUNDLE_ONLY" ? "This resource will be available only through a bundle." : "Set a valid price and optional discount."} For paid resources, set a valid price and optional discount.</span></div>
    </section>
  );
}

export function AdditionalInfoPanel({ values, onChange }) {
  return (
    <section className="admin-upload-card" id="upload-step-5">
      <UploadPanelHeading number="5" title="Additional Information" description="Version, language, page count and publish settings" />
      <div className="admin-upload-field-grid">
        <Field label="Version"><input value={values.version} onChange={(event) => onChange("version", event.target.value)} placeholder="e.g. 1.0" maxLength={40} /></Field>
        <Field label="Language"><select value={values.language} onChange={(event) => onChange("language", event.target.value)}>
          <option value="">Select language</option><option>English</option><option>Marathi</option><option>Hindi</option><option>Other</option>
        </select></Field>
        <Field label="Page Count"><input type="number" min="1" value={values.pageCount} onChange={(event) => onChange("pageCount", event.target.value)} placeholder="e.g. 120" /></Field>
        <Field label="Preview Pages"><input type="number" min="0" value={values.previewPages} onChange={(event) => onChange("previewPages", event.target.value)} placeholder="e.g. 10" /></Field>
      </div>
      <div className="admin-upload-toggle-grid">
        <label><input type="checkbox" checked={values.downloadable} onChange={(event) => onChange("downloadable", event.target.checked)} /><span>Allow Download</span></label>
        <label><input type="checkbox" checked={values.watermarkEnabled} onChange={(event) => onChange("watermarkEnabled", event.target.checked)} /><span>Enable Watermark</span></label>
        <label><input type="checkbox" checked={values.active} onChange={(event) => onChange("active", event.target.checked)} /><span>Active Resource</span></label>
        <label><input type="checkbox" checked={values.published} onChange={(event) => onChange("published", event.target.checked)} /><span>Publish Immediately</span></label>
      </div>
    </section>
  );
}

export function ResourcePreviewPanel({ values, selectedUniversity, selectedBranch, selectedSemester, selectedSubject, pdfFile, pdfPreviewUrl, coverPreviewUrl }) {
  const documentLabel = getDetectedFileType(pdfFile) || "Detected after file upload";
  const accessLabel = values.accessType === "FREE" ? "Free" : values.accessType === "DIRECT_PURCHASE" ? "Paid" : values.accessType === "BUNDLE_ONLY" ? "Bundle Only" : "Subscription";
  return (
    <aside className="admin-upload-card admin-resource-preview-panel">
      <UploadPanelHeading title="Resource Preview" description="This is how it will appear to students" icon={FiEye} />
      <div className="admin-resource-preview">
        <div className="admin-resource-preview-cover">
          {coverPreviewUrl ? <img src={coverPreviewUrl} alt="Resource cover preview" /> : <div className="admin-book-cover-art"><FiBookOpen /><span>NOTESWALA</span><strong>STUDY<br />MATERIAL</strong><i>PDF</i></div>}
        </div>
        <div className="admin-resource-preview-main">
          <h3>{values.title || "DBMS Previous Year Question Paper 2024"}</h3>
          <div className="admin-preview-chips">
            {values.categoryId && <span>{values.categoryName || "Selected Category"}</span>}
          </div>
        </div>
        <div className="admin-resource-preview-meta">
          <p><FiHome /> <span>University: {selectedUniversity?.name || "Select university"}</span></p>
          <p><FiMapPin /> <span>Branch: {selectedBranch?.name || "Select branch"}</span></p>
          <p><FiCalendar /> <span>Semester: {selectedSemester?.name || "Select semester"}</span></p>
          {selectedSubject && <p><FiBookOpen /> <span>Subject: {selectedSubject.subjectName}</span></p>}
          <p><FiFileText /> <span>Type: {documentLabel}</span></p>
          <p><FiUploadCloud /> <span>Access: {accessLabel}</span></p>
          {pdfFile && <p><FiFileText /> <span>{pdfFile.name}</span></p>}
        </div>
        <div className="admin-resource-preview-actions">
          <button type="button" disabled={!pdfFile} onClick={() => { if (pdfPreviewUrl) window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer"); }}><FiFileText /> View PDF</button>
          <button type="button" disabled={!pdfFile} onClick={() => { if (!pdfPreviewUrl || !pdfFile) return; const link = document.createElement("a"); link.href = pdfPreviewUrl; link.download = pdfFile.name; link.click(); }}><FiDownload /> Download</button>
        </div>
      </div>
    </aside>
  );
}

export function UploadReviewBar({ onCancel, onSaveDraft, onPublish, submitting, uploadProgress = 0 }) {
  return (
    <footer className="admin-upload-footer">
      <div className="admin-upload-review-note"><FiInfo /><span><strong>Review all details before uploading</strong><small>Make sure the information is correct and the file follows our content guidelines.</small></span></div>
      <div className="admin-upload-footer-actions">
        <button type="button" className="admin-upload-cancel" onClick={onCancel} disabled={submitting}><FiX /> Cancel</button>
        <button type="button" className="admin-upload-save-draft" onClick={onSaveDraft} disabled={submitting}><FiFileText /> Save as Draft</button>
        <button type="button" className="admin-upload-submit" onClick={onPublish} disabled={submitting}>{submitting ? <span className="admin-upload-button-spinner" /> : <FiUploadCloud />}{submitting ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : "Uploading…") : "Upload Resource"}</button>
      </div>
    </footer>
  );
}
