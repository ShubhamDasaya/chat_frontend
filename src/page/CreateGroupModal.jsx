import React, { useState } from "react";
import { X, Search, Users, Camera, Image } from "lucide-react";
import { Toast } from "../ui/Toast";

const CreateGroupModal = ({ isOpen, onClose, chats, myId, onCreateGroup, getAvatarURL }) => {
    const [groupName, setGroupName] = useState("");
    const [groupImage, setGroupImage] = useState("");
    const [groupImgFile, setGroupImgFile] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [creating, setCreating] = useState(false);

    if (!isOpen) return null;

    const toggleMember = (id) =>
        setGroupMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

    const handleSubmit = async () => {
        if (!groupName.trim()) return Toast("Group name required", "error");
        if (groupMembers.length === 0) return Toast("Select at least 1 member", "error");
        setCreating(true);
        try {
            await onCreateGroup({ name: groupName, members: groupMembers, avatarFile: groupImgFile, avatarLink: groupImage });
            setGroupName(""); setGroupImage(""); setGroupImgFile(null); setGroupMembers([]); setSearchQuery("");
            onClose();
        } catch (e) {
            Toast(e.message || "Failed to create group", "error");
        } finally {
            setCreating(false);
        }
    };

    const contacts = chats.filter(c => c.type === 'single');
    const filteredContacts = contacts.filter(chat => {
        const contact = chat.members.find(m => m._id !== myId);
        return contact?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const previewSrc = groupImgFile
        ? URL.createObjectURL(groupImgFile)
        : groupImage
            ? getAvatarURL(groupImage)
            : null;

    return (
        <div className="fixed inset-0 backdrop-panel z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full sm:max-w-lg glass-modal rounded-t-3xl sm:rounded-3xl overflow-hidden animate-toast shadow-2xl"
                style={{ maxHeight: '92dvh' }}>

                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--glass-border)]">
                    <div>
                        <h2 className="text-xl font-extrabold text-[var(--text-primary)]">New Group</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Create a group and invite contacts</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto custom-scrollbar px-6 py-5 space-y-5" style={{ maxHeight: 'calc(92dvh - 72px - 72px)' }}>

                    {/* Group Image */}
                    <div className="flex items-center gap-5">
                        <label htmlFor="group-img-upload" className="relative cursor-pointer shrink-0 group">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-200 group-hover:border-[var(--accent)]"
                                style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                                {previewSrc ? (
                                    <img src={previewSrc} className="w-full h-full object-cover" alt="group" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                                        <Users size={24} className="text-[var(--accent)]" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={18} className="text-white" />
                            </div>
                            <input type="file" id="group-img-upload" accept="image/*" className="hidden"
                                onChange={(e) => { setGroupImgFile(e.target.files[0]); setGroupImage(""); }} />
                        </label>

                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Group Name *</label>
                                <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="e.g. Phoenix Squad"
                                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-primary)] input-base"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                            <span className="inline-flex items-center gap-1.5"><Image size={11} /> Image URL (optional)</span>
                        </label>
                        <input
                            value={groupImage}
                            onChange={(e) => { setGroupImage(e.target.value); setGroupImgFile(null); }}
                            placeholder="https://..."
                            className="w-full rounded-xl px-4 py-3 text-sm text-[var(--accent)] input-base font-medium"
                        />
                    </div>

                    {/* Search members */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Select Members</label>
                            {groupMembers.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--accent)]"
                                    style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                                    {groupMembers.length} selected
                                </span>
                            )}
                        </div>
                        <div className="relative mb-3">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm input-base"
                            />
                        </div>

                        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                            {filteredContacts.map(chat => {
                                const contact = chat.members.find(m => m._id !== myId);
                                if (!contact) return null;
                                const isSelected = groupMembers.includes(contact._id);
                                return (
                                    <button
                                        key={chat._id}
                                        type="button"
                                        onClick={() => toggleMember(contact._id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98] ${isSelected ? "ring-1" : ""}`}
                                        style={isSelected
                                            ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', ringColor: 'var(--accent)' }
                                            : { background: 'var(--hover-bg)', border: '1px solid transparent' }}
                                    >
                                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[var(--glass-border)]">
                                            {contact.avatar
                                                ? <img src={getAvatarURL(contact.avatar)} className="w-full h-full object-cover" alt={contact.name} onError={(e) => { e.target.style.display = 'none'; }} />
                                                : <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-violet-500 flex items-center justify-center text-white font-bold text-sm">{contact.name?.charAt(0)?.toUpperCase()}</div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{contact.name}</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">{contact.online ? "● Online" : "Offline"}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? "border-[var(--accent)]" : "border-[var(--text-muted)]/40"}`}
                                            style={isSelected ? { background: 'var(--accent)' } : {}}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredContacts.length === 0 && (
                                <p className="text-xs text-center text-[var(--text-muted)] py-5 italic">No matching contacts</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--glass-border)] safe-bottom">
                    <button
                        onClick={handleSubmit}
                        disabled={creating || !groupName.trim() || groupMembers.length === 0}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed btn-accent"
                    >
                        {creating ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            `Create Group${groupMembers.length > 0 ? ` (${groupMembers.length})` : ""}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
