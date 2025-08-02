const albums = ["Explosion of Colours", "Chinese New Year", "December 2024"];

const grid = document.getElementById("all-photos-grid");

albums.forEach((album) => {
    fetch(`/${encodeURIComponent(album)}/info.json`)
        .then((res) => res.json())
        .then((data) => {
            for (const filename in data) {
                const img = document.createElement("img");
                img.src = `/${encodeURIComponent(album)}/thumbs/${filename}`;
                img.alt = filename;
                img.classList.add("album-image");
                img.onclick = () => {
                    window.location.href = `/image/?album=${encodeURIComponent(album)}&img=${filename}&from=browse`;
                };
                grid.appendChild(img);
            }
        })
        .catch((err) => {
            console.error(`Failed to load ${album}/info.json`, err);
        });
});
