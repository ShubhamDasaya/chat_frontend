import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ── Global state outside React so Toast() can be called from anywhere ──
let _addToast = null;

const ICONS = {
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    error: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    info: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    warning: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
};

const STYLES = {
    success: {
        icon: "bg-emerald-500/20 text-emerald-400",
        border: "border-emerald-500/25",
        bar:   "bg-emerald-400",
        title: "text-emerald-300"
    },
    error: {
        icon: "bg-red-500/20 text-red-400",
        border: "border-red-500/25",
        bar:   "bg-red-400",
        title: "text-red-300"
    },
    info: {
        icon: "bg-indigo-500/20 text-indigo-400",
        border: "border-indigo-500/25",
        bar:   "bg-indigo-400",
        title: "text-indigo-300"
    },
    warning: {
        icon: "bg-amber-500/20 text-amber-400",
        border: "border-amber-500/30",
        bar:   "bg-amber-400",
        title: "text-amber-300"
    }
};

// ── Individual Toast Card ──
const ToastCard = ({ id, message, type = "info", onDismiss }) => {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const duration = 3800;
    const s = STYLES[type] || STYLES.info;

    useEffect(() => {
        // Trigger enter animation
        const t1 = setTimeout(() => setVisible(true), 10);
        // Progress bar countdown
        const start = Date.now();
        const ticker = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
        }, 40);
        // Auto-dismiss
        const t2 = setTimeout(() => handleDismiss(), duration);
        return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(ticker); };
    }, []);

    const handleDismiss = useCallback(() => {
        setVisible(false);
        setTimeout(() => onDismiss(id), 320);
    }, [id, onDismiss]);

    return (
        <div
            style={{
                transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
                transform: visible ? "translateX(0) scale(1)" : "translateX(110%) scale(0.92)",
                opacity: visible ? 1 : 0,
                background: "rgba(10,14,26,0.88)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)"
            }}
            className={`relative w-[340px] max-w-[90vw] rounded-2xl border ${s.border} shadow-2xl shadow-black/40 overflow-hidden`}
        >
            {/* Body */}
            <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${s.icon}`}>
                    {ICONS[type] || ICONS.info}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${s.title}`}>
                        {type === "info" ? "Info" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </p>
                    <p className="text-[13px] text-slate-200 leading-snug font-medium">
                        {message}
                    </p>
                </div>

                {/* Dismiss */}
                <button
                    onClick={handleDismiss}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-all shrink-0 mt-0.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-white/5 w-full">
                <div
                    className={`h-full ${s.bar} transition-none rounded-full`}
                    style={{ width: `${progress}%`, transition: "width 0.04s linear" }}
                />
            </div>
        </div>
    );
};

// ── Toast Container (renders as portal) ──
export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev.slice(-4), { id, message, type }]); // max 5 stacked
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Register globally
    useEffect(() => {
        _addToast = addToast;
        return () => { _addToast = null; };
    }, [addToast]);

    if (toasts.length === 0) return null;

    return createPortal(
        <div
            className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
            aria-live="polite"
        >
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastCard
                        id={t.id}
                        message={t.message}
                        type={t.type}
                        onDismiss={removeToast}
                    />
                </div>
            ))}
        </div>,
        document.body
    );
};

// ── Imperative trigger ── call this from anywhere: Toast("msg", "success")
export const Toast = (message, type = "info") => {
    if (_addToast) {
        _addToast(message, type);
    } else {
        // Fallback if container not mounted yet
        console.warn("[Toast] Container not mounted. Message:", message);
    }
};