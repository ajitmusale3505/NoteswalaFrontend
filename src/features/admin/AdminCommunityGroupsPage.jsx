import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight,
  FiEdit2, FiHome, FiImage, FiMoreVertical, FiPlus, FiSearch,
  FiSliders, FiUploadCloud, FiUsers, FiX, FiXCircle,
} from "react-icons/fi";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import {
  createAdminCommunityGroup,
  getAdminCommunityGroupSummary,
  getAdminCommunityGroups,
  getCommunityBranchesByUniversity,
  getCommunitySemesters,
  getCommunityUniversities,
  setAdminCommunityGroupStatus,
  updateAdminCommunityGroup,
  uploadAdminCommunityGroupIcon,
} from "./services/adminCommunityGroupService";
import "./admin-community-groups.css";

const DEFAULT_FORM = {
  universityId: "",
  branchId: "",
  semesterId: "",
  name: "",
  description: "",
  active: true,
};

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

function getList(response) {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-IN");
}

export default function AdminCommunityGroupsPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("noteswala_admin_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const [activeItem, setActiveItem] = useState("Manage Groups");
  const [globalSearch, setGlobalSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({
    totalGroups: 0, activeGroups: 0, inactiveGroups: 0, totalMembers: 0,
    activePercentage: 0, inactivePercentage: 0,
  });
  const [universities, setUniversities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMasterData, setLoadingMasterData] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formOpen, setFormOpen] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [openActionId, setOpenActionId] = useState(null);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try { localStorage.setItem("noteswala_admin_sidebar_collapsed", String(next)); } catch { /* Storage may be unavailable. */ }
      return next;
    });
  };

  const selectNavigation = (label) => {
    setActiveItem(label);
    if (label === "Dashboard") navigate("/admin");
    else if (label === "Manage Categories") navigate("/admin/categories");
    else if (label === "Upload Resources") navigate("/admin/resources/upload");
    else if (label === "Manage Groups") navigate("/admin/community-groups");
    else toast(`${label} is part of the admin workspace.`, { icon: "ℹ️", duration: 2500 });
  };

  const loadSummary = useCallback(async () => {
    try {
      const response = await getAdminCommunityGroupSummary();
      const payload = unwrap(response);
      if (payload && typeof payload === "object") {
        setSummary({
          totalGroups: Number(payload.totalGroups) || 0,
          activeGroups: Number(payload.activeGroups) || 0,
          inactiveGroups: Number(payload.inactiveGroups) || 0,
          totalMembers: Number(payload.totalMembers) || 0,
          activePercentage: Number(payload.activePercentage) || 0,
          inactivePercentage: Number(payload.inactivePercentage) || 0,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load community group statistics."));
    }
  }, []);

  const loadGroups = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await getAdminCommunityGroups({
        page: Math.max(0, page - 1),
        size: pageSize,
        query: debouncedSearch || undefined,
        universityId: universityFilter || undefined,
        status: statusFilter,
      });
      const payload = unwrap(response);
      const records = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : [];
      setGroups(records);
      setTotalElements(Number(payload?.totalElements) || records.length);
      setTotalPages(Math.max(0, Number(payload?.totalPages) || (records.length ? 1 : 0)));
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load community groups."));
      setGroups([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, universityFilter, statusFilter]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getCommunityUniversities(), getCommunitySemesters()])
      .then(([universityResult, semesterResult]) => {
        if (!active) return;
        if (universityResult.status === "fulfilled") {
          setUniversities(getList(universityResult.value).filter((item) => item.active !== false));
        } else {
          toast.error(getErrorMessage(universityResult.reason, "Could not load universities."));
        }
        if (semesterResult.status === "fulfilled") {
          setSemesters(getList(semesterResult.value).filter((item) => item.active !== false));
        } else {
          toast.error(getErrorMessage(semesterResult.reason, "Could not load semesters."));
        }
      })
      .finally(() => { if (active) setLoadingMasterData(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchValue.trim()), 240);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => { setPage(1); }, [debouncedSearch, universityFilter, statusFilter, pageSize]);
  useEffect(() => { loadGroups(); }, [loadGroups]);

  useEffect(() => {
    if (!form.universityId) {
      setBranches([]);
      return undefined;
    }
    let active = true;
    setLoadingBranches(true);
    getCommunityBranchesByUniversity(form.universityId)
      .then((response) => {
        if (active) setBranches(getList(response).filter((item) => item.active !== false));
      })
      .catch((error) => {
        if (active) {
          setBranches([]);
          toast.error(getErrorMessage(error, "Could not load branches for this university."));
        }
      })
      .finally(() => { if (active) setLoadingBranches(false); });
    return () => { active = false; };
  }, [form.universityId]);

  useEffect(() => {
    if (!iconFile) {
      setIconPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(iconFile);
    setIconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [iconFile]);

  const totalVisiblePages = Math.max(1, totalPages);
  const startRow = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalElements);

  const openCreateForm = () => {
    setEditingGroup(null);
    setForm({ ...DEFAULT_FORM, active: true });
    setIconFile(null);
    setFormOpen(true);
    setOpenActionId(null);
  };

  const openEditForm = (group) => {
    setEditingGroup(group);
    setForm({
      universityId: group.universityId || "",
      branchId: group.branchId || "",
      semesterId: group.semesterId || "",
      name: group.name || "",
      description: group.description || "",
      active: Boolean(group.active),
    });
    setIconFile(null);
    setFormOpen(true);
    setOpenActionId(null);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingGroup(null);
    setIconFile(null);
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      if (field === "universityId") return { ...current, universityId: value, branchId: "" };
      return { ...current, [field]: value };
    });
  };

  const saveGroup = async (event) => {
    event.preventDefault();
    if (!form.universityId || !form.branchId || !form.semesterId || !form.name.trim()) {
      toast.error("University, branch, semester and group name are required.");
      return;
    }
    if (form.name.trim().length > 120) {
      toast.error("Group name must be 120 characters or fewer.");
      return;
    }
    if (form.description.length > 500) {
      toast.error("Description must be 500 characters or fewer.");
      return;
    }
    if (iconFile && iconFile.size > 2 * 1024 * 1024) {
      toast.error("Group icon must be 2 MB or smaller.");
      return;
    }

    const payload = {
      universityId: form.universityId,
      branchId: form.branchId,
      semesterId: form.semesterId,
      name: form.name.trim(),
      description: form.description.trim(),
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      const response = editingGroup
        ? await updateAdminCommunityGroup(editingGroup.id, payload)
        : await createAdminCommunityGroup(payload);
      let saved = unwrap(response);
      if (!saved?.id) throw new Error("The server did not return the saved group.");

      if (iconFile) {
        try {
          await uploadAdminCommunityGroupIcon(saved.id, iconFile);
        } catch (iconError) {
          toast.error(`Group saved, but the icon upload failed: ${getErrorMessage(iconError, "upload failed")}`);
        }
      }

      toast.success(editingGroup ? "Community group updated successfully." : "Community group created successfully.");
      setFormOpen(false);
      setEditingGroup(null);
      setIconFile(null);
      await Promise.all([loadGroups({ silent: true }), loadSummary()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save this community group."));
    } finally {
      setSaving(false);
    }
  };

  const changeGroupStatus = async (group) => {
    setTogglingId(group.id);
    setOpenActionId(null);
    try {
      await setAdminCommunityGroupStatus(group.id, !group.active);
      toast.success(group.active ? "Group deactivated. It will be hidden from students." : "Group activated and available to students.");
      await Promise.all([loadGroups({ silent: true }), loadSummary()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change group status."));
    } finally {
      setTogglingId(null);
    }
  };

  const pageButtons = useMemo(() => {
    const total = Math.max(1, totalPages);
    const first = Math.max(1, Math.min(page - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, index) => first + index).filter((value) => value <= total);
  }, [page, totalPages]);

  return (
    <div className={`admin-app-shell admin-community-groups-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        activeItem={activeItem}
        onSelect={selectNavigation}
      />
      <div className="admin-workspace">
        <AdminTopbar collapsed={sidebarCollapsed} searchValue={globalSearch} onSearchChange={setGlobalSearch} />
        <main className={`admin-dashboard-content admin-community-groups-content ${formOpen ? "has-group-panel" : "panel-closed"}`}>
          <div className="admin-community-main-column">
            <section className="admin-community-hero">
              <div className="admin-community-breadcrumb">
                <button type="button" onClick={() => navigate("/admin")}>Dashboard</button>
                <FiChevronRight />
                <span>Community Management</span>
                <FiChevronRight />
                <strong>Manage Groups</strong>
              </div>
              <div className="admin-community-hero-copy">
                <h1>Manage Community Groups</h1>
                <p>Create, update and manage university groups for student discussions.</p>
              </div>
              <div className="admin-community-hero-art" aria-hidden="true">
                <p>Connect<br />Discuss<br />Learn<br /><em>Together</em></p>
              </div>
            </section>

            <section className="admin-community-metrics" aria-label="Community group statistics">
              <MetricCard icon={<FiUsers />} tone="amber" label="Total Groups" value={formatNumber(summary.totalGroups)} note="All university groups" />
              <MetricCard icon={<span className="admin-community-metric-dot" />} tone="green" label="Active Groups" value={formatNumber(summary.activeGroups)} note={`${summary.activePercentage}% active`} />
              <MetricCard icon={<span className="admin-community-metric-dot" />} tone="red" label="Inactive Groups" value={formatNumber(summary.inactiveGroups)} note={`${summary.inactivePercentage}% inactive`} />
              <MetricCard icon={<FiUsers />} tone="blue" label="Total Members" value={formatNumber(summary.totalMembers)} note="Across all university groups" />
            </section>

            <section className="admin-community-table-card">
              <div className="admin-community-table-tools">
                <label className="admin-community-search">
                  <FiSearch />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search groups by name, university, branch…"
                    aria-label="Search community groups"
                  />
                  {searchValue && <button type="button" onClick={() => setSearchValue("")} aria-label="Clear search"><FiX /></button>}
                </label>
                <label className="admin-community-filter-select">
                  <FiSliders />
                  <select value={universityFilter} onChange={(event) => setUniversityFilter(event.target.value)} aria-label="Filter by university">
                    <option value="">All Universities</option>
                    {universities.map((university) => <option value={university.id} key={university.id}>{university.name}</option>)}
                  </select>
                  <FiChevronDown />
                </label>
                <label className="admin-community-filter-select admin-community-status-filter">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <FiChevronDown />
                </label>
                {!formOpen && <button type="button" className="admin-community-primary-button" onClick={openCreateForm}><FiPlus /> Create Group</button>}
              </div>

              <div className="admin-community-table-scroll">
                <table className="admin-community-table">
                  <thead>
                    <tr>
                      <th className="admin-community-number-col">#</th>
                      <th>Group Name</th>
                      <th>University</th>
                      <th>Branch</th>
                      <th>Members</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Updated At</th>
                      <th className="admin-community-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9}><div className="admin-community-table-message"><span className="admin-community-spinner" /> Loading community groups…</div></td></tr>
                    ) : groups.length === 0 ? (
                      <tr><td colSpan={9}>
                        <div className="admin-community-empty">
                          <span><FiUsers /></span>
                          <strong>{debouncedSearch || universityFilter || statusFilter !== "all" ? "No groups match these filters" : "No university groups created yet"}</strong>
                          <small>Create a group for a university, branch and semester to make it available to students.</small>
                          {!formOpen && <button type="button" className="admin-community-primary-button" onClick={openCreateForm}><FiPlus /> Create Group</button>}
                        </div>
                      </td></tr>
                    ) : groups.map((group, index) => (
                      <tr key={group.id}>
                        <td className="admin-community-number-col">{startRow + index}</td>
                        <td>
                          <div className="admin-community-group-name-cell">
                            <span className={`admin-community-row-icon ${group.active ? "" : "is-inactive"}`}>
                              {group.iconUrl ? <img src={group.iconUrl} alt="" /> : <FiHome />}
                            </span>
                            <span><strong title={group.name}>{group.name}</strong><small>{group.semesterName || "Semester not set"}</small></span>
                          </div>
                        </td>
                        <td><span className="admin-community-university-short">{group.universityShortCode || "—"}</span></td>
                        <td><span className="admin-community-branch-cell" title={group.branchName}>{group.branchName || "—"}</span></td>
                        <td><span className="admin-community-member-count"><FiUsers /> {formatNumber(group.memberCount)}</span></td>
                        <td><span className={`admin-community-status-pill ${group.active ? "is-active" : "is-inactive"}`}><i />{group.active ? "Active" : "Inactive"}</span></td>
                        <td className="admin-community-date">{formatDate(group.createdAt)}</td>
                        <td className="admin-community-date">{formatDate(group.updatedAt)}</td>
                        <td>
                          <div className="admin-community-actions">
                            <button type="button" onClick={() => openEditForm(group)} title={`Edit ${group.name}`} aria-label={`Edit ${group.name}`}><FiEdit2 /></button>
                            <button
                              type="button"
                              role="switch"
                              className={`admin-community-status-switch ${group.active ? "is-on" : ""}`}
                              aria-checked={group.active}
                              aria-label={`${group.active ? "Deactivate" : "Activate"} ${group.name}`}
                              disabled={togglingId === group.id}
                              onClick={() => changeGroupStatus(group)}
                            ><span /></button>
                            <div className="admin-community-actions-menu-wrap">
                              <button type="button" aria-label={`More actions for ${group.name}`} aria-expanded={openActionId === group.id} onClick={() => setOpenActionId((id) => id === group.id ? null : group.id)}><FiMoreVertical /></button>
                              {openActionId === group.id && <div className="admin-community-actions-menu">
                                <button type="button" onClick={() => openEditForm(group)}><FiEdit2 /> Edit group</button>
                                <button type="button" disabled={togglingId === group.id} onClick={() => changeGroupStatus(group)}>{group.active ? <FiXCircle /> : <FiCheckCircle />}{group.active ? "Deactivate" : "Activate"}</button>
                              </div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="admin-community-pagination">
                <span>Showing {startRow} to {endRow} of {totalElements} groups</span>
                <div className="admin-community-pagination-controls">
                  <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} aria-label="Previous page"><FiChevronLeft /></button>
                  {pageButtons.map((value) => (
                    <button key={value} type="button" className={value === page ? "is-current" : ""} aria-current={value === page ? "page" : undefined} onClick={() => setPage(value)} disabled={loading}>{value}</button>
                  ))}
                  <button type="button" onClick={() => setPage((current) => Math.min(totalVisiblePages, current + 1))} disabled={page >= totalPages || loading} aria-label="Next page"><FiChevronRight /></button>
                  <label className="admin-community-page-size">
                    <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Groups per page">
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                    <FiChevronDown />
                  </label>
                </div>
              </footer>
            </section>
            <footer className="admin-community-footer"><span>© {new Date().getFullYear()} NotesWala Admin</span><span>Community management workspace</span></footer>
          </div>

          {formOpen && (
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
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ icon, tone, label, value, note }) {
  return (
    <article className="admin-community-metric">
      <span className={`admin-community-metric-icon tone-${tone}`}>{icon}</span>
      <span className="admin-community-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </span>
    </article>
  );
}
