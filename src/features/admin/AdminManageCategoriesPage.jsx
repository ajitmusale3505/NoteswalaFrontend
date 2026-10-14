import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiChevronRight, FiFileText } from "react-icons/fi";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import CategoryManagementMetrics from "./components/CategoryManagementMetrics";
import CategoryManagementTable from "./components/CategoryManagementTable";
import CategoryEditorPanel from "./components/CategoryEditorPanel";
import {
  createAdminCategory,
  getAdminCategories,
  setAdminCategoryStatus,
  updateAdminCategory,
} from "./services/adminCategoryService";
import "./admin-categories.css";

const DEFAULT_FORM = {
  name: "",
  slug: "",
  description: "",
  icon: "book-open",
  active: true,
  displayOrder: null,
};

function normalizeResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;
}

export default function AdminManageCategoriesPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("noteswala_admin_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const [activeItem, setActiveItem] = useState("Manage Categories");
  const [globalSearch, setGlobalSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingCategoryId, setTogglingCategoryId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formOpen, setFormOpen] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const loadCategories = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await getAdminCategories();
      const payload = normalizeResponse(response);
      const records = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : [];
      setCategories(records.map((category) => ({
        ...category,
        resourceCount: Number(category.resourceCount) || 0,
        active: Boolean(category.active),
      })));
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load resource categories."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchValue.trim().toLowerCase()), 220);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  const filteredCategories = useMemo(() => {
    const query = debouncedSearch;
    return categories.filter((category) => {
      const matchesSearch = !query || [
        category.name,
        category.slug,
        category.description,
        category.icon,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && category.active)
        || (statusFilter === "inactive" && !category.active);
      return matchesSearch && matchesStatus;
    });
  }, [categories, debouncedSearch, statusFilter]);

  const visibleCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try { localStorage.setItem("noteswala_admin_sidebar_collapsed", String(next)); }
      catch { /* Storage may be unavailable. */ }
      return next;
    });
  };

  const selectNavigation = (label) => {
    setActiveItem(label);
    if (label === "Dashboard") {
      navigate("/admin");
    } else if (label === "Manage Categories") {
      navigate("/admin/categories");
    } else if (label === "Upload Resources") {
      navigate("/admin/resources/upload");
    } else {
      toast(`${label} is part of the admin workspace.`, { icon: "ℹ️", duration: 2500 });
    }
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    setForm({ ...DEFAULT_FORM, displayOrder: categories.length + 1 });
    setSlugTouched(false);
    setFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      icon: category.icon || "book-open",
      active: Boolean(category.active),
      displayOrder: category.displayOrder ?? null,
    });
    setSlugTouched(true);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingCategory(null);
  };

  const updateFormField = (field, value) => {
    setForm((current) => {
      if (field === "name" && !slugTouched) return { ...current, name: value, slug: slugify(value) };
      return { ...current, [field]: value };
    });
    if (field === "slug") setSlugTouched(true);
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const slug = slugify(form.slug);
    if (!name) {
      toast.error("Category name is required.");
      return;
    }
    if (!slug) {
      toast.error("A valid category slug is required.");
      return;
    }

    const payload = {
      name,
      slug,
      description: form.description.trim(),
      icon: form.icon,
      displayOrder: form.displayOrder ?? categories.length + 1,
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      const response = editingCategory
        ? await updateAdminCategory(editingCategory.id, payload)
        : await createAdminCategory(payload);
      const savedCategory = normalizeResponse(response);
      if (!savedCategory?.id) throw new Error("The server did not return the saved category.");

      setCategories((current) => {
        const existing = current.find((item) => item.id === savedCategory.id);
        const merged = { ...existing, ...savedCategory, resourceCount: Number(existing?.resourceCount ?? savedCategory.resourceCount) || 0 };
        if (existing) return current.map((item) => item.id === savedCategory.id ? merged : item);
        return [...current, merged].sort((first, second) =>
          (first.displayOrder ?? Number.MAX_SAFE_INTEGER) - (second.displayOrder ?? Number.MAX_SAFE_INTEGER)
          || String(first.name).localeCompare(String(second.name))
        );
      });

      toast.success(editingCategory ? "Category updated successfully." : "Category created successfully.");
      setFormOpen(false);
      setEditingCategory(null);
      setForm({ ...DEFAULT_FORM, displayOrder: categories.length + 2 });
      setSlugTouched(false);
      await loadCategories({ silent: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save this category."));
    } finally {
      setSaving(false);
    }
  };

  const changeCategoryStatus = async (category) => {
    const nextActive = !category.active;
    setTogglingCategoryId(category.id);
    try {
      const response = await setAdminCategoryStatus(category.id, nextActive);
      const updated = normalizeResponse(response);
      setCategories((current) => current.map((item) => item.id === category.id
        ? { ...item, active: typeof updated?.active === "boolean" ? updated.active : nextActive, updatedAt: updated?.updatedAt || new Date().toISOString() }
        : item
      ));
      toast.success(nextActive ? "Category activated." : "Category deactivated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change category status."));
    } finally {
      setTogglingCategoryId(null);
    }
  };

  return (
    <div className={`admin-app-shell admin-category-app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        activeItem={activeItem}
        onSelect={selectNavigation}
      />
      <div className="admin-workspace">
        <AdminTopbar collapsed={sidebarCollapsed} searchValue={globalSearch} onSearchChange={setGlobalSearch} />
        <main className="admin-dashboard-content admin-category-content">
          <header className="admin-category-hero">
            <div className="admin-category-breadcrumb">
              <button type="button" onClick={() => navigate("/admin")}>Dashboard</button>
              <FiChevronRight />
              <span>Resource Management</span>
              <FiChevronRight />
              <strong>Manage Categories</strong>
            </div>
            <div className="admin-category-hero-copy">
              <h1>Manage Resource Categories</h1>
              <p>Create, edit and manage resource categories used to organize study materials.</p>
            </div>
            <div className="admin-category-hero-art" aria-hidden="true">
              <p>Organize<br /><em>Manage</em><br />Grow Knowledge</p>
              <div className="admin-category-book-stack">
                <span>NOTES</span><span>PYQ</span><span>SOLUTIONS</span><span>MANUALS</span><span>BOOKS</span>
              </div>
              <div className="admin-category-plant"><i /><i /><i /><b /></div>
            </div>
          </header>

          <CategoryManagementMetrics categories={categories} />

          <div className={`admin-category-main-grid ${formOpen ? "has-editor" : "is-expanded"}`}>
            <CategoryManagementTable
              categories={visibleCategories}
              allCount={filteredCategories.length}
              loading={loading}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onEdit={openEditForm}
              onStatusChange={changeCategoryStatus}
              togglingCategoryId={togglingCategoryId}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onAddCategory={openCreateForm}
            />
            {formOpen && (
              <CategoryEditorPanel
                form={form}
                isEditing={Boolean(editingCategory)}
                saving={saving}
                onChange={updateFormField}
                onClose={closeForm}
                onSubmit={submitCategory}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
