import React, { useState, useEffect, useRef } from "react";
import socketIO from "socket.io-client";
import Message from "./Message";
import ScrollToBottom from "react-scroll-to-bottom";
import { Paperclip, Send, MessageCircle, Users, Globe, CheckCircle, Pencil, X, Check, Camera, Settings, LogOut, Menu } from "lucide-react";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import CreateGroupModal from "./CreateGroupModal";
import { accessChat, getMessages, sendMessage as sendMessageAPI, markSeen, deleteMessageAPI, getMyChats, updateMessageAPI, updateGroupAPI, leaveGroupAPI, createGroup, getProfile, updateProfile } from "../services/authService";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Toast } from "../ui/Toast";

const BackendPORT = import.meta.env.VITE_BACKEND_PORT;
const userToken = import.meta.env.VITE_USER_TOKEN;

// Resolve avatar URL: handles external links, Google image search URLs, and local paths
export const getAvatarURL = (str) => {
    if (!str) return null;

    // Extract actual image URL from Google Images search result links
    if (typeof str === 'string' && str.includes("google.com/imgres")) {
        try {
            const imgurl = new URL(str).searchParams.get("imgurl");
            if (imgurl) return decodeURIComponent(imgurl);
        } catch (e) { /* ignore */ }
    }

    // Already a full URL or data URI
    if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:")) return str;

    const baseUrl = BackendPORT.replace(/\/$/, '');
    const path = str.startsWith('/') ? str : `/${str}`;

    // Looks like an external domain (has a dot, not localhost, not /uploads)
    if (str.includes(".") && !str.includes("localhost") && !str.startsWith("/uploads")) {
        return `https://${str.replace(/^https?:\/\//, "")}`;
    }

    return `${baseUrl}${path}`;
};

const Chat = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedUserId = searchParams.get("user");
    const selectedChatId = searchParams.get("chat");
    const selectedName = searchParams.get("name");
    const chatType = searchParams.get("type") || "single";

    const [socket, setSocket] = useState(null);
    const typingRef = useRef(false);

    const [message, setMessage] = useState("");
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [activeContact, setActiveContact] = useState(null);
    const [myId] = useState(() => {
        const stored = localStorage.getItem(userToken);
        return stored ? JSON.parse(stored).user?._id : "";
    });
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);

    // Mobile & Theme states
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

    useEffect(() => {
        if (theme === "light") document.body.classList.add("light-theme");
        else document.body.classList.remove("light-theme");
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    // Auto-hide sidebar on mobile when chat is selected
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsSidebarOpen(true);
        };
        window.addEventListener("resize", handleResize);
        if (window.innerWidth < 768 && (selectedUserId || selectedChatId)) setIsSidebarOpen(false);
        return () => window.removeEventListener("resize", handleResize);
    }, [selectedUserId, selectedChatId]);

    useEffect(() => {
        if (selectedUserId || selectedChatId) setMainPanelView(null);
    }, [selectedUserId, selectedChatId]);

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [mainPanelView, setMainPanelView] = useState(null);

    // Group editing states
    const [isGroupEditModalOpen, setIsGroupEditModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupImage, setNewGroupImage] = useState("");
    const [groupImgFile, setGroupImgFile] = useState(null);
    const [updatingGroup, setUpdatingGroup] = useState(false);



    // Profile modal states & handlers
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarLinkInput, setAvatarLinkInput] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getProfile().then(res => {
            if (res?.success) {
                setUser(res.data.user);
                setEditName(res.data.user.name || "");
                setEditBio(res.data.user.bio || "");
            }
        });
    }, []);

    const saveProfile = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", editName);
            formData.append("bio", editBio);
            if (avatarFile) formData.append("avatar", avatarFile);
            else if (avatarLinkInput.trim()) formData.append("avatarLink", avatarLinkInput.trim());

            const res = await updateProfile(formData);
            if (res.success) {
                setUser(res.data);
                const stored = JSON.parse(localStorage.getItem(userToken));
                stored.user = res.data;
                localStorage.setItem(userToken, JSON.stringify(stored));
                Toast("Profile optimized", "success");
                setIsProfileOpen(false);
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    // 1. Persistent socket setup
    useEffect(() => {
        if (!myId) return;
        const newSocket = socketIO(BackendPORT, { transports: ["websocket"] });
        setSocket(newSocket);

        newSocket.on("connect", () => {
            newSocket.emit("setup", myId);
            getMyChats().then(res => { if (res.success) setChats(res.data); });
        });

        // Update sidebar when messages arrive globally
        newSocket.on("receiveMessage", (data) => {
            setChats(prev => prev.map(c => c._id === data.chatId ? { ...c, lastMessage: data } : c));
        });

        newSocket.on("groupAdded", (data) => setChats(prev => [data, ...prev]));

        newSocket.on("groupUpdated", (data) => {
            setChats(prev => prev.map(c => c._id === data._id ? { ...c, ...data } : c));
            if (chatId === data._id) setActiveChat(prev => ({ ...prev, ...data }));
        });

        return () => newSocket.disconnect();
    }, [myId, chatId]);

    // 2. Initialize active chat when URL params change
    useEffect(() => {
        if (!selectedUserId && !selectedChatId) {
            setChatId(null);
            setActiveContact(null);
            setReceivedMessages([]);
            setIsOnline(false);
            return;
        }

        const initChat = async () => {
            try {
                let currentChat;
                if (selectedUserId) {
                    const res = await accessChat(selectedUserId);
                    if (res.success) {
                        currentChat = res.data;
                        const other = res.data.members.find(m => m._id === selectedUserId);
                        setActiveContact(other);
                        setIsOnline(other?.online || false);
                    }
                } else if (selectedChatId) {
                    currentChat = chats.find(c => c._id === selectedChatId) || { _id: selectedChatId, type: chatType, name: selectedName };
                    setActiveContact(null);
                }

                if (currentChat) {
                    setChatId(currentChat._id);
                    setActiveChat(currentChat);
                    const msgRes = await getMessages(currentChat._id);
                    if (msgRes.success) {
                        setReceivedMessages(msgRes.data);
                        await markSeen(currentChat._id);
                        socket?.emit("messageSeen", { chatId: currentChat._id, userId: myId });
                    }
                    socket?.emit("joinChat", currentChat._id);
                }
            } catch (err) { console.error("Chat Init Error:", err); }
        };
        initChat();
    }, [selectedUserId, selectedChatId, chatType, socket, myId, chats]);

    // 3. Socket listeners for the active chat
    useEffect(() => {
        if (!socket || !chatId) return;

        const handleReceive = (data) => {
            if (data.chatId !== chatId) return;
            setReceivedMessages(prev => [...prev, data]);
            markSeen(chatId).finally(() => socket.emit("messageSeen", { chatId, userId: myId }));
        };

        const handleTyping = (cid) => { if (cid === chatId) setIsTyping(true); };
        const handleStopTyping = (cid) => { if (cid === chatId) setIsTyping(false); };

        const handleDelete = ({ messageId, chatId: cid }) => {
            if (cid === chatId) {
                setReceivedMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, content: "This message was deleted", deleted: true } : m
                ));
            }
        };

        const handleSeenUpdate = ({ userId, chatId: cid }) => {
            if (cid === chatId) {
                setReceivedMessages(prev => prev.map(m =>
                    m.sender._id !== userId && !m.seenBy.includes(userId)
                        ? { ...m, seenBy: [...m.seenBy, userId] }
                        : m
                ));
            }
        };

        const handleOnline = (id) => { if (id === selectedUserId) setIsOnline(true); };
        const handleOffline = (id) => { if (id === selectedUserId) setIsOnline(false); };

        socket.on("receiveMessage", handleReceive);
        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("broadcastDelete", handleDelete);
        socket.on("messageSeenUpdate", handleSeenUpdate);
        socket.on("userOnline", handleOnline);
        socket.on("userOffline", handleOffline);

        return () => {
            socket.off("receiveMessage", handleReceive);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("broadcastDelete", handleDelete);
            socket.off("messageSeenUpdate", handleSeenUpdate);
            socket.off("userOnline", handleOnline);
            socket.off("userOffline", handleOffline);
        };
    }, [socket, chatId, selectedUserId]);

    // Handle input + typing indicator with 3s debounce
    const handleTypingEv = (e) => {
        setMessage(e.target.value);
        if (!socket || !chatId) return;
        if (!typingRef.current) {
            typingRef.current = true;
            socket.emit("typing", chatId);
        }
        const lastTypingTime = Date.now();
        setTimeout(() => {
            if (Date.now() - lastTypingTime >= 3000 && typingRef.current) {
                socket.emit("stopTyping", chatId);
                typingRef.current = false;
            }
        }, 3000);
    };

    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState("");

    const startEdit = (msg) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setEditContent("");
    };

    const handleUpdateMessage = async () => {
        if (!editContent.trim() || !editingMessage) return;

        try {
            const res = await updateMessageAPI(editingMessage._id, { content: editContent, chatId });
            if (res.success) {
                socket.emit("updateMessage", { chatId, message: res.data });
                setReceivedMessages(prev => prev.map(m => m._id === editingMessage._id ? res.data : m));
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, lastMessage: res.data } : c));
                setEditingMessage(null);
                setEditContent("");
            }
        } catch (err) { console.error("Update Error:", err); }
    };

    const send = async () => {
        if (!message.trim() || !chatId) return;
        if (typingRef.current) {
            socket.emit("stopTyping", chatId);
            typingRef.current = false;
        }
        try {
            const res = await sendMessageAPI({ content: message, chatId });
            if (res.success) {
                socket.emit("sendMessage", { chatId, message: res.data });
                setReceivedMessages(prev => [...prev, res.data]);
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, lastMessage: res.data } : c));
                setMessage("");
            }
        } catch (err) { console.error("Send Message Error:", err); }
    };

    const handleDeleteMsg = async (messageId) => {
        try {
            const res = await deleteMessageAPI(messageId);
            if (res.success) {
                setReceivedMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, content: "This message was deleted", deleted: true } : m
                ));
                socket.emit("messageDeleted", { chatId, messageId });
                Toast("Message deleted", "success");
            }
        } catch (e) { Toast("Delete failed", "error"); }
    };

    const handleCreateGroup = async ({ name, members }) => {
        try {
            const res = await createGroup({ name, members });
            if (res.success) {
                setChats(prev => [res.data, ...prev]);
                setMainPanelView(null);
                Toast("Group created", "success");
                navigate(`/chat?chat=${res.data._id}&name=${res.data.name}&type=group`);
                socket?.emit("newGroupCreated", res.data);
            }
        } catch (e) {
            Toast(e.message || "Failed to create group", "error");
            throw e;
        }
    };

    const handleUpdateGroup = async () => {
        if (!newGroupName.trim() && !groupImgFile && !newGroupImage) return;
        setUpdatingGroup(true);
        try {
            const fd = new FormData();
            fd.append("chatId", chatId);
            if (newGroupName) fd.append("name", newGroupName);
            if (groupImgFile) fd.append("avatar", groupImgFile);
            else if (newGroupImage) fd.append("imageLink", newGroupImage);

            const res = await updateGroupAPI(fd);
            if (res.success) {
                setActiveChat(res.data);
                setChats(prev => prev.map(c => c._id === chatId ? res.data : c));
                socket?.emit("updateGroup", res.data);
                setIsGroupEditModalOpen(false);
                Toast("Group updated", "success");
            }
        } catch (e) { Toast("Update failed", "error"); }
        finally { setUpdatingGroup(false); }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            const res = await leaveGroupAPI({ chatId });
            if (res.success) {
                setChats(prev => prev.filter(c => c._id !== chatId));
                navigate("/chat");
                Toast("Left group successfully", "success");
            }
        } catch (e) { Toast("Failed to leave group", "error"); }
    };

    // Build the status text for the chat header
    const statusText = isTyping ? "typing..." : chatType === "single" ? (isOnline ? "online" : "offline") : `${activeChat?.members?.length || 0} members`;
    const statusClass = isTyping ? "text-blue-400 animate-pulse" : isOnline ? "text-green-400" : "text-slate-400";
    const isGroupAdmin = activeChat?.type === "group" && (activeChat.admin?._id || activeChat.admin) === myId;

    return (
        <div className={`flex flex-col h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)] font-sans transition-colors duration-300 ${theme === 'light' ? 'light-theme' : ''}`}>
            <Header theme={theme} toggleTheme={toggleTheme} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* ── Sidebar: fixed overlay on mobile, static on desktop ── */}
                <div className={`
                    fixed md:relative z-50 h-full w-[82vw] max-w-[320px] md:w-[300px] lg:w-[320px] shrink-0
                    transition-transform duration-300 ease-in-out
                    bg-[var(--bg-secondary)] md:shadow-none
                    ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
                `}>
                    <Sidebar
                        sharedChats={chats} setSharedChats={setChats} socket={socket}
                        theme={theme} toggleTheme={toggleTheme}
                        openMainPanel={(view) => { setMainPanelView(view); setIsSidebarOpen(false); }}
                        user={user} onProfileClick={() => setIsProfileOpen(true)}
                        onCloseSidebar={() => setIsSidebarOpen(false)}
                    />
                </div>

                {/* Mobile backdrop */}
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className={`md:hidden fixed inset-0 backdrop-panel z-40 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                />

                {/* ── Main chat panel ── */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-secondary)] min-w-0">
                    {/* Ambient background */}
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: 'var(--glow-opacity)' }}>
                        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/8 blur-[180px] rounded-full" />
                        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-600/8 blur-[180px] rounded-full" />
                    </div>

                    {/* ── Chat header bar ── */}
                    <div className="h-[60px] px-4 md:px-5 flex items-center justify-between z-20 shrink-0 relative"
                        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderBottom: '1px solid var(--glass-border)' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            {/* Mobile sidebar toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                                className={`md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg-strong)] transition-all active:scale-95 shrink-0 ${isSidebarOpen ? "hidden" : "flex"}`}
                            >
                                <Menu size={19} />
                            </button>

                            {chatId ? (
                                <div className="flex items-center gap-3 min-w-0 animate-toast">
                                    <div className="relative shrink-0">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border transition-all"
                                            style={{ borderColor: 'var(--glass-border)' }}>
                                            {chatType === "group"
                                                ? (activeChat?.image
                                                    ? <img src={getAvatarURL(activeChat.image)} className="w-full h-full object-cover" alt="group" />
                                                    : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.15)' }}><Users size={16} className="text-blue-300" /></div>)
                                                : chatType === "public"
                                                    ? <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}><Globe size={16} className="text-indigo-300" /></div>
                                                    : <img src={getAvatarURL(activeContact?.avatar)} className="w-full h-full object-cover" alt="contact" />
                                            }
                                        </div>
                                        {chatType === "single" && (
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 transition-all duration-300 ${isOnline ? "dot-online" : "bg-slate-500"}`}
                                                style={{ borderColor: 'var(--bg-secondary)' }} />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[14px] font-bold text-[var(--text-primary)] tracking-tight truncate leading-tight">
                                            {activeChat?.name || selectedName || activeContact?.name || "Chat Room"}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {chatType === "single" && (
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
                                            )}
                                            <span className={`text-[10px] font-semibold tracking-wide uppercase ${statusClass}`}>{statusText}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--text-muted)]"
                                    style={{ background: 'var(--hover-bg)', border: '1px solid var(--glass-border)' }}>
                                    <CheckCircle size={12} className="text-[var(--accent)]" />
                                    Select a conversation
                                </div>
                            )}
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {isGroupAdmin && (
                                <button
                                    onClick={() => { setIsGroupEditModalOpen(true); setNewGroupName(activeChat.name); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--accent)] transition-all duration-200 active:scale-95"
                                    style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}
                                >
                                    <Pencil size={11} /> <span className="hidden sm:inline">Edit Group</span>
                                </button>
                            )}
                            {chatType === "group" && (
                                <button
                                    onClick={handleLeaveGroup}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 transition-all duration-200 active:scale-95"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                                >
                                    <LogOut size={11} /> <span className="hidden sm:inline">Leave</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Group Edit Modal ── */}
                    {isGroupEditModalOpen && (
                        <div className="fixed inset-0 backdrop-panel z-[200] flex items-center justify-center p-4 animate-fadeIn">
                            <div className="w-full max-w-sm glass-modal rounded-3xl overflow-hidden animate-toast shadow-2xl">
                                <div className="px-6 py-5 border-b border-[var(--glass-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                                            <Settings size={15} className="text-[var(--accent)]" />
                                        </div>
                                        <h3 className="text-base font-extrabold text-[var(--text-primary)]">Edit Group</h3>
                                    </div>
                                    <button onClick={() => setIsGroupEditModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Group image */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative cursor-pointer group" onClick={() => document.getElementById('group-img-upload').click()}>
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all group-hover:border-[var(--accent)]"
                                                style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                                                {(groupImgFile || newGroupImage || activeChat?.image)
                                                    ? <img src={groupImgFile ? URL.createObjectURL(groupImgFile) : getAvatarURL(newGroupImage || activeChat?.image)} className="w-full h-full object-cover" alt="group" />
                                                    : <div className="w-full h-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}><Users size={28} className="text-[var(--accent)]" /></div>
                                                }
                                            </div>
                                            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Camera size={20} className="text-white" />
                                            </div>
                                            <input type="file" id="group-img-upload" className="hidden" onChange={(e) => { setGroupImgFile(e.target.files[0]); setNewGroupImage(""); }} />
                                        </div>

                                        <div className="w-full">
                                            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Image URL</label>
                                            <input type="text" placeholder="https://..." value={newGroupImage}
                                                onChange={(e) => { setNewGroupImage(e.target.value); setGroupImgFile(null); }}
                                                className="w-full rounded-xl px-4 py-3 text-sm text-[var(--accent)] font-medium input-base" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Group Name</label>
                                        <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name..."
                                            className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] input-base" />
                                    </div>
                                </div>

                                <div className="px-6 pb-6 space-y-2.5">
                                    <button onClick={handleUpdateGroup} disabled={updatingGroup}
                                        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white btn-accent disabled:opacity-50 active:scale-[0.97] transition-all">
                                        {updatingGroup ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </span>
                                        ) : "Save Changes"}
                                    </button>
                                    <button onClick={() => setIsGroupEditModalOpen(false)}
                                        className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors font-medium">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Messages area ── */}
                    <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <ScrollToBottom
                                className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
                                scrollViewClassName="flex flex-col gap-2 min-h-full px-3 md:px-5 py-5 pb-10 overflow-x-hidden"
                            >
                                {!chatId && (
                                    <div className="m-auto flex flex-col items-center justify-center text-center px-4 py-16 max-w-xs w-full animate-toast">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                                            <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
                                                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                                                <MessageCircle size={40} className="text-[var(--accent)]" />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-extrabold gradient-text mb-2">ChatFlow</h2>
                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">
                                            Pick a conversation from the sidebar or search for someone new to start chatting.
                                        </p>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest"
                                            style={{ background: 'var(--hover-bg)', border: '1px solid var(--glass-border)' }}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            End-to-end encrypted
                                        </div>
                                    </div>
                                )}

                                {receivedMessages.map((item, index) => (
                                    <Message
                                        key={item._id || index}
                                        id={item._id}
                                        own={(item.sender._id || item.sender) === myId}
                                        message={item.content}
                                        timestamp={item.createdAt}
                                        senderName={chatType !== 'single' ? item.sender.name : null}
                                        senderAvatar={chatType !== 'single' ? item.sender.avatar : null}
                                        seen={item.seenBy.length > 1}
                                        deleted={item.deleted}
                                        onDelete={() => handleDeleteMsg(item._id)}
                                        onEdit={() => startEdit(item)}
                                        isEditing={editingMessage?._id === item._id}
                                        onUpdate={handleUpdateMessage}
                                        editContent={editContent}
                                        onCancelEdit={cancelEdit}
                                        onEditChange={(e) => setEditContent(e.target.value)}
                                        onEditKeyDown={(e) => e.key === "Enter" && handleUpdateMessage()}
                                        theme={theme}
                                    />
                                ))}
                            </ScrollToBottom>
                        </div>

                        {/* ── Input area ── */}
                        {chatId && (
                            <div className="px-4 md:px-5 pb-4 pt-2 z-20 safe-bottom">
                                {/* Edit banner */}
                                {editingMessage && (
                                    <div className="flex items-center justify-between px-4 py-2 rounded-t-2xl animate-toast"
                                        style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderTop: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderLeft: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRight: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                                        <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest flex items-center gap-1.5">
                                            <Pencil size={10} className="animate-pulse" /> Editing message
                                        </span>
                                        <button onClick={cancelEdit} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all">
                                            <X size={13} />
                                        </button>
                                    </div>
                                )}

                                <div className={`flex items-center gap-2 px-3 py-1.5 transition-all duration-250 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.25)] ${editingMessage ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"}`}
                                    style={{
                                        background: 'var(--glass-bg)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        border: editingMessage
                                            ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)'
                                            : '1px solid var(--glass-border)',
                                        borderTop: editingMessage ? 'none' : undefined,
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-all active:scale-90 shrink-0">
                                        <Paperclip size={18} />
                                    </button>

                                    <input
                                        value={editingMessage ? editContent : message}
                                        onChange={editingMessage ? (e) => setEditContent(e.target.value) : handleTypingEv}
                                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingMessage ? handleUpdateMessage() : send(); } }}
                                        placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
                                        className="flex-1 bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-3 px-1 min-w-0"
                                    />

                                    {editingMessage ? (
                                        <button onClick={handleUpdateMessage} disabled={!editContent.trim()}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-40 shrink-0 btn-accent">
                                            <Check size={16} />
                                        </button>
                                    ) : (
                                        <button onClick={send} disabled={!message.trim()}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${message.trim() ? "btn-accent" : "opacity-25 grayscale cursor-not-allowed"}`}
                                            style={message.trim() ? {} : { background: 'var(--hover-bg)', border: '1px solid var(--glass-border)' }}>
                                            <Send size={16} className={message.trim() ? "text-white" : "text-[var(--text-muted)]"} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Group Creation Modal ── */}
            <CreateGroupModal
                isOpen={mainPanelView === "createGroup"}
                onClose={() => setMainPanelView(null)}
                chats={chats}
                myId={myId}
                onCreateGroup={handleCreateGroup}
                getAvatarURL={getAvatarURL}
            />

            {/* ── Profile Modal ── */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-panel animate-fadeIn">
                    <div className="w-full sm:max-w-sm glass-modal rounded-t-3xl sm:rounded-3xl overflow-hidden animate-toast shadow-2xl" style={{ maxHeight: '92dvh' }}>
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[var(--glass-border)] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-extrabold text-[var(--text-primary)]">Profile</h3>
                                <p className="text-xs text-[var(--text-muted)]">Update your info and avatar</p>
                            </div>
                            <button onClick={() => setIsProfileOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto custom-scrollbar px-6 py-6 space-y-5" style={{ maxHeight: 'calc(92dvh - 72px - 80px)' }}>
                            {/* Avatar */}
                            <div className="flex justify-center">
                                <div className="relative cursor-pointer group" onClick={() => document.getElementById('profile-file').click()}>
                                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 transition-all group-hover:border-[var(--accent)] shadow-xl"
                                        style={{ borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-violet-600 opacity-20" />
                                        <img src={avatarPreview || getAvatarURL(user?.avatar)} className="relative w-full h-full object-cover" alt="profile" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Camera size={22} className="text-white" />
                                    </div>
                                    <input type="file" id="profile-file" className="hidden" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                                    }} />
                                </div>
                            </div>

                            {/* Fields */}
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Display Name</label>
                                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                    className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] input-base" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Bio</label>
                                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="Tell people about yourself..."
                                    className="w-full rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] input-base resize-none leading-relaxed" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Avatar URL</label>
                                <input value={avatarLinkInput} onChange={(e) => setAvatarLinkInput(e.target.value)} placeholder="https://..."
                                    className="w-full rounded-xl px-4 py-3.5 text-sm text-[var(--accent)] font-medium input-base" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[var(--glass-border)] safe-bottom">
                            <button onClick={saveProfile} disabled={saving}
                                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white btn-accent disabled:opacity-50 active:scale-[0.97] transition-all">
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </span>
                                ) : "Save Profile"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;