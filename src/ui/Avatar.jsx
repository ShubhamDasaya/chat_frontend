import React, { useState } from "react";

const BackendPORT = import.meta.env.VITE_BACKEND_PORT || "http://localhost:8000";

const getAvatarURL = (str) => {
    if (!str) return null;
    if (typeof str === 'string' && str.includes("google.com/imgres")) {
        try {
            const imgurl = new URL(str).searchParams.get("imgurl");
            if (imgurl) return decodeURIComponent(imgurl);
        } catch (e) { /* ignore */ }
    }
    if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:")) return str;
    const baseUrl = BackendPORT.replace(/\/$/, '');
    const path = str.startsWith('/') ? str : `/${str}`;
    if (str.includes(".") && !str.includes("localhost") && !str.startsWith("/uploads")) {
        return `https://${str.replace(/^https?:\/\//, "")}`;
    }
    return `${baseUrl}${path}`;
};

const Avatar = ({ src, name, size = 10, online = false, className = "", onClick }) => {
    const [hasError, setHasError] = useState(false);
    const initials = name?.charAt(0)?.toUpperCase() || "?";
    
    // Convert numerical scale (e.g. 10 -> 40px)
    const dimensions = typeof size === 'number' ? `${size * 4}px` : size;
    const avatarUrl = src ? getAvatarURL(src) : null;

    return (
        <div 
            onClick={onClick}
            className={`relative shrink-0 select-none ${onClick ? "cursor-pointer active:scale-95" : ""} ${className}`}
            style={{ width: dimensions, height: dimensions }}
        >
            {avatarUrl && !hasError ? (
                <img 
                    src={avatarUrl} 
                    className="w-full h-full object-cover rounded-full transition-opacity duration-200" 
                    alt={name || "Avatar"} 
                    onError={() => setHasError(true)}
                />
            ) : (
                <div 
                    className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[#a78bfa] flex items-center justify-center text-white font-extrabold rounded-full"
                    style={{ fontSize: `calc(${dimensions} * 0.4)` }}
                >
                    {initials}
                </div>
            )}
            {online && (
                <div 
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full dot-online border-2" 
                    style={{ borderColor: "var(--bg-secondary)" }}
                />
            )}
        </div>
    );
};

export default Avatar;
export { getAvatarURL };
