const albums = [
    "Explosion of Colours",
    "Chinese New Year",
    "December 2024",
    "The Next Chapter",
    "A Different Time",
    "IT'S SO DARK",
    "IT'S SO COLOURFUL",
    "AS^",
    "canon",
    "canon_mine",
    "Blossom",
    "Mihir Blossom",
    "Animals",
    "Cars"
];

const grid = document.getElementById("all-photos-grid");
const seenFilenames = new Set();

async function loadAlbumsInOrder() {
    const { searchTerm } = getQueryParams();

    for (const album of albums) {
        try {
            const res = await fetch(`/${encodeURIComponent(album)}/info.json`);
            const data = await res.json();

            for (const filename in data) {
                const meta = data[filename];

                // Check if image is meant to be shown in a specific album
                if (meta.album && meta.album !== album) continue;

                // Avoid duplicates
                if (seenFilenames.has(filename)) continue;
                seenFilenames.add(filename);

                const container = document.createElement("div");
                container.classList.add("album-item");

                const img = document.createElement("img");
                img.src = `/${encodeURIComponent(album)}/thumbs/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");
                img.setAttribute("img-data-url", `/${encodeURIComponent(album)}/${filename}`);

                img.setAttribute("img-data-onclick", `/image/?album=${encodeURIComponent(album)}&img=${filename}&from=browse&searched=${searched}`);

                img.setAttribute("img-title", meta.title || filename);
                img.setAttribute("img-date", meta.date);
                img.setAttribute("img-caption", meta.caption);
                img.setAttribute("img-lore", meta.lore);
                img.setAttribute("img-song", meta["s-title"]);
                img.setAttribute("img-song-artist", meta["s-artist"]);

                img.style.userSelect = "none";

                if (meta.color) {
                    img.setAttribute("col", meta.color);
                }

                img.onclick = () => {
                    console.log(`/image/?album=${encodeURIComponent(album)}&img=${filename}&from=browse&searched=${searched}`);
                    window.location.href = `/image/?album=${encodeURIComponent(album)}&img=${filename}&from=browse&searched=${searched}`;
                };

                img.addEventListener("load", () => {
                    colorThiefQueue.push({ img });
                    processColorThiefQueue();
                });

                const label = document.createElement("div");
                label.classList.add("album-label");
                label.textContent = meta.title;

                container.appendChild(img);
                container.appendChild(label);

                grid.appendChild(container);

                //console.log("added item", img.src);

                await new Promise((res) => setTimeout(res, 2));
            }

        } catch (err) {
            console.error(`Failed to load ${album}/info.json`, err);
        }
    }

    if (searchBox && searchTerm && searchTerm != "null" && searchTerm != "undefined") {
        searchBox.value = searchTerm;
        searched = searchTerm;
        search({ target: searchBox });
    }

    setupContextMenus();
    // Tooltip hover effects after all images are loaded
    setupTooltipHover();

    // Hide loading screen
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("fade-out");
    setTimeout(() => {
        loadingScreen.remove();
    }, 1000);
}

loadAlbumsInOrder();

const colorThiefQueue = [];
let isProcessingColorThief = false;

function processColorThiefQueue() {
    if (isProcessingColorThief || colorThiefQueue.length === 0) return;
    isProcessingColorThief = true;

    const { img } = colorThiefQueue.shift();

    requestAnimationFrame(() => {
        const colorThief = new ColorThief();
        if (img.complete) {
            const color = colorThief.getColor(img);
            const hsl = rgbToHsl(color[0], color[1], color[2]);

            hsl[1] = Math.min(0.9, hsl[1]);
            hsl[2] = Math.max(0.4, hsl[2]);

            const brightRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
            const rgb = `rgb(${brightRgb[0]}, ${brightRgb[1]}, ${brightRgb[2]})`;
            if (!img.hasAttribute("col")) {
                img.setAttribute("col", rgb);
            }
        }

        isProcessingColorThief = false;

        // Slow down the loop to avoid overloading
        setTimeout(processColorThiefQueue, 5);
    });
}
