import React, { useState } from "react";

// Per-letter hue map for colorful initials
const charToHue = (char) => {
    const code = char?.toUpperCase().charCodeAt(0) || 65;
    return ((code - 65) * 14) % 360;
};

const getBackendPort = () => {
    if (import.meta.env.VITE_BACKEND_PORT) return import.meta.env.VITE_BACKEND_PORT;
    if (import.meta.env.PROD) return "http://13.61.24.47:8000";
    return "http://localhost:8000";
};
const BackendPORT = getBackendPort();

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
    const hue = charToHue(initials);

    // Convert numerical scale (e.g. 10 -> 40px)
    const dimensions = typeof size === 'number' ? `${size * 4}px` : size;
    const avatarUrl = src ? getAvatarURL(src) : null;

    // Dynamic gradient per letter
    const fallbackGradient = `linear-gradient(135deg, 
        hsl(${hue}, 70%, 55%) 0%, 
        hsl(${(hue + 40) % 360}, 80%, 60%) 100%
    )`;

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
                    className="w-full h-full flex items-center justify-center text-white font-extrabold rounded-full"
                    style={{
                        background: fallbackGradient,
                        fontSize: `calc(${dimensions} * 0.4)`,
                        textShadow: "0 1px 3px rgba(0,0,0,0.3)"
                    }}
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
