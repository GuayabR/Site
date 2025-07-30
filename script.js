window.addEventListener("DOMContentLoaded", () => {
    console.log("Loaded");
    const { img } = getQueryParams();

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
                const imagePath = `${encodeURIComponent(album)}/${randomImage}`;

                // Set background image styles
                button.style.backgroundImage = `url(${imagePath})`;
            })
            .catch((err) => {
                console.warn(`Couldn't load info.json for ${album}`, err);
            });
    });
}

function album_selected(album) {
    console.log("Travelling to guayabr.com/album.html?album=", album);
    window.location.href = `album.html?album=${encodeURIComponent(album)}`;
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

    document.title = album;

    const grid = document.querySelector(".photos-grid");
    const albumTitle = document.querySelector("h1");
    albumTitle.textContent = decodeURIComponent(album);

    fetch(`${album}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            for (const filename in data) {
                const img = document.createElement("img");
                img.src = `${album}/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");

                img.onclick = () => {
                    window.location.href = `image.html?album=${encodeURIComponent(album)}&img=${encodeURIComponent(filename)}`;
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

    const imgPath = `${album}/${img}`;
    document.getElementById("album-img").src = imgPath;

    // ⬇️ Set download link dynamically
    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.href = imgPath;
    downloadBtn.download = img; // optional: force filename
    downloadBtn.style.display = "block"; // show it if hidden

    // Optional: fetch info.json
    fetch(`${album}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            const info = data[img] || {};
            document.getElementById("image-title").innerText = info.title || "";
            document.getElementById("image-caption").innerText = info.caption || "";
            document.getElementById("image-lore").innerText = info.lore || "";

            document.title = info.title;
        })
        .catch(() => {
            console.warn("No info.json or failed to load.");
            document.title = img;
        });
}
