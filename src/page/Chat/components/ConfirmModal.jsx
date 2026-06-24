import React from "react";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Are you sure?", 
    message = "This action cannot be undone.", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger" 
}) => {
    const getConfirmButtonClass = () => {
        if (type === "danger") return "bg-red-500 hover:bg-red-600 text-white border-red-500/20";
        if (type === "warning") return "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500/20";
        return "bg-blue-500 hover:bg-blue-600 text-white border-blue-500/20";
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <div className="flex gap-2.5 w-full">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 hover:bg-[var(--hover-bg)]"
                        style={{ border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                    >
                        {cancelText}
                    </button>
                    <Button 
                        onClick={() => { onConfirm(); onClose(); }} 
                        className={`flex-1 ${getConfirmButtonClass()}`}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
            maxWidth="max-w-xs"
        >
            <p className="text-xs leading-relaxed text-[var(--text-muted)] text-center py-2">
                {message}
            </p>
        </Modal>
    );
};

export default ConfirmModal;
