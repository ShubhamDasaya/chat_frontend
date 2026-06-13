import React, { useState, useEffect, useRef } from "react";
import { X, Globe, Trash2, Users, MessageSquare, ShieldAlert, MoreVertical } from "lucide-react";
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
            prev.map(c => c.type === 'single' && c.members.some(m => m._id === uid)
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
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)] overflow-hidden">

            {/* ── Header ── */}
            <div className="px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-[var(--glass-border)]"
                style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <div onClick={onProfileClick} className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0">
                    <Avatar src={user?.avatar} name={user?.name} size={9} online={true} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{user?.name || "..."}</p>
                        <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wide">Available</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => openMainPanel?.("createGroup")}
                        title="New Group"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-all duration-150 active:scale-95 border border-transparent hover:border-[var(--glass-border)]"
                    >
                        <Users size={17} />
                    </button>
                    {onCloseSidebar && (
                        <button
                            onClick={onCloseSidebar}
                            title="Close"
                            className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 active:scale-95"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Bio ── */}
            {user?.bio && (
                <div className="px-4 pt-2.5 pb-1 shrink-0">
                    <p className="text-[11px] text-[var(--text-muted)] italic line-clamp-1 opacity-60">"{user.bio}"</p>
                </div>
            )}

            {/* ── Public Chat Button ── */}
            <div className="px-4 py-3 shrink-0">
                <button
                    onClick={handlePublicChat}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-2xl font-bold text-[11px] text-[var(--accent)] transition-all duration-200 hover:bg-[var(--hover-bg-strong)] active:scale-[0.98] uppercase tracking-widest"
                    style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)' }}
                >
                    <Globe size={15} />
                    Explore Public Feed
                </button>
            </div>

            {/* ── Conversation list ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1" ref={menuRef}>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
                    Conversations
                </p>

                {sharedChats.length === 0 && (
                    <div className="flex flex-col items-center py-14 opacity-25 text-center px-4">
                        <MessageSquare size={36} className="mb-3 text-[var(--text-muted)]" />
                        <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                            No conversations yet.<br />Search for users or join the public feed.
                        </p>
                    </div>
                )}

                <div className="space-y-0.5">
                    {sharedChats.map((chat) => {
                        const isGroup = chat.type === "group";
                        const other = isGroup ? null : chat.members.find(m => m._id !== user?._id);
                        if (!isGroup && !other) return null;

                        const isActive = activeChatId === chat._id || (!isGroup && activeUserId === other?._id);
                        const displayName = isGroup ? chat.name : other?.name;
                        const displayAvatar = isGroup ? chat.image : other?.avatar;
                        const isOnline = !isGroup && other?.online;

                        return (
                            <div key={chat._id} className="relative group/item animate-fadeIn">
                                <div
                                    onClick={() => isGroup
                                        ? navigate(`/chat?chat=${chat._id}&name=${chat.name}&type=group`)
                                        : navigate(`/chat?user=${other._id}&name=${other.name}&chat=${chat._id}`)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] relative ${isActive ? "sidebar-item-active" : "hover:bg-[var(--hover-bg)]"}`}
                                >
                                    <Avatar 
                                        src={displayAvatar} 
                                        name={displayName} 
                                        size={11} 
                                        online={isOnline} 
                                        className={`border transition-all ${isActive ? "border-[var(--accent)]/40" : "border-[var(--glass-border)]"}`}
                                    />

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-sm font-bold truncate leading-tight ${isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                                                {displayName}
                                            </span>
                                            {chat.lastMessage?.createdAt && (
                                                <span className="text-[9px] font-medium text-[var(--text-muted)] shrink-0 ml-2 tabular-nums">
                                                    {formatTime(chat.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate leading-snug">
                                            {chat.lastMessage?.content || "Start a conversation..."}
                                        </p>
                                    </div>

                                    {/* Context menu trigger */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveItemMenu(activeItemMenu === chat._id ? null : chat._id); }}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ml-1
                                            ${activeItemMenu === chat._id
                                                ? "opacity-100 text-[var(--accent)] bg-[var(--hover-bg-strong)]"
                                                : "opacity-0 group-hover/item:opacity-100 text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                                            }`}
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
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-xs font-bold text-[var(--text-primary)] transition-colors"
                                        >
                                            <Trash2 size={13} className="text-red-400" /> Clear
                                        </button>
                                        {!isGroup && (
                                            <button
                                                onClick={() => { setActiveItemMenu(null); handleBlock(other?._id); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-xs font-bold text-red-400 transition-colors"
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