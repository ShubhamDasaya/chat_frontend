import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const Lightbox = ({ src, alt = "Image", onClose }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const zoomIn  = () => setScale(s => Math.min(s + 0.5, 5));
    const zoomOut = () => { setScale(s => { const n = Math.max(s - 0.5, 0.5); if (n === 1) setOffset({ x: 0, y: 0 }); return n; }); };
    const reset   = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        if (e.deltaY < 0) setScale(s => Math.min(s + 0.15, 5));
        else setScale(s => { const n = Math.max(s - 0.15, 0.5); if (n <= 1) setOffset({ x: 0, y: 0 }); return n; });
    }, []);

    const handleMouseDown = (e) => {
        if (scale <= 1) return;
        setDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };
    const handleMouseMove = (e) => {
        if (!dragging) return;
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleMouseUp = () => setDragging(false);

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = src;
        a.download = alt || "image";
        a.target = "_blank";
        a.click();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9990] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onWheel={handleWheel}
        >
            {/* Image */}
            <div
                className={`select-none ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transition: dragging ? "none" : "transform 0.2s ease",
                    maxWidth: "90vw",
                    maxHeight: "85vh"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={scale === 1 ? zoomIn : reset}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                    draggable={false}
                />
            </div>

            {/* Controls bar */}
            <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10"
                style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(20px)" }}
            >
                <LbBtn onClick={zoomOut} title="Zoom out" disabled={scale <= 0.5}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </LbBtn>

                <span className="text-[11px] font-bold text-slate-300 min-w-[42px] text-center tabular-nums">
                    {Math.round(scale * 100)}%
                </span>

                <LbBtn onClick={zoomIn} title="Zoom in" disabled={scale >= 5}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </LbBtn>

                <div className="w-px h-4 bg-white/15 mx-1" />

                <LbBtn onClick={reset} title="Reset zoom">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </LbBtn>

                <LbBtn onClick={handleDownload} title="Download">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </LbBtn>
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(12px)" }}
                title="Close (Esc)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>

            {/* Hint */}
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 pointer-events-none">
                Scroll or double-click to zoom · Drag when zoomed
            </p>
        </div>,
        document.body
    );
};

const LbBtn = ({ children, onClick, title, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
    >
        {children}
    </button>
);

export default Lightbox;
