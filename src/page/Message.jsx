import React, { useState } from "react";
import { Check, CheckCheck, Pencil, Trash2, Copy, CheckCircle, Trash } from "lucide-react";

const backendURL = import.meta.env.VITE_BACKEND_PORT;

const resolveAvatar = (str) => {
    if (!str) return "";
    if (str.startsWith("http")) return str;
    return `${backendURL}${str.startsWith("/") ? "" : "/"}${str}`;
};

const Message = ({ own, message, timestamp, senderName, senderAvatar, seen, deleted, onDelete, id, onEdit }) => {
    const [copied, setCopied] = useState(false);
    // showActions: toggled by tap on mobile; always shown on desktop via CSS .msg-row:hover
    const [showActions, setShowActions] = useState(false);

    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const isToday = date.toDateString() === new Date().toDateString();
    const displayDate = isToday ? "Today" : formattedDate;

    const handleCopy = async () => {
        if (deleted) return;
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { console.error("Copy failed:", err); }
    };

    return (
        // .msg-row used by CSS to show actions on hover (desktop)
        <div className={`msg-row flex w-full mb-0.5 ${own ? "justify-end" : "justify-start"}`}>
            <div
                className={`flex flex-col min-w-0 ${own ? "items-end" : "items-start"}`}
                style={{ maxWidth: 'min(80%, 480px)' }}
            >
                {/* Group sender name */}
                {!own && senderName && !deleted && (
                    <div className="flex items-center gap-1.5 ml-2 mb-1">
                        <div className="w-4 h-4 rounded-full overflow-hidden border border-[var(--glass-border)] shrink-0">
                            {senderAvatar
                                ? <img src={resolveAvatar(senderAvatar)} className="w-full h-full object-cover" alt={senderName} />
                                : <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-violet-500 flex items-center justify-center text-[8px] text-white font-bold">{senderName.charAt(0)}</div>
                            }
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">{senderName.split(' ')[0]}</span>
                    </div>
                )}

                {/* Bubble — tap to toggle actions on mobile */}
                <div
                    onClick={() => { if (!deleted) setShowActions(v => !v); }}
                    className={`relative px-3.5 py-2 rounded-2xl cursor-pointer select-text
                        ${own ? "rounded-tr-sm" : "rounded-tl-sm"}
                        ${deleted ? "opacity-55" : ""}
                    `}
                    style={deleted
                        ? { background: 'var(--msg-deleted-bg)', border: '1px solid var(--glass-border)', color: 'var(--msg-deleted-text)' }
                        : own
                            ? { background: 'linear-gradient(135deg, var(--msg-own-from), var(--msg-own-to))', color: 'var(--msg-own-text)', boxShadow: '0 2px 12px rgba(31,111,235,0.4)' }
                            : { background: 'var(--msg-other-bg)', color: 'var(--msg-other-text)', border: '1px solid var(--msg-other-border)' }
                    }
                >
                    {/* Message text */}
                    <div
                        className={`text-[13.5px] leading-[1.5] ${deleted ? "italic" : ""}`}
                        style={{
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'pre-wrap',
                            // Leave space for the time+tick overlay at the end of last line
                            paddingRight: deleted ? '0' : '54px',
                        }}
                    >
                        {deleted ? (
                            <span className="flex items-center gap-1.5">
                                <Trash size={11} className="shrink-0 opacity-60" />
                                This message was deleted
                            </span>
                        ) : message}
                    </div>

                    {/* Time + tick — pinned inside bubble, bottom-right */}
                    {!deleted && (
                        <div className="absolute bottom-[5px] right-[7px] flex items-center gap-[3px] select-none pointer-events-none">
                            <span className={`text-[10px] leading-none font-medium tabular-nums ${own ? "text-white/75" : "text-[var(--text-muted)]"}`}>
                                {formattedTime}
                            </span>
                            {own && (
                                seen
                                    ? <CheckCheck size={13} className="text-blue-200/90" />
                                    : <Check size={13} className="text-white/45" />
                            )}
                        </div>
                    )}

                    {/* Hover tooltip (desktop) */}
                    {!deleted && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[9px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                            {displayDate} · {formattedTime}
                        </div>
                    )}
                </div>

                {/* ── Action bar ──
                    .msg-actions: hidden by default, revealed by:
                    - CSS .msg-row:hover .msg-actions (desktop)
                    - showActions state (mobile tap)
                */}
                {!deleted && (
                    <div
                        className="msg-actions flex items-center gap-1 mt-0.5 transition-all duration-150"
                        style={{
                            justifyContent: own ? 'flex-end' : 'flex-start',
                            paddingLeft: own ? 0 : '2px',
                            paddingRight: own ? '2px' : 0,
                            // Mobile: controlled by tap state
                            opacity: showActions ? 1 : 0,
                            height: showActions ? '24px' : '0px',
                            overflow: showActions ? 'visible' : 'hidden',
                            pointerEvents: showActions ? 'auto' : 'none',
                        }}
                    >
                        {own && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(id); setShowActions(false); }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                                style={{ background: 'var(--hover-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent)' }}
                            >
                                <Pencil size={10} /> Edit
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                            style={{ background: 'var(--hover-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                        >
                            {copied ? <CheckCircle size={10} className="text-green-400" /> : <Copy size={10} />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                        {own && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(id); setShowActions(false); }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                            >
                                <Trash2 size={10} /> Delete
                            </button>
                        )}
                    </div>
                )}

                {/* Seen — tight under the bubble, no extra gap */}
                {own && seen && !deleted && (
                    <span className="text-[10px] leading-none mt-0.5 mr-1"
                        style={{ color: 'var(--text-muted)' }}>
                        Seen
                    </span>
                )}
            </div>
        </div>
    );
};

export default Message;
