import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { avaterUplodar, loginUser, registerUser } from "../../services/authService";
import {
    Eye, EyeOff, MessageCircle, Upload, Link as LinkIcon,
    ArrowRight, Sparkles, Shield, Zap, Camera, User, Mail, Lock,
    ChevronLeft, ChevronRight, Quote
} from "lucide-react";
import { Toast } from "../../ui/Toast";
import Avatar, { getAvatarURL } from "../../ui/Avatar";
import Input from "../../ui/Input";
import Button from "../../ui/Button";

const Login = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarLink, setAvatarLink] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [showAvatarStep, setShowAvatarStep] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ name: "", email: "", password: "" });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const navigate = useNavigate();
    const userToken = import.meta.env.VITE_USER_TOKEN;

    const carouselImages = [
        {
            url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop",
            title: "Connect Globally",
            description: "Chat with friends and colleagues from anywhere in the world"
        },
        {
            url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=1000&fit=crop",
            title: "Secure Messaging",
            description: "End-to-end encryption keeps your conversations private"
        },
        {
            url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1000&fit=crop",
            title: "Team Collaboration",
            description: "Work together seamlessly with powerful collaboration tools"
        },
        {
            url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=1000&fit=crop",
            title: "Real-time Updates",
            description: "Never miss a message with instant notifications"
        }
    ];

    useEffect(() => {
        if (showAvatarStep) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [showAvatarStep]);

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);

    const handleUser = async () => {
        if (loading) return;

        // Reset errors
        setErrors({ name: "", email: "", password: "" });

        // Client-side validations
        let hasError = false;
        const newErrors = { name: "", email: "", password: "" };

        if (isRegister && !name.trim()) {
            newErrors.name = "Name is required";
            hasError = true;
        }
        if (!email.trim()) {
            newErrors.email = "Email is required";
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = "Please enter a valid email address";
            hasError = true;
        }
        if (!password.trim()) {
            newErrors.password = "Password is required";
            hasError = true;
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const res = isRegister
                ? await registerUser({ name, email, password })
                : await loginUser({ email, password });

            if (!res.success) {
                Toast(res.message, "error");
                return;
            }

            localStorage.setItem(userToken, JSON.stringify(res.data));
            Toast(isRegister ? "Account created successfully!" : "Welcome back!", "success");

            if (isRegister) setShowAvatarStep(true);
            else navigate("/chat");
        } catch (error) {
            Toast(error?.message || "Authentication failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async () => {
        try {
            const formData = new FormData();
            if (avatarFile) formData.append("avatar", avatarFile);
            if (avatarLink) formData.append("avatarLink", getAvatarURL(avatarLink));

            const res = await avaterUplodar(formData);
            if (res.success) {
                Toast("Avatar saved!", "success");
                const stored = JSON.parse(localStorage.getItem(userToken) || "{}");
                localStorage.setItem(userToken, JSON.stringify({ ...stored, user: res.data }));
                navigate("/chat");
            }
        } catch {
            Toast("Avatar upload failed", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#060c1a] via-[#0a1020] to-[#060c1a] flex items-center justify-center p-4 md:p-6 overflow-y-auto relative">
            {/* Animated ambient orbs */}
            <div className="fixed top-[-20%] left-[-15%] w-[65%] h-[65%] bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent blur-[160px] rounded-full animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-15%] w-[65%] h-[65%] bg-gradient-to-tl from-violet-500/15 via-purple-500/10 to-transparent blur-[160px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
            <div className="fixed top-[40%] right-[20%] w-[30%] h-[30%] bg-blue-600/8 blur-[120px] rounded-full pointer-events-none" />

            {/* Main Container */}
            <div className="w-full max-w-5xl mx-auto relative z-10 animate-scale-in">
                <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
                    style={{ background: 'rgba(8,14,26,0.75)', backdropFilter: 'blur(32px) saturate(180%)', border: '1px solid rgba(255,255,255,0.07)' }}>

                    {/* ── Left: Image Carousel ── */}
                    {!showAvatarStep && (
                        <div className="hidden lg:block lg:w-[48%] relative overflow-hidden rounded-l-3xl">
                            <div className="relative h-full min-h-[620px]">
                                {carouselImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                                        style={{ opacity: idx === currentImageIndex ? 1 : 0 }}
                                    >
                                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#060c1a] via-[#060c1a]/50 to-transparent" />
                                    </div>
                                ))}

                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                                    <div className="mb-5">
                                        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs mb-5">
                                            <MessageCircle size={13} className="text-blue-400" />
                                            <span className="text-slate-300 font-medium">ChatFlow</span>
                                        </div>
                                        <h2 className="text-3xl font-extrabold mb-2 leading-tight">
                                            {carouselImages[currentImageIndex].title}
                                        </h2>
                                        <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
                                            {carouselImages[currentImageIndex].description}
                                        </p>
                                    </div>

                                    <div className="pt-5 border-t border-white/10 mb-4">
                                        <div className="flex items-start gap-3">
                                            <Quote size={20} className="text-blue-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-300 italic leading-relaxed">
                                                "Best communication platform I've ever used. The speed and clarity are unmatched!"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Dots */}
                                    <div className="flex gap-2 mb-2">
                                        {carouselImages.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`rounded-full transition-all duration-300 ${currentImageIndex === idx ? "w-7 h-2 bg-blue-400" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
                                                aria-label={`Slide ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Arrow buttons */}
                                <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all duration-200 z-20 active:scale-95" aria-label="Previous">
                                    <ChevronLeft size={18} className="text-white" />
                                </button>
                                <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all duration-200 z-20 active:scale-95" aria-label="Next">
                                    <ChevronRight size={18} className="text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Right: Form ── */}
                    <div className={`${!showAvatarStep ? "w-full lg:w-[52%]" : "w-full"} flex flex-col p-7 md:p-10 overflow-y-auto max-h-[92vh] lg:max-h-none custom-scrollbar`}>

                        {/* Mobile logo */}
                        <div className="lg:hidden text-center mb-7">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-violet-500 shadow-xl shadow-blue-500/40 mb-3">
                                <MessageCircle size={26} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                                ChatFlow
                            </h1>
                        </div>

                        {!showAvatarStep ? (
                            <>
                                <div className="mb-7 lg:mt-6">
                                    <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-blue-100 to-slate-300 bg-clip-text text-transparent mb-1">
                                        {isRegister ? "Create Account" : "Welcome Back"}
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        {isRegister ? "Join the future of communication" : "Sign in to continue your journey"}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Name */}
                                    {isRegister && (
                                        <Input
                                            type="text"
                                            placeholder="Full Name"
                                            value={name}
                                            autoComplete="name"
                                            icon={User}
                                            error={errors.name}
                                            onChange={(e) => { setErrors(er => ({ ...er, name: "" })); setName(e.target.value); }}
                                        />
                                    )}

                                    {/* Email */}
                                    <Input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        autoComplete="email"
                                        icon={Mail}
                                        error={errors.email}
                                        onChange={(e) => { setErrors(er => ({ ...er, email: "" })); setEmail(e.target.value); }}
                                    />

                                    {/* Password */}
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={password}
                                            autoComplete={isRegister ? "new-password" : "current-password"}
                                            icon={Lock}
                                            error={errors.password}
                                            onChange={(e) => { setErrors(er => ({ ...er, password: "" })); setPassword(e.target.value); }}
                                            onKeyDown={(e) => e.key === "Enter" && handleUser()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-[18px] text-slate-500 hover:text-blue-400 transition-colors p-1 z-10"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <Button
                                    onClick={handleUser}
                                    loading={loading}
                                    disabled={loading}
                                    icon={ArrowRight}
                                    className="w-full mt-6"
                                >
                                    {isRegister ? "Create Account" : "Sign In"}
                                </Button>

                                {/* Toggle */}
                                <div className="text-center mt-5">
                                    <button
                                        type="button"
                                        onClick={() => { setIsRegister(!isRegister); setErrors({ name: "", email: "", password: "" }); }}
                                        className="text-slate-400 hover:text-blue-300 text-sm transition-colors duration-200 inline-flex items-center gap-1"
                                    >
                                        {isRegister ? "Already have an account? " : "Don't have an account? "}
                                        <span className="text-blue-400 font-medium hover:underline">{isRegister ? "Sign In" : "Create one"}</span>
                                    </button>
                                </div>

                                {/* Badges */}
                                <div className="flex justify-center gap-6 mt-6 pt-5 border-t border-white/6">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Shield size={13} className="text-green-400" />
                                        <span>Encrypted</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Zap size={13} className="text-yellow-400" />
                                        <span>Real-time</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Sparkles size={13} className="text-violet-400" />
                                        <span>Modern</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Avatar Upload Step */
                            <div className="flex flex-col items-center lg:justify-center flex-1 py-4">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 mb-4">
                                        <Camera size={28} className="text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-white mb-1">Add Profile Photo</h2>
                                    <p className="text-slate-400 text-sm">Help your contacts recognise you</p>
                                </div>

                                {/* Avatar Preview */}
                                <div className="relative mb-7">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500 rounded-full blur-xl opacity-40 animate-pulse" />
                                    <Avatar 
                                        src={avatarFile ? URL.createObjectURL(avatarFile) : avatarLink} 
                                        name={name || email} 
                                        size={28} 
                                        className="border-2 border-white/20 shadow-2xl relative z-10"
                                    />
                                </div>

                                <div className="w-full space-y-3 max-w-sm">
                                    {/* File upload */}
                                    <label className="w-full cursor-pointer block">
                                        <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-blue-300 hover:text-white transition-all duration-200 hover:bg-blue-500/15 active:scale-[0.98]"
                                            style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
                                            <Upload size={16} />
                                            Choose Local Image
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) { setAvatarFile(e.target.files[0]); setAvatarLink(""); } }} />
                                    </label>

                                    {/* Link input */}
                                    <Input
                                        type="text"
                                        placeholder="Or paste image URL..."
                                        value={avatarLink}
                                        icon={LinkIcon}
                                        onChange={(e) => { setAvatarLink(e.target.value); setAvatarFile(null); }}
                                    />

                                    <Button
                                        onClick={handleAvatarUpload}
                                        className="w-full mt-2"
                                        icon={ArrowRight}
                                    >
                                        Continue to Chat
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/chat")}
                                        className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors duration-200"
                                    >
                                        Skip for now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
