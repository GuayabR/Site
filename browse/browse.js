const albums = ["Explosion of Colours", "Chinese New Year", "December 2024", "IT'S SO DARK", "IT'S SO COLOURFUL", "Animals", "Cars", "CANON", "canon_mine"];

const grid = document.getElementById("all-photos-grid");
const seenFilenames = new Set();

async function loadAlbumsInOrder() {
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

                const img = document.createElement("img");
                img.src = `/${encodeURIComponent(album)}/thumbs/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");
                img.setAttribute("img-title", meta.title || filename);
                img.setAttribute("img-date", meta.date);
                img.setAttribute("img-caption", meta.caption);
                img.setAttribute("img-song", meta["s-title"]);
                img.setAttribute("img-song-artist", meta["s-artist"]);

                if (meta.color) {
                    img.setAttribute("col", meta.color);
                }

                img.onclick = () => {
                    window.location.href = `/image/?album=${encodeURIComponent(album)}&img=${filename}&from=browse`;
                };

                img.addEventListener("load", () => {
                    colorThiefQueue.push({ img });
                    processColorThiefQueue();
                });

                grid.appendChild(img);

                //console.log("added item", img.src);

                await new Promise((res) => setTimeout(res, 10));
            }
        } catch (err) {
            console.error(`Failed to load ${album}/info.json`, err);
        }
    }

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
        setTimeout(processColorThiefQueue, 40);
    });
}
