
import React, { useState, useEffect, useRef } from "react";
import { LogOut, Search, User as UserIcon, MessageCircle, Moon, Sun, User, X } from "lucide-react";
import { addContact, searchUsers } from "../../services/authService";
import { useNavigate } from "react-router-dom";

const backendURL = import.meta.env.VITE_BACKEND_PORT;
const userToken = import.meta.env.VITE_USER_TOKEN;

const resolveAvatar = (str) => {
    if (!str) return "";
    if (str.startsWith("http")) return str;
    return `${backendURL}${str.startsWith("/") ? "" : "/"}${str}`;
};

const Header = ({ theme, toggleTheme }) => {
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
                if (parsed.user) setUser(parsed.user);
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
        <header className="h-[60px] px-4 md:px-5 flex justify-between items-center shrink-0 z-40 sticky top-0 transition-colors duration-300"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderBottom: '1px solid var(--glass-border)' }}>

            {/* ── Logo ── */}
            <div className="flex items-center gap-2.5 shrink-0">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <MessageCircle size={16} className="text-white" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/30 to-transparent" />
                </div>
                <div className="hidden sm:block leading-none">
                    <h1 className="text-[15px] font-extrabold text-[var(--text-primary)] tracking-tight">ChatFlow</h1>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Connect instantly</p>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="flex-1 flex justify-center max-w-md mx-4" ref={searchRef}>
                <div className="relative w-full">
                    <div className={`relative flex items-center rounded-xl transition-all duration-250 ${searchFocused ? "shadow-[0_0_0_2px_rgba(59,130,246,0.3)]" : ""}`}
                        style={{ background: 'var(--input-bg)', border: `1px solid ${searchFocused ? 'var(--input-focus-border)' : 'var(--input-border)'}` }}>
                        <Search size={15} className={`absolute left-3 pointer-events-none transition-colors duration-200 ${searchFocused ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            className="w-full bg-transparent pl-9 pr-8 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                        />
                        {searchText && (
                            <button onClick={() => { setSearchText(""); setResults([]); }}
                                className="absolute right-2.5 p-0.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Search dropdown */}
                    {searchText && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 glass-modal rounded-2xl overflow-hidden z-50 animate-toast">
                            {loading ? (
                                <div className="px-5 py-5 flex items-center justify-center gap-2.5 text-sm text-[var(--accent)]">
                                    <div className="w-4 h-4 border-2 border-[var(--accent)]/40 border-t-[var(--accent)] rounded-full animate-spin" />
                                    Searching...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="px-5 py-5 text-center text-sm text-[var(--text-muted)]">
                                    No results for <span className="font-semibold text-[var(--text-primary)]">"{searchText}"</span>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                    {results.map((u) => (
                                        <div
                                            key={u._id}
                                            onClick={async () => {
                                                await addContact(u._id);
                                                setSearchText(""); setResults([]);
                                                navigate(`/chat?user=${u._id}&name=${u.name}`);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150 border-b border-[var(--glass-border)] last:border-0 group"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm">
                                                    {u.avatar
                                                        ? <img src={resolveAvatar(u.avatar)} className="w-full h-full object-cover" alt={u.name} onError={(e) => { e.target.style.display = 'none'; }} />
                                                        : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{u.name.charAt(0).toUpperCase()}</div>
                                                    }
                                                </div>
                                                {u.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full dot-online border-2" style={{ borderColor: 'var(--glass-bg)' }} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{u.name}</p>
                                                <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                                            </div>
                                            <span className="text-xs px-2.5 py-1 rounded-lg font-medium text-[var(--accent)] shrink-0 transition-colors"
                                                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                                                Message
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
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--hover-bg-strong)] active:scale-95"
                        style={{ border: '1px solid var(--glass-border)' }}
                    >
                        {theme === "dark"
                            ? <Sun size={15} className="text-amber-400" />
                            : <Moon size={15} className="text-[var(--text-primary)]" />}
                    </button>
                )}

                {/* Avatar / User menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(v => !v)}
                        className="relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-200 active:scale-95 hover:opacity-90"
                        style={{ borderColor: showUserMenu ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
                        aria-label="User menu"
                        aria-expanded={showUserMenu}
                    >
                        {user?.avatar
                            ? <img src={resolveAvatar(user.avatar)} className="w-full h-full object-cover" alt="profile" />
                            : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center"><UserIcon size={14} className="text-white" /></div>
                        }
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full dot-online border-2" style={{ borderColor: 'var(--bg-primary)' }} />
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 top-[calc(100%+10px)] w-60 glass-modal rounded-2xl overflow-hidden z-50 animate-toast shadow-2xl">
                                {/* Profile header */}
                                <div className="px-4 py-3.5 border-b border-[var(--glass-border)]"
                                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--glass-border)] shadow-md">
                                            {user?.avatar
                                                ? <img src={resolveAvatar(user.avatar)} className="w-full h-full object-cover" alt="profile" />
                                                : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center"><UserIcon size={16} className="text-white" /></div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.name || "User"}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div className="py-1.5">
                                    <button
                                        onClick={() => setShowUserMenu(false)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--hover-bg)] transition-colors duration-150 group text-left"
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                                            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                                            <User size={13} className="text-[var(--accent)]" />
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-primary)]">Profile Settings</span>
                                    </button>

                                    <div className="mx-4 my-1 border-t border-[var(--glass-border)]" />

                                    <button
                                        onClick={() => { setShowUserMenu(false); logOut(); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/8 transition-colors duration-150 group text-left"
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: 'rgba(239,68,68,0.1)' }}>
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
