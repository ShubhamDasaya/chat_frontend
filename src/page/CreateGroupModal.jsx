import React, { useState } from "react";
import { Search, Users, Camera, Image } from "lucide-react";
import { Toast } from "../ui/Toast";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

const CreateGroupModal = ({ isOpen, onClose, chats, myId, onCreateGroup }) => {
    const [groupName, setGroupName] = useState("");
    const [groupImage, setGroupImage] = useState("");
    const [groupImgFile, setGroupImgFile] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [creating, setCreating] = useState(false);

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
            ? groupImage
            : null;

    const modalFooter = (
        <Button
            onClick={handleSubmit}
            disabled={creating || !groupName.trim() || groupMembers.length === 0}
            loading={creating}
            className="w-full"
        >
            {`Create Group${groupMembers.length > 0 ? ` (${groupMembers.length})` : ""}`}
        </Button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Group"
            subtitle="Create a group and invite contacts"
            footer={modalFooter}
            maxWidth="max-w-lg"
        >
            <div className="space-y-5">
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

                    <div className="flex-1">
                        <Input
                            label="Group Name *"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Phoenix Squad"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Image URL */}
                <Input
                    label="Image URL (optional)"
                    value={groupImage}
                    onChange={(e) => { setGroupImage(e.target.value); setGroupImgFile(null); }}
                    placeholder="https://..."
                    icon={Image}
                    className="w-full"
                />

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
                        <Input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={Search}
                            className="w-full"
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
                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98]"
                                    style={isSelected
                                        ? { 
                                            background: 'color-mix(in srgb, var(--accent) 14%, transparent)', 
                                            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', 
                                            boxShadow: '0 0 0 1px var(--accent)' 
                                          }
                                        : { 
                                            background: 'var(--hover-bg)', 
                                            border: '1px solid var(--glass-border)' 
                                          }
                                    }
                                >
                                    <Avatar src={contact.avatar} name={contact.name} size={9} />
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
        </Modal>
    );
};

export default CreateGroupModal;
