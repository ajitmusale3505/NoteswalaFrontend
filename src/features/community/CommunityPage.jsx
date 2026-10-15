import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle, FiArrowDown, FiBookOpen, FiCheck, FiChevronRight, FiClock,
  FiDownload, FiFileText, FiHome, FiMessageCircle,
  FiPaperclip, FiBookmark, FiSearch, FiSend, FiShield, FiSmile, FiUsers, FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import HomeNavbar from "../home/components/HomeNavbar";
import ProfileCompletionGate from "../profile/ProfileCompletionGate";
import {
  getCommunityAttachments, getCommunityGroups, getCommunityMembers, getCommunityMessages, getPinnedCommunityMessage,
  postCommunityMessage,
  uploadCommunityAttachment,
} from "../../services/communityService";
import "../../styles/community.css";

const INITIAL_MESSAGE_LIMIT = 30;
const EMOJIS = ["👍", "🙏", "❤️", "😂", "🎉", "🔥", "👏", "😊", "📚", "✅"];

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const errorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";

function sortMessages(messages) {
  return [...messages].sort((a, b) => {
    if (a.id != null && b.id != null) return Number(a.id) - Number(b.id);
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
}

function mergeMessages(existing, incoming) {
  const byId = new Map();
  [...existing, ...incoming].forEach((message) => {
    const key = message.id != null
      ? `id:${message.id}`
      : message.clientMessageId
        ? `client:${message.clientMessageId}`
        : null;
    if (key) byId.set(key, { ...byId.get(key), ...message });
  });
  return sortMessages([...byId.values()]);
}

function initials(name = "Student") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function displaySemester(value) {
  if (!value) return "Semester not set";
  return /^semester\s/i.test(value) ? value : `Semester ${value}`;
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateHeader(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const fullDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const relativeDate = formatDate(value);
  return relativeDate === "Today" || relativeDate === "Yesterday"
    ? `${relativeDate}, ${fullDate}`
    : fullDate;
}

function ordinalYear(value) {
  const year = Number(value);
  if (!Number.isFinite(year) || year < 1) return "Student";
  const suffix = year % 100 >= 11 && year % 100 <= 13 ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[year % 10] || "th");
  return `${year}${suffix} Year`;
}

function responsePage(response) {
  const value = unwrap(response);
  if (Array.isArray(value)) return { content: value, totalPages: 1, number: 0 };
  return value && Array.isArray(value.content) ? value : { content: [], totalPages: 1, number: 0 };
}

function CommunityPageContent() {
  const [room, setRoom] = useState(null);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersPage, setMembersPage] = useState(0);
  const [membersTotalPages, setMembersTotalPages] = useState(1);
  const [membersLoading, setMembersLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [connection, setConnection] = useState("connecting");
  const [activeSection, setActiveSection] = useState("chat");
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const messageScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const clientRef = useRef(null);
  const messagesRef = useRef([]);
  const olderLoadingRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadMessagePage = useCallback(async (channelId, params = {}) => {
    const response = await getCommunityMessages(channelId, params);
    return responsePage(response);
  }, []);

  const reloadLatest = useCallback(async (channelId, replace = false) => {
    try {
      const page = await loadMessagePage(channelId, { page: 0, size: INITIAL_MESSAGE_LIMIT });
      const newestFirst = page.content || [];
      const inOrder = sortMessages(newestFirst);
      setMessages((current) => replace ? inOrder : mergeMessages(current, inOrder));
      setHasOlderMessages((page.totalPages || 0) > 1);
    } catch (error) {
      if (replace) setLoadError(errorMessage(error));
    }
  }, [loadMessagePage]);

  useEffect(() => {
    let mounted = true;
    const loadGroups = async () => {
      setLoadError("");
      try {
        const response = await getCommunityGroups();
        const availableGroups = unwrap(response);
        if (!Array.isArray(availableGroups) || availableGroups.length !== 2) {
          throw new Error("Your profile must have a valid university, college and branch to access the two community groups.");
        }
        if (!mounted) return;
        setGroups(availableGroups);
        setRoom(availableGroups[0]);
      } catch (error) {
        if (mounted) {
          setLoadError(errorMessage(error));
          setLoading(false);
        }
      }
    };
    loadGroups();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!room?.id) return undefined;
    let mounted = true;
    setLoading(true);
    setLoadError("");
    shouldStickToBottomRef.current = true;

    const loadSelectedGroup = async () => {
      const results = await Promise.allSettled([
        getCommunityMessages(room.id, { page: 0, size: INITIAL_MESSAGE_LIMIT }),
        getCommunityMembers(room.id, 8, 0),
        getCommunityAttachments(room.id, 5),
        getPinnedCommunityMessage(room.id),
      ]);
      if (!mounted) return;

      if (results[0].status === "fulfilled") {
        const messagePage = responsePage(results[0].value);
        setMessages(sortMessages(messagePage.content || []));
        setHasOlderMessages((messagePage.totalPages || 0) > 1);
      } else {
        setMessages([]);
        setHasOlderMessages(false);
        setLoadError(errorMessage(results[0].reason));
      }

      if (results[1].status === "fulfilled") {
        const memberPage = responsePage(results[1].value);
        setMembers(memberPage.content || []);
        setMembersPage(0);
        setMembersTotalPages(memberPage.totalPages || 1);
      } else {
        setMembers([]);
        setMembersTotalPages(1);
      }
      setAttachments(results[2].status === "fulfilled" ? unwrap(results[2].value) || [] : []);
      setPinnedMessage(results[3].status === "fulfilled" ? unwrap(results[3].value) : null);
      setLoading(false);
    };

    loadSelectedGroup();
    return () => { mounted = false; };
  }, [room?.id]);

  useEffect(() => {
    if (!room?.id) return undefined;
    const token = localStorage.getItem("noteswala_access_token");
    if (!token) {
      setConnection("disconnected");
      return undefined;
    }

    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
    const brokerURL = `${apiBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:")}/ws`;
    const client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 1800,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectionTimeout: 10000,
      debug: () => {},
      onConnect: () => {
        setConnection("connected");
        client.subscribe(`/topic/community/${room.id}/messages`, (frame) => {
          try {
            const message = JSON.parse(frame.body);
            setMessages((current) => mergeMessages(current, [message]));
          } catch {
            // Ignore malformed event payloads; the next history sync repairs gaps.
          }
        });
        client.subscribe(`/topic/community/${room.id}/typing`, () => {});
        reloadLatest(room.id, false);
      },
      onWebSocketClose: () => setConnection("reconnecting"),
      onWebSocketError: () => setConnection("reconnecting"),
      onStompError: () => setConnection("reconnecting"),
    });

    clientRef.current = client;
    setConnection("connecting");
    client.activate();

    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, [room?.id, reloadLatest]);

  useEffect(() => {
    if (activeSection !== "members" || !room?.id) return undefined;
    let active = true;
    setMembersLoading(true);
    getCommunityMembers(room.id, 30, 0)
      .then((response) => {
        if (!active) return;
        const page = responsePage(response);
        setMembers(page.content || []);
        setMembersPage(0);
        setMembersTotalPages(page.totalPages || 1);
      })
      .catch((error) => {
        if (active) toast.error(errorMessage(error));
      })
      .finally(() => {
        if (active) setMembersLoading(false);
      });
    return () => { active = false; };
  }, [activeSection, room?.id]);

  const loadMoreMembers = async () => {
    const nextPage = membersPage + 1;
    if (membersLoading || nextPage >= membersTotalPages) return;
    setMembersLoading(true);
    try {
      const page = responsePage(await getCommunityMembers(room.id, 30, nextPage));
      const incoming = page.content || [];
      setMembers((current) => {
        const knownIds = new Set(current.map((member) => member.userId));
        return [...current, ...incoming.filter((member) => !knownIds.has(member.userId))];
      });
      setMembersPage(nextPage);
      setMembersTotalPages(page.totalPages || 1);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setMembersLoading(false);
    }
  };

  const loadOlderMessages = useCallback(async () => {
    const channelId = room?.id;
    const current = messagesRef.current;
    if (!channelId || !hasOlderMessages || olderLoadingRef.current || !current.length) return;

    const beforeId = current[0]?.id;
    if (!beforeId) return;
    const scroller = messageScrollRef.current;
    const oldHeight = scroller?.scrollHeight || 0;
    const oldTop = scroller?.scrollTop || 0;
    olderLoadingRef.current = true;
    setOlderLoading(true);
    try {
      const page = await loadMessagePage(channelId, { beforeId, size: INITIAL_MESSAGE_LIMIT });
      const older = sortMessages(page.content || []);
      setMessages((existing) => mergeMessages(existing, older));
      setHasOlderMessages((page.totalPages || 0) > 1 && older.length > 0);
      requestAnimationFrame(() => {
        if (scroller) scroller.scrollTop = scroller.scrollHeight - oldHeight + oldTop;
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      olderLoadingRef.current = false;
      setOlderLoading(false);
    }
  }, [room?.id, hasOlderMessages, loadMessagePage]);

  const onMessageScroll = useCallback(() => {
    const scroller = messageScrollRef.current;
    if (!scroller) return;
    const distanceToBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom < 90;
    setShowJumpToLatest(distanceToBottom > 220);
    if (scroller.scrollTop < 70) loadOlderMessages();
  }, [loadOlderMessages]);

  useEffect(() => {
    if (shouldStickToBottomRef.current && activeSection === "chat" && messageScrollRef.current) {
      messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight;
    }
  }, [messages, activeSection]);

  const scrollToLatest = () => {
    if (messageScrollRef.current) messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight;
    shouldStickToBottomRef.current = true;
    setShowJumpToLatest(false);
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const content = draft.trim();
    if ((!content && !selectedFile) || !room?.id || sending) return;
    if (content.length > 2000) {
      toast.error("Messages can contain up to 2,000 characters.");
      return;
    }

    const clientMessageId = globalThis.crypto?.randomUUID?.()
      || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payload = { content: content || `Shared a file: ${selectedFile.name}`, clientMessageId };
    setSending(true);
    setDraft("");
    setEmojiOpen(false);
    const file = selectedFile;
    setSelectedFile(null);

    try {
      const response = await postCommunityMessage(room.id, payload);
      const saved = unwrap(response);
      if (saved) {
        setMessages((current) => mergeMessages(current, [saved]));
        shouldStickToBottomRef.current = true;
      }
      if (file && saved?.id) {
        try {
          const fileResponse = await uploadCommunityAttachment(room.id, saved.id, file);
          const attachment = unwrap(fileResponse);
          if (attachment) setAttachments((current) => [attachment, ...current.filter((item) => item.id !== attachment.id)].slice(0, 20));
        } catch (error) {
          toast.error(`Message sent, but the file could not be uploaded: ${errorMessage(error)}`);
        }
      }
      if (!saved) await reloadLatest(room.id, false);
    } catch (error) {
      setDraft(content);
      setSelectedFile(file);
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const activeMembersCount = Number(room?.memberCount || 0);
  const universityName = room?.universityName || "University Community";
  const collegeName = room?.collegeName || "Your College";
  const branchName = room?.branchName || "Student";
  const semesterName = displaySemester(room?.semesterName);
  const isUniversityBranchGroup = room?.groupType === "UNIVERSITY_BRANCH";
  const groupKindTitle = isUniversityBranchGroup ? "University Branch Group" : "College Branch Group";
  const groupTitle = room?.displayName || `${branchName} · ${groupKindTitle}`;
  const chatInstitutionName = isUniversityBranchGroup ? universityName : collegeName;

  const selectGroup = (nextGroup) => {
    if (!nextGroup?.id || Number(nextGroup.id) === Number(room?.id)) return;
    shouldStickToBottomRef.current = true;
    setRoom(nextGroup);
    setMessages([]);
    setMembers([]);
    setAttachments([]);
    setPinnedMessage(null);
    setDraft("");
    setSelectedFile(null);
    setHasOlderMessages(false);
    setActiveSection("chat");
    setSearchOpen(false);
    setSearchTerm("");
    setEmojiOpen(false);
    setLoadError("");
  };
  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((message) =>
      `${message.authorName || ""} ${message.content || ""}`.toLowerCase().includes(term));
  }, [messages, searchTerm]);

  const tabs = [
    { id: "chat", label: "Chat", icon: FiMessageCircle },
    { id: "announcements", label: "Announcements", icon: FiShield },
    { id: "files", label: "Shared Files", icon: FiFileText },
    { id: "members", label: "Group Members", icon: FiUsers },
  ];

  const renderMessage = (message) => {
    const isMine = Number(message.authorId) === Number(
      JSON.parse(localStorage.getItem("noteswala_user") || "{}")?.userId
    );
    const messageFiles = attachments.filter((attachment) => Number(attachment.messageId) === Number(message.id));
    return (
      <article className={`community-message-row ${isMine ? "mine" : ""}`} key={message.id || message.clientMessageId}>
        {!isMine && <div className="community-avatar message-avatar">{initials(message.authorName)}</div>}
        <div className="community-message-stack">
          <div className="community-message-bubble">
            <div className="community-message-meta">
              <strong>{message.authorName || "Student"}</strong>
              <span>{ordinalYear(room?.currentYear)}</span>
              <i />
              <span>{branchName}</span>
              {message.pinned && <span className="community-message-pinned"><FiBookmark /> Pinned</span>}
            </div>
            <p>{message.content}</p>
            {messageFiles.map((file) => (
              <a className="community-message-attachment" key={file.id} href={file.fileUrl} download={file.fileName || true} rel="noreferrer">
                <span className="community-file-badge"><FiFileText /></span>
                <span className="community-file-copy"><strong>{file.fileName}</strong><small>{formatBytes(file.sizeBytes)}</small></span>
                <FiDownload />
              </a>
            ))}
            <time>{formatTime(message.createdAt)}</time>
          </div>
        </div>
        {isMine && <div className="community-avatar message-avatar own-avatar">{initials(message.authorName)}</div>}
      </article>
    );
  };

  return (
    <div className="community-page">
      <HomeNavbar brandName="NotesWala" />
      <main className="community-main">
        <section className="community-hero">
          <div className="community-hero-icon"><FiUsers /></div>
          <div className="community-hero-copy">
            <h1>Community</h1>
            <p>Connect, discuss, learn and grow with your university community.</p>
          </div>
          <div className="community-hero-motto">Learn<br />Share<br />Grow<br />Together</div>
          <div className="community-hero-university">
            <span className="community-seal"><FiHome /></span>
            <span><strong>{universityName}</strong><small>{branchName} <i /> {semesterName}</small></span>
          </div>
        </section>

        <div className="community-layout">
          <aside className="community-left-panel">
            <section className="community-group-summary">
              <div className="community-large-seal"><FiHome /></div>
              <h2>{groupTitle}</h2>
              <p className="community-member-count"><span className="community-verified"><FiCheck /></span>{activeMembersCount.toLocaleString("en-IN")} members <i /> Official group</p>
              <div className="community-learner-context"><span><FiShield /> {branchName}</span><span><FiBookOpen /> {semesterName}</span></div>
            </section>
            <section className="community-group-switcher" aria-label="Your two community groups">
              <div className="community-group-switcher-heading">YOUR GROUPS <span>2</span></div>
              {groups.map((group) => {
                const universityGroup = group.groupType === "UNIVERSITY_BRANCH";
                const title = universityGroup ? "University Branch Group" : "College Branch Group";
                const subtitle = universityGroup ? group.universityName : group.collegeName;
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={Number(room?.id) === Number(group.id) ? "active" : ""}
                    onClick={() => selectGroup(group)}
                    aria-pressed={Number(room?.id) === Number(group.id)}
                  >
                    <span className="community-group-switcher-icon">{universityGroup ? <FiBookOpen /> : <FiHome />}</span>
                    <span className="community-group-switcher-copy"><strong>{title}</strong><small>{subtitle}</small></span>
                    {Number(room?.id) === Number(group.id) && <FiCheck className="community-group-switcher-check" />}
                  </button>
                );
              })}
            </section>
            <nav className="community-side-nav" aria-label="Community sections">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button type="button" key={id} className={activeSection === id ? "active" : ""} onClick={() => setActiveSection(id)}>
                  <Icon /><span>{label}</span>
                  {id === "announcements" && pinnedMessage?.id && <small>1</small>}
                </button>
              ))}
            </nav>
            <div className="community-left-note"><FiShield /><span>Only these two groups matching your university, college and branch are available to you.</span></div>
          </aside>

          <section className="community-chat-card">
            <header className="community-chat-header">
              <div className="community-header-seal"><FiHome /></div>
              <div className="community-header-copy">
                <h2>{chatInstitutionName}</h2>
                <p>{activeMembersCount.toLocaleString("en-IN")} members <i /> {groupKindTitle} <i /> {semesterName}</p>
              </div>
              {searchOpen && (
                <input
                  className="community-header-search"
                  autoFocus
                  aria-label="Search loaded messages"
                  placeholder="Search loaded messages..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              )}
              <div className="community-header-actions">
                <button type="button" title="Search messages" aria-label="Search messages" onClick={() => { setSearchOpen((open) => !open); setSearchTerm(""); }}><FiSearch /></button>
                <button type="button" title="View pinned announcement" aria-label="View pinned announcement" onClick={() => setActiveSection("announcements")}><FiBookmark /></button>
                <span className={`community-connection ${connection}`} title={connection === "connected" ? "Live connection active" : "Connecting to live chat"} />
              </div>
            </header>

            {loading ? (
              <div className="community-state"><span className="community-spinner" /><p>Loading your university community…</p></div>
            ) : loadError && !room ? (
              <div className="community-state community-error"><FiAlertCircle /><h3>Community is not available</h3><p>{loadError}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>
            ) : (
              <>
                {activeSection === "chat" && (
                  <>
                    {pinnedMessage && (
                      <div className="community-pinned-banner">
                        <FiBookmark />
                        <div><strong>Pinned by Admin</strong><p>{pinnedMessage.content}</p></div>
                        <button type="button" onClick={() => setActiveSection("announcements")}>View Details <FiChevronRight /></button>
                      </div>
                    )}
                    {loadError && <div className="community-inline-error"><FiAlertCircle /> {loadError}</div>}
                    <div className="community-messages" ref={messageScrollRef} onScroll={onMessageScroll}>
                      {olderLoading && <div className="community-history-loading">Loading older messages…</div>}
                      {filteredMessages.length ? filteredMessages.map((message, index) => {
                        const dateKey = message.createdAt ? new Date(message.createdAt).toDateString() : "";
                        const previousDateKey = index > 0 && filteredMessages[index - 1].createdAt
                          ? new Date(filteredMessages[index - 1].createdAt).toDateString()
                          : "";
                        return (
                          <div className="community-message-date-group" key={message.id || message.clientMessageId || ("message-" + index)}>
                            {dateKey && dateKey !== previousDateKey && (
                              <div className="community-date-separator"><span>{formatDateHeader(message.createdAt)}</span></div>
                            )}
                            {renderMessage(message)}
                          </div>
                        );
                      }) : (
                        <div className="community-empty-chat">
                          <span><FiMessageCircle /></span>
                          <h3>{searchTerm ? "No matching messages" : "Start a conversation"}</h3>
                          <p>{searchTerm ? "Try another search term." : `Say hello to students from ${universityName}.`}</p>
                        </div>
                      )}
                    </div>
                    {showJumpToLatest && <button className="community-jump-latest" type="button" onClick={scrollToLatest}><FiArrowDown /> Latest messages</button>}
                    {selectedFile && (
                      <div className="community-selected-file">
                        <FiFileText /><span>{selectedFile.name}</span><small>{formatBytes(selectedFile.size)}</small>
                        <button type="button" aria-label="Remove selected file" onClick={() => setSelectedFile(null)}><FiX /></button>
                      </div>
                    )}
                    {emojiOpen && (
                      <div className="community-emoji-picker" role="group" aria-label="Choose an emoji">
                        {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => setDraft((value) => value + emoji)}>{emoji}</button>)}
                      </div>
                    )}
                    <form className="community-composer" onSubmit={sendMessage}>
                      <button type="button" className={emojiOpen ? "selected" : ""} aria-label="Add emoji" onClick={() => setEmojiOpen((open) => !open)}><FiSmile /></button>
                      <button type="button" aria-label="Attach a file" onClick={() => fileInputRef.current?.click()}><FiPaperclip /></button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="community-file-input"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                      />
                      <input
                        className="community-composer-input"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={2000}
                        placeholder={`Type a message to ${universityName}...`}
                        aria-label="Type a community message"
                      />
                      <button className="community-send-button" type="submit" aria-label="Send message" disabled={sending || (!draft.trim() && !selectedFile)}>
                        {sending ? <span className="community-send-spinner" /> : <FiSend />}
                      </button>
                    </form>
                    <div className="community-chat-footer"><span>{connection === "connected" ? <><i /> Live chat connected</> : <><i /> {connection === "reconnecting" ? "Reconnecting…" : "Connecting to live chat…"}</>}</span><span>Be respectful. Help your community learn.</span></div>
                  </>
                )}

                {activeSection === "announcements" && (
                  <div className="community-detail-view">
                    <div className="community-view-heading"><span><FiShield /></span><div><h3>Announcements</h3><p>Important updates shared with your university community.</p></div></div>
                    {pinnedMessage ? (
                      <article className="community-announcement">
                        <div className="community-announcement-label"><FiBookmark /> Pinned announcement</div>
                        <p>{pinnedMessage.content}</p>
                        <small>{pinnedMessage.authorName || "Community administrator"}{pinnedMessage.createdAt ? ` · ${formatDate(pinnedMessage.createdAt)} at ${formatTime(pinnedMessage.createdAt)}` : ""}</small>
                      </article>
                    ) : <div className="community-empty-state"><FiShield /><h3>No announcements yet</h3><p>New pinned updates from your university will appear here.</p></div>}
                    <button className="community-back-chat" type="button" onClick={() => setActiveSection("chat")}><FiMessageCircle /> Back to chat</button>
                  </div>
                )}

                {activeSection === "files" && (
                  <div className="community-detail-view">
                    <div className="community-view-heading"><span><FiFileText /></span><div><h3>Shared Files</h3><p>Files attached to messages in this university community.</p></div></div>
                    {attachments.length ? <div className="community-all-files">{attachments.map((file) => (
                      <a key={file.id} href={file.fileUrl} download={file.fileName || true} rel="noreferrer" className="community-file-row">
                        <span className="community-file-document"><FiFileText /></span><span><strong>{file.fileName}</strong><small>{formatBytes(file.sizeBytes)}{file.authorName ? ` · Shared by ${file.authorName}` : ""}{file.createdAt ? ` · ${formatDate(file.createdAt)}` : ""}</small></span><FiDownload />
                      </a>
                    ))}</div> : <div className="community-empty-state"><FiFileText /><h3>No shared files yet</h3><p>Share a file from the message composer to make it available to your group.</p></div>}
                    <button className="community-back-chat" type="button" onClick={() => setActiveSection("chat")}><FiMessageCircle /> Back to chat</button>
                  </div>
                )}

                {activeSection === "members" && (
                  <div className="community-detail-view">
                    <div className="community-view-heading"><span><FiUsers /></span><div><h3>Group Members</h3><p>{activeMembersCount.toLocaleString("en-IN")} students with an active profile at this university.</p></div></div>
                    {members.length ? <div className="community-all-members">{members.map((member) => (
                      <div key={member.userId} className="community-member-row">
                        <div className="community-avatar">{initials(member.fullName)}</div>
                        <span><strong>{member.fullName}</strong><small>{member.branchName || "Student"}{member.currentYear ? ` · ${ordinalYear(member.currentYear)}` : ""}{member.semesterName ? ` · ${displaySemester(member.semesterName)}` : ""}</small></span>
                        <span className="community-student-badge">Student</span>
                      </div>
                    ))}</div> : membersLoading ? <div className="community-empty-state"><span className="community-spinner" /><p>Loading university members…</p></div> : <div className="community-empty-state"><FiUsers /><h3>No member details available</h3><p>Member details will appear when student profiles are completed.</p></div>}
                    {membersLoading && members.length > 0 && <div className="community-history-loading">Loading members…</div>}
                    {!membersLoading && membersPage + 1 < membersTotalPages && <button className="community-load-more-members" type="button" onClick={loadMoreMembers}>Load more members <FiChevronRight /></button>}
                    <button className="community-back-chat" type="button" onClick={() => setActiveSection("chat")}><FiMessageCircle /> Back to chat</button>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="community-right-panel">
            <section className="community-info-card">
              <h3><FiClock /> Group Details</h3>
              <div className="community-info-identity">
                <div className="community-detail-seal"><FiHome /></div>
                <div><strong>{groupTitle}</strong><small>{activeMembersCount.toLocaleString("en-IN")} members</small></div>
                <span className="community-official-badge"><i /> Official Group</span>
              </div>
              <p className="community-info-description">{isUniversityBranchGroup ? "The branch community for " + branchName + " students from all colleges under " + universityName + "." : "The branch community for " + branchName + " students from " + collegeName + "."} Discuss academics, share resources, get updates and help each other.</p>
              <dl>
                <div><dt>Branch</dt><dd>{branchName}</dd></div>
                <div><dt>Semester</dt><dd>{semesterName}</dd></div>
                <div><dt>Type</dt><dd>{groupKindTitle}</dd></div>
                <div><dt>Visibility</dt><dd>{isUniversityBranchGroup ? "University + Branch" : "College + Branch"}</dd></div>
              </dl>
            </section>

            <section className="community-info-card community-files-card">
              <header><h3><FiFileText /> Shared Files</h3><button type="button" onClick={() => setActiveSection("files")}>View All <FiChevronRight /></button></header>
              {attachments.length ? attachments.slice(0, 3).map((file) => (
                <a key={file.id} className="community-mini-file" href={file.fileUrl} download={file.fileName || true} rel="noreferrer">
                  <span className="community-mini-file-icon"><FiFileText /></span>
                  <span><strong>{file.fileName}</strong><small>{formatBytes(file.sizeBytes)}{file.createdAt ? ` · ${formatDate(file.createdAt)}` : ""}</small></span>
                  <FiChevronRight />
                </a>
              )) : <p className="community-card-empty">No files shared yet.</p>}
            </section>

            <section className="community-info-card community-members-card">
              <header><h3><FiUsers /> Members ({activeMembersCount.toLocaleString("en-IN")})</h3><button type="button" onClick={() => setActiveSection("members")}>View All <FiChevronRight /></button></header>
              {members.slice(0, 3).map((member) => (
                <div key={member.userId} className="community-mini-member">
                  <div className="community-avatar">{initials(member.fullName)}</div>
                  <span><strong>{member.fullName}</strong><small>{member.branchName || "Student"}{member.currentYear ? ` · ${ordinalYear(member.currentYear)}` : ""}</small></span>
                  <span className="community-student-badge">Student</span>
                </div>
              ))}
              {!members.length && <p className="community-card-empty">Member information is not available yet.</p>}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CommunityPage() {
  return (
    <ProfileCompletionGate>
      <CommunityPageContent />
    </ProfileCompletionGate>
  );
}
