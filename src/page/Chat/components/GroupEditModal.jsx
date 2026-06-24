import React, { useState, useEffect } from "react";
import { Camera, Search, Users, Image } from "lucide-react";
import Modal from "../../../ui/Modal";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import Avatar from "../../../ui/Avatar";
import { updateGroupAPI } from "../../../services/authService";
import { Toast } from "../../../ui/Toast";

const GroupEditModal = ({ isOpen, onClose, activeChat, chatId, onGroupUpdated, socket, chats = [], myId }) => {
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupImage, setNewGroupImage] = useState("");
    const [groupImgFile, setGroupImgFile] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingGroup, setUpdatingGroup] = useState(false);

    const adminId = activeChat?.admin?._id || activeChat?.admin;

    useEffect(() => {
        if (activeChat) {
            setNewGroupName(activeChat.name || "");
            setNewGroupImage("");
            setGroupImgFile(null);
            setGroupMembers(activeChat.members ? activeChat.members.map(m => m._id || m) : []);
            setSearchQuery("");
        }
    }, [activeChat, isOpen]);

    const toggleMember = (id) => {
        if (id === adminId) return; // Admin cannot be removed
        setGroupMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const handleUpdateGroup = async () => {
        if (!newGroupName.trim()) return Toast("Group name required", "error");
        setUpdatingGroup(true);
        try {
            const fd = new FormData();
            fd.append("chatId", chatId);
            if (newGroupName) fd.append("name", newGroupName);
            if (groupImgFile) fd.append("avatar", groupImgFile);
            else if (newGroupImage) fd.append("imageLink", newGroupImage);
            
            // Send the updated member list
            fd.append("members", JSON.stringify(groupMembers));

            const res = await updateGroupAPI(fd);
            if (res.success) {
                if (onGroupUpdated) onGroupUpdated(res.data);
                socket?.emit("updateGroup", res.data);
                onClose();
                Toast("Group updated", "success");
            }
        } catch (e) {
            Toast("Update failed", "error");
        } finally {
            setUpdatingGroup(false);
        }
    };

    const contacts = chats.filter(c => c.type === 'single');
    const filteredContacts = contacts.filter(chat => {
        const contact = chat.members.find(m => m._id !== myId);
        if (!contact) return false;
        if (!searchQuery) {
            // Only show members who are already in the group
            return groupMembers.includes(contact._id);
        }
        // Show any contact matching the search query
        return contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Group"
            subtitle="Change group details and manage members"
            footer={
                <div className="space-y-2.5">
                    <Button 
                        onClick={handleUpdateGroup} 
                        disabled={updatingGroup || !newGroupName.trim()} 
                        loading={updatingGroup}
                        className="w-full"
                    >
                        Save Changes
                    </Button>
                    <button onClick={onClose}
                        className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors font-medium">
                        Cancel
                    </button>
                </div>
            }
            maxWidth="max-w-md"
        >
            <div className="space-y-5">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative cursor-pointer group" onClick={() => document.getElementById('group-img-edit-upload').click()}>
                        <Avatar 
                            src={groupImgFile ? URL.createObjectURL(groupImgFile) : (newGroupImage || activeChat?.image)} 
                            name={newGroupName || activeChat?.name} 
                            size={20} 
                            className="border-2 border-white/20 shadow-xl"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                            <Camera size={20} className="text-white" />
                        </div>
                        <input type="file" id="group-img-edit-upload" className="hidden" onChange={(e) => { setGroupImgFile(e.target.files[0]); setNewGroupImage(""); }} />
                    </div>

                    <Input
                        label="Image URL"
                        placeholder="https://..."
                        value={newGroupImage}
                        onChange={(e) => { setNewGroupImage(e.target.value); setGroupImgFile(null); }}
                        className="w-full"
                    />
                </div>

                <Input
                    label="Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name..."
                    className="w-full"
                />

                {/* Member Management */}
                <div className="border-t border-[var(--glass-border)] pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Manage Members</label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--accent)]"
                            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                            {groupMembers.length} members
                        </span>
                    </div>

                    <div className="relative mb-3">
                        <Input
                            type="text"
                            placeholder="Search contacts to add/remove..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={Search}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {filteredContacts.map(chat => {
                            const contact = chat.members.find(m => m._id !== myId);
                            if (!contact) return null;
                            const isSelected = groupMembers.includes(contact._id);
                            const isAdmin = contact._id === adminId;
                            return (
                                <button
                                    key={chat._id}
                                    type="button"
                                    onClick={() => toggleMember(contact._id)}
                                    disabled={isAdmin}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-150 ${isAdmin ? "opacity-75 cursor-default" : "active:scale-[0.98]"}`}
                                    style={isSelected
                                        ? { 
                                            background: 'color-mix(in srgb, var(--accent) 10%, transparent)', 
                                            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)'
                                          }
                                        : { 
                                            background: 'var(--hover-bg)', 
                                            border: '1px solid var(--glass-border)' 
                                          }
                                    }
                                >
                                    <Avatar src={contact.avatar} name={contact.name} size={8} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                            {contact.name} {isAdmin && <span className="text-[10px] text-[var(--accent)] font-bold ml-1">(Admin)</span>}
                                        </p>
                                        <p className="text-[9px] text-[var(--text-muted)]">{contact.online ? "● Online" : "Offline"}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${isSelected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--text-muted)]/40"}`}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </button>
                            );
                        })}
                        {filteredContacts.length === 0 && (
                            <p className="text-xs text-center text-[var(--text-muted)] py-4 italic">No matching contacts</p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default GroupEditModal;
