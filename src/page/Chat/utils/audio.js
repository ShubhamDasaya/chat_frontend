// Web Audio API Synthesizer Chime
export const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.08); // A5 note
        
        gain.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        console.error("Audio failed to play:", e);
    }
};
