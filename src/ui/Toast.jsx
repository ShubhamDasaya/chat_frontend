// Lightweight toast notification — directly injects into the DOM
export const Toast = (message, type = "info") => {
    const validTypes = ["success", "error", "info"];
    if (!validTypes.includes(type)) type = "info";

    const colors = {
        success: "linear-gradient(to right,#22c55e,#34d399)",
        error: "linear-gradient(to right,#ef4444,#f43f5e)",
        info: "linear-gradient(to right,#3b82f6,#38bdf8)"
    };

    const icons = {
        success: `<circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/>`,
        error: `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
        info: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`
    };

    const toast = document.createElement("div");
    toast.className = `fixed right-6 top-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg text-gray-800`;

    toast.innerHTML = `
        <div style="background:${colors[type]};padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="white" stroke-width="2">${icons[type]}</svg>
        </div>
        <span style="font-weight:500">${message || "Something happened"}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
};