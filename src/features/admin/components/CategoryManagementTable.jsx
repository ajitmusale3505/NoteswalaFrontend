import {
  FiChevronLeft, FiChevronRight, FiEdit2, FiFileText, FiSearch,
} from "react-icons/fi";
import { CategoryIcon } from "./CategoryEditorPanel";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getVisiblePages(currentPage, totalPages) {
  const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: Math.max(0, Math.min(5, totalPages)) }, (_, index) => first + index)
    .filter((page) => page <= totalPages);
}

export default function CategoryManagementTable({
  categories,
  allCount,
  loading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onStatusChange,
  togglingCategoryId,
}) {
  const totalPages = Math.max(1, Math.ceil(allCount / pageSize));
  const start = allCount ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, allCount);
  const pages = getVisiblePages(page, totalPages);

  return (
    <section className="admin-category-table-card">
      <header className="admin-category-table-heading">
        <div className="admin-category-section-heading">
          <span><FiLayers /></span>
          <div>
            <h2>Resource Categories</h2>
            <p>Manage all resource categories, their status and resource counts.</p>
          </div>
        </div>
      </header>

      <div className="admin-category-table-scroll">
        <table className="admin-category-table">
          <thead>
            <tr>
              <th className="category-number-col">#</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Slug</th>
              <th>Resources</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th className="category-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}><div className="admin-category-table-message"><span className="admin-category-button-spinner" /> Loading categories…</div></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="admin-category-table-empty">
                  <FiSearch />
                  <strong>No categories found</strong>
                  <small>Try changing your search or status filter.</small>
                </div>
              </td></tr>
            ) : categories.map((category, index) => (
              <tr key={category.id}>
                <td className="category-number-col">{start + index}</td>
                <td>
                  <div className="admin-category-name-cell">
                    <span className={`admin-category-row-icon ${category.active ? "" : "is-inactive"}`}>
                      <CategoryIcon value={category.icon} />
                    </span>
                    <strong title={category.name}>{category.name}</strong>
                  </div>
                </td>
                <td><span className="admin-category-description" title={category.description || ""}>{category.description || "—"}</span></td>
                <td><code className="admin-category-slug">{category.slug}</code></td>
                <td><span className="admin-category-resource-count"><FiFileText /> {(Number(category.resourceCount) || 0).toLocaleString("en-IN")}</span></td>
                <td><span className={`admin-category-status-pill ${category.active ? "is-active" : "is-inactive"}`}><i />{category.active ? "Active" : "Inactive"}</span></td>
                <td className="admin-category-date">{formatDate(category.createdAt)}</td>
                <td className="admin-category-date">{formatDate(category.updatedAt)}</td>
                <td>
                  <div className="admin-category-actions">
                    <button type="button" className="admin-category-edit-button" onClick={() => onEdit(category)} aria-label={`Edit ${category.name}`} title="Edit category"><FiEdit2 /></button>
                    <button
                      type="button"
                      role="switch"
                      className={`admin-category-status-switch ${category.active ? "is-on" : ""}`}
                      aria-checked={category.active}
                      aria-label={`${category.active ? "Deactivate" : "Activate"} ${category.name}`}
                      title={category.active ? "Deactivate category" : "Activate category"}
                      disabled={togglingCategoryId === category.id}
                      onClick={() => onStatusChange(category)}
                    ><span /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="admin-category-pagination">
        <span>Showing {start} to {end} of {allCount} categories</span>
        <div className="admin-category-pagination-controls">
          <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1 || loading} aria-label="Previous page"><FiChevronLeft /></button>
          {pages.map((pageNumber) => (
            <button key={pageNumber} type="button" className={pageNumber === page ? "is-current" : ""} aria-current={pageNumber === page ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)} disabled={loading}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} aria-label="Next page"><FiChevronRight /></button>
          <select aria-label="Categories per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </footer>
    </section>
  );
}
