import React, { useState, useEffect, useRef } from "react";
import socketIO from "socket.io-client";
import Message from "./Message";
import { Paperclip, Send, MessageCircle, Users, Globe, CheckCircle, Pencil, X, Check, Camera, Settings, LogOut, Menu, Search } from "lucide-react";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import CreateGroupModal from "./CreateGroupModal";
import GroupEditModal from "./Chat/components/GroupEditModal";
import ForwardMessageModal from "./Chat/components/ForwardMessageModal";
import ProfileSettingsModal from "./Chat/components/ProfileSettingsModal";
import MessageSkeleton from "./Chat/components/MessageSkeleton";
import ConfirmModal from "./Chat/components/ConfirmModal";
import { playNotificationSound } from "./Chat/utils/audio";
import { BackendPORT } from "./api/Api";
import EmojiPicker from "emoji-picker-react";
import { accessChat, getMessages, sendMessage as sendMessageAPI, markSeen, deleteMessageAPI, getMyChats, updateMessageAPI, leaveGroupAPI, createGroup, getProfile, uploadMediaAPI, reactToMessageAPI, getPublicChat } from "../services/authService";
import { useLocation, useNavigate } from "react-router-dom";
import { Toast } from "../ui/Toast";
import Avatar from "../ui/Avatar";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const selectedUserId = location.state?.user;
    const selectedChatId = location.state?.chat;
    const selectedName = location.state?.name;
    const chatType = location.state?.type || "single";

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

    const unreadCountRef = useRef(0);
    const activeChatIdRef = useRef(null);

    const fileInputRef = useRef(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    // Clear object URL on preview change to prevent memory leaks
    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    // Reset selection when chat room changes
    useEffect(() => {
        setSelectedFile(null);
        setFilePreview(null);
    }, [chatId]);

    const [loadingMessages, setLoadingMessages] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

    const [replyingTo, setReplyingTo] = useState(null);

    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFullPicker, setShowFullPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const quickEmojiList = ["😀", "😂", "🥰", "😎", "🤔", "😅", "🙏", "👍", "👏", "❤️", "🔥", "✅", "😮", "😢", "😍", "🎉", "💯", "🤣", "😭", "✨", "💪", "🙌", "🤝", "👀", "😬", "🥳", "😡", "💔", "🌟", "🚀"];

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const [forwardMsg, setForwardMsg] = useState(null);
    const handleForward = (msgData) => setForwardMsg(msgData);
    const sendForward = async (targetChatId) => {
        if (!forwardMsg || !targetChatId) return;
        try {
            const res = await sendMessageAPI({ content: forwardMsg.message || "", chatId: targetChatId, media: forwardMsg.media || [], mediaType: forwardMsg.mediaType || [] });
            if (res.success) {
                socket?.emit("sendMessage", { chatId: targetChatId, message: res.data });
                Toast("Message forwarded!", "success");
            }
        } catch { Toast("Forward failed", "error"); }
        finally { setForwardMsg(null); }
    };

    const [showContactInfo, setShowContactInfo] = useState(false);

    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const chatContainerRef = useRef(null);
    const isInitialLoadRef = useRef(false);
    const lastMessageIdRef = useRef(null);

    const messagesCacheRef = useRef({});
    const chatHasMoreRef = useRef({});

    useEffect(() => {
        if (theme === "light") document.body.classList.add("light-theme");
        else document.body.classList.remove("light-theme");
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    useEffect(() => {
        activeChatIdRef.current = chatId;
    }, [chatId]);

    // Reset unread status when tab is focused
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                unreadCountRef.current = 0;
                document.title = "ChatFlow";
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Request notification permissions on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Toggle sidebar layout on mobile
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
    const chatsRef = useRef(chats);
    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);
    const [activeChat, setActiveChat] = useState(null);
    const [mainPanelView, setMainPanelView] = useState(null);

    const [isGroupEditModalOpen, setIsGroupEditModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "",
        type: "danger",
        onConfirm: () => { }
    });

    useEffect(() => {
        getProfile().then(res => {
            if (res?.success) {
                setUser(res.data.user);
            }
        });
    }, []);

    // Setup persistent real-time socket connections
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

            // Sync with cache
            if (messagesCacheRef.current[data.chatId]) {
                const cacheMsgs = messagesCacheRef.current[data.chatId];
                if (!cacheMsgs.some(m => m._id === data._id)) {
                    messagesCacheRef.current[data.chatId] = [...cacheMsgs, data];
                }
            }

            // Audio chime & dynamic badge rules
            const isTabInactive = document.visibilityState !== "visible";
            const isDifferentChat = activeChatIdRef.current !== data.chatId;
            const isOutgoingMessage = (data.sender._id || data.sender) === myId;

            if (!isOutgoingMessage && (isDifferentChat || isTabInactive)) {
                playNotificationSound();

                // Trigger desktop push notification
                if (isTabInactive && "Notification" in window && Notification.permission === "granted") {
                    const notification = new Notification(`New message from ${data.sender.name || 'User'}`, {
                        body: data.content || "Shared a file attachment",
                        icon: data.sender.avatar || undefined,
                        tag: data.chatId // Group alerts by conversation thread
                    });
                    notification.onclick = () => {
                        window.focus();
                    };
                }

                if (isTabInactive) {
                    unreadCountRef.current += 1;
                    document.title = `(${unreadCountRef.current}) ChatFlow`;
                }
            }
        });

        newSocket.on("groupAdded", (data) => setChats(prev => [data, ...prev]));

        newSocket.on("groupUpdated", (data) => {
            setChats(prev => prev.map(c => c._id === data._id ? { ...c, ...data } : c));
            if (activeChatIdRef.current === data._id) setActiveChat(prev => ({ ...prev, ...data }));
        });

        return () => newSocket.disconnect();
    }, [myId]);

    // Initialize active chat session
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
                    // Try to find the existing chat room in chatsRef.current locally
                    const existingChat = chatsRef.current.find(c =>
                        c.type === "single" &&
                        c.members.some(m => m._id === selectedUserId)
                    );

                    if (existingChat) {
                        currentChat = existingChat;
                        const other = existingChat.members.find(m => m._id === selectedUserId);
                        setActiveContact(other);
                        setIsOnline(other?.online || false);
                    } else {
                        // Fallback to API if not loaded yet
                        const res = await accessChat(selectedUserId);
                        if (res.success) {
                            currentChat = res.data;
                            const other = res.data.members.find(m => m._id === selectedUserId);
                            setActiveContact(other);
                            setIsOnline(other?.online || false);
                        }
                    }
                } else if (selectedChatId) {
                    currentChat = chatsRef.current.find(c => c._id === selectedChatId) || { _id: selectedChatId, type: chatType, name: selectedName };
                    setActiveContact(null);
                }

                if (currentChat) {
                    const cid = currentChat._id;
                    setChatId(cid);
                    setActiveChat(currentChat);
                    setReplyingTo(null);

                    // Load from memory cache if available
                    const cachedMsgs = messagesCacheRef.current[cid];
                    if (cachedMsgs) {
                        setReceivedMessages(cachedMsgs);
                        setHasMoreMessages(chatHasMoreRef.current[cid] !== false);
                        setLoadingMessages(false);
                    } else {
                        setReceivedMessages([]);
                        setHasMoreMessages(true);
                        setLoadingMessages(true);
                    }

                    isInitialLoadRef.current = true;

                    const msgRes = await getMessages(cid, { limit: 30 });
                    if (msgRes.success) {
                        setReceivedMessages(msgRes.data);
                        messagesCacheRef.current[cid] = msgRes.data;

                        const hasMore = msgRes.data.length >= 30;
                        setHasMoreMessages(hasMore);
                        chatHasMoreRef.current[cid] = hasMore;

                        await markSeen(cid);
                        socket?.emit("messageSeen", { chatId: cid, userId: myId });
                    }
                    setLoadingMessages(false);
                    socket?.emit("joinChat", cid);
                }
            } catch (err) {
                console.error("Chat Init Error:", err);
                setLoadingMessages(false);
            }
        };
        initChat();
    }, [selectedUserId, selectedChatId, chatType, socket, myId]);

    // Load older messages (triggered on scrolling to the top)
    const loadMoreMessages = async () => {
        if (!chatId || loadingMore || !hasMoreMessages || receivedMessages.length === 0) return;
        setLoadingMore(true);

        const oldestMsgId = receivedMessages[0]._id;
        try {
            const res = await getMessages(chatId, { before: oldestMsgId, limit: 30 });
            if (res.success) {
                if (res.data.length < 30) {
                    setHasMoreMessages(false);
                }

                const container = chatContainerRef.current;
                const prevScrollHeight = container ? container.scrollHeight : 0;
                const prevScrollTop = container ? container.scrollTop : 0;

                setReceivedMessages(prev => [...res.data, ...prev]);

                // Anchor scroll position to prevent jumping
                setTimeout(() => {
                    if (container) {
                        const heightDiff = container.scrollHeight - prevScrollHeight;
                        container.scrollTop = prevScrollTop + heightDiff;
                    }
                }, 0);
            }
        } catch (err) {
            console.error("Load older messages error:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (!container) return;

        // If we scrolled to the very top, trigger loadMoreMessages
        if (container.scrollTop === 0) {
            loadMoreMessages();
        }
    };

    // Initial scroll to bottom on chat load
    useEffect(() => {
        if (!loadingMessages && receivedMessages.length > 0 && chatContainerRef.current) {
            const container = chatContainerRef.current;
            if (isInitialLoadRef.current) {
                container.scrollTop = container.scrollHeight;
                isInitialLoadRef.current = false;
            }
        }
    }, [loadingMessages, receivedMessages]);

    // Auto-scroll on new message received or sent
    useEffect(() => {
        if (receivedMessages.length === 0 || !chatContainerRef.current) return;
        const container = chatContainerRef.current;
        const lastMsg = receivedMessages[receivedMessages.length - 1];

        if (lastMessageIdRef.current !== lastMsg._id) {
            lastMessageIdRef.current = lastMsg._id;

            const isMyOwn = (lastMsg.sender?._id || lastMsg.sender) === myId;
            const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 250;

            if (isMyOwn || isNearBottom) {
                setTimeout(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                }, 50);
            }
        }
    }, [receivedMessages, myId]);

    // Reset initialization states when chat changes
    useEffect(() => {
        isInitialLoadRef.current = true;
        setHasMoreMessages(true);
    }, [chatId]);

    // Setup event listeners for active chat events
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
                setReceivedMessages(prev => prev.filter(m => m._id !== messageId));
            }
            if (messagesCacheRef.current[cid]) {
                messagesCacheRef.current[cid] = messagesCacheRef.current[cid].filter(m => m._id !== messageId);
            }
            // Update sidebar lastMessage if it was the deleted one
            setChats(prev => prev.map(c => {
                if (c._id === cid && c.lastMessage?._id === messageId) {
                    const remaining = messagesCacheRef.current[cid] || [];
                    // Filter out the deleted message from remaining cache to find the new last message
                    const filteredRemaining = remaining.filter(m => m._id !== messageId);
                    const newLast = filteredRemaining.length > 0 ? filteredRemaining[filteredRemaining.length - 1] : null;
                    return { ...c, lastMessage: newLast };
                }
                return c;
            }));
        };

        const handleSeenUpdate = ({ userId, chatId: cid }) => {
            if (cid === chatId) {
                setReceivedMessages(prev => prev.map(m =>
                    m.sender._id !== userId && !m.seenBy.includes(userId)
                        ? { ...m, seenBy: [...m.seenBy, userId] }
                        : m
                ));
            }
            if (messagesCacheRef.current[cid]) {
                messagesCacheRef.current[cid] = messagesCacheRef.current[cid].map(m =>
                    m.sender._id !== userId && !m.seenBy.includes(userId)
                        ? { ...m, seenBy: [...m.seenBy, userId] }
                        : m
                );
            }
        };

        const handleReceiveReaction = ({ messageId, reactions }) => {
            setReceivedMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
            if (messagesCacheRef.current[chatId]) {
                messagesCacheRef.current[chatId] = messagesCacheRef.current[chatId].map(m =>
                    m._id === messageId ? { ...m, reactions } : m
                );
            }
        };

        const handleMessageUpdated = (msg) => {
            const msgChatId = msg.chatId?._id || msg.chatId;

            // Instantly update the sidebar lastMessage regardless of which chat is active
            setChats(prev => prev.map(c => c._id === msgChatId ? { ...c, lastMessage: msg } : c));

            if (msgChatId === chatId) {
                setReceivedMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
            }
            if (messagesCacheRef.current[msgChatId]) {
                messagesCacheRef.current[msgChatId] = messagesCacheRef.current[msgChatId].map(m =>
                    m._id === msg._id ? msg : m
                );
            }
        };

        const handleOnline = (id) => { if (id === selectedUserId) setIsOnline(true); };
        const handleOffline = (id) => { if (id === selectedUserId) setIsOnline(false); };

        socket.on("receiveMessage", handleReceive);
        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("broadcastDelete", handleDelete);
        socket.on("messageSeenUpdate", handleSeenUpdate);
        socket.on("receiveReaction", handleReceiveReaction);
        socket.on("messageUpdated", handleMessageUpdated);
        socket.on("userOnline", handleOnline);
        socket.on("userOffline", handleOffline);

        return () => {
            socket.off("receiveMessage", handleReceive);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("broadcastDelete", handleDelete);
            socket.off("messageSeenUpdate", handleSeenUpdate);
            socket.off("receiveReaction", handleReceiveReaction);
            socket.off("messageUpdated", handleMessageUpdated);
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
        setReplyingTo(null); // Mutually exclusive visual states
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
                if (messagesCacheRef.current[chatId]) {
                    messagesCacheRef.current[chatId] = messagesCacheRef.current[chatId].map(m => m._id === editingMessage._id ? res.data : m);
                }
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, lastMessage: res.data } : c));
                setEditingMessage(null);
                setEditContent("");
            }
        } catch (err) { console.error("Update Error:", err); }
    };

    const send = async () => {
        if ((!message.trim() && !selectedFile) || !chatId) return;
        
        if (typingRef.current) {
            socket.emit("stopTyping", chatId);
            typingRef.current = false;
        }

        setUploadingFile(true);
        try {
            let mediaUrls = [];
            let mediaTypes = [];

            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const uploadRes = await uploadMediaAPI(formData);
                if (uploadRes.success) {
                    mediaUrls = [uploadRes.data.fileUrl];
                    mediaTypes = [uploadRes.data.mediaType];
                } else {
                    throw new Error("Attachment upload failed");
                }
            }

            const res = await sendMessageAPI({
                content: message.trim(),
                chatId,
                media: mediaUrls.length > 0 ? mediaUrls : undefined,
                mediaType: mediaTypes.length > 0 ? mediaTypes : undefined,
                parentMessageId: replyingTo?._id || null
            });

            if (res.success) {
                socket.emit("sendMessage", { chatId, message: res.data });
                setReceivedMessages(prev => [...prev, res.data]);
                if (messagesCacheRef.current[chatId]) {
                    messagesCacheRef.current[chatId] = [...messagesCacheRef.current[chatId], res.data];
                }
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, lastMessage: res.data } : c));
                setMessage("");
                setReplyingTo(null);

                // Clear attachment preview states
                setSelectedFile(null);
                if (filePreview) {
                    URL.revokeObjectURL(filePreview);
                    setFilePreview(null);
                }
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("Send Message Error:", err);
            Toast(err?.message || "Send failed", "error");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteMsg = async (messageId) => {
        try {
            const res = await deleteMessageAPI(messageId);
            if (res.success) {
                // Completely filter out the deleted message
                setReceivedMessages(prev => prev.filter(m => m._id !== messageId));
                if (messagesCacheRef.current[chatId]) {
                    messagesCacheRef.current[chatId] = messagesCacheRef.current[chatId].filter(m => m._id !== messageId);
                }
                // Update sidebar lastMessage if it was the deleted one
                setChats(prev => prev.map(c => {
                    if (c._id === chatId && c.lastMessage?._id === messageId) {
                        const remaining = messagesCacheRef.current[chatId] || [];
                        const newLast = remaining.length > 0 ? remaining[remaining.length - 1] : null;
                        return { ...c, lastMessage: newLast };
                    }
                    return c;
                }));
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
                navigate("/chat", { state: { chat: res.data._id, name: res.data.name, type: "group" } });
                socket?.emit("newGroupCreated", res.data);
            }
        } catch (e) {
            Toast(e.message || "Failed to create group", "error");
            throw e;
        }
    };



    const handleLeaveGroup = () => {
        setConfirmData({
            isOpen: true,
            title: "Leave Group",
            message: "Are you sure you want to leave this group? You will no longer receive messages.",
            confirmText: "Leave Group",
            type: "danger",
            onConfirm: async () => {
                try {
                    const res = await leaveGroupAPI({ chatId });
                    if (res.success) {
                        setChats(prev => prev.filter(c => c._id !== chatId));
                        navigate("/chat");
                        Toast("Left group successfully", "success");
                    }
                } catch (e) { Toast("Failed to leave group", "error"); }
            }
        });
    };

    // React to Message (add/remove emoji tags)
    const handleReact = async (messageId, emoji) => {
        try {
            const res = await reactToMessageAPI(messageId, emoji);
            if (res.success) {
                setReceivedMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
                if (messagesCacheRef.current[chatId]) {
                    messagesCacheRef.current[chatId] = messagesCacheRef.current[chatId].map(m => m._id === messageId ? res.data : m);
                }
                socket?.emit("messageReaction", { chatId, messageId, reactions: res.data.reactions });
            }
        } catch (e) { console.error("Reaction failed:", e); }
    };

    // Trigger Quoted Reply layout
    const handleReplyTrigger = (msg) => {
        setEditingMessage(null); // Clear active edit settings
        setReplyingTo(msg);
    };

    // Chat Media File select dispatcher (previews file and waits for Send click)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !chatId) return;

        // Size check (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            Toast("File size must be under 10MB", "error");
            return;
        }

        setSelectedFile(file);
        setFilePreview(URL.createObjectURL(file));
    };

    const cancelFileSelection = () => {
        setSelectedFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePublicChat = async () => {
        try {
            const res = await getPublicChat();
            if (res?.success) navigate("/chat", { state: { chat: res.data._id, name: "Public Chat", type: "public" } });
        } catch (err) {
            Toast("Failed to access public chat", "error");
        }
    };

    // Build the status text for the chat header
    const statusText = isTyping ? "typing..." : chatType === "single" ? (isOnline ? "online" : "offline") : `${activeChat?.members?.length || 0} members`;
    const statusClass = isTyping ? "text-blue-400 animate-pulse" : isOnline ? "text-green-400" : "text-slate-400";
    const isGroupAdmin = activeChat?.type === "group" && (activeChat.admin?._id || activeChat.admin) === myId;

    return (
        <div className={`flex flex-col h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)] font-sans transition-colors duration-300 noise-overlay ${theme === 'light' ? 'light-theme' : ''}`}>
            <Header theme={theme} toggleTheme={toggleTheme} onProfileClick={() => setIsProfileOpen(true)} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* ── Sidebar ── */}
                <div className={`
                    fixed md:relative z-40 h-full w-[82vw] max-w-[320px] md:w-[300px] lg:w-[320px] shrink-0
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
                    className={`md:hidden fixed inset-0 backdrop-panel z-35 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                />

                {/* ── Main chat panel ── */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-secondary)] min-w-0 noise-overlay">
                    {/* Ambient background */}
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: 'var(--glow-opacity)' }}>
                        {/* Dotted Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                            style={{
                                backgroundImage: `radial-gradient(var(--accent) 1.5px, transparent 1.5px)`,
                                backgroundSize: '24px 24px'
                            }}
                        />
                        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full animate-glow-1" />
                        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full animate-glow-2" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/6 blur-[130px] rounded-full animate-glow-3" />
                    </div>

                    {/* ── Chat header bar ── */}
                    <div className="h-[60px] px-4 md:px-5 flex items-center justify-between z-20 shrink-0 relative"
                        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderBottom: '1px solid var(--glass-border)' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                                className={`md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg-strong)] transition-all active:scale-95 shrink-0 ${isSidebarOpen ? "hidden" : "flex"}`}
                            >
                                <Menu size={19} />
                            </button>

                            {chatId ? (
                                <div className="flex items-center gap-3 min-w-0 animate-toast">
                                    {chatType === "public" ? (
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid var(--glass-border)' }}><Globe size={16} className="text-indigo-300" /></div>
                                    ) : chatType === "group" && !activeChat?.image ? (
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid var(--glass-border)' }}><Users size={16} className="text-blue-300" /></div>
                                    ) : (
                                        <Avatar
                                            src={chatType === "group" ? activeChat?.image : activeContact?.avatar}
                                            name={chatType === "group" ? activeChat?.name : activeContact?.name}
                                            size={9}
                                            online={chatType === "single" && isOnline}
                                            className="border border-[var(--glass-border)]"
                                        />
                                    )}

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
                            {chatId && (
                                <button
                                    onClick={() => { setShowSearch(v => !v); setSearchQuery(""); }}
                                    title="Search messages"
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 border shrink-0
                                        ${showSearch
                                            ? "text-[var(--accent)] bg-[var(--hover-bg-strong)] border-[var(--accent)]/30"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] border-transparent"
                                        }`}
                                >
                                    <Search size={16} />
                                </button>
                            )}
                            {isGroupAdmin && (
                                <button
                                    onClick={() => setIsGroupEditModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--accent)] transition-all duration-200 active:scale-95 border border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"
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

                    {/* Group Edit Modal */}
                    <GroupEditModal
                        isOpen={isGroupEditModalOpen}
                        onClose={() => setIsGroupEditModalOpen(false)}
                        activeChat={activeChat}
                        chatId={chatId}
                        onGroupUpdated={(updatedGroup) => {
                            setActiveChat(updatedGroup);
                            setChats(prev => prev.map(c => c._id === chatId ? updatedGroup : c));
                        }}
                        socket={socket}
                        chats={chats}
                        myId={myId}
                    />

                    {/* ── Messages area ── */}
                    <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
                        {showSearch && (
                            <div className="px-4 py-3 flex items-center gap-2.5 z-20 border-b border-[var(--glass-border)] transition-all animate-toast shrink-0"
                                style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)' }}>
                                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search messages in this conversation..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-0.5"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="w-5 h-5 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-hidden">
                            <div
                                ref={chatContainerRef}
                                onScroll={handleScroll}
                                className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-2 min-h-full px-3 md:px-5 py-5 pb-10"
                            >
                                {loadingMore && (
                                    <div className="flex justify-center py-2 shrink-0">
                                        <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}

                                {!chatId && (
                                    <div className="m-auto max-w-sm w-full px-6 py-12 rounded-3xl text-center flex flex-col items-center justify-center relative overflow-hidden animate-scale-in"
                                        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(32px)', border: '1px solid var(--glass-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>

                                        {/* Radial ambient glow */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
                                            style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                                        {/* Hero icon with orbit ring */}
                                        <div className="relative flex items-center justify-center mb-7">
                                            {/* Orbit ring */}
                                            <div className="absolute w-28 h-28 rounded-full border opacity-20 animate-spin"
                                                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent', animationDuration: '8s' }} />
                                            <div className="absolute w-36 h-36 rounded-full border opacity-10 animate-spin"
                                                style={{ borderColor: 'var(--accent-light)', borderBottomColor: 'transparent', animationDuration: '15s', animationDirection: 'reverse' }} />
                                            {/* Glow */}
                                            <div className="absolute w-20 h-20 rounded-full blur-2xl opacity-40 animate-pulse"
                                                style={{ background: 'var(--gradient-brand)' }} />
                                            {/* Icon */}
                                            <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center animate-hero-glow"
                                                style={{ background: 'var(--gradient-brand)', boxShadow: '0 16px 48px var(--accent-glow)' }}>
                                                <MessageCircle size={36} className="text-white" strokeWidth={2} />
                                                <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
                                            </div>
                                        </div>

                                        <h2 className="text-3xl font-black gradient-text mb-2 tracking-tight">ChatFlow</h2>
                                        <p className="text-sm leading-relaxed mb-8 max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
                                            Pick a conversation or start something new
                                        </p>

                                        {/* Action cards */}
                                        <div className="grid grid-cols-2 gap-2.5 w-full mb-6">
                                            <button
                                                onClick={() => setMainPanelView("createGroup")}
                                                className="flex flex-col items-start gap-2.5 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] group shimmer-hover"
                                                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}
                                            >
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-indigo-400 transition-all group-hover:scale-110"
                                                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                                                    <Users size={17} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>New Group</p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Collaborate</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={handlePublicChat}
                                                className="flex flex-col items-start gap-2.5 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] group shimmer-hover"
                                                style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}
                                            >
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400 transition-all group-hover:scale-110"
                                                    style={{ background: 'rgba(167,139,250,0.15)' }}>
                                                    <Globe size={17} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Public Feed</p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Global chat</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => document.getElementById("global-search-input")?.focus()}
                                                className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group shimmer-hover"
                                                style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}
                                            >
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-400 shrink-0 transition-all group-hover:scale-110"
                                                    style={{ background: 'rgba(56,189,248,0.12)' }}>
                                                    <Search size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Find People</p>
                                                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Search & message instantly</p>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-5 text-center">
                                            {[['🔒', 'Encrypted'], ['⚡', 'Real-time'], ['🌍', 'Global']].map(([icon, label]) => (
                                                <div key={label} className="flex flex-col items-center gap-0.5">
                                                    <span className="text-lg">{icon}</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {loadingMessages ? (
                                    <MessageSkeleton />
                                ) : (() => {
                                    const msgList = searchQuery.trim()
                                        ? receivedMessages.filter(m => m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                                        : receivedMessages;

                                    const getDateLabel = (ts) => {
                                        const d = new Date(ts);
                                        const today = new Date();
                                        const yesterday = new Date();
                                        yesterday.setDate(today.getDate() - 1);
                                        if (d.toDateString() === today.toDateString()) return "Today";
                                        if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
                                        return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                                    };

                                    const elements = [];
                                    let lastDateLabel = null;

                                    msgList.forEach((item, index) => {
                                        const dateLabel = getDateLabel(item.createdAt);
                                        if (dateLabel !== lastDateLabel) {
                                            lastDateLabel = dateLabel;
                                            elements.push(
                                                <div key={`sep-${item._id || index}`} className="flex items-center gap-3 my-3 px-2">
                                                    <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full select-none"
                                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                                        {dateLabel}
                                                    </span>
                                                    <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
                                                </div>
                                            );
                                        }
                                        elements.push(
                                            <Message
                                                key={item._id || index}
                                                id={item._id}
                                                own={(item.sender._id || item.sender) === myId}
                                                onForward={handleForward}
                                                message={item.content}
                                                timestamp={item.createdAt}
                                                senderName={chatType !== 'single' ? item.sender.name : null}
                                                senderAvatar={chatType !== 'single' ? item.sender.avatar : null}
                                                seen={item.seenBy.length > 1}
                                                deleted={item.deleted}
                                                media={item.media}
                                                mediaType={item.mediaType}
                                                reactions={item.reactions}
                                                parentMessage={item.parentMessage}
                                                onDelete={() => handleDeleteMsg(item._id)}
                                                onEdit={() => startEdit(item)}
                                                onReact={handleReact}
                                                onReply={handleReplyTrigger}
                                                isEditing={editingMessage?._id === item._id}
                                                onUpdate={handleUpdateMessage}
                                                editContent={editContent}
                                                onCancelEdit={cancelEdit}
                                                onEditChange={(e) => setEditContent(e.target.value)}
                                                onEditKeyDown={(e) => e.key === "Enter" && handleUpdateMessage()}
                                                theme={theme}
                                            />
                                        );
                                    });
                                    return elements;
                                })()}

                                {isTyping && (
                                    <div className="flex items-end gap-2 ml-1 mb-4 self-start animate-fadeIn shrink-0">
                                        <Avatar
                                            src={activeContact?.avatar}
                                            name={activeContact?.name || activeChat?.name}
                                            size={7}
                                            className="shrink-0 mb-0.5 border border-[var(--glass-border)]"
                                        />
                                        <div className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
                                            style={{ background: 'var(--msg-other-bg)', border: '1px solid var(--msg-other-border)' }}>
                                            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '160ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '320ms' }} />
                                        </div>
                                    </div>
                                )}
                            </div>
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

                                {/* Quoted Reply banner */}
                                {replyingTo && (
                                    <div className="flex items-center justify-between px-4 py-2 rounded-t-2xl animate-toast"
                                        style={{
                                            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                                            borderTop: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                            borderLeft: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                            borderRight: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)'
                                        }}
                                    >
                                        <div className="flex flex-col gap-0.5 text-left truncate">
                                            <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                                                Replying to {replyingTo.sender?.name || "User"}
                                            </span>
                                            <span className="text-xs text-[var(--text-primary)] opacity-75 truncate max-w-sm">
                                                {replyingTo.content || (replyingTo.media?.length > 0 ? "📷 Media attachment" : "Message")}
                                            </span>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all">
                                            <X size={13} />
                                        </button>
                                    </div>
                                )}

                                {/* File Attachment Preview Banner */}
                                {filePreview && (
                                    <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl animate-toast"
                                        style={{
                                            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                                            borderTop: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                            borderLeft: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                            borderRight: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)'
                                        }}
                                    >
                                        <div className="flex items-center gap-3 text-left truncate">
                                            {selectedFile?.type.startsWith("image/") ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                    <img src={filePreview} className="w-full h-full object-cover" alt="Selected Preview" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/20 text-[var(--accent)] shrink-0 border border-white/10">
                                                    <Paperclip size={18} />
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-0.5 truncate">
                                                <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">
                                                    Attachment Selected
                                                </span>
                                                <span className="text-xs text-[var(--text-primary)] opacity-85 truncate max-w-xs md:max-w-md">
                                                    {selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={cancelFileSelection} className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                <div className={`flex items-center gap-2 px-3 py-1.5 transition-all duration-250 glow-border-focus ${(editingMessage || replyingTo || filePreview) ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"}`}
                                    style={{
                                        background: 'var(--glass-bg)',
                                        backdropFilter: 'blur(24px) saturate(180%)',
                                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                                        border: (editingMessage || replyingTo || filePreview)
                                            ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)'
                                            : '1px solid var(--glass-border)',
                                        borderTop: (editingMessage || replyingTo || filePreview) ? 'none' : undefined,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                                    }}
                                >
                                    {/* Attachment */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingFile}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-all active:scale-90 shrink-0 border border-transparent hover:border-[var(--glass-border)]"
                                        title="Attach file"
                                    >
                                        {uploadingFile ? (
                                            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Paperclip size={18} />
                                        )}
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                                    {/* Emoji Picker Button */}
                                    <div className="relative shrink-0" ref={emojiPickerRef}>
                                        <button
                                            onClick={() => { setShowEmojiPicker(v => !v); setShowFullPicker(false); }}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-transparent text-[18px] hover:bg-[var(--hover-bg)] ${showEmojiPicker ? 'bg-[var(--hover-bg-strong)] border-[var(--glass-border)]' : ''}`}
                                            title="Emoji"
                                        >
                                            😊
                                        </button>
                                        {showEmojiPicker && (
                                            <div
                                                className="absolute bottom-[calc(100%+8px)] left-0 p-3 rounded-2xl glass-modal border border-[var(--glass-border)] shadow-2xl z-50 animate-scale-in"
                                                style={{ width: showFullPicker ? '300px' : '240px' }}
                                            >
                                                {!showFullPicker ? (
                                                    <div>
                                                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Quick Emojis</p>
                                                        <div className="grid grid-cols-6 gap-1">
                                                            {quickEmojiList.slice(0, 18).map(em => (
                                                                <button
                                                                    key={em}
                                                                    onClick={() => { setMessage(prev => prev + em); setShowEmojiPicker(false); }}
                                                                    className="w-8 h-8 rounded-lg text-lg hover:bg-[var(--hover-bg-strong)] transition-all hover:scale-125 active:scale-90 flex items-center justify-center"
                                                                >
                                                                    {em}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setShowFullPicker(true)}
                                                            className="w-full mt-2.5 py-1.5 rounded-xl text-[10px] font-bold text-center transition-all border border-[var(--glass-border)] hover:bg-[var(--hover-bg-strong)]"
                                                            style={{ color: 'var(--accent)' }}
                                                        >
                                                            More Emojis...
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">All Emojis</span>
                                                            <button
                                                                onClick={() => setShowFullPicker(false)}
                                                                className="text-[9px] font-bold"
                                                                style={{ color: 'var(--accent)' }}
                                                            >
                                                                Back
                                                            </button>
                                                        </div>
                                                        <div className="emoji-picker-wrapper">
                                                            <EmojiPicker
                                                                theme={theme === "dark" ? "dark" : "light"}
                                                                onEmojiClick={(emojiData) => {
                                                                    setMessage(prev => prev + emojiData.emoji);
                                                                    setShowEmojiPicker(false);
                                                                }}
                                                                width="276px"
                                                                height="320px"
                                                                skinTonesDisabled
                                                                previewConfig={{ showPreview: false }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Text input + char count */}
                                    <div className="flex-1 relative min-w-0">
                                        <input
                                            value={editingMessage ? editContent : message}
                                            onChange={editingMessage ? (e) => setEditContent(e.target.value) : handleTypingEv}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); editingMessage ? handleUpdateMessage() : send(); } }}
                                            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
                                            maxLength={2000}
                                            className="w-full bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-3 px-1"
                                        />
                                        {message.length > 100 && !editingMessage && (
                                            <span className={`absolute right-1 bottom-1 text-[9px] font-bold tabular-nums pointer-events-none ${message.length > 1900 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                                                {message.length}/2000
                                            </span>
                                        )}
                                    </div>

                                    {/* Send / Confirm */}
                                    {editingMessage ? (
                                        <button onClick={handleUpdateMessage} disabled={!editContent.trim()}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-40 shrink-0 btn-accent">
                                            <Check size={16} />
                                        </button>
                                    ) : (
                                        <button onClick={send} disabled={!message.trim() && !selectedFile}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${message.trim() || selectedFile ? "btn-accent shadow-lg shadow-[var(--accent-glow)]" : "opacity-25 grayscale cursor-not-allowed"}`}
                                            style={message.trim() || selectedFile ? {} : { background: 'var(--hover-bg)', border: '1px solid var(--glass-border)' }}>
                                            <Send size={16} className={message.trim() || selectedFile ? "text-white" : "text-[var(--text-muted)]"} />
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
            />

            {/* Forward Message Modal */}
            <ForwardMessageModal
                isOpen={!!forwardMsg}
                onClose={() => setForwardMsg(null)}
                chats={chats}
                myId={myId}
                chatId={chatId}
                sendForward={sendForward}
            />

            {/* Profile Settings Modal */}
            <ProfileSettingsModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                onProfileUpdated={(updatedUser) => setUser(updatedUser)}
            />

            {/* Global Confirmation Dialog */}
            <ConfirmModal
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmData.onConfirm}
                title={confirmData.title}
                message={confirmData.message}
                confirmText={confirmData.confirmText}
                type={confirmData.type}
            />
        </div>
    );
};

const userToken = import.meta.env.VITE_USER_TOKEN;

export default Chat;