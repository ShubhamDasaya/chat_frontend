import React, { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import Modal from "../../../ui/Modal";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import Avatar from "../../../ui/Avatar";
import { updateProfile } from "../../../services/authService";
import { Toast } from "../../../ui/Toast";

const userToken = import.meta.env.VITE_USER_TOKEN;

const ProfileSettingsModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarLinkInput, setAvatarLinkInput] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name || "");
            setEditBio(user.bio || "");
            setAvatarPreview("");
            setAvatarFile(null);
            setAvatarLinkInput("");
        }
    }, [user, isOpen]);

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
                const stored = JSON.parse(localStorage.getItem(userToken) || "{}");
                stored.user = res.data;
                localStorage.setItem(userToken, JSON.stringify(stored));
                Toast("Profile optimized", "success");
                if (onProfileUpdated) onProfileUpdated(res.data);
                onClose();
            }
        } catch (err) {
            console.error(err);
            Toast("Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Profile"
            subtitle="Update your info and avatar"
            footer={
                <Button 
                    onClick={saveProfile} 
                    disabled={saving} 
                    loading={saving}
                    className="w-full"
                >
                    Save Profile
                </Button>
            }
            maxWidth="max-w-sm"
        >
            <div className="space-y-5">
                <div className="flex justify-center">
                    <div className="relative cursor-pointer group" onClick={() => document.getElementById('profile-file').click()}>
                        <Avatar 
                            src={avatarPreview || user?.avatar} 
                            name={editName || user?.name} 
                            size={24} 
                            className="border-2 border-white/20 shadow-xl"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                            <Camera size={22} className="text-white" />
                        </div>
                        <input type="file" id="profile-file" className="hidden" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                        }} />
                    </div>
                </div>

                <Input
                    label="Display Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full"
                />

                <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 ml-0.5">Bio</label>
                    <textarea 
                        value={editBio} 
                        onChange={(e) => setEditBio(e.target.value)} 
                        rows={3} 
                        placeholder="Tell people about yourself..."
                        className="w-full rounded-xl px-4 py-3.5 text-sm text-[var(--text-primary)] input-base resize-none leading-relaxed focus:border-[var(--accent)]" 
                    />
                </div>

                <Input
                    label="Avatar URL"
                    value={avatarLinkInput}
                    onChange={(e) => setAvatarLinkInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full"
                />
            </div>
        </Modal>
    );
};

export default ProfileSettingsModal;
