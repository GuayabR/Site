/**
 * GuayabR's
 * Main website
 */

const DEVICE = detectDeviceType();

const menu = document.getElementById("customMenu");
const openBtn = document.getElementById("openFull");
const openTabBtn = document.getElementById("openTab");
const goToImgBtn = document.getElementById("goToImg");
const goToAlbumBtn = document.getElementById("goToAlbum");
const quickDown = document.getElementById("quickDown");
const ALBUM_METADATA_KEY = "_album";
const KAWARP_MODULE_URL = "https://cdn.jsdelivr.net/npm/@kawarp/core@1.2.0/dist/index.js";
const KAWARP_PRESETS = {
    water: {
        strength: 0.35,
        radius: 0.45,
        speed: 1.0,
        darkness: 0.35,

        blurPasses: 8,
        transitionDuration: 1000,
        saturation: 1.5,
        tintColor: [0.16, 0.16, 0.24],
        tintIntensity: 0.15,
        dithering: 0.008
    },

    glass: {
        strength: 0.15,
        radius: 0.3,
        speed: 0.3,
        darkness: 0.5,

        blurPasses: 10,
        transitionDuration: 1000,
        saturation: 1.5,
        tintColor: [0.16, 0.16, 0.24],
        tintIntensity: 0.15,
        dithering: 0.0
    },

    spicetify: {
        strength: 1.2,
        radius: 2.0,
        speed: 1.75,
        darkness: 0.7,

        blurPasses: 8,
        transitionDuration: 1000,
        saturation: 1.5,
        tintColor: [0.16, 0.16, 0.24],
        tintIntensity: 0.15,
        dithering: 0.0
    },

    dream: {
        strength: 0.6,
        radius: 0.7,
        speed: 0.5,
        darkness: 0.45,

        blurPasses: 8,
        transitionDuration: 1000,
        saturation: 1.5,
        tintColor: [0.16, 0.16, 0.24],
        tintIntensity: 0.15,
        dithering: 0.008
    },

    ripple: {
        strength: 0.4,
        radius: 0.3,
        speed: 1.5,
        darkness: 0.4,

        blurPasses: 8,
        transitionDuration: 1000,
        saturation: 1.5,
        tintColor: [0.16, 0.16, 0.24],
        tintIntensity: 0.15,
        dithering: 0.008
    }
};
const KAWARP_PRESET_ALIASES = {
    liquid: "water"
};

let kawarpInstance;
let kawarpRequestId = 0;

function shouldSwitchAlbumColorOnHover(metadata) {
    return (
        metadata["switch-col-hover"] === true && !["Mobile", "iOS", "Android"].includes(DEVICE) && ["gradient", "double-gradient"].includes(metadata["tint-bg"])
    );
}

function getAlbumMetadata(data) {
    const metadata = data?.[ALBUM_METADATA_KEY];
    return metadata && typeof metadata === "object" ? metadata : {};
}

function getImageFilenames(data) {
    return Object.keys(data || {}).filter((filename) => filename !== ALBUM_METADATA_KEY);
}

function getKawarpOptions(config) {
    const presetName = KAWARP_PRESET_ALIASES[config.preset] || config.preset;
    const preset = KAWARP_PRESETS[presetName] || {};
    const options = {
        warpIntensity: config.warpIntensity ?? config.strength ?? preset.warpIntensity ?? preset.strength,
        blurPasses: config.blurPasses ?? preset.blurPasses,
        animationSpeed: config.animationSpeed ?? config.speed ?? preset.animationSpeed ?? preset.speed,
        transitionDuration: config.transitionDuration ?? preset.transitionDuration,
        saturation: config.saturation ?? preset.saturation,
        tintColor: config.tintColor ?? preset.tintColor,
        tintIntensity: config.tintIntensity ?? preset.tintIntensity,
        dithering: config.dithering ?? preset.dithering,
        scale: config.scale ?? config.radius ?? preset.scale ?? preset.radius
    };

    return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
}

function getKawarpDarkness(config) {
    const presetName = KAWARP_PRESET_ALIASES[config.preset] || config.preset;
    const preset = KAWARP_PRESETS[presetName] || {};
    return Math.min(1, Math.max(0, config.darkness ?? preset.darkness ?? 0));
}

function getKawarpCanvas() {
    let container = document.getElementById("kawarp-background");
    if (!container) {
        container = document.createElement("div");
        container.id = "kawarp-background";
        container.setAttribute("aria-hidden", "true");

        container.style.position = "fixed";
        container.style.inset = "0";
        container.style.background = "rgb(12, 12, 12)";
        container.style.zIndex = "-10";

        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.background = "transparent";

        container.appendChild(canvas);
        document.body.prepend(container);
    }

    return container.querySelector("canvas");
}

function disableKawarp() {
    kawarpRequestId++;
    kawarpInstance?.dispose();
    kawarpInstance = undefined;
    document.documentElement.classList.remove("kawarp-active");
    document.body.classList.remove("kawarp-active");
}

async function enableKawarp(config, imageUrl) {
    if (!config?.enabled || !imageUrl) return;

    const requestId = ++kawarpRequestId;
    const canvas = getKawarpCanvas();

    canvas.parentElement.style.background = "rgb(12, 12, 12)";

    try {
        const { Kawarp } = await import(KAWARP_MODULE_URL);
        const instance = new Kawarp(canvas, getKawarpOptions(config));
        await instance.loadImage(imageUrl);

        if (requestId !== kawarpRequestId) {
            instance.dispose();
            return;
        }

        kawarpInstance?.dispose();
        kawarpInstance = instance;
        canvas.parentElement.style.setProperty("--kawarp-darkness", getKawarpDarkness(config));
        document.documentElement.classList.add("kawarp-active");
        document.body.classList.add("kawarp-active");
        instance.start();
    } catch (error) {
        console.warn("Couldn't enable Kawarp", error);
    }
}

function applyAlbumMetadata(metadata, albumTitle) {
    if (metadata.color) {
        albumTitle.style.color = metadata.color;
    }

    if (metadata["tint-bg"] === "gradient" && metadata.color && !shouldSwitchAlbumColorOnHover(metadata)) {
        applyGradientBackground(parseRgbString(metadata.color));
    } else if (metadata["tint-bg"] === "double-gradient" && metadata.color && !shouldSwitchAlbumColorOnHover(metadata)) {
        const primaryColor = parseRgbString(metadata.color);
        const secondaryColor = metadata.color2 ? parseRgbString(metadata.color2) : primaryColor;
        applyGradientBackground(primaryColor, secondaryColor, true);
    }

    const songEmbed = document.getElementById("album-song-embed");
    const songContainer = document.getElementById("album-song-container");
    if (songEmbed && songContainer && metadata.song?.includes("open.spotify.com/embed/")) {
        songEmbed.src = metadata.song;
        songContainer.hidden = false;
    }
}

function setupAlbumLabelScrolling() {
    document.querySelectorAll(".album-label").forEach((label) => {
        if (label.dataset.scrollReady) return;
        label.dataset.scrollReady = "true";

        const labelText = document.createElement("span");
        labelText.classList.add("album-label-text");
        while (label.firstChild) {
            labelText.appendChild(label.firstChild);
        }
        label.appendChild(labelText);

        const overscroll = 20;
        const overflow = labelText.scrollWidth - label.clientWidth;

        if (overflow > 0) {
            label.classList.add("album-label-scroll");
            label.style.setProperty("--label-scroll-start", `${overscroll}px`);
            label.style.setProperty("--label-scroll-distance", `-${overflow + overscroll}px`);
        }
    });
}

function setImageLabel(label, meta, filename) {
    const imageTitle = meta.title || filename;
    label.replaceChildren();
    label.title = imageTitle;

    if (meta.author) {
        const author = document.createElement("span");
        author.classList.add("album-label-author");
        author.textContent = `${meta.author}'s `;
        label.appendChild(author);
    }

    const title = document.createElement("span");
    title.textContent = imageTitle;
    label.appendChild(title);
}

function getPhotoYear(date) {
    return String(date || "").match(/\b(?:19|20)\d{2}\b/)?.[0];
}

console.log(DEVICE);

window.addEventListener("DOMContentLoaded", () => {
    const { img, album, from, searchTerm } = getQueryParams();

    // Determine which back button is present
    const backBtn = document.getElementById("back-btn");
    const browseBtn = document.getElementById("back-browse-btn");

    if (backBtn) {
        if (img && album) {
            if (from === "browse") {
                backBtn.href = `/album/?album=${encodeURIComponent(album)}&searched=${searchTerm}`;
                backBtn.innerText = `Go to Album (${album})`;
                browseBtn.style.display = "block";
                browseBtn.href = `/browse/?&searched=${searchTerm}`;
                browseBtn.innerText = "Back to Browsing";
            } else if (from === "view") {
                backBtn.href = `/album/?album=${encodeURIComponent(album)}&from=view&searched=${searchTerm}`;
                backBtn.innerText = `Back to "${album}"`;
                browseBtn.style.display = "block";
                browseBtn.href = "/view/";
                browseBtn.innerText = "Back to All Albums";
            } else {
                backBtn.href = `/album/?album=${encodeURIComponent(album)}&searched=${searchTerm}`;
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

    removeQueryParam("searched");

    setupAlbumButtons();
    setRandomAlbumBackgrounds();
    setupHomeAlbumContextMenus();
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
                const metadata = getAlbumMetadata(data);
                const images = getImageFilenames(data);
                if (images.length === 0) return;

                if (metadata.title) {
                    button.textContent = metadata.title;
                }

                const selectedImage = images[Math.floor(Math.random() * images.length)];
                //const selectedImage = album === "The Next Chapter" ? images[0] : images[Math.floor(Math.random() * images.length)];

                const imagePath = (isViewPage ? "/" : "") + `${album}/thumbs/${selectedImage}`;

                button.style.backgroundImage = `url("${encodeURI(imagePath)}")`;
                button.dataset.previewImage = selectedImage;

                const previewMeta = data[selectedImage] || {};
                if (previewMeta.color) {
                    button.setAttribute("col", previewMeta.color);
                    button.style.setProperty("--album-color", previewMeta.color);
                } else if (typeof ColorThief !== "undefined") {
                    const previewImage = new Image();
                    previewImage.crossOrigin = "anonymous";
                    previewImage.src = imagePath;

                    previewImage.addEventListener("load", () => {
                        const color = new ColorThief().getColor(previewImage);
                        const hsl = rgbToHsl(color[0], color[1], color[2]);

                        hsl[1] = Math.min(1, hsl[1] * 1.2);
                        hsl[2] = Math.max(0.65, hsl[2]);

                        const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                        const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;
                        button.setAttribute("col", rgb);
                        button.style.setProperty("--album-color", rgb);
                    });
                }
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
            spacer.style.minHeight = "40px";
            document.body.insertBefore(spacer, document.body.firstChild);

            while (centerWrapper.firstChild) {
                document.body.insertBefore(centerWrapper.firstChild, centerWrapper);
            }

            centerWrapper.remove();
        }
    }
}

function setupAlbumButtons() {
    document.querySelectorAll(".album-btn[data-album]").forEach((button) => {
        const { album } = button.dataset;
        button.textContent = album;
        button.addEventListener("click", () => album_selected(album));
    });
}

function setupHomeAlbumContextMenus() {
    const isHomePage = window.location.pathname === "/" || window.location.pathname.endsWith("/index.html");
    const isViewPage = window.location.pathname.startsWith("/view");
    if (!isHomePage && !isViewPage) return;

    document.querySelectorAll(".album-btn[data-album]").forEach((button) => {
        button.addEventListener("contextmenu", async (event) => {
            event.preventDefault();

            const album = button.dataset.album;

            try {
                const response = await fetch(`/${encodeURIComponent(album)}/info.json`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                const filename = button.dataset.previewImage || getImageFilenames(data)[0];
                const meta = data[filename];

                if (!filename || !meta) throw new Error("Album has no preview image metadata");

                const previewImage = new Image();
                previewImage.alt = filename;
                previewImage.dataset.album = album;
                previewImage.setAttribute("img-data-url", `/${encodeURIComponent(album)}/${encodeURIComponent(filename)}`);
                const imagePageUrl = `/image/?album=${encodeURIComponent(album)}&img=${encodeURIComponent(filename)}${isViewPage ? "&from=view" : ""}`;
                previewImage.setAttribute("img-data-onclick", imagePageUrl);
                previewImage.setAttribute("img-title", meta.title || filename);
                previewImage.setAttribute("img-date", meta.date || "");
                previewImage.setAttribute("img-caption", meta.caption || "");
                previewImage.setAttribute("img-lore", meta.lore || "");
                previewImage.setAttribute("img-song", meta["s-title"] || "");
                previewImage.setAttribute("img-song-artist", meta["s-artist"] || "");
                previewImage.setAttribute("col", button.getAttribute("col") || meta.color || "rgba(255, 255, 255, 0.35)");

                showImageContextMenu(event, previewImage);
            } catch (error) {
                console.error(`Couldn't load preview metadata for ${album}`, error);
            }
        });
    });
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
        from: params.get("from"),
        searchTerm: params.get("searched")
    };
}

function removeQueryParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);

    // Update URL in address bar without reload
    window.history.replaceState({}, "", url);
}

function populateAlbumGrid() {
    const { album, from, searchTerm } = getQueryParams();
    if (!album) return;

    document.title = album;

    const grid = document.querySelector(".photos-grid");
    const albumTitle = document.querySelector("h1");
    albumTitle.textContent = decodeURIComponent(album);

    const notFoundMessage = `<span style="color: red; font-family: Helvetica;">Error (404 Not Found)</span><br>Album "${album}" was not found.<br><span style="font-size: 20px; font-family: Helvetica; font-weight: 400; color: gray;">${window.location}</span>`;

    const noDataMessage = `<span style="color: red; font-family: Helvetica;">Error (NaN No Data)</span><br>Album "${album}" was searched but no data recieved.<br><span style="font-size: 20px; font-family: Helvetica; font-weight: 400; color: gray;">${window.location}</span>`;

    fetch(`/${album}/info.json`)
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.text();
        })
        .then((text) => {
            if (!text.trim()) {
                // Empty JSON file → show "no data"
                if (grid) grid.style.display = "none";
                albumTitle.innerHTML = noDataMessage;
                document.title = "NaN No Data";
                return null;
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid JSON");
            }

            if (!data || getImageFilenames(data).length === 0) {
                // JSON parsed but no content
                if (grid) grid.style.display = "none";
                albumTitle.innerHTML = noDataMessage;
                document.title = "NaN No Data";
                return null;
            }

            return data;
        })
        .then((data) => {
            if (!data) return; // already handled empty cases

            const metadata = getAlbumMetadata(data);
            if (!metadata.kawarp?.enabled) {
                disableKawarp();
            }
            const displayTitle = metadata.title || decodeURIComponent(album);
            const albumDate = document.getElementById("album-date");

            albumTitle.textContent = displayTitle;
            document.title = displayTitle;

            if (albumDate && metadata.date) {
                albumDate.textContent = metadata.date;
                albumDate.hidden = false;
            }

            applyAlbumMetadata(metadata, albumTitle);
            const albumKawarpConfig = metadata.kawarp;
            const switchColorOnHover = shouldSwitchAlbumColorOnHover(metadata);
            if (switchColorOnHover) {
                resetGradientBackground();
            }

            const albumTintNeedsImageColor = !switchColorOnHover && !metadata.color && ["gradient", "double-gradient"].includes(metadata["tint-bg"]);
            let albumTintApplied = !albumTintNeedsImageColor;
            let albumKawarpApplied = false;

            let count = 0;

            for (const filename of getImageFilenames(data)) {
                const meta = data[filename];

                const container = document.createElement("div");
                container.classList.add("album-item");

                const img = document.createElement("img");
                img.src = `/${album}/thumbs/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");
                img.setAttribute("img-data-url", `/${album}/${filename}`);
                if (from === "view") img.setAttribute("img-data-onclick", `/image/?album=${album}&img=${filename}&from=view`);
                else img.setAttribute("img-data-onclick", `/image/?album=${album}&img=${filename}&searched=${searched}`);

                img.setAttribute("img-title", meta.title || filename);
                img.setAttribute("img-date", meta.date);
                img.setAttribute("img-caption", meta.caption);
                img.setAttribute("img-lore", meta.lore);
                img.setAttribute("img-song", meta["s-title"]);
                img.setAttribute("img-song-artist", meta["s-artist"]);

                img.style.userSelect = "none";

                img.onclick = () => {
                    if (from === "view") window.location.href = `/image/?album=${album}&img=${filename}&from=view`;
                    else window.location.href = `/image/?album=${album}&img=${filename}&searched=${searched}`;
                };

                img.addEventListener("load", () => {
                    const colorThief = new ColorThief();
                    if (img.complete) {
                        if (albumKawarpConfig?.enabled && !albumKawarpApplied) {
                            albumKawarpApplied = true;
                            enableKawarp(albumKawarpConfig, img.src);
                        }

                        if (img.hasAttribute("col") && !albumTintNeedsImageColor && !switchColorOnHover) return;

                        const color = colorThief.getColor(img);
                        img.dataset.colorThief = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

                        if (albumTintNeedsImageColor && !albumTintApplied) {
                            const hsl = rgbToHsl(color[0], color[1], color[2]);
                            hsl[1] = Math.min(1, hsl[1] * 1.2);
                            hsl[2] = Math.max(0.65, hsl[2]);
                            const albumColor = hslToRgb(hsl[0], hsl[1], hsl[2]);

                            if (metadata["tint-bg"] === "double-gradient") {
                                applyGradientBackground(albumColor, color, true);
                            } else {
                                applyGradientBackground(albumColor);
                            }

                            albumTintApplied = true;
                        }

                        if (img.hasAttribute("col")) return;

                        const hsl = rgbToHsl(color[0], color[1], color[2]);

                        hsl[1] = Math.min(1, hsl[1] * 1.2);
                        hsl[2] = Math.max(0.65, hsl[2]);

                        const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                        const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;
                        img.setAttribute("col", rgb);
                    }
                });

                if (img.complete && img.naturalWidth > 0) {
                    img.dispatchEvent(new Event("load"));
                }

                if (meta.color && meta.color != "") {
                    img.setAttribute("col", meta.color);
                }

                if (switchColorOnHover) {
                    img.addEventListener("mouseenter", () => {
                        const imageColor = img.getAttribute("col");
                        if (!imageColor) return;

                        const imageRgb = parseRgbString(imageColor);
                        if (metadata["tint-bg"] === "double-gradient") {
                            const extractedRgb = parseRgbString(img.dataset.colorThief || imageColor);
                            const secondColor = meta.color ? parseRgbString(meta.color) : extractedRgb;
                            const firstColor = toneDownColor(extractedRgb);
                            applyGradientBackground(firstColor, secondColor, true);
                        } else {
                            applyGradientBackground(imageRgb);
                        }
                    });

                    img.addEventListener("mouseleave", resetGradientBackground);
                }

                const label = document.createElement("div");
                label.classList.add("album-label");
                setImageLabel(label, meta, filename);

                container.appendChild(img);
                container.appendChild(label);

                grid.appendChild(container);
                count++;
            }

            setupContextMenus();

            setupTooltipHover();
            setupAlbumLabelScrolling();

            if (searchTerm && searchTerm != "undefined" && searchTerm != "null") {
                searchBox.value = searchTerm;
                searched = searchTerm;
                search({ target: searchBox });
                removeQueryParam("searched");
            }

            if (count > 18) {
                searchBox.style.display = "inline-block";
            } else {
                searchBox.remove();
                document.getElementById("s-break").remove();
                document.getElementById("s-break2").remove();
            }

            if (count > 21) {
                document.getElementById("back-btn overflow-back").style.display = "inline-block";
                const breaks = document.getElementsByClassName("overflow-break");

                for (const br of breaks) {
                    br.style.display = "block";
                }
                document.getElementById("back-btn").remove();
            } else {
                document.getElementById("back-btn overflow-back").remove();
                const breaks = document.getElementsByClassName("overflow-break");

                for (const br of breaks) {
                    br.style.display = "none";
                }
            }

            if (DEVICE == "Android" || DEVICE == "iOS" || DEVICE == "Mobile") {
                removeOverCount(count, 4);
            } else {
                removeOverCount(count, 8);
            }
        })
        .catch((err) => {
            console.error(`Failed to load ${album}/info.json`, err);
            // If data is empty or has no keys, treat as not found
            // Hide grid and show error in title
            if (grid) grid.style.display = "none";
            document.getElementById("back-btn overflow-back").remove();
            albumTitle.innerHTML = notFoundMessage;
            document.title = "404 Not Found";
        });
}

function removeOverCount(count, amount) {
    if (count > amount) {
        const centerWrapper = document.querySelector(".center");
        if (centerWrapper) {
            const spacer = document.createElement("div");
            spacer.style.minHeight = "30px";
            document.body.insertBefore(spacer, document.body.firstChild);

            while (centerWrapper.firstChild) {
                document.body.insertBefore(centerWrapper.firstChild, centerWrapper);
            }

            centerWrapper.remove();
        }
    }
}

const searchBox = document.getElementById("search-box");
if (searchBox) searchBox.addEventListener("input", search);

// Listen for Enter key
if (searchBox)
    searchBox.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault(); // stop form submission if inside a form
            enterFirst();
        }
    });

var searched;

function search(ev) {
    console.trace(ev);
    const query = ev.target.value.toLowerCase().trim();
    const photos = document.getElementsByClassName("album-image");

    // Detect prefix
    let mode = "title"; // default
    let term = query;

    if (query.startsWith("s-")) {
        mode = "song";
        term = query.slice(2);
    } else if (query.startsWith("a-")) {
        mode = "artist";
        term = query.slice(2);
    } else if (query.startsWith("d-")) {
        mode = "date";
        term = query.slice(2);
    }

    searched = query;

    for (const photo of photos) {
        const title = photo.getAttribute("img-title")?.toLowerCase() || "";
        const song = photo.getAttribute("img-song")?.toLowerCase() || "";
        const artist = photo.getAttribute("img-song-artist")?.toLowerCase() || "";
        const date = photo.getAttribute("img-date")?.toLowerCase() || "";

        let match = false;

        if (mode === "title" && title.includes(term)) match = true;
        if (mode === "song" && song.includes(term)) match = true;
        if (mode === "artist" && artist.includes(term)) match = true;
        if (mode === "date" && date.includes(term)) match = true;

        const container = photo.parentElement;
        container.style.display = match || term === "" ? "flex" : "none";
    }
}

function enterFirst() {
    const photos = document.getElementsByClassName("album-image");

    for (const photo of photos) {
        const container = photo.parentElement;
        if (container.style.display !== "none") {
            photo.click();
            break;
        }
    }
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
            img.style.borderColor = img.getAttribute("col");

            if (currentFullUrl != undefined) return;
            const lines = [];

            if (title != "undefined" || "") lines.push(`${title}`);
            if (caption != "undefined" || "") lines.push(`<br>${parseCaption(caption)}`);
            if (date != "undefined" || "") lines.push(`<br>${date}`);
            if (song != "undefined" || "") lines.push(`<br><i style="color: rgba(158, 158, 158, 1)">${song}</i>`);
            if (song_a != "undefined" || "") lines.push(`<br><i style="color: rgba(158, 158, 158, 1)">${song_a}</i>`);

            tooltip.innerHTML = lines.join("");
            tooltip.style.opacity = "1";
            tooltip.style.borderColor = img.getAttribute("col");
        });

        document.addEventListener("mousemove", (e) => {
            if (currentFullUrl != undefined) return;
            const offset = 8;
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

            tooltip.style.top = `${e.clientY + offset + 10}px`;
        });

        img.addEventListener("mouseleave", () => {
            tooltip.style.opacity = "0";
            tooltip.style.borderColor = "grey";
            img.style.borderColor = "rgba(255, 255, 255, 0.1)";
        });

        img.addEventListener("contextmenu", (e) => {
            tooltip.style.opacity = "0";
            tooltip.style.borderColor = "grey";
        });
    });
}

function truncateWithExpand(element, text, maxWords = 15) {
    // Split into words
    const words = text.trim().split(/\s+/);

    // If text is short, show it as-is
    if (words.length <= maxWords) {
        element.innerHTML = text;
        return;
    } // Animate only left/top

    // Build truncated version
    const shortText = words.slice(0, maxWords).join(" ") + " ";
    element.innerHTML = `${shortText}<span class="expand-ellipsis" style="color:#00bfff; cursor:pointer;">...</span>`;

    // Add click event for expansion
    const ellipsis = element.querySelector(".expand-ellipsis");
    ellipsis.onclick = () => {
        element.innerHTML = text;
        menu.style.transition = "opacity 0.2s ease, transform 0.2s ease, top 0.2s ease";
        // Re-check menu height and reposition
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        const off = 8;
        const space = 24;

        const rect = menu.getBoundingClientRect();
        let left = rect.left;
        let top = rect.top;

        if (left + menuWidth > window.innerWidth - space) {
            left = window.innerWidth - menuWidth - off;
        }

        if (top + menuHeight > window.innerHeight - space) {
            top = window.innerHeight - menuHeight - off;
        }

        // Apply new position
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        setTimeout(() => {
            menu.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        }, 200);
    };
}

const viewMetaBtn = document.getElementById("viewMeta");
const metaEl = document.getElementById("menu-img-meta");

function hideMetaLabels() {
    document.getElementById("meta-sep").style.display = "none";
    metaEl.style.display = "none";
    viewMetaBtn.innerText = "View Metadata";
    viewMetaBtn.style.display = "block";
    document.getElementById("openFull").innerHTML = "Open full image<br>in new tab";
    menu.style.width = "152px";
    document.querySelectorAll(".custom-menu p").forEach((el) => {
        el.classList.remove("large");
    });
    document.querySelectorAll(".sep").forEach((el) => {
        el.textContent = "-------------------------";
    });
}

if (viewMetaBtn) {
    viewMetaBtn.addEventListener("click", async () => {
        if (!currentFullUrl) return;

        // Fetch metadata
        viewMetaBtn.innerText = "Loading metadata...";

        const metadata = await getImageMetadata(currentFullUrl);

        metaEl.style.display = "block";

        document.getElementById("meta-sep").style.display = "block";

        document.getElementById("openFull").innerHTML = "Open full image in new tab";

        viewMetaBtn.style.display = "none";
        menu.style.width = "300px";
        document.querySelectorAll(".custom-menu p").forEach((el) => {
            el.classList.add("large");
        });

        document.querySelectorAll(".sep").forEach((el) => {
            el.textContent = "----------------------------------------------------";
        });

        if (Object.keys(metadata).length === 0) {
            metaEl.innerText = "No Metadata";
        } else {
            const lines = Object.entries(metadata)
                .map(([key, val]) => `${key}: ${val}`)
                .join("\n");
            metaEl.innerText = lines;
        }

        // Ensure menu fits on screen (bottom + right edges)
        const menuRect = menu.getBoundingClientRect();
        const off = 8;
        const loff = 20;
        const space = 24;

        let top = menuRect.top;
        let left = menuRect.left;
        const menuHeight = menu.offsetHeight;
        const menuWidth = menu.offsetWidth;

        // Check bottom edge
        if (top + menuHeight > window.innerHeight - space) {
            top = window.innerHeight - menuHeight - off;
        }

        // Check right edge
        if (left + menuWidth > window.innerWidth - space) {
            left = window.innerWidth - menuWidth - loff;
        }

        // Apply transition before moving
        menu.style.transition = "opacity 0.2s ease, top 0.2s ease, left 0.2s ease";

        requestAnimationFrame(() => {
            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
        });

        // Reset transition after animation
        setTimeout(() => {
            menu.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        }, 200);
    });
}

async function getImageMetadata(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const exif = await exifr.parse(blob);

        if (!exif) return {};

        // Pick only meaningful fields
        const important = {
            "Camera Maker": exif.Make,
            "Camera Model": exif.Model,
            "Date Taken": exif.DateTimeOriginal || exif.CreateDate,
            Exposure: exif.ExposureTime ? `${exif.ExposureTime}s` : undefined,
            Aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
            ISO: exif.ISO,
            "Focal Length": exif.FocalLengthIn35mmFormat ? `${exif.FocalLengthIn35mmFormat}mm` : exif.FocalLength ? `${exif.FocalLength}mm` : undefined,
            "Exposure Compensation": exif.ExposureCompensation,
            "White Balance": exif.WhiteBalance === 1 ? "Manual" : "Auto",
            Brightness: exif.BrightnessValue
        };

        console.log(exif);

        // Remove empty values
        for (const key in important) {
            if (important[key] === undefined || important[key] === null) delete important[key];
        }

        return important;
    } catch (err) {
        console.error("Error reading metadata:", err);
        return {};
    }
}

var currentFullUrl = undefined;
var currentImagePageUrl = undefined;
var currentAlbum = undefined;

let currentTempImg = null; // reference to the loaded image

function showImageContextMenu(e, img) {
    e.preventDefault(); // stop native menu
    if (currentTempImg) {
        currentTempImg.src = "";
        currentTempImg = null;
    }

    const fullUrl = img.getAttribute("img-data-url");
    const imageUrl = img.getAttribute("img-data-onclick");
    const col = img.getAttribute("col");

    const updateMenuContent = () => {
        currentFullUrl = fullUrl;

        currentImagePageUrl = imageUrl;
        currentAlbum = img.dataset.album;

        quickDown.setAttribute("href", currentFullUrl);

        const tempImg = new Image();
        currentTempImg = tempImg;
        tempImg.src = fullUrl;

        tempImg.onload = () => {
            if (menu.style.display === "block" && menu.classList.contains("show")) {
                document.getElementById("menu-img-dim").innerText = `${tempImg.naturalWidth}x${tempImg.naturalHeight}`;
            }
        };

        tempImg.onerror = () => {
            if (menu.style.display === "block" && menu.classList.contains("show")) {
                document.getElementById("menu-img-dim").innerText = "Unknown size";
            }
        };

        const title = img.getAttribute("img-title") || "";
        document.getElementById("menu-img-title").innerText = title.startsWith('"') ? title : `"${title}"`;

        document.getElementById("menu-img-file").innerText = img.alt;
        document.getElementById("menu-img-date").innerText = img.getAttribute("img-date");

        const captionEl = document.getElementById("menu-img-caption");
        const loreEl = document.getElementById("menu-img-lore");
        const captionText = img.getAttribute("img-caption");
        const loreText = img.getAttribute("img-lore");

        if (!captionText || captionText === "undefined") {
            captionEl.style.display = "none";
        } else {
            captionEl.style.display = "block";
            truncateWithExpand(captionEl, parseCaption(captionText));
        }

        if (!loreText || loreText === "undefined") {
            loreEl.style.display = "none";
        } else {
            loreEl.style.display = "block";
            truncateWithExpand(loreEl, parseCaption(loreText));
        }

        const songEl = document.getElementById("menu-img-song");
        const artistEl = document.getElementById("menu-img-artist");
        const sSep = document.getElementById("song-sep");

        const song = img.getAttribute("img-song");
        const artist = img.getAttribute("img-song-artist");

        if (!song || song === "undefined" || song.trim() === "") {
            songEl.style.display = "none";
            sSep.style.display = "none";
            artistEl.style.display = "none";
        } else {
            songEl.style.display = "block";
            songEl.innerHTML = `<i>"${song}"</i>`;
            artistEl.style.display = "block";
            artistEl.innerText = artist;
            sSep.style.display = "block";
        }
    };

    const showMenu = () => {
        updateMenuContent();
        menu.style.display = "block"; // needed to measure
        menu.style.transition = "opacity 0.2s ease, transform 0.2s ease;";
        menu.style.transformOrigin = "top left";

        // Measure menu after content
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;

        const off = 8;
        const space = 24;

        let left = e.clientX - off;
        let top = e.clientY - off;

        // Check right space
        if (left + menuWidth > window.innerWidth - space) {
            left = e.clientX - off - menuWidth; // position left of cursor
            menu.style.transformOrigin = "top right";
        }

        // Check bottom space
        if (top + menuHeight > window.innerHeight - space) {
            top = window.innerHeight - menuHeight - off; // offset above bottom
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.border = `1.5px ${col} solid`;

        const btns = document.getElementsByClassName("menu-btn");
        for (const btn of btns) {
            btn.style.borderColor = col;
        }

        requestAnimationFrame(() => {
            menu.classList.add("show"); // fade/scale in
        });
    };

    if (menu.style.display === "block" && menu.classList.contains("show")) {
        menu.classList.remove("show");
        setTimeout(() => {
            menu.style.display = "none";
            hideMetaLabels();
            setTimeout(showMenu, 20); // allow display:block to register
        }, 70);
    } else {
        showMenu();
    }
}

function setupContextMenus() {
    document.querySelectorAll(".album-image").forEach((img) => {
        img.addEventListener("contextmenu", (event) => showImageContextMenu(event, img));
    });
}

if (openBtn) {
    openBtn.onclick = () => {
        window.open(currentFullUrl, "_blank");
        hideMenu();
    };
}

if (openTabBtn) {
    openTabBtn.onclick = () => {
        window.open(currentImagePageUrl, "_blank");
        hideMenu();
    };
}

if (goToImgBtn) {
    goToImgBtn.onclick = () => {
        if (currentImagePageUrl) window.location.href = currentImagePageUrl;
    };
}

document.addEventListener("click", (e) => {
    if (!menu) return;
    const clickedInsideMenu = menu.contains(e.target);
    const clickedEllipsis = e.target.classList.contains("expand-ellipsis");

    // Only hide if it's outside both the menu and the ellipsis
    if (!clickedInsideMenu && !clickedEllipsis) {
        hideMenu();
    }
});

function hideMenu() {
    menu.style.transition = "opacity 0.2s ease, transform 0.2s ease-out;";

    menu.style.transformOrigin = "center";
    menu.classList.remove("show");
    setTimeout(() => {
        menu.style.display = "none";
        hideMetaLabels();
    }, 200); // match transition time

    currentFullUrl = undefined;

    // Clean up temp image reference
    if (currentTempImg) {
        currentTempImg.src = ""; // stops any loading
        currentTempImg = null;
    }
}

function brightenBorderColor(color) {
    const hsl = rgbToHsl(color[0], color[1], color[2]);
    hsl[1] = Math.min(1, hsl[1] * 1.2);
    hsl[2] = Math.max(0.65, hsl[2]);
    return hslToRgb(hsl[0], hsl[1], hsl[2]);
}

function setAnimatedImageBorder(image, primaryColor, secondaryColor) {
    const secondaryRgb = brightenBorderColor(secondaryColor);
    const secondary = `rgb(${secondaryRgb[0] * 0.15}, ${secondaryRgb[1] * 0.15}, ${secondaryRgb[2] * 0.15})`;
    const border = image.closest(".image-border");

    if (!border) return;

    border.style.setProperty("--border-color-1", primaryColor);
    border.style.setProperty("--border-color-2", secondary);
    border.classList.add("animated-gradient-border");
    border.addEventListener(
        "animationend",
        (event) => {
            if (event.animationName === "border-spin-intro") {
                border.classList.add("slow-border-spin");
            }
        },
        { once: true }
    );
}

function loadAlbumImage() {
    const { album, img, from } = getQueryParams();
    if (!album || !img) return;

    removeQueryParam("searched");

    console.log("Loading image:", img, "from album:", album);
    console.log("From", from);

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

    let color_els = true;
    let color_a = false;
    let extracted_rgb, extracted_arr;

    let fetched_info;

    const notFoundMessage = `<span style="color: red; font-family: Helvetica;">Error (404 Not Found)</span><br>Image "${img}" was not found in album "${album}".<br><span style="font-size: 20px; font-family: Helvetica; font-weight: 400; color: gray;">${window.location}</span>`;

    const noDataMessage = `<span style="color: red; font-family: Helvetica;">Error (NaN No Data)</span><br>Image "${img}" was searched in album "${album}" but no data recieved.<br><span style="font-size: 20px; font-family: Helvetica; font-weight: 400; color: gray;">${window.location}</span>`;

    fetch(`/${album}/info.json`)
        .then((res) => {
            if (!res.ok) throw new Error("info.json not found");
            return res.text();
        })
        .then((text) => {
            if (!text.trim()) {
                // Empty file
                document.title = "NaN No Data";
                showErrorMessage(noDataMessage);
                throw new Error("Empty info.json");
            }
            let d;
            try {
                d = JSON.parse(text);
            } catch (e) {
                document.title = "404 Not Found";
                showErrorMessage(notFoundMessage);
                throw new Error("Invalid JSON in info.json");
            }
            let imageFilename = img;
            let imageInfo = d[img];

            if (!imageInfo) {
                for (const [filename, info] of Object.entries(d)) {
                    if (filename === "_album") continue;

                    if ((info.title || "") === img) {
                        imageFilename = filename;
                        imageInfo = info;
                        break;
                    }
                }
            }

            if (!imageInfo) {
                document.title = "404 Not Found";
                showErrorMessage(notFoundMessage);
                throw new Error("Image not found in info.json");
            }

            return {
                filename: imageFilename,
                info: imageInfo
            };
        })
        .then((result) => {
            fetched_info = result.info || {};

            const info = fetched_info;
            console.log("Fetched info for image:", fetched_info);
            const kawarpConfig = info.kawarp;
            if (!kawarpConfig?.enabled) {
                disableKawarp();
            }

            const otherAlbumBtn = document.getElementById("other-album-btn");

            const hasOtherAlbum = Boolean(info.album && info.album !== album);

            if (hasOtherAlbum) {
                otherAlbumBtn.style.display = "inline-block";
                otherAlbumBtn.textContent = `Go to Album "${info.album}"`;
                otherAlbumBtn.href = `/album/?album=${encodeURIComponent(info.album)}`;
            } else {
                otherAlbumBtn.style.display = "none";
            }

            document.getElementById("image-title").innerText = info.title || "";
            const authorEl = document.getElementById("image-author");
            if (authorEl && info.author) {
                authorEl.textContent = `${info.author}'s`;
                authorEl.hidden = false;
            }

            const copyrightEl = document.getElementById("image-copyright");
            const photoYear = getPhotoYear(info.date);
            if (copyrightEl && info.author && photoYear) {
                copyrightEl.textContent = `© ${photoYear} ${info.author}. All Rights Reserved.`;
            }
            const captionEl = document.getElementById("image-caption");
            captionEl.innerHTML = parseCaption(info.caption || "");

            document.getElementById("image-lore").innerHTML = parseCaption(info.lore || "");
            document.getElementById("image-date").innerText = info.date || "";

            const borderPrimaryColor = info.color || null;

            if (info.color) {
                console.log("Setting fixed color from info.color:", info.color);
                document.getElementById("image-title").style.color = info.color;

                if (info.color_hyper) {
                    color_as(captionEl.querySelectorAll("a"), info.color);
                }

                imageEl.style.borderColor = info.color;

                color_els = false;

                setLowColor(imageEl, parseRgbString(info.color));
            } else if (info.color_hyper && !info.color) {
                color_els = true;
                color_a = true;
                color_as(document.getElementById("image-caption").querySelectorAll("a"), extracted_rgb);
            }

            if (info["tint-bg"] === "gradient") {
                console.log("tint-bg is gradient");
                if (info.color) {
                    const rgb = parseRgbString(info.color);
                    console.log("Applying gradient background with fixed color:", rgb);
                    applyGradientBackground(rgb);
                    color_els = false; // disable extraction since color exists
                } else {
                    console.log("No fixed color waiting for img load to put grad");
                    color_els = true;
                }
            } else if (info["tint-bg"] === "double-gradient") {
                console.log("tint-bg is double gradient");
                if (info.color && info.color2) {
                    const rgb = parseRgbString(info.color);
                    const rgb2 = parseRgbString(info.color2);
                    console.log("gradient background with 2 fixed colors:", rgb, " ", rgb2);
                    applyGradientBackground(rgb, rgb2, true);
                    color_els = false; // disable extraction since color exists
                } else if (info.color && !info.color2) {
                    const rgb = parseRgbString(info.color);
                    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

                    hsl[1] = Math.min(1, hsl[1] * 0.3);
                    hsl[2] = Math.max(0, hsl[2]);

                    const darkRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                    console.log("gradient background with fixed color and dark color:", rgb, " ", darkRgb);
                    applyGradientBackground(rgb, darkRgb, true);
                    color_els = false; // disable extraction since color exists
                } else {
                    console.log("No fixed color will wait for img load to get color and set gradient");
                    color_els = true;
                }
            } else if (info["site-bg"]) {
                console.log("site background color:", info["site-bg"]);
                document.documentElement.style.backgroundColor = info["site-bg"];
                document.body.style.backgroundColor = info["site-bg"];
            } else {
                console.log("Clearing background colors");
                document.documentElement.style.background = "";
                document.body.style.background = "";
            }

            if (info["site-bg"]) {
                document.documentElement.style.backgroundColor = info["site-bg"];
                document.body.style.backgroundColor = info["site-bg"];
            }

            document.title = info.title;

            // Add Spotify embed if song exists
            const iframe = document.querySelector('iframe[data-testid="embed-iframe"]');
            const hasSpotifyEmbed = Boolean(info.song && info.song.includes("open.spotify.com/embed/"));

            if (hasSpotifyEmbed) {
                console.log("Showing embed with src:", info.song);
                iframe.src = info.song;
                iframe.style.display = "block";
                iframe.parentElement.style.display = "block";
            } else {
                iframe.parentElement.style.display = "none";
            }

            const backButton = document.getElementById("back-btn");
            const homeButton = document.getElementById("home-btn");
            const browseBackButton = document.getElementById("back-browse-btn");
            const hasBrowseBack = browseBackButton && browseBackButton.style.display !== "none";

            if (hasSpotifyEmbed) {
                homeButton.style.borderRadius = "16px";

                if (hasOtherAlbum) {
                    otherAlbumBtn.style.borderRadius = "4px 4px 16px 4px";
                    backButton.style.borderRadius = "4px 4px 4px 16px";
                    if (hasBrowseBack) browseBackButton.style.borderRadius = "16px";
                } else if (hasBrowseBack) {
                    backButton.style.borderRadius = "4px 4px 4px 16px";
                    browseBackButton.style.borderRadius = "4px 4px 16px 4px";
                } else {
                    backButton.style.borderRadius = "4px 4px 16px 16px";
                }
            } else if (hasOtherAlbum && hasBrowseBack) {
                backButton.style.borderRadius = "4px";
                otherAlbumBtn.style.borderRadius = "4px";
                browseBackButton.style.borderRadius = "4px 4px 4px 16px";
                homeButton.style.borderRadius = "4px 4px 16px 4px";
            } else if (hasOtherAlbum) {
                homeButton.style.borderRadius = "4px 4px 16px 16px";
                backButton.style.borderRadius = "4px"; // 4px 4px 16px";
                otherAlbumBtn.style.borderRadius = "4px"; // 4px 16px 4px";
            } else if (hasBrowseBack) {
                homeButton.style.borderRadius = "16px";
                backButton.style.borderRadius = "4px 4px 4px 16px";
                browseBackButton.style.borderRadius = "4px 16px 4px 4px";
            } else {
                backButton.style.borderRadius = "4px 4px 4px 16px";
                homeButton.style.borderRadius = "4px 4px 16px 4px";
            }

            // Add image load event listener here (inside fetch block)
            imageEl.addEventListener("load", () => {
                console.log("Img loaded");

                if (kawarpConfig?.enabled) {
                    enableKawarp(kawarpConfig, imageEl.src);
                }

                if (info.bg) {
                    console.log("Bg info:", info.bg);

                    // Split into path/keyword and brightness
                    const [bgValue, brightnessStr] = info.bg.split("|").map((v) => v.trim());
                    const brightness = parseFloat(brightnessStr) || 0.5; // default to 0.5 if missing or invalid

                    let bgUrl = "";

                    if (bgValue === "self") {
                        console.log("Bg info is self");
                        bgUrl = imgPath;
                    } else {
                        console.log("Bg info is custom img:", bgValue);
                        bgUrl = bgValue;
                    }

                    // Remove previous video background (if any)
                    const oldVid = document.getElementById("bg-video");
                    if (oldVid) oldVid.remove();

                    const oldOverlay = document.getElementById("bg-overlay");
                    if (oldOverlay) oldOverlay.remove();

                    // Reset background styles
                    document.body.style.backgroundImage = "none";
                    document.body.style.backgroundColor = "transparent";
                    document.documentElement.style.background = "transparent";
                    document.body.style.position = "relative";
                    document.body.style.overflow = "hidden"; // prevents scrollbars

                    // If it's a video
                    if (bgUrl.toLowerCase().endsWith(".mp4")) {
                        console.log("Background is a video:", bgUrl);

                        // Create video element
                        const video = document.createElement("video");
                        video.id = "bg-video";
                        video.src = bgUrl;
                        video.autoplay = true;
                        video.loop = true;
                        video.muted = true;
                        video.playsInline = true; // prevents fullscreen on mobile
                        video.style.position = "fixed";
                        video.style.top = "0";
                        video.style.left = "0";
                        video.style.width = "100%";
                        video.style.height = "100%";
                        video.style.objectFit = "cover";
                        video.style.zIndex = "-2"; // behind overlay
                        video.style.opacity = "0";
                        video.style.transition = "opacity 0.5s ease";

                        video.addEventListener("loadeddata", () => {
                            video.style.opacity = "1"; // fade in
                            console.log("Video loaded and visible");
                        });

                        // Create dark overlay
                        const overlay = document.createElement("div");
                        overlay.id = "bg-overlay";
                        overlay.style.position = "fixed";
                        overlay.style.top = "0";
                        overlay.style.left = "0";
                        overlay.style.width = "100%";
                        overlay.style.height = "100%";
                        overlay.style.background = `rgba(0, 0, 0, ${brightness})`;
                        overlay.style.zIndex = "-1";

                        // Add both elements to the DOM
                        document.body.prepend(video);
                        document.body.appendChild(overlay);

                        console.log(`Video background set with overlay brightness ${brightness}`);
                    } else {
                        document.body.style.backgroundImage = `
                            linear-gradient(rgba(0, 0, 0, ${brightness}), rgba(0, 0, 0, ${brightness})),
                            url("${bgUrl}")
                        `;
                        document.body.style.backgroundSize = "cover";
                        document.body.style.backgroundPosition = "center";
                        document.body.style.backgroundRepeat = "no-repeat";

                        console.log(`Image background set to ${bgUrl} with overlay brightness ${brightness}`);
                    }
                }

                if (!color_els) {
                    console.log("Color extraction skip fixed color");
                    return;
                }

                const colorThief = new ColorThief();
                const palette = colorThief.getPalette(imageEl, 3) || [];

                if (imageEl.complete) {
                    if (!color_els) {
                        setAnimatedImageBorder(imageEl, borderPrimaryColor, palette[0] || parseRgbString(borderPrimaryColor));
                        return;
                    }

                    const color = colorThief.getColor(imageEl);
                    console.log("Got color from img:", color);

                    const hsl = rgbToHsl(color[0], color[1], color[2]);

                    hsl[1] = Math.min(1, hsl[1] * 1.2);
                    hsl[2] = Math.max(0.65, hsl[2]);

                    const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                    const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;

                    extracted_rgb = rgb;
                    extracted_arr = brightRgb;

                    console.log("Setting extracted color:", rgb);

                    document.getElementById("image-title").style.color = rgb;
                    imageEl.style.borderColor = rgb;

                    const secondaryColor =
                        palette.find((paletteColor) => paletteColor[0] !== color[0] || paletteColor[1] !== color[1] || paletteColor[2] !== color[2]) || color;
                    setAnimatedImageBorder(imageEl, rgb, secondaryColor);

                    setLowColor(imageEl, extracted_arr);

                    if (fetched_info?.["tint-bg"] === "gradient" && !fetched_info.color) {
                        console.log("Setting grad background with extracted color:", extracted_arr);
                        applyGradientBackground(extracted_arr);
                    } else if (fetched_info?.["tint-bg"] === "double-gradient" && !fetched_info.color) {
                        console.log("Settomg double grad background with extracted color:", extracted_arr);
                        applyGradientBackground(extracted_arr, color, true);
                    }

                    if (fetched_info?.color_hyper) {
                        console.log("Coloring hyperlinks with extracted color:", rgb);
                        color_as(document.querySelectorAll("#image-caption a"), rgb);
                    }
                } else {
                    console.log("Img not loaded cant get col");
                }
            });

            // Handle case if image already loaded before listener was added
            if (imageEl.complete) {
                imageEl.dispatchEvent(new Event("load"));
            }
        })
        .catch((err) => {
            console.warn("Error loading album or image:", err);
            showErrorMessage(notFoundMessage);
            imageEl.src = "/Explosion of Colours/thumbs/GYAAAT.jpg";
            document.getElementById("back-btn").style.borderRadius = "4px 4px 4px 16px";
            document.getElementById("home-btn").style.borderRadius = "4px 4px 16px 4px";
        });

    // Also catch the case if image file itself fails to load
    imageEl.addEventListener("error", () => {
        console.warn("Image file not found:", imageEl.src);
        imageEl.src = "/Explosion of Colours/thumbs/GYAAAT.jpg";
        showErrorMessage(notFoundMessage);
    });

    function showErrorMessage(msg) {
        console.log("an error");
        const titleEl = document.getElementById("image-title");
        const captionEl = document.getElementById("image-caption");
        const loreEl = document.getElementById("image-lore");
        const dateEl = document.getElementById("image-date");
        titleEl.innerHTML = msg;
        if (captionEl) {
            captionEl.remove();
            loreEl.remove();
            dateEl.remove();
        }
    }

    if (window.location.pathname !== "/image/") return;
}

function onLoadedSpotifyEmbed() {
    console.log("Loaded iframe");

    const iframe = document.querySelector('iframe[data-testid="embed-iframe"]');

    let cover = iframe.getElementsByClassName("CoverArtBase_coverArt__ne0XI CoverArtTrackList_coverArtTrackList__1YwHX");

    cover.backgroundImage = 'url("https://guayabr.com/The%20Next%20Chapter/A%20Thousand%20Suns.jpg")';
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

function applyGradientBackground(rgbArr, secondRgbArr, twoway) {
    const hsl = rgbToHsl(rgbArr[0], rgbArr[1], rgbArr[2]);
    const darkHsl = [hsl[0], hsl[1], Math.max(0, hsl[2] * 0.16)];
    const darkRgb = hslToRgb(darkHsl[0], darkHsl[1], darkHsl[2]);

    if (secondRgbArr && twoway) {
        const hsl2 = rgbToHsl(secondRgbArr[0], secondRgbArr[1], secondRgbArr[2]);
        const darkHsl2 = [hsl2[0], hsl2[1], Math.max(0, hsl2[2] * 0.16)];
        const darkRgb2 = hslToRgb(darkHsl2[0], darkHsl2[1], darkHsl2[2]);

        setPageBackgroundColors(darkRgb2, darkRgb);
    } else {
        console.log("set gradient", rgbArr);

        setPageBackgroundColors([0, 0, 0], darkRgb);
    }
}

if (goToAlbumBtn) {
    goToAlbumBtn.onclick = () => {
        if (currentAlbum) album_selected(currentAlbum);
    };
}

function resetGradientBackground() {
    setPageBackgroundColors([12, 12, 12], [12, 12, 12]);
}

function setPageBackgroundColors(startRgb, endRgb) {
    const startColor = `rgb(${startRgb[0]}, ${startRgb[1]}, ${startRgb[2]})`;
    const endColor = `rgb(${endRgb[0]}, ${endRgb[1]}, ${endRgb[2]})`;

    for (const element of [document.documentElement, document.body]) {
        element.style.setProperty("--page-background-start", startColor);
        element.style.setProperty("--page-background-end", endColor);
    }
}

function toneDownColor(rgbArr) {
    const hsl = rgbToHsl(rgbArr[0], rgbArr[1], rgbArr[2]);
    return hslToRgb(hsl[0], hsl[1], hsl[2] * 0.8);
}

function color_as(links, col) {
    for (const a of links) {
        a.style.color = col;
    }
}

function parseCaption(caption) {
    // Match patterns like ("Link Text")https://example.com
    const linkRegex = /\("([^"]+)"\)(https?:\/\/[^\s]+)/g;

    return caption.replace(linkRegex, (match, text, url) => {
        return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
    });
}

function parseRgbString(rgbStr) {
    const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return [0, 0, 0]; // fallback
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
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
