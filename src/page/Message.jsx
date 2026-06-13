import React, { useState } from "react";
import { Check, CheckCheck, Pencil, Trash2, Copy, CheckCircle, Trash } from "lucide-react";
import Avatar, { getAvatarURL } from "../ui/Avatar";

const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Safe Markdown Parser for Bold (*text*), Italic (_text_), Strikethrough (~text~), and Monospaced code blocks
const parseMarkdown = (text) => {
    if (!text) return "";
    
    // Escape HTML to prevent XSS injections
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Multi-line code block: ```code```
    escaped = escaped.replace(/```([\s\S]+?)```/g, '<pre class="bg-black/25 p-2.5 rounded-xl text-[11.5px] font-mono my-1.5 overflow-x-auto whitespace-pre-wrap text-left">$1</pre>');

    // Inline code block: `code`
    escaped = escaped.replace(/`([^`\n]+)`/g, '<code class="bg-black/25 px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // Bold: *text*
    escaped = escaped.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");

    // Italic: _text_
    escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Strikethrough: ~text~
    escaped = escaped.replace(/~([^~]+)~/g, "<del>$1</del>");

    return escaped;
};

const Message = ({ 
    own, 
    message, 
    timestamp, 
    senderName, 
    senderAvatar, 
    seen, 
    deleted, 
    onDelete, 
    id, 
    onEdit,
    media,
    mediaType,
    reactions = [],
    onReact,
    parentMessage,
    onReply
}) => {
    const [copied, setCopied] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [hovered, setHovered] = useState(false);

    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const isToday = date.toDateString() === new Date().toDateString();
    const displayDate = isToday ? "Today" : formattedDate;

    const handleCopy = async () => {
        if (deleted) return;
        try {
            await navigator.clipboard.writeText(message || "");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { console.error("Copy failed:", err); }
    };

    // Group reactions by emoji type
    const reactionsGrouped = reactions.reduce((acc, curr) => {
        if (!curr.emoji) return acc;
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
    }, {});

    return (
        <div 
            className={`msg-row flex flex-col w-full mb-3.5 relative group ${own ? "items-end" : "items-start"}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setShowActions(false); }}
        >
            <div
                className="flex flex-col min-w-0 relative"
                style={{ 
                    maxWidth: 'min(85%, 480px)',
                    alignItems: own ? "flex-end" : "flex-start"
                }}
            >
                {/* Group sender name */}
                {!own && senderName && !deleted && (
                    <div className="flex items-center gap-1.5 ml-2 mb-1">
                        <Avatar src={senderAvatar} name={senderName} size={4} />
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">{senderName.split(' ')[0]}</span>
                    </div>
                )}

                {/* Bubble — tap to toggle actions on mobile */}
                <div
                    onClick={() => { if (!deleted) setShowActions(v => !v); }}
                    onDoubleClick={(e) => {
                        if (!deleted && onReact) {
                            e.stopPropagation();
                            onReact(id, "❤️");
                        }
                    }}
                    className={`relative px-3.5 py-2.5 rounded-2xl cursor-pointer select-text transition-all
                        ${own ? "rounded-tr-sm msg-tail-right" : "rounded-tl-sm msg-tail-left"}
                        ${deleted ? "opacity-55" : ""}
                    `}
                    style={deleted
                        ? { background: 'var(--msg-deleted-bg)', border: '1px solid var(--glass-border)', color: 'var(--msg-deleted-text)' }
                        : own
                            ? { background: 'linear-gradient(135deg, var(--msg-own-from), var(--msg-own-to))', color: 'var(--msg-own-text)', boxShadow: '0 2px 12px rgba(31,111,235,0.25)' }
                            : { background: 'var(--msg-other-bg)', color: 'var(--msg-other-text)', border: '1px solid var(--msg-other-border)' }
                    }
                >
                    {/* Render Quoted Reply Banner */}
                    {parentMessage && !deleted && (
                        <div 
                            className="mb-2 p-2.5 rounded-xl border-l-[3px] border-[var(--accent)] text-left bg-black/15 select-none text-xs flex flex-col gap-0.5"
                            style={{ opacity: 0.85 }}
                        >
                            <span className="font-extrabold text-[var(--accent)] text-[9px] uppercase tracking-wide">
                                {parentMessage.sender?.name || "User"}
                            </span>
                            <span className="text-[11px] truncate max-w-full text-[var(--text-primary)] opacity-85">
                                {parentMessage.content || (parentMessage.media?.length > 0 ? "📷 Shared Media File" : "Message")}
                            </span>
                        </div>
                    )}

                    {/* Media Attachments Render */}
                    {media && media.length > 0 && (
                        <div className="flex flex-col gap-2 mb-1.5">
                            {media.map((url, idx) => {
                                const type = mediaType?.[idx] || "other";
                                const fullUrl = getAvatarURL(url);
                                if (type === "image") {
                                    return (
                                        <img 
                                            key={idx}
                                            src={fullUrl} 
                                            className="max-w-full max-h-60 rounded-xl object-contain cursor-pointer border border-white/10 shadow-md" 
                                            alt="Media Attachment" 
                                            onClick={(e) => { e.stopPropagation(); window.open(fullUrl, '_blank'); }} 
                                            loading="lazy"
                                        />
                                    );
                                } else if (type === "video") {
                                    return (
                                        <video 
                                            key={idx}
                                            src={fullUrl} 
                                            controls 
                                            className="max-w-full max-h-60 rounded-xl border border-white/10 shadow-md"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    );
                                } else if (type === "pdf") {
                                    return (
                                        <a 
                                            key={idx}
                                            href={fullUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10 bg-black/10 hover:bg-black/20 text-white transition-all min-w-[200px]"
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">PDF Document</p>
                                                <p className="text-[9px] opacity-75 truncate">Open PDF</p>
                                            </div>
                                        </a>
                                    );
                                } else {
                                    return (
                                        <a 
                                            key={idx}
                                            href={fullUrl} 
                                            download 
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10 bg-black/10 hover:bg-black/20 text-white transition-all min-w-[200px]"
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-300 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">Attachment</p>
                                                <p className="text-[9px] opacity-75 truncate">Download File</p>
                                            </div>
                                        </a>
                                    );
                                }
                            })}
                        </div>
                    )}

                    {/* Message text with rich markdown formatting */}
                    {/* Message text with rich markdown formatting */}
                    {message && (
                        deleted ? (
                            <div
                                className="text-[13.5px] leading-[1.5] italic"
                                style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Trash size={11} className="shrink-0 opacity-60" />
                                    This message was deleted
                                </span>
                            </div>
                        ) : (
                            <div
                                className="text-[13.5px] leading-[1.5]"
                                style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    whiteSpace: 'pre-wrap',
                                    paddingRight: '56px',
                                }}
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(message) }}
                            />
                        )
                    )}

                    {/* Time + tick — pinned inside bubble, bottom-right */}
                    {!deleted && (
                        <div className="absolute bottom-[5px] right-[7px] flex items-center gap-[3px] select-none pointer-events-none">
                            <span className={`text-[9px] leading-none font-semibold tabular-nums ${own ? "text-white/75" : "text-[var(--text-muted)]"}`}>
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
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[9px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                            {displayDate} · {formattedTime}
                        </div>
                    )}
                </div>

                {/* ── Action bar ── */}
                {!deleted && (hovered || showActions || copied) && (
                    <div
                        className="absolute z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass shadow-lg border border-[var(--glass-border)] animate-toast shrink-0"
                        style={{
                            bottom: "-32px",
                            right: own ? "4px" : "auto",
                            left: own ? "auto" : "4px",
                        }}
                    >
                        {/* Quick Emojis Selector */}
                        {onReact && (
                            <div className="flex items-center gap-1 border-r border-[var(--glass-border)] pr-2 mr-1">
                                {quickEmojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={(e) => { e.stopPropagation(); onReact(id, emoji); setShowActions(false); }}
                                        className="hover:scale-130 active:scale-95 transition-transform duration-100 p-0.5 text-sm"
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        {onReply && (
                            <button
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onReply({ _id: id, sender: { name: senderName || (own ? "You" : "User") }, content: message }); 
                                    setShowActions(false); 
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] hover:opacity-85 transition-opacity pr-1 border-r border-[var(--glass-border)] mr-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                                Reply
                            </button>
                        )}

                        {own && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(id); setShowActions(false); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] hover:opacity-85 transition-opacity"
                            >
                                <Pencil size={11} /> Edit
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                            className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-primary)] hover:opacity-85 transition-opacity"
                        >
                            {copied ? <CheckCircle size={11} className="text-green-400" /> : <Copy size={11} />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                        {own && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(id); setShowActions(false); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                            >
                                <Trash2 size={11} /> Delete
                            </button>
                        )}
                    </div>
                )}

                {/* Seen — tight under the bubble */}
                {own && seen && !deleted && (
                    <span className="text-[9px] font-semibold leading-none mt-1 mr-1"
                        style={{ color: 'var(--text-muted)' }}>
                        Seen
                    </span>
                )}
            </div>

            {/* ── Active reactions list ── */}
            {reactions && reactions.length > 0 && !deleted && (
                <div className={`flex flex-wrap gap-1 mt-1.5 ${own ? "justify-end" : "justify-start"} select-none relative z-10`}>
                    {Object.entries(reactionsGrouped).map(([emoji, count]) => {
                        const usersWhoReacted = reactions
                            .filter(r => r.emoji === emoji)
                            .map(r => r.user?.name || "Someone")
                            .join(", ");

                        return (
                            <button
                                key={emoji}
                                onClick={(e) => { e.stopPropagation(); onReact && onReact(id, emoji); }}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    borderColor: 'var(--glass-border)',
                                    color: 'var(--text-primary)'
                                }}
                                title={usersWhoReacted}
                            >
                                <span>{emoji}</span>
                                {count > 1 && <span className="text-[9px] text-[var(--text-muted)] font-extrabold">{count}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Wrap in React.memo to prevent unnecessary message bubble re-renders
export default React.memo(Message, (prevProps, nextProps) => {
    // If these values didn't change, we skip re-rendering the message component
    return (
        prevProps.id === nextProps.id &&
        prevProps.own === nextProps.own &&
        prevProps.message === nextProps.message &&
        prevProps.timestamp === nextProps.timestamp &&
        prevProps.senderName === nextProps.senderName &&
        prevProps.senderAvatar === nextProps.senderAvatar &&
        prevProps.seen === nextProps.seen &&
        prevProps.deleted === nextProps.deleted &&
        prevProps.isEditing === nextProps.isEditing &&
        prevProps.editContent === nextProps.editContent &&
        prevProps.theme === nextProps.theme &&
        // Compare attachments arrays
        (prevProps.media?.length === nextProps.media?.length) &&
        (prevProps.media?.every((url, idx) => url === nextProps.media[idx])) &&
        // Compare reaction counts and emojis
        (prevProps.reactions?.length === nextProps.reactions?.length) &&
        (prevProps.reactions?.every((r, idx) => r.emoji === nextProps.reactions[idx].emoji && (r.user?._id || r.user) === (nextProps.reactions[idx].user?._id || nextProps.reactions[idx].user))) &&
        // Compare parent message
        (prevProps.parentMessage?._id === nextProps.parentMessage?._id) &&
        (prevProps.parentMessage?.content === nextProps.parentMessage?.content)
    );
});
