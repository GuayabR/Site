const targetDate = new Date("2025-08-16T00:00:00");
const countdownEl = document.getElementById("countdown");

function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        countdownEl.textContent = "BEATZ! X RELEASED!";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

window.addEventListener("DOMContentLoaded", () => {
    const song = document.getElementById("bgsong");
    if (song) {
        song.volume = 0.07; // 30%
    }

    document.getElementById("download_btn").textContent = "Download for " + detectDeviceType() + "!";
});

function detectDeviceType() {
    const userAgent = navigator.userAgent || window.opera;

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    if (/CrOS/.test(userAgent)) {
        return "Chromebook";
    }

    if (/Mobile|iP(hone|od)|IEMobile|Windows Phone|kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return "Mobile";
    }
    return "Windows";
}

function home() {
    window.location.href = "/";
}
