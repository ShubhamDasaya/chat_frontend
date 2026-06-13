import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight, Shield, Zap, Sparkles, Users, Send, LogIn } from "lucide-react";

const Home = () => {
    const [userName, setUserName] = useState("");
    const [errors, setErrors] = useState("");
    const navigate = useNavigate();

    const handleUser = () => {
        if (!userName.trim()) {
            setErrors("Please enter your name to continue");
            return;
        }
        navigate("/chat", { state: { userName } });
    };

    const features = [
        { icon: Shield, label: "Encrypted", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
        { icon: Zap, label: "Real-time", color: "#eab308", bg: "rgba(234,179,8,0.1)" },
        { icon: Sparkles, label: "Modern", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
        { icon: Users, label: "Groups", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ background: "var(--bg-primary)" }}>

            {/* Animated ambient orbs */}
            <div className="fixed pointer-events-none" style={{
                top: "-25%", left: "-15%", width: "70%", height: "70%",
                background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)",
                filter: "blur(60px)", borderRadius: "50%"
            }} />
            <div className="fixed pointer-events-none animate-glow-2" style={{
                bottom: "-25%", right: "-15%", width: "65%", height: "65%",
                background: "radial-gradient(ellipse, rgba(167,139,250,0.15) 0%, transparent 70%)",
                filter: "blur(80px)", borderRadius: "50%"
            }} />
            <div className="fixed pointer-events-none animate-glow-3" style={{
                top: "30%", right: "15%", width: "35%", height: "35%",
                background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)",
                filter: "blur(50px)", borderRadius: "50%"
            }} />

            {/* Main content */}
            <div className="w-full max-w-sm relative z-10 animate-scale-in">

                {/* Hero icon */}
                <div className="flex flex-col items-center mb-10">
                    {/* Outer pulse ring */}
                    <div className="relative flex items-center justify-center mb-5">
                        <div className="absolute w-28 h-28 rounded-full opacity-20 animate-ping"
                            style={{ background: "var(--gradient-brand)", animationDuration: "2.5s" }} />
                        <div className="absolute w-24 h-24 rounded-full opacity-30"
                            style={{ background: "var(--gradient-brand)", filter: "blur(12px)" }} />
                        <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center animate-hero-glow"
                            style={{
                                background: "var(--gradient-brand)",
                                boxShadow: "0 20px 60px rgba(99,102,241,0.4)"
                            }}>
                            <MessageCircle size={38} className="text-white" strokeWidth={2} />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">
                        ChatFlow
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                        Connect instantly · Chat seamlessly
                    </p>
                </div>

                {/* Glass card */}
                <div className="glass-card rounded-3xl p-7">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                            Enter to get started
                        </h2>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                            No account needed — just your name
                        </p>
                    </div>

                    {/* Input */}
                    <div className="relative mb-4 glow-border-focus rounded-xl transition-all duration-200"
                        style={{ border: "1px solid var(--glass-border)", background: "var(--input-bg)" }}>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: "var(--text-muted)" }}>
                            <Send size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Your display name"
                            value={userName}
                            className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                            style={{ color: "var(--text-primary)" }}
                            onChange={(e) => { setErrors(""); setUserName(e.target.value); }}
                            onKeyDown={(e) => e.key === "Enter" && handleUser()}
                            autoFocus
                        />
                    </div>

                    {errors && (
                        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "#f87171" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                            {errors}
                        </p>
                    )}

                    {/* CTA button */}
                    <button
                        onClick={handleUser}
                        className="w-full btn-accent rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2"
                        style={{ background: "var(--gradient-brand)" }}
                    >
                        Start Chatting
                        <ArrowRight size={16} />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: "var(--glass-border)" }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
                        <div className="flex-1 h-px" style={{ background: "var(--glass-border)" }} />
                    </div>

                    {/* Login link */}
                    <a href="/login" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold btn-ghost transition-all duration-200">
                        <LogIn size={15} />
                        Sign in with account
                    </a>
                </div>

                {/* Feature badges */}
                <div className="grid grid-cols-4 gap-2 mt-5">
                    {features.map(({ icon: Icon, label, color, bg }) => (
                        <div key={label} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl shimmer-hover"
                            style={{
                                background: "var(--glass-bg)",
                                border: "1px solid var(--glass-border)",
                                backdropFilter: "blur(12px)"
                            }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: bg }}>
                                <Icon size={14} style={{ color }} />
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs mt-5" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                    Join thousands of happy users worldwide 🌍
                </p>
            </div>
        </div>
    );
};

export default Home;