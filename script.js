window.addEventListener("DOMContentLoaded", () => {
    const { img, album } = getQueryParams();

    // Determine which back button is present
    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
        if (img && album) {
            // You're on the image view → back to album
            backBtn.href = `/album/?album=${encodeURIComponent(album)}`;
            backBtn.innerText = `Back to "${album}"`;
        } else {
            // You're on the album view → back to home
            backBtn.href = "/";
            backBtn.innerText = "Back to Home";
        }
    }

    if (img) {
        loadAlbumImage();
    } else {
        populateAlbumGrid();
    }

    setRandomAlbumBackgrounds();
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

function setRandomAlbumBackgrounds() {
    const buttons = document.querySelectorAll(".album-btn");

    buttons.forEach((button) => {
        const album = button.getAttribute("data-album");

        fetch(`${encodeURIComponent(album)}/info.json`)
            .then((res) => res.json())
            .then((data) => {
                const images = Object.keys(data);
                if (images.length === 0) return;

                const randomImage = images[Math.floor(Math.random() * images.length)];
                const imagePath = `${album}/thumbs/${randomImage}`;

                // Set background image styles
                button.style.backgroundImage = `url(${encodeURI(imagePath)})`;
            })
            .catch((err) => {
                console.warn(`Couldn't load info.json for ${album}`, err);
            });
    });
}

function album_selected(album) {
    console.log("Travelling to guayabr.com/album?album=", album);
    window.location.href = `album/?album=${encodeURIComponent(album)}`;
}

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        album: params.get("album"),
        img: params.get("img")
    };
}

function populateAlbumGrid() {
    const { album } = getQueryParams();
    if (!album) return;

    console.log("populating");

    document.title = album;

    const grid = document.querySelector(".photos-grid");
    const albumTitle = document.querySelector("h1");
    albumTitle.textContent = decodeURIComponent(album);

    fetch(`/${album}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            for (const filename in data) {
                const img = document.createElement("img");
                img.src = `/${album}/thumbs/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");

                img.onclick = () => {
                    window.location.href = `/image/?album=${album}&img=${filename}`;
                };

                grid.appendChild(img);
            }
        })
        .catch((err) => {
            console.error(`Failed to load ${album}/info.json`, err);
        });
}

function loadAlbumImage() {
    const { album, img } = getQueryParams();
    if (!album || !img) return;

    const imgPath = `/${album}/thumbs/${img}`;
    const imageEl = document.getElementById("album-img");
    imageEl.crossOrigin = "anonymous";
    imageEl.src = imgPath;

    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.href = `/${album}/${img}`;
    downloadBtn.download = img;

    const viewBtn = document.getElementById("view-img-btn");
    viewBtn.href = `/${album}/${img}`;
    viewBtn.target = "_blank";

    var color_els = true;

    fetch(`/${album}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            const info = data[img] || {};
            document.getElementById("image-title").innerText = info.title || "";
            document.getElementById("image-caption").innerText = info.caption || "";
            document.getElementById("image-lore").innerText = info.lore || "";
            document.getElementById("image-date").innerText = info.date || "";
            if (info.color) {
                document.getElementById("image-title").style.color = info.color;
                color_els = false;
            }

            document.title = info.title;
        })
        .catch(() => {
            console.warn("No info.json or failed to load.");
            document.title = img;
        });

    // Only run Color Thief logic on /image/
    if (window.location.pathname !== "/image/") return;

    imageEl.addEventListener("load", () => {
        if (!color_els) return;
        const colorThief = new ColorThief();
        if (imageEl.complete) {
            const color = colorThief.getColor(imageEl); // [r, g, b]
            const hsl = rgbToHsl(color[0], color[1], color[2]);

            // Boost saturation and lightness to force brightness
            hsl[1] = Math.min(1, hsl[1] * 1.2); // Saturation
            hsl[2] = Math.max(0.65, hsl[2]); // Lightness floor

            const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
            const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;
            document.getElementById("image-title").style.color = rgb;
        }
    });
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h,
        s,
        l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
