import React from "react";

const Input = ({ 
    type = "text", 
    value, 
    onChange, 
    placeholder, 
    name, 
    label, 
    icon: Icon, 
    error, 
    className = "", 
    onKeyDown,
    autoComplete,
    ...props
}) => {
    return (
        <div className={`w-full flex flex-col ${className}`}>
            {label && (
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative w-full">
                {Icon && (
                    <Icon 
                        size={17} 
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" 
                    />
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    name={name}
                    onKeyDown={onKeyDown}
                    autoComplete={autoComplete}
                    className={`w-full rounded-xl py-3.5 text-sm input-base ${Icon ? "pl-10" : "px-4"} ${error ? "border-red-500/55 focus:border-red-500" : ""}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-red-400 text-xs mt-1.5 ml-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
