/**
 * GuayabR's
 * Main website
 */

const DEVICE = detectDeviceType();

console.log(DEVICE);

window.addEventListener("DOMContentLoaded", () => {
    const { img, album, from } = getQueryParams();

    // Determine which back button is present
    const backBtn = document.getElementById("back-btn");
    const browseBtn = document.getElementById("back-browse-btn");
    if (backBtn) {
        if (img && album) {
            if (from === "browse") {
                backBtn.href = `/album/?album=${encodeURIComponent(album)}`;
                backBtn.innerText = `Go to Album (${album})`;
                browseBtn.style.display = "block";
                browseBtn.href = "/browse/";
                browseBtn.innerText = "Back to Browsing";
            } else if (from === "view") {
                backBtn.href = `/album/?album=${encodeURIComponent(album)}&from=view`;
                backBtn.innerText = `Back to "${album}"`;
                browseBtn.style.display = "block";
                browseBtn.href = "/view/";
                browseBtn.innerText = "Back to All Albums";
            } else {
                backBtn.href = `/album/?album=${encodeURIComponent(album)}`;
                backBtn.innerText = `Back to "${album}"`;
            }
        } else if (from === "view") {
            backBtn.href = "/view";
            backBtn.innerText = "Back to All Albums";
        } else {
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
    const isViewPage = window.location.pathname.startsWith("/view");

    buttons.forEach((button) => {
        const album = button.getAttribute("data-album");

        const fetchFrom = (isViewPage ? "/" : "") + `${encodeURIComponent(album)}/info.json`;

        fetch(fetchFrom)
            .then((res) => res.json())
            .then((data) => {
                const images = Object.keys(data);
                if (images.length === 0) return;

                const randomImage = images[Math.floor(Math.random() * images.length)];
                const imagePath = (isViewPage ? "/" : "") + `${album}/thumbs/${randomImage}`;

                button.style.backgroundImage = `url("${encodeURI(imagePath)}")`;
                //console.log("set bg as ", button.style.backgroundImage);
                //console.log("set bg url as ", encodeURI(imagePath));
            })
            .catch((err) => {
                console.warn(`Couldn't load info.json for ${album}`, err);
            });
    });

    if (buttons.length > 5) {
        const centerWrapper = document.querySelector(".center-wrapper");
        if (centerWrapper) {
            const spacer = document.createElement("div");
            spacer.style.minHeight = "70px";
            document.body.insertBefore(spacer, document.body.firstChild);

            while (centerWrapper.firstChild) {
                document.body.insertBefore(centerWrapper.firstChild, centerWrapper);
            }

            centerWrapper.remove();
        }
    }
}

function album_selected(album) {
    console.log("Travelling to guayabr.com/album?album=", album);

    if (window.location.pathname.startsWith("/view")) window.location.href = `/album/?album=${encodeURIComponent(album)}&from=view`;
    else window.location.href = `album/?album=${encodeURIComponent(album)}`;
}

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        album: params.get("album"),
        img: params.get("img"),
        from: params.get("from")
    };
}

function populateAlbumGrid() {
    const { album, from } = getQueryParams();
    if (!album) return;

    document.title = album;

    const grid = document.querySelector(".photos-grid");
    const albumTitle = document.querySelector("h1");
    albumTitle.textContent = decodeURIComponent(album);

    fetch(`/${album}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            let count = 0;

            for (const filename in data) {
                const meta = data[filename];

                const img = document.createElement("img");
                img.src = `/${album}/thumbs/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");
                img.setAttribute("img-title", meta.title || filename);
                img.setAttribute("img-date", meta.date);
                img.setAttribute("img-caption", meta.caption);
                img.setAttribute("img-song", meta["s-title"]);
                img.setAttribute("img-song-artist", meta["s-artist"]);

                img.onclick = () => {
                    if (from === "view") window.location.href = `/image/?album=${album}&img=${filename}&from=view`;
                    else window.location.href = `/image/?album=${album}&img=${filename}`;
                };

                var extract = true;

                //if (meta.color) {
                //    img.style.borderColor = meta.color;
                //    extract = false;
                //}

                img.addEventListener("load", () => {
                    return;
                    const colorThief = new ColorThief();
                    if (img.complete) {
                        const color = colorThief.getColor(img); // [r, g, b]
                        const hsl = rgbToHsl(color[0], color[1], color[2]);

                        // Boost saturation and lightness to force brightness
                        hsl[1] = Math.min(1, hsl[1] * 1.2); // Saturation
                        hsl[2] = Math.max(0.65, hsl[2]); // Lightness floor

                        const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                        const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;
                        img.style.borderColor = rgb;
                    }
                });

                grid.appendChild(img);
                count++;
            }

            setupTooltipHover();

            if (count > 9) {
                const centerWrapper = document.querySelector(".center-wrapper");
                if (centerWrapper) {
                    const spacer = document.createElement("div");
                    spacer.style.minHeight = "70px";
                    document.body.insertBefore(spacer, document.body.firstChild);

                    while (centerWrapper.firstChild) {
                        document.body.insertBefore(centerWrapper.firstChild, centerWrapper);
                    }

                    centerWrapper.remove();
                }
            }
        })
        .catch((err) => {
            console.error(`Failed to load ${album}/info.json`, err);
        });
}

function setupTooltipHover() {
    if (DEVICE != "Windows") return;
    const tooltip = document.getElementById("custom-tooltip");
    const images = document.querySelectorAll(".album-image");

    images.forEach((img) => {
        const title = img.getAttribute("img-title") || img.alt;
        const date = img.getAttribute("img-date");
        const caption = img.getAttribute("img-caption");
        const song = img.getAttribute("img-song");
        const song_a = img.getAttribute("img-song-artist");

        img.addEventListener("mouseenter", () => {
            const lines = [];

            if (title != "undefined" || "") lines.push(`${title}`);
            if (caption != "undefined" || "") lines.push(`<br>${caption}`);
            if (date != "undefined" || "") lines.push(`<br>${date}`);
            if (song != "undefined" || "") lines.push(`<br><i style="color: rgba(158, 158, 158, 1)">${song}</i>`);
            if (song_a != "undefined" || "") lines.push(`<br><i style="color: rgba(158, 158, 158, 1)">${song_a}</i>`);

            tooltip.innerHTML = lines.join("");
            tooltip.style.opacity = "1";
        });

        img.addEventListener("mousemove", (e) => {
            const offset = 15;
            const tooltipWidth = tooltip.offsetWidth;
            const pageWidth = window.innerWidth;

            // Determine if there's enough space on the right
            if (e.clientX + tooltipWidth + offset > pageWidth - 12) {
                // Not enough space: position tooltip to the left
                tooltip.style.left = `${e.clientX - tooltipWidth - offset}px`;
            } else {
                // Enough space: position tooltip to the right
                tooltip.style.left = `${e.clientX + offset}px`;
            }

            tooltip.style.top = `${e.clientY + offset}px`;
        });

        img.addEventListener("mouseleave", () => {
            tooltip.style.opacity = "0";
        });
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
    var color_a = false;
    var extracted_rgb, extracted_arr;

    fetch(`/${album}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            const info = data[img] || {};
            document.getElementById("image-title").innerText = info.title || "";
            const captionEl = document.getElementById("image-caption");
            captionEl.innerHTML = parseCaption(info.caption || "");

            document.getElementById("image-lore").innerText = info.lore || "";
            document.getElementById("image-date").innerText = info.date || "";

            if (info.color) {
                document.getElementById("image-title").style.color = info.color;

                if (info.color_hyper) {
                    color_as(captionEl.querySelectorAll("a"), info.color);
                }

                imageEl.style.borderColor = info.color;

                // Disable color extraction only if a fixed color is used
                color_els = false;

                setLowColor(imageEl, parseRgbString(info.color));
            } else if (info.color_hyper && !info.color) {
                // Keep color_els = true so it extracts and applies to <a>
                // Title color will be handled after image loads
                color_els = true;
                color_a = true;
                color_as(document.getElementById("image-caption").querySelectorAll("a"), extracted_rgb);
            }

            if (info["site-bg"]) {
                document.documentElement.style.backgroundColor = info["site-bg"];
                document.body.style.backgroundColor = info["site-bg"];
            }

            document.title = info.title;

            // Add Spotify embed if song exists
            const iframe = document.querySelector('iframe[data-testid="embed-iframe"]');
            if (iframe && info.song && info.song.includes("open.spotify.com/embed/track/")) {
                iframe.src = info.song;
                iframe.style.display = "block";
            } else if (iframe) {
                iframe.style.display = "none";
            }
        })
        .catch(() => {
            console.warn("No info.json or failed to load.");
            document.title = img;
        });

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
            extracted_rgb = rgb;
            extracted_arr = brightRgb;
            document.getElementById("image-title").style.color = rgb;
            imageEl.style.borderColor = rgb;
            setLowColor(imageEl, extracted_arr);
        }
    });
}

function setLowColor(elem, color) {
    setTimeout(() => {
        elem.style.transition = "border 3s ease";
        const hsl = rgbToHsl(color[0], color[1], color[2]);
        hsl[1] = Math.min(0.1, hsl[1]); // Saturation
        hsl[2] = Math.max(0.1, hsl[2] * 0.5); // Lightness floor

        const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
        const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;
        elem.style.borderColor = rgb;
    }, 500);
}

function color_as(links, col) {
    for (const a of links) {
        a.style.color = col;
    }
}

function parseCaption(caption) {
    const linkRegex = /\((https?:\/\/[^\s()]+)\)/;

    const match = caption.match(linkRegex);
    if (match) {
        const url = match[1];
        const textBefore = caption.slice(0, match.index).trim();
        const linkTextMatch = textBefore.match(/(\S+)$/);
        const linkText = linkTextMatch ? linkTextMatch[1] : url;

        // Remove the linkText from before the match
        const captionStart = textBefore.replace(new RegExp(linkText + "$"), "").trim();
        const captionEnd = caption.slice(match.index + match[0].length).trim();

        return `${captionStart} <a href="${url}" target="_blank" rel="noopener">${linkText}</a> ${captionEnd}`;
    }

    return caption; // No link found
}

function parseRgbString(rgbStr) {
    const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return [0, 0, 0]; // fallback
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
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
