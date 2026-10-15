import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiActivity, FiAlertTriangle, FiArrowLeft, FiArrowUpRight, FiBell,
  FiBookOpen, FiCalendar, FiCheckCircle, FiChevronDown, FiChevronLeft,
  FiChevronRight, FiClipboard, FiClock, FiDownload, FiEdit2, FiEye,
  FiFileText, FiHome, FiInfo, FiMail, FiMapPin, FiMessageSquare,
  FiRefreshCw, FiSearch, FiSettings, FiShield, FiSliders, FiUsers,
  FiX, FiXCircle,
} from "react-icons/fi";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import {
  getAdminCommunityGroup,
  getAdminCommunityGroupMembers,
  getAdminCommunityGroupMessages,
  getAdminCommunityGroupStatistics,
  setAdminCommunityGroupStatus,
} from "./services/adminCommunityGroupService";
import "./admin-community-group-details.css";

const PAGE_SIZE = 10;

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-IN");
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function initials(name) {
  return String(name || "Student").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "S";
}

function activityTone(reports) {
  if (reports >= 5) return "high";
  if (reports >= 3) return "medium";
  if (reports >= 1) return "low";
  return "none";
}

function StatCard({ icon: Icon, label, value, detail, tone = "blue" }) {
  return (
    <article className={`admin-gd-stat tone-${tone}`}>
      <span className="admin-gd-stat-icon"><Icon /></span>
      <div className="admin-gd-stat-copy">
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function GroupImage({ group, compact = false }) {
  const [failed, setFailed] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState(group?.iconUrl || "");
  useEffect(() => {
    setFailed(false);
    setLoadedUrl(group?.iconUrl || "");
  }, [group?.iconUrl]);
  return (
    <span className={`admin-gd-group-image ${compact ? "is-compact" : ""}`}>
      {loadedUrl && !failed
        ? <img src={loadedUrl} alt="" onError={() => setFailed(true)} />
        : <span className="admin-gd-group-monogram">{initials(group?.universityShortCode || group?.universityName || group?.name)}</span>}
    </span>
  );
}

function EmptyState({ icon: Icon = FiUsers, title, detail }) {
  return (
    <div className="admin-gd-empty">
      <span><Icon /></span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function AdminCommunityGroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("noteswala_admin_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const [globalSearch, setGlobalSearch] = useState("");
  const [group, setGroup] = useState(null);
  const [stats, setStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberPage, setMemberPage] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(0);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberQuery, setMemberQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState("all");
  const [activityLevel, setActivityLevel] = useState("all");
  const [messages, setMessages] = useState([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messagePage, setMessagePage] = useState(0);
  const [messageTotalPages, setMessageTotalPages] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try { localStorage.setItem("noteswala_admin_sidebar_collapsed", String(next)); } catch { /* Storage may be unavailable. */ }
      return next;
    });
  };

  const loadGroup = useCallback(async () => {
    setInitialLoading(true);
    try {
      const [groupResult, statsResult] = await Promise.allSettled([
        getAdminCommunityGroup(groupId),
        getAdminCommunityGroupStatistics(groupId),
      ]);
      if (groupResult.status === "rejected") throw groupResult.reason;
      const loadedGroup = unwrap(groupResult.value);
      if (!loadedGroup?.id) throw new Error("This community group could not be found.");
      setGroup(loadedGroup);
      if (statsResult.status === "fulfilled") setStats(unwrap(statsResult.value));
      else toast.error(getErrorMessage(statsResult.reason, "Could not load group statistics."));
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load this community group."));
      setGroup(null);
    } finally {
      setInitialLoading(false);
    }
  }, [groupId]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(memberQuery.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [memberQuery]);

  const loadMembers = useCallback(async () => {
    setMemberLoading(true);
    try {
      const response = await getAdminCommunityGroupMembers(groupId, {
        page: memberPage,
        size: PAGE_SIZE,
        query: debouncedQuery,
        status: memberStatus,
        activityLevel,
      });
      const payload = unwrap(response);
      const rows = Array.isArray(payload?.content) ? payload.content : Array.isArray(payload) ? payload : [];
      setMembers(rows);
      setMemberTotal(Number(payload?.totalElements) || rows.length);
      setMemberTotalPages(Number(payload?.totalPages) || (rows.length ? 1 : 0));
    } catch (error) {
      setMembers([]);
      setMemberTotal(0);
      setMemberTotalPages(0);
      toast.error(getErrorMessage(error, "Could not load group members."));
    } finally {
      setMemberLoading(false);
    }
  }, [groupId, memberPage, debouncedQuery, memberStatus, activityLevel]);

  useEffect(() => {
    if (activeTab === "members" && group) loadMembers();
  }, [activeTab, group, loadMembers]);

  const loadMessages = useCallback(async () => {
    setMessageLoading(true);
    try {
      const response = await getAdminCommunityGroupMessages(groupId, { page: messagePage, size: PAGE_SIZE });
      const payload = unwrap(response);
      const rows = Array.isArray(payload?.content) ? payload.content : Array.isArray(payload) ? payload : [];
      setMessages(rows);
      setMessageTotalPages(Number(payload?.totalPages) || (rows.length ? 1 : 0));
    } catch (error) {
      setMessages([]);
      setMessageTotalPages(0);
      toast.error(getErrorMessage(error, "Could not load group messages."));
    } finally {
      setMessageLoading(false);
    }
  }, [groupId, messagePage]);

  useEffect(() => {
    if (activeTab === "messages" && group) loadMessages();
  }, [activeTab, group, loadMessages]);

  useEffect(() => { setMemberPage(0); }, [debouncedQuery, memberStatus, activityLevel]);

  const toggleStatus = async () => {
    if (!group) return;
    setStatusSaving(true);
    try {
      await setAdminCommunityGroupStatus(group.id, !group.active);
      toast.success(group.active ? "Group deactivated successfully." : "Group activated successfully.");
      await loadGroup();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update group status."));
    } finally {
      setStatusSaving(false);
    }
  };

  const exportMembers = () => {
    if (!members.length) {
      toast("There are no members on this page to export.", { icon: "ℹ️" });
      return;
    }
    const columns = [
      ["Name", "fullName"], ["Roll Number", "rollNumber"], ["Email", "email"],
      ["Mobile", "phoneNumber"], ["Semester", "semesterName"], ["Branch", "branchName"],
      ["Messages", "messageCount"], ["Reported Activity", "suspiciousActivityCount"],
      ["Status", "active"],
    ];
    const escapeCsv = (value) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const csv = [columns.map(([label]) => escapeCsv(label)).join(","), ...members.map((member) =>
      columns.map(([, key]) => escapeCsv(key === "active" ? (member.active ? "Active" : "Inactive") : member[key])).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `noteswala-group-${group?.id}-members-page-${memberPage + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Current member page exported to CSV.");
  };

  const tabs = useMemo(() => [
    { id: "overview", label: "Overview", icon: FiHome },
    { id: "members", label: "Members", icon: FiUsers },
    { id: "messages", label: "Group Messages", icon: FiMessageSquare },
    { id: "announcements", label: "Announcements", icon: FiBell },
    { id: "settings", label: "Settings", icon: FiSettings },
  ], []);

  const selectNavigation = (label) => {
    if (label === "Dashboard") navigate("/admin");
    else if (label === "Manage Groups") navigate("/admin/community-groups");
    else if (label === "Upload Resources") navigate("/admin/resources/upload");
    else if (label === "Manage Categories") navigate("/admin/categories");
    else toast(`${label} is part of the admin workspace.`, { icon: "ℹ️", duration: 2500 });
  };

  const activePercent = Number(stats?.activePercentage) || 0;
  const inactivePercent = Number(stats?.inactivePercentage) || 0;

  if (!initialLoading && !group) {
    return (
      <div className={`admin-app-shell admin-community-groups-shell admin-gd-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} activeItem="Manage Groups" onSelect={selectNavigation} />
        <div className="admin-workspace">
          <AdminTopbar collapsed={sidebarCollapsed} searchValue={globalSearch} onSearchChange={setGlobalSearch} />
          <main className="admin-dashboard-content admin-gd-failure">
            <FiAlertTriangle />
            <h1>Group details unavailable</h1>
            <p>This group may have been removed, or your administrator session could not load its details.</p>
            <button type="button" className="admin-gd-primary-button" onClick={() => navigate("/admin/community-groups")}><FiArrowLeft /> Back to Manage Groups</button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-app-shell admin-community-groups-shell admin-gd-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} activeItem="Manage Groups" onSelect={selectNavigation} />
      <div className="admin-workspace">
        <AdminTopbar collapsed={sidebarCollapsed} searchValue={globalSearch} onSearchChange={setGlobalSearch} />
        <main className="admin-dashboard-content admin-gd-page">
          <div className="admin-gd-main-column">
            <nav className="admin-gd-breadcrumb" aria-label="Breadcrumb">
              <button type="button" onClick={() => navigate("/admin")}><FiHome /> Dashboard</button>
              <FiChevronRight />
              <button type="button" onClick={() => navigate("/admin/community-groups")}>Community Management</button>
              <FiChevronRight />
              <button type="button" onClick={() => navigate("/admin/community-groups")}>Manage Groups</button>
              <FiChevronRight />
              <span>{group?.universityName || "Community Group"}</span>
              <FiChevronRight />
              <strong>{activeTab === "members" ? "Members" : tabs.find((tab) => tab.id === activeTab)?.label}</strong>
            </nav>

            <section className="admin-gd-hero">
              <div className="admin-gd-hero-copy">
                <div className="admin-gd-identity">
                  <GroupImage group={group} />
                  <div className="admin-gd-title-block">
                    <div className="admin-gd-title-line">
                      <h1>{initialLoading ? "Loading community group…" : group?.name || group?.universityName}</h1>
                      {group && <span className={`admin-gd-status ${group.active ? "is-active" : "is-inactive"}`}><i /> {group.active ? "Active" : "Inactive"}</span>}
                    </div>
                    <p>{group?.description || "Official university community space for student discussions."}</p>
                    <div className="admin-gd-meta">
                      <span><FiBookOpen /> {group?.universityShortCode || "University"}</span>
                      <span><FiMapPin /> {group?.universityName || "University group"}</span>
                      <span><FiUsers /> {group?.branchName || "All branches"}</span>
                      <span><FiCalendar /> Created {formatDate(group?.createdAt)}</span>
                      <span><FiUsers /> {formatNumber(stats?.totalMembers ?? group?.memberCount)} members</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="admin-gd-edit-button" onClick={() => navigate(`/admin/community-groups?edit=${group?.id}`)} disabled={!group}>
                  <FiEdit2 /> Edit Group
                </button>
              </div>
              <div className="admin-gd-hero-watermark" aria-hidden="true">Connect<br />Discuss<br />Learn <em>Together</em></div>
            </section>

            <div className="admin-gd-tabs" role="tablist" aria-label="Community group sections">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" role="tab" aria-selected={activeTab === id}
                  className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)}>
                  <Icon /> <span>{label}</span>
                </button>
              ))}
            </div>

            {activeTab === "members" && (
              <>
                <section className="admin-gd-stat-grid">
                  <StatCard icon={FiUsers} label="Total Members" value={stats?.totalMembers} detail="Students in this group" tone="blue" />
                  <StatCard icon={FiCheckCircle} label="Active Members" value={stats?.activeMembers} detail={`${activePercent.toFixed(1)}% active`} tone="green" />
                  <StatCard icon={FiXCircle} label="Inactive Members" value={stats?.inactiveMembers} detail={`${inactivePercent.toFixed(1)}% inactive`} tone="red" />
                  <StatCard icon={FiMessageSquare} label="Total Messages" value={stats?.totalMessages} detail="Messages in this group" tone="violet" />
                  <StatCard icon={FiShield} label="Reported Users" value={stats?.suspiciousUsers} detail="Authors with reported messages" tone="amber" />
                </section>

                <section className="admin-gd-members-card">
                  <div className="admin-gd-member-toolbar">
                    <label className="admin-gd-search">
                      <FiSearch />
                      <input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)}
                        placeholder="Search by name, email, roll number or mobile…" aria-label="Search members" />
                      {memberQuery && <button type="button" onClick={() => setMemberQuery("")} aria-label="Clear search"><FiX /></button>}
                    </label>
                    <label className="admin-gd-select"><FiSliders /><select value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)} aria-label="Filter member status">
                      <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                    </select><FiChevronDown /></label>
                    <label className="admin-gd-select"><select value={activityLevel} onChange={(event) => setActivityLevel(event.target.value)} aria-label="Filter reported activity">
                      <option value="all">All Activity</option><option value="none">None reported</option><option value="low">Low reports</option><option value="medium">Medium reports</option><option value="high">High reports</option>
                    </select><FiChevronDown /></label>
                    <button type="button" className="admin-gd-primary-button" onClick={exportMembers}><FiDownload /> Export</button>
                    <button type="button" className="admin-gd-icon-button" onClick={() => { loadMembers(); loadGroup(); }} aria-label="Refresh members"><FiRefreshCw /></button>
                  </div>
                  <div className="admin-gd-table-scroll">
                    <table className="admin-gd-members-table">
                      <thead><tr><th>#</th><th>Member</th><th>Roll No.</th><th>Email</th><th>Mobile No.</th><th>Semester</th><th>Branch</th><th>Messages</th><th>Reported Activity</th><th>Status</th><th>Joined On</th><th>Actions</th></tr></thead>
                      <tbody>
                        {memberLoading ? <tr><td colSpan={12}><div className="admin-gd-loading"><span className="admin-gd-spinner" /> Loading members…</div></td></tr>
                          : members.length === 0 ? <tr><td colSpan={12}><EmptyState icon={FiUsers} title="No members found" detail={debouncedQuery || memberStatus !== "all" || activityLevel !== "all" ? "Try changing your search or filters." : "Students will appear here when their academic profile matches this group."} /></td></tr>
                            : members.map((member, index) => {
                              const tone = activityTone(Number(member.suspiciousActivityCount) || 0);
                              return <tr key={member.userId}>
                                <td className="admin-gd-row-number">{memberPage * PAGE_SIZE + index + 1}</td>
                                <td><div className="admin-gd-member-cell"><span className={`admin-gd-avatar avatar-${index % 6}`}>{initials(member.fullName)}</span><strong>{member.fullName || "Student"}</strong></div></td>
                                <td>{member.rollNumber || "—"}</td>
                                <td><span className="admin-gd-email-cell" title={member.email}>{member.email || "—"}</span></td>
                                <td>{member.phoneNumber || "—"}</td>
                                <td>{member.semesterName || group?.semesterName || "—"}</td>
                                <td><span className="admin-gd-branch-cell" title={member.branchName}>{member.branchName || group?.branchName || "—"}</span></td>
                                <td><span className="admin-gd-message-count"><FiMessageSquare /> {formatNumber(member.messageCount)}</span></td>
                                <td><span className={`admin-gd-activity-pill activity-${tone}`}><i />{tone === "none" ? "None" : tone[0].toUpperCase() + tone.slice(1)} <small>{Number(member.suspiciousActivityCount) || 0}</small></span></td>
                                <td><span className={`admin-gd-member-status ${member.active ? "is-active" : "is-inactive"}`}><i />{member.active ? "Active" : "Inactive"}</span></td>
                                <td className="admin-gd-date-cell">{formatDate(member.joinedAt)}</td>
                                <td><div className="admin-gd-row-actions">
                                  <button type="button" title="View member details" aria-label={`View ${member.fullName}`} onClick={() => setSelectedMember(member)}><FiEye /></button>
                                  {member.email && <a href={`mailto:${encodeURIComponent(member.email)}`} title="Email member" aria-label={`Email ${member.fullName}`}><FiMail /></a>}
                                </div></td>
                              </tr>;
                            })}
                      </tbody>
                    </table>
                  </div>
                  <footer className="admin-gd-pagination">
                    <span>Showing {memberTotal ? memberPage * PAGE_SIZE + 1 : 0} to {Math.min((memberPage + 1) * PAGE_SIZE, memberTotal)} of {formatNumber(memberTotal)} members</span>
                    <div><button type="button" disabled={memberPage <= 0 || memberLoading} onClick={() => setMemberPage((value) => Math.max(0, value - 1))} aria-label="Previous page"><FiChevronLeft /></button>
                      {Array.from({ length: Math.min(Math.max(memberTotalPages, 1), 5) }, (_, index) => {
                        const first = Math.min(Math.max(0, memberPage - 2), Math.max(0, memberTotalPages - 5));
                        const number = first + index;
                        return <button key={number} type="button" className={memberPage === number ? "is-current" : ""} disabled={number >= memberTotalPages || memberLoading} onClick={() => setMemberPage(number)}>{number + 1}</button>;
                      })}
                      <button type="button" disabled={memberTotalPages === 0 || memberPage >= memberTotalPages - 1 || memberLoading} onClick={() => setMemberPage((value) => Math.min(memberTotalPages - 1, value + 1))} aria-label="Next page"><FiChevronRight /></button>
                      <span className="admin-gd-page-size">{PAGE_SIZE} per page</span>
                    </div>
                  </footer>
                </section>
              </>
            )}

            {activeTab === "overview" && (
              <section className="admin-gd-overview-grid">
                <article className="admin-gd-panel admin-gd-overview-primary">
                  <div className="admin-gd-panel-heading"><span><FiActivity /></span><div><h2>Community at a glance</h2><p>Current membership and participation for this group.</p></div></div>
                  <div className="admin-gd-progress-block">
                    <div><span>Active members</span><strong>{activePercent.toFixed(1)}%</strong></div>
                    <div className="admin-gd-progress"><span style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }} /></div>
                    <small>{formatNumber(stats?.activeMembers)} active out of {formatNumber(stats?.totalMembers)} members</small>
                  </div>
                  <div className="admin-gd-progress-block is-muted">
                    <div><span>Inactive members</span><strong>{inactivePercent.toFixed(1)}%</strong></div>
                    <div className="admin-gd-progress"><span style={{ width: `${Math.min(100, Math.max(0, inactivePercent))}%` }} /></div>
                    <small>{formatNumber(stats?.inactiveMembers)} inactive profiles in this group scope</small>
                  </div>
                  <div className="admin-gd-overview-bottom">
                    <div><FiMessageSquare /><span><small>Total messages</small><strong>{formatNumber(stats?.totalMessages)}</strong></span></div>
                    <div><FiShield /><span><small>Authors with reports</small><strong>{formatNumber(stats?.suspiciousUsers)}</strong></span></div>
                  </div>
                </article>
                <article className="admin-gd-panel">
                  <div className="admin-gd-panel-heading"><span><FiInfo /></span><div><h2>Group profile</h2><p>Academic scope and administration.</p></div></div>
                  <dl className="admin-gd-detail-list">
                    <div><dt>University</dt><dd>{group?.universityName || "—"}</dd></div>
                    <div><dt>University code</dt><dd>{group?.universityShortCode || "—"}</dd></div>
                    <div><dt>Branch</dt><dd>{group?.branchName || "—"}</dd></div>
                    <div><dt>Semester</dt><dd>{group?.semesterName || "—"}</dd></div>
                    <div><dt>Created</dt><dd>{formatDate(group?.createdAt)}</dd></div>
                    <div><dt>Last updated</dt><dd>{formatDate(group?.updatedAt)}</dd></div>
                    <div><dt>Visibility</dt><dd>{group?.active ? "Visible to eligible students" : "Hidden from students"}</dd></div>
                  </dl>
                  <button type="button" className="admin-gd-secondary-button" onClick={() => setActiveTab("settings")}><FiSettings /> Manage group settings</button>
                </article>
              </section>
            )}

            {activeTab === "messages" && (
              <section className="admin-gd-panel admin-gd-messages-panel">
                <div className="admin-gd-panel-heading"><span><FiMessageSquare /></span><div><h2>Group Messages</h2><p>Recent published messages in this community. Messages load in pages of {PAGE_SIZE}.</p></div></div>
                {messageLoading ? <div className="admin-gd-loading"><span className="admin-gd-spinner" /> Loading messages…</div>
                  : messages.length === 0 ? <EmptyState icon={FiMessageSquare} title="No messages yet" detail="Messages sent to this group will appear here." />
                    : <div className="admin-gd-message-list">{messages.map((message) => <article key={message.id} className="admin-gd-message-item">
                      <span className="admin-gd-message-avatar">{initials(message.authorName)}</span>
                      <div className="admin-gd-message-copy"><div><strong>{message.authorName || "Student"}</strong><time><FiClock /> {formatDate(message.createdAt, true)}</time>{message.pinned && <span className="admin-gd-pinned"><FiClipboard /> Pinned</span>}</div><p>{message.content}</p></div>
                    </article>)}</div>}
                <footer className="admin-gd-pagination"><span>Page {messagePage + 1} of {Math.max(messageTotalPages, 1)}</span><div><button type="button" disabled={messagePage <= 0 || messageLoading} onClick={() => setMessagePage((value) => Math.max(0, value - 1))} aria-label="Previous messages"><FiChevronLeft /></button><button type="button" disabled={messageTotalPages === 0 || messagePage >= messageTotalPages - 1 || messageLoading} onClick={() => setMessagePage((value) => Math.min(messageTotalPages - 1, value + 1))} aria-label="Next messages"><FiChevronRight /></button></div></footer>
              </section>
            )}

            {activeTab === "announcements" && (
              <section className="admin-gd-panel admin-gd-coming-soon">
                <EmptyState icon={FiBell} title="Announcements" detail="Announcement publishing is not exposed by the current backend API yet. Group messages remain available from the Group Messages tab." />
              </section>
            )}

            {activeTab === "settings" && (
              <section className="admin-gd-settings-grid">
                <article className="admin-gd-panel">
                  <div className="admin-gd-panel-heading"><span><FiSettings /></span><div><h2>Group settings</h2><p>Manage the existing group configuration.</p></div></div>
                  <div className="admin-gd-setting-row"><span className="admin-gd-setting-symbol"><FiShield /></span><div><strong>Group visibility</strong><p>{group?.active ? "Students matching this academic scope can access this group." : "This group is currently hidden from students."}</p></div>
                    <button type="button" className={`admin-gd-toggle ${group?.active ? "is-on" : ""}`} role="switch" aria-checked={Boolean(group?.active)} onClick={toggleStatus} disabled={statusSaving}><span /></button></div>
                  <div className="admin-gd-setting-row"><span className="admin-gd-setting-symbol"><FiUsers /></span><div><strong>Membership scope</strong><p>{group?.universityName} · {group?.branchName} · {group?.semesterName}</p></div><span className="admin-gd-fixed-tag">Scope locked</span></div>
                  <div className="admin-gd-setting-actions"><button type="button" className="admin-gd-secondary-button" onClick={() => navigate("/admin/community-groups")}><FiArrowLeft /> Back to groups</button><button type="button" className="admin-gd-primary-button" onClick={() => navigate(`/admin/community-groups?edit=${group?.id}`)}><FiEdit2 /> Edit group details</button></div>
                </article>
                <article className="admin-gd-panel">
                  <div className="admin-gd-panel-heading"><span><FiInfo /></span><div><h2>Group information</h2><p>Current metadata stored for this group.</p></div></div>
                  <dl className="admin-gd-detail-list">
                    <div><dt>Group name</dt><dd>{group?.name || "—"}</dd></div>
                    <div><dt>Description</dt><dd>{group?.description || "No description"}</dd></div>
                    <div><dt>Created at</dt><dd>{formatDate(group?.createdAt, true)}</dd></div>
                    <div><dt>Updated at</dt><dd>{formatDate(group?.updatedAt, true)}</dd></div>
                    <div><dt>Record ID</dt><dd>#{group?.id}</dd></div>
                  </dl>
                </article>
              </section>
            )}

            <footer className="admin-gd-footer"><span>© {new Date().getFullYear()} NotesWala Admin</span><span>Community management workspace <i /> Secured administrator view</span></footer>
          </div>

          <aside className="admin-gd-right-rail">
            <section className="admin-gd-rail-card">
              <div className="admin-gd-rail-heading"><FiClipboard /><h2>Group Information</h2></div>
              <div className="admin-gd-rail-identity"><GroupImage group={group} compact /><div><strong>{group?.name || group?.universityName || "Community Group"}</strong><small>{formatNumber(stats?.totalMembers ?? group?.memberCount)} members</small><span className={`admin-gd-status ${group?.active ? "is-active" : "is-inactive"}`}><i /> {group?.active ? "Active" : "Inactive"}</span></div></div>
              <p className="admin-gd-rail-description">{group?.description || "A dedicated space for students in the selected academic scope to discuss and share learning resources."}</p>
              <dl className="admin-gd-rail-detail-list">
                <div><dt>University</dt><dd>{group?.universityShortCode || group?.universityName || "—"}</dd></div>
                <div><dt>Branch</dt><dd>{group?.branchName || "—"}</dd></div>
                <div><dt>Semester</dt><dd>{group?.semesterName || "—"}</dd></div>
                <div><dt>Created on</dt><dd>{formatDate(group?.createdAt)}</dd></div>
                <div><dt>Type</dt><dd>University group</dd></div>
                <div><dt>Visibility</dt><dd>Eligible students only</dd></div>
              </dl>
            </section>

            <section className="admin-gd-rail-card">
              <div className="admin-gd-rail-heading admin-gd-rail-heading-between"><span><FiActivity /> <h2>Group Statistics</h2></span><button type="button" onClick={() => setActiveTab("overview")}>View all <FiArrowUpRight /></button></div>
              <div className="admin-gd-rail-stat"><span className="rail-blue"><FiUsers /></span><span>Total Members</span><strong>{formatNumber(stats?.totalMembers)}</strong></div>
              <div className="admin-gd-rail-stat"><span className="rail-green"><FiCheckCircle /></span><span>Active Members</span><strong>{formatNumber(stats?.activeMembers)}</strong></div>
              <div className="admin-gd-rail-stat"><span className="rail-red"><FiXCircle /></span><span>Inactive Members</span><strong>{formatNumber(stats?.inactiveMembers)}</strong></div>
              <div className="admin-gd-rail-stat"><span className="rail-violet"><FiMessageSquare /></span><span>Total Messages</span><strong>{formatNumber(stats?.totalMessages)}</strong></div>
              <div className="admin-gd-rail-stat"><span className="rail-amber"><FiShield /></span><span>Reported Users</span><strong className="admin-gd-alert-number">{formatNumber(stats?.suspiciousUsers)}</strong></div>
            </section>

            <section className="admin-gd-rail-card admin-gd-quick-actions">
              <div className="admin-gd-rail-heading"><FiSettings /><h2>Quick Actions</h2></div>
              <button type="button" onClick={() => setActiveTab("announcements")}><FiBell /> <span>Send Announcement</span><FiChevronRight /></button>
              <button type="button" onClick={() => { setActiveTab("messages"); setMessagePage(0); }}><FiMessageSquare /> <span>View Group Messages</span><FiChevronRight /></button>
              <button type="button" onClick={exportMembers}><FiDownload /> <span>Export Members</span><FiChevronRight /></button>
              <button type="button" onClick={() => setActiveTab("settings")}><FiSettings /> <span>Manage Settings</span><FiChevronRight /></button>
            </section>
          </aside>
        </main>
      </div>

      {selectedMember && (
        <div className="admin-gd-modal-backdrop" role="presentation" onClick={() => setSelectedMember(null)}>
          <section className="admin-gd-member-modal" role="dialog" aria-modal="true" aria-labelledby="admin-gd-member-modal-title" onClick={(event) => event.stopPropagation()}>
            <header><span><FiUsers /></span><div><h2 id="admin-gd-member-modal-title">Member details</h2><p>Academic profile information</p></div><button type="button" onClick={() => setSelectedMember(null)} aria-label="Close member details"><FiX /></button></header>
            <div className="admin-gd-modal-identity"><span className="admin-gd-avatar avatar-0">{initials(selectedMember.fullName)}</span><div><strong>{selectedMember.fullName}</strong><small>{selectedMember.email}</small></div></div>
            <dl className="admin-gd-detail-list">
              <div><dt>Roll number</dt><dd>{selectedMember.rollNumber || "—"}</dd></div>
              <div><dt>Mobile</dt><dd>{selectedMember.phoneNumber || "—"}</dd></div>
              <div><dt>Semester</dt><dd>{selectedMember.semesterName || group?.semesterName || "—"}</dd></div>
              <div><dt>Branch</dt><dd>{selectedMember.branchName || group?.branchName || "—"}</dd></div>
              <div><dt>Messages sent</dt><dd>{formatNumber(selectedMember.messageCount)}</dd></div>
              <div><dt>Reported activity</dt><dd>{formatNumber(selectedMember.suspiciousActivityCount)}</dd></div>
              <div><dt>Status</dt><dd>{selectedMember.active ? "Active" : "Inactive"}</dd></div>
              <div><dt>Profile created</dt><dd>{formatDate(selectedMember.joinedAt)}</dd></div>
            </dl>
            <footer><button type="button" className="admin-gd-secondary-button" onClick={() => setSelectedMember(null)}>Close</button>{selectedMember.email && <a className="admin-gd-primary-button" href={`mailto:${encodeURIComponent(selectedMember.email)}`}><FiMail /> Email member</a>}</footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCommunityGroupDetailsPage;
