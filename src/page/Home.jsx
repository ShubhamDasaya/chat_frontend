
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight, User, Sparkles, Shield, Zap, Send, LogIn } from "lucide-react";

const Home = () => {
    const [userName, setUserName] = useState("");
    const [errors, setErrors] = useState("");
    const navigate = useNavigate();

    const handleUser = () => {
        if (!userName.trim()) {
            setErrors("Name is required");
            return;
        }
        navigate("/chat", { state: { userName } });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#0d1425] to-[#0a0f1c] flex items-center justify-center px-4">
            {/* Animated gradient orbs */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full animate-pulse delay-1000" />

            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 mb-4">
                        <MessageCircle size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">ChatFlow</h1>
                    <p className="text-sm text-slate-400 mt-1">Connect instantly, chat seamlessly</p>
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-white">Welcome to ChatFlow</h2>
                        <p className="text-sm text-slate-400 mt-1">Enter your name to continue</p>
                    </div>

                    {/* Input Field */}
                    <div className="relative mb-4">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={userName}
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
                            onChange={(e) => {
                                setErrors("");
                                setUserName(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleUser()}
                        />
                    </div>

                    {/* Error Message */}
                    {errors && (
                        <div className="mb-4">
                            <p className="text-red-400 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                {errors}
                            </p>
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        onClick={handleUser}
                        disabled={!userName.trim()}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${userName.trim()
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/30 cursor-pointer"
                            : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        <span>Start Chatting</span>
                        <Send size={16} />
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-transparent text-slate-500">Secure & Private</span>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Shield size={14} className="text-green-400" />
                            <span>Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Zap size={14} className="text-yellow-400" />
                            <span>Real-time</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    Join thousands of happy users worldwide
                </p>
            </div>
        </div>
    );
};

export default Home;