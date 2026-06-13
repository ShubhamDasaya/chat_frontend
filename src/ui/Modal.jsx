import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    subtitle, 
    children, 
    footer,
    maxWidth = "max-w-md",
    className = "" 
}) => {
    // Close modal on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 backdrop-panel z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn" 
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div 
                className={`w-full ${maxWidth} glass-modal rounded-t-3xl sm:rounded-3xl overflow-hidden animate-toast shadow-2xl flex flex-col ${className}`}
                style={{ maxHeight: "92dvh" }}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--glass-border)] shrink-0">
                    <div>
                        <h2 className="text-lg font-extrabold text-[var(--text-primary)] leading-tight">{title}</h2>
                        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95" 
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-[var(--glass-border)] safe-bottom shrink-0 bg-[var(--bg-secondary)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
