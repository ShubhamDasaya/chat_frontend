import React, { useState, useEffect, useRef } from "react";
import { X, Globe, Trash2, Users, MessageSquare, ShieldAlert, MoreVertical, Search, Plus } from "lucide-react";
import { getPublicChat, removeContactAPI, blockUserAPI } from "../../services/authService";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toast } from "../../ui/Toast";
import Avatar from "../../ui/Avatar";

const userToken = import.meta.env.VITE_USER_TOKEN;

const Sidebar = ({ sharedChats, setSharedChats, socket, openMainPanel, user, onProfileClick, onCloseSidebar }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeUserId = searchParams.get("user");
    const activeChatId = searchParams.get("chat");

    const [activeItemMenu, setActiveItemMenu] = useState(null);
    const [filterQuery, setFilterQuery] = useState("");
    const menuRef = useRef(null);

    // Close context menus on outside click
    useEffect(() => {
        const handle = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setActiveItemMenu(null);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    // Online / offline socket updates
    useEffect(() => {
        if (!socket) return;
        const update = (uid, online) => setSharedChats(prev =>
            prev.map(c => c.type === "single" && c.members.some(m => m._id === uid)
                ? { ...c, members: c.members.map(m => m._id === uid ? { ...m, online } : m) }
                : c)
        );
        socket.on("userOnline", (id) => update(id, true));
        socket.on("userOffline", (id) => update(id, false));
        return () => { socket.off("userOnline"); socket.off("userOffline"); };
    }, [socket, setSharedChats]);

    const handleBlock = async (id) => {
        if (!window.confirm("Block this user? Interactions will be restricted.")) return;
        try {
            await blockUserAPI(id);
            setSharedChats(prev => prev.filter(c => !c.members.some(m => m._id === id)));
            if (activeUserId === id) navigate("/chat");
            Toast("User blocked", "info");
        } catch { Toast("Failed to block user", "error"); }
    };

    const handleRemove = async (e, chatId, contactId) => {
        e?.stopPropagation();
        if (!window.confirm("Remove this conversation?")) return;
        try {
            if (contactId) await removeContactAPI(contactId);
            setSharedChats(sharedChats.filter(c => c._id !== chatId));
            if (activeChatId === chatId) navigate("/chat");
            Toast("Removed", "success");
        } catch { Toast("Failed to remove", "error"); }
    };

    const handlePublicChat = async () => {
        try {
            const res = await getPublicChat();
            if (res.success) navigate(`/chat?chat=${res.data._id}&name=Public Chat&type=public`);
        } catch { Toast("Failed to access public chat", "error"); }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    // Filter conversations
    const filteredChats = sharedChats.filter(chat => {
        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase();
        const isGroup = chat.type === "group";
        const other = isGroup ? null : chat.members.find(m => m._id !== user?._id);
        const name = isGroup ? chat.name : other?.name;
        return name?.toLowerCase().includes(q);
    });

    return (
        <div className="w-full h-full flex flex-col overflow-hidden"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>

            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3 shrink-0 relative"
                style={{
                    background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, var(--bg-secondary)) 0%, var(--bg-secondary) 100%)",
                    borderBottom: "1px solid var(--glass-border)"
                }}>
                {/* Top row: avatar + buttons */}
                <div className="flex items-center justify-between mb-3">
                    <div onClick={onProfileClick} className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0">
                        <Avatar src={user?.avatar} name={user?.name} size={10} online={true} className="avatar-ring" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate"
                                style={{ color: "var(--text-primary)" }}
                                onMouseEnter={e => e.target.style.color = "var(--accent)"}
                                onMouseLeave={e => e.target.style.color = "var(--text-primary)"}
                            >{user?.name || "..."}</p>
                            <div className="status-pill status-pill-online mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                Available
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => openMainPanel?.("createGroup")}
                            title="New Group"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                            style={{
                                color: "var(--text-muted)",
                                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 18%, transparent)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)"; }}
                        >
                            <Plus size={16} />
                        </button>
                        {onCloseSidebar && (
                            <button
                                onClick={onCloseSidebar}
                                title="Close"
                                className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Bio */}
                {user?.bio && (
                    <p className="text-[11px] italic line-clamp-1 mb-2 pl-1"
                        style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                        "{user.bio}"
                    </p>
                )}
            </div>

            {/* ── Public Chat button ── */}
            <div className="px-3 py-2.5 shrink-0">
                <button
                    onClick={handlePublicChat}
                    className="w-full h-10 flex items-center justify-center gap-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest shimmer-hover transition-all duration-200 active:scale-[0.98]"
                    style={{
                        color: "var(--accent)",
                        background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, var(--accent) 5%, transparent))",
                        border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                        boxShadow: "0 2px 12px color-mix(in srgb, var(--accent) 10%, transparent)"
                    }}
                >
                    <Globe size={14} style={{ filter: "drop-shadow(0 0 4px var(--accent))" }} />
                    Explore Public Feed
                </button>
            </div>

            {/* ── Conversation Search ── */}
            <div className="px-3 pb-2 shrink-0">
                <div className="relative glow-border-focus rounded-xl transition-all duration-200"
                    style={{ background: "var(--hover-bg)", border: "1px solid var(--glass-border)" }}>
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--text-muted)" }} />
                    <input
                        type="text"
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-8 pr-8 py-2.5 rounded-xl text-[12px] outline-none bg-transparent"
                        style={{ color: "var(--text-primary)" }}
                    />
                    {filterQuery && (
                        <button
                            onClick={() => setFilterQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Conversation list ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1" ref={menuRef}>
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}>
                    {filterQuery ? `Results (${filteredChats.length})` : `Chats · ${sharedChats.length}`}
                </p>

                {filteredChats.length === 0 && (
                    <div className="flex flex-col items-center py-14 text-center px-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                            style={{
                                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)"
                            }}>
                            <MessageSquare size={24} style={{ color: "var(--accent)", opacity: 0.6 }} />
                        </div>
                        <p className="text-xs font-semibold leading-relaxed" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                            {filterQuery
                                ? `No chats matching "${filterQuery}"`
                                : "No conversations yet.\nSearch for users or join the public feed."}
                        </p>
                    </div>
                )}

                <div className="space-y-0.5">
                    {filteredChats.map((chat) => {
                        const isGroup = chat.type === "group";
                        const other = isGroup ? null : chat.members.find(m => m._id !== user?._id);
                        if (!isGroup && !other) return null;

                        const isActive = activeChatId === chat._id || (!isGroup && activeUserId === other?._id);
                        const displayName = isGroup ? chat.name : other?.name;
                        const displayAvatar = isGroup ? chat.image : other?.avatar;
                        const isOnline = !isGroup && other?.online;

                        const lastMsg = chat.lastMessage;
                        const hasUnread = lastMsg &&
                            (lastMsg.sender?._id || lastMsg.sender) !== user?._id &&
                            lastMsg.seenBy &&
                            !lastMsg.seenBy.includes(user?._id) &&
                            !isActive;
                        const unreadCount = hasUnread ? (chat.unreadCount || 1) : 0;

                        return (
                            <div key={chat._id} className="relative group/item animate-fadeIn">
                                <div
                                    onClick={() => isGroup
                                        ? navigate(`/chat?chat=${chat._id}&name=${chat.name}&type=group`)
                                        : navigate(`/chat?user=${other._id}&name=${other.name}&chat=${chat._id}`)}
                                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] border relative ${isActive ? "sidebar-item-active" : "border-transparent"}`}
                                    style={!isActive ? {
                                        borderColor: "transparent"
                                    } : {}}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.borderColor = "var(--glass-border)"; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "transparent"; } }}
                                >
                                    <Avatar
                                        src={displayAvatar}
                                        name={displayName}
                                        size={11}
                                        online={isOnline}
                                        className={`transition-all duration-300 ${isActive ? "avatar-ring scale-[1.04]" : ""}`}
                                    />

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-sm font-bold truncate leading-tight`}
                                                style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}>
                                                {displayName}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                {chat.lastMessage?.createdAt && (
                                                    <span className="text-[9px] font-medium tabular-nums"
                                                        style={{ color: unreadCount > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                                                        {formatTime(chat.lastMessage.createdAt)}
                                                    </span>
                                                )}
                                                {unreadCount > 0 && (
                                                    <span className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
                                                        style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }}>
                                                        {unreadCount > 99 ? "99+" : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[11px] truncate leading-snug"
                                            style={{ color: "var(--text-muted)", fontWeight: unreadCount > 0 ? 600 : 400 }}>
                                            {chat.lastMessage?.content || "Start a conversation..."}
                                        </p>
                                    </div>

                                    {/* Context menu trigger */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveItemMenu(activeItemMenu === chat._id ? null : chat._id); }}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ml-1
                                            ${activeItemMenu === chat._id
                                                ? "opacity-100"
                                                : "opacity-0 group-hover/item:opacity-100"}`}
                                        style={{
                                            color: activeItemMenu === chat._id ? "var(--accent)" : "var(--text-muted)",
                                            background: activeItemMenu === chat._id ? "var(--hover-bg-strong)" : "transparent"
                                        }}
                                        aria-label="More options"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                </div>

                                {/* Context dropdown */}
                                {activeItemMenu === chat._id && (
                                    <div className="absolute top-1 right-12 glass-modal rounded-xl shadow-2xl p-1.5 z-[90] w-32 animate-toast">
                                        <button
                                            onClick={(e) => { setActiveItemMenu(null); handleRemove(e, chat._id, isGroup ? null : other?._id); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                            style={{ color: "var(--text-primary)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <Trash2 size={13} className="text-red-400" /> Clear
                                        </button>
                                        {!isGroup && (
                                            <button
                                                onClick={() => { setActiveItemMenu(null); handleBlock(other?._id); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 transition-colors"
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                <ShieldAlert size={13} /> Block
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;