const albums = [
	"Explosion of Colours", "Chinese New Year", "December 2024",
	"IT'S SO DARK", "IT'S SO COLOURFUL", "Animals", "Cars"
];

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
				img.onclick = () => {
					window.location.href = `/image/?album=${encodeURIComponent(album)}&img=${filename}&from=browse`;
				};
				grid.appendChild(img);
			}
		} catch (err) {
			console.error(`Failed to load ${album}/info.json`, err);
		}
	}

	// Tooltip hover effects after all images are loaded
	setupTooltipHover();
}

loadAlbumsInOrder();
