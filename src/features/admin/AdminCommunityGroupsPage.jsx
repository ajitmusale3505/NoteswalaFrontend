import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import AdminCommunityGroupMetrics from "./components/community-groups/AdminCommunityGroupMetrics";
import AdminCommunityGroupTable from "./components/community-groups/AdminCommunityGroupTable";
import AdminCommunityGroupEditor from "./components/community-groups/AdminCommunityGroupEditor";
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

  const startRow = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;

  const openCreateForm = useCallback(() => {
    setEditingGroup(null);
    setForm({ ...DEFAULT_FORM, active: true });
    setIconFile(null);
    setFormOpen(true);
    setOpenActionId(null);
  }, []);

  const openEditForm = useCallback((group) => {
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
  }, []);

  const closeForm = useCallback(() => {
    if (saving) return;
    setFormOpen(false);
    setEditingGroup(null);
    setIconFile(null);
  }, [saving]);

  const updateForm = useCallback((field, value) => {
    setForm((current) => {
      if (field === "universityId") return { ...current, universityId: value, branchId: "" };
      return { ...current, [field]: value };
    });
  }, []);

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

  const changeGroupStatus = useCallback(async (group) => {
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
  }, [loadGroups, loadSummary]);

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

            <AdminCommunityGroupMetrics summary={summary} />

            <AdminCommunityGroupTable
              loading={loading}
              groups={groups}
              startRow={startRow}
              debouncedSearch={debouncedSearch}
              universityFilter={universityFilter}
              statusFilter={statusFilter}
              formOpen={formOpen}
              openCreateForm={openCreateForm}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              setUniversityFilter={setUniversityFilter}
              universities={universities}
              setStatusFilter={setStatusFilter}
              openEditForm={openEditForm}
              togglingId={togglingId}
              changeGroupStatus={changeGroupStatus}
              openActionId={openActionId}
              setOpenActionId={setOpenActionId}
              page={page}
              setPage={setPage}
              totalElements={totalElements}
              totalPages={totalPages}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
            <footer className="admin-community-footer"><span>© {new Date().getFullYear()} NotesWala Admin</span><span>Community management workspace</span></footer>
          </div>

          <AdminCommunityGroupEditor
            formOpen={formOpen}
            editingGroup={editingGroup}
            closeForm={closeForm}
            saving={saving}
            saveGroup={saveGroup}
            form={form}
            updateForm={updateForm}
            universities={universities}
            loadingMasterData={loadingMasterData}
            branches={branches}
            loadingBranches={loadingBranches}
            semesters={semesters}
            iconPreview={iconPreview}
            iconFile={iconFile}
            setIconFile={setIconFile}
          />
        </main>
      </div>
    </div>
  );
}

