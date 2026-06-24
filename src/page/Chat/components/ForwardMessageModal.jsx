import React from "react";
import Modal from "../../../ui/Modal";
import Avatar from "../../../ui/Avatar";

const ForwardMessageModal = ({ isOpen, onClose, chats, myId, chatId, sendForward }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Forward Message"
            subtitle="Select a conversation to forward to"
            maxWidth="max-w-sm"
        >
            <div className="space-y-1.5">
                {chats.filter(c => c._id !== chatId).map(c => {
                    const isGroup = c.type === "group";
                    const other = isGroup ? null : c.members.find(m => m._id !== myId);
                    if (!isGroup && !other) return null;
                    const dName = isGroup ? c.name : other?.name;
                    const dAvatar = isGroup ? c.image : other?.avatar;
                    return (
                        <button
                            key={c._id}
                            onClick={() => sendForward(c._id)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[var(--hover-bg)] transition-all text-left active:scale-[0.98] border border-transparent hover:border-[var(--glass-border)]"
                        >
                            <Avatar src={dAvatar} name={dName} size={10} />
                            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{dName}</span>
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
};

export default ForwardMessageModal;
