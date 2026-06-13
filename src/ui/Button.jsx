import React from "react";

const Button = ({ 
    children, 
    onClick, 
    type = "button", 
    variant = "primary", 
    loading = false, 
    disabled = false, 
    className = "", 
    icon: Icon 
}) => {
    // Styling mapping
    const baseStyles = "relative overflow-hidden rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";
    
    const variants = {
        primary: "btn-accent text-white shadow-lg shadow-[var(--accent-glow)] py-3 px-5",
        secondary: "text-[var(--text-primary)] hover:bg-[var(--hover-bg-strong)] py-3 px-5 border border-[var(--glass-border)]",
        destructive: "bg-red-500/8 border border-red-500/25 hover:bg-red-500/15 text-red-400 py-3 px-5"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && <Icon size={16} className="shrink-0" />}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
};

export default Button;
