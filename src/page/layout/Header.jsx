import React, { useState, useEffect, useRef } from "react";
import { LogOut, Search, User, MessageCircle, Moon, Sun, X, ChevronDown } from "lucide-react";
import { addContact, searchUsers } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import Avatar from "../../ui/Avatar";

const userToken = import.meta.env.VITE_USER_TOKEN;

const Header = ({ theme, toggleTheme, onProfileClick }) => {
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const menuRef = useRef(null);

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem(userToken);
        return stored ? JSON.parse(stored).user : null;
    });
    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    // Sync user from localStorage
    useEffect(() => {
        const interval = setInterval(() => {
            const stored = localStorage.getItem(userToken);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.user) {
                    setUser(prev => {
                        if (prev &&
                            prev._id === parsed.user._id &&
                            prev.name === parsed.user.name &&
                            prev.avatar === parsed.user.avatar &&
                            prev.bio === parsed.user.bio) {
                            return prev;
                        }
                        return parsed.user;
                    });
                }
            }
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handle = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchText("");
                setResults([]);
                setSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    const logOut = () => {
        localStorage.removeItem(userToken);
        navigate("/");
    };

    // Debounced search
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (!searchText.trim()) { setResults([]); return; }
            setLoading(true);
            try {
                const res = await searchUsers(searchText);
                if (res?.success) setResults(res.data || []);
            } catch (err) { console.error("Search error:", err); }
            finally { setLoading(false); }
        }, 380);
        return () => clearTimeout(delay);
    }, [searchText]);

    return (
        <header
            className="h-[60px] px-4 md:px-5 flex justify-between items-center shrink-0 z-45 sticky top-0 transition-colors duration-300"
            style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(28px) saturate(200%)",
                WebkitBackdropFilter: "blur(28px) saturate(200%)",
                borderBottom: "1px solid var(--glass-border)",
                boxShadow: "0 1px 0 var(--glass-border)"
            }}
        >
            {/* ── Logo ── */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                        background: "var(--gradient-brand)",
                        boxShadow: "0 4px 16px var(--accent-glow), 0 0 0 1px rgba(255,255,255,0.1) inset"
                    }}>
                    <MessageCircle size={18} className="text-white" strokeWidth={2.5} />
                    {/* Gloss */}
                    <div className="absolute inset-0 rounded-xl"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
                </div>
                <div className="hidden sm:block leading-none">
                    <h1 className="text-[15px] font-extrabold gradient-text tracking-tight">ChatFlow</h1>
                    <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Connect instantly</p>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="flex-1 flex justify-center max-w-sm mx-4 relative z-50" ref={searchRef}>
                <div className="relative w-full">
                    <div
                        className={`relative flex items-center rounded-xl transition-all duration-250 ${searchFocused ? "glow-border-focus" : ""}`}
                        style={{
                            background: searchFocused ? "var(--bg-card)" : "var(--hover-bg)",
                            border: `1px solid ${searchFocused ? "var(--border-light)" : "var(--glass-border)"}`,
                        }}
                    >
                        <Search size={13} className="absolute left-3 pointer-events-none"
                            style={{ color: searchFocused ? "var(--accent)" : "var(--text-muted)" }} />
                        <input
                            id="global-search-input"
                            type="text"
                            placeholder="Search users or groups..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            className="w-full pl-8 pr-8 py-2.5 text-sm outline-none bg-transparent rounded-xl"
                            style={{ color: "var(--text-primary)" }}
                        />
                        {searchText && (
                            <button onClick={() => { setSearchText(""); setResults([]); }}
                                className="absolute right-3 p-0.5 rounded-md transition-colors"
                                style={{ color: "var(--text-muted)" }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Search dropdown */}
                    {searchText && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 glass-modal rounded-2xl overflow-hidden z-50 animate-toast shadow-2xl">
                            {loading ? (
                                <div className="px-5 py-5 flex items-center justify-center gap-2.5 text-sm"
                                    style={{ color: "var(--accent)" }}>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Searching...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="px-5 py-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                                    No results for <span className="font-semibold" style={{ color: "var(--text-primary)" }}>"{searchText}"</span>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                    {results.map((u) => (
                                        <div
                                            key={u._id}
                                            onClick={async () => {
                                                if (u.isGroup) {
                                                    setSearchText(""); setResults([]);
                                                    navigate(`/chat?chat=${u._id}&name=${u.name}&type=${u.type}`);
                                                } else {
                                                    await addContact(u._id);
                                                    setSearchText(""); setResults([]);
                                                    navigate(`/chat?user=${u._id}&name=${u.name}`);
                                                }
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 group"
                                            style={{ borderBottom: "1px solid var(--glass-border)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <Avatar src={u.avatar} name={u.name} size={9} online={!u.isGroup && u.online} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate transition-colors"
                                                    style={{ color: "var(--text-primary)" }}>
                                                    {u.name}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                                    {u.isGroup ? (u.type === "public" ? "Public Feed" : "Group Chat") : u.email}
                                                </p>
                                            </div>
                                            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                                                style={{
                                                    color: "var(--accent)",
                                                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                                                    border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)"
                                                }}>
                                                {u.isGroup ? "Open" : "Chat"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right controls ── */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Theme toggle */}
                {toggleTheme && (
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95"
                        style={{ border: "1px solid var(--glass-border)", color: "var(--text-muted)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--hover-bg-strong)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--glass-border)"; }}
                    >
                        {theme === "dark"
                            ? <Sun size={15} className="text-amber-400" />
                            : <Moon size={15} style={{ color: "var(--text-primary)" }} />}
                    </button>
                )}

                {/* Avatar / User menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(v => !v)}
                        className="relative transition-all duration-200 active:scale-95 outline-none flex items-center gap-1.5 px-1.5 py-1 rounded-xl"
                        style={{ border: "1px solid transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.borderColor = "var(--glass-border)"; }}
                        onMouseLeave={e => { if (!showUserMenu) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
                        aria-label="User menu"
                        aria-expanded={showUserMenu}
                    >
                        <Avatar src={user?.avatar} name={user?.name} size={8} online={true} className="avatar-ring" />
                        <ChevronDown size={12} style={{ color: "var(--text-muted)", transform: showUserMenu ? "rotate(180deg)" : "", transition: "transform 0.2s ease" }} />
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 top-[calc(100%+10px)] w-64 glass-modal rounded-2xl overflow-hidden z-50 animate-toast shadow-2xl">
                                {/* Profile header */}
                                <div className="px-4 py-4 relative overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent)",
                                        borderBottom: "1px solid var(--glass-border)"
                                    }}>
                                    <div className="flex items-center gap-3">
                                        <Avatar src={user?.avatar} name={user?.name} size={12} className="avatar-ring" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                                {user?.name || "User"}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                                            <div className="status-pill status-pill-online mt-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                                Online
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div className="py-1.5">
                                    <button
                                        onClick={() => { setShowUserMenu(false); onProfileClick?.(); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 group text-left"
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                                            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
                                            <User size={13} style={{ color: "var(--accent)" }} />
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                            Profile Settings
                                        </span>
                                    </button>

                                    <div className="mx-4 my-1" style={{ borderTop: "1px solid var(--glass-border)" }} />

                                    <button
                                        onClick={() => { setShowUserMenu(false); logOut(); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 group text-left"
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                                            style={{ background: "rgba(239,68,68,0.1)" }}>
                                            <LogOut size={13} className="text-red-400" />
                                        </div>
                                        <span className="text-sm font-medium text-red-400">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
