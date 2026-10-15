import { memo, useMemo, useState } from "react";
import {
  FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight,
  FiEdit2, FiHome, FiMoreVertical, FiPlus, FiSearch, FiSliders,
  FiUsers, FiX, FiXCircle,
} from "react-icons/fi";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-IN");
}

function AdminCommunityGroupIcon({ group }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className={`admin-community-row-icon ${group.active ? "" : "is-inactive"}`}>
      {group.iconUrl && !imageFailed
        ? <img src={group.iconUrl} alt="" onError={() => setImageFailed(true)} />
        : <FiHome />}
    </span>
  );
}

function AdminCommunityGroupTable(props) {
  const {
    loading, groups, startRow, debouncedSearch, universityFilter, statusFilter, formOpen,
    openCreateForm, searchValue, setSearchValue, setUniversityFilter, universities,
    setStatusFilter, openEditForm, togglingId, changeGroupStatus, openActionId,
    setOpenActionId, page, setPage, totalElements, totalPages, pageSize, setPageSize, onOpenGroup,
  } = props;
  const totalVisiblePages = Math.max(1, totalPages);
  const endRow = Math.min(page * pageSize, totalElements);
  const pageButtons = useMemo(() => {
    const total = Math.max(1, totalPages);
    const first = Math.max(1, Math.min(page - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, index) => first + index).filter((value) => value <= total);
  }, [page, totalPages]);

  return (
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
                                <AdminCommunityGroupIcon group={group} />
                                <button type="button" className="admin-community-group-open-link" onClick={() => onOpenGroup?.(group)} title={`Open ${group.name}`}><strong>{group.name}</strong><small>{group.semesterName || "Semester not set"}</small></button>
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
  );
}

export default memo(AdminCommunityGroupTable);
