import os
import json
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk
from PIL import Image, ImageOps, ExifTags
import rawpy
import imageio
from datetime import datetime, date
import platform
import re


# Select folder GUI
def select_folder_gui():
    root = tk.Tk()
    root.withdraw()
    return filedialog.askdirectory(title="Select Folder")

# Dropdown menu for action
def ask_action_dropdown():
    def set_choice():
        nonlocal choice
        choice = action_var.get()
        root.destroy()

    choice = None
    root = tk.Tk()
    root.title("Select Action")
    tk.Label(root, text="Choose an action:").pack(pady=10)

    action_var = tk.StringVar(value="compress")
    actions = ["Compress Images", "Resize images", "Create Info.json", "Setup again"]
    dropdown = ttk.Combobox(root, textvariable=action_var, values=actions, state="readonly")
    dropdown.pack(pady=5)

    tk.Button(root, text="OK", command=set_choice).pack(pady=10)
    root.mainloop()
    return choice

# Ask for compression % (1-95)
def ask_compression_level():
    root = tk.Tk()
    root.withdraw()
    while True:
        value = simpledialog.askinteger("Compression", "Enter compression % (1-95):", minvalue=1, maxvalue=95)
        if value:
            return value

# Ask for resize %
def ask_resize_percent():
    root = tk.Tk()
    root.withdraw()
    while True:
        value = simpledialog.askinteger("Resize", "Enter resize % (1-100):", minvalue=1, maxvalue=100)
        if value:
            return value

# Convert CR2 → JPG
def convert_cr2_to_jpg_if_missing(folder):
    for file in os.listdir(folder):
        if file.lower().endswith(".cr2"):
            jpg_name = os.path.splitext(file)[0] + ".jpg"
            jpg_path = os.path.join(folder, jpg_name)
            if not os.path.exists(jpg_path):
                cr2_path = os.path.join(folder, file)
                try:
                    with rawpy.imread(cr2_path) as raw:
                        rgb = raw.postprocess()
                        imageio.imsave(jpg_path, rgb)
                    print(f"Converted {file} → {jpg_name}")
                except Exception as e:
                    print(f"Failed to convert {file}: {e}")

# Strip GPS metadata but keep camera/date
def strip_gps_metadata(img):
    exif_data = img.getexif()
    gps_tag = None
    for tag, value in ExifTags.TAGS.items():
        if value == "GPSInfo":
            gps_tag = tag
            break
    if gps_tag in exif_data:
        del exif_data[gps_tag]
    return exif_data

# Keep camera related metadata and date taken
# Keep camera related metadata and date taken
def keep_camera_date_metadata(img):
    exif_data = img.getexif()

    remove_tags = [
        "GPSInfo",
        "XPComment",
        "UserComment",
        "ImageDescription",
        "Copyright",
        "Artist",
        "Software"
    ]

    remove_tag_ids = []

    for tag_id, value in ExifTags.TAGS.items():
        if value in remove_tags:
            remove_tag_ids.append(tag_id)

    for tag_id in remove_tag_ids:
        if tag_id in exif_data:
            del exif_data[tag_id]

    return exif_data

# Move original to "Original" folder & replace with stripped version
def backup_and_strip_metadata(folder):
	original_dir = os.path.join(folder, "Original")

	# Skip only if Original folder exists AND has files
	if os.path.exists(original_dir) and os.listdir(original_dir):
		print(f"Original folder already exists in {folder} and is not empty, skipping backup.")
		return

	os.makedirs(original_dir, exist_ok=True)

	for file in os.listdir(folder):
		if file.lower().endswith(".jpg"):
			src_path = os.path.join(folder, file)
			dst_path = os.path.join(original_dir, file)
			shutil.move(src_path, dst_path)

			with Image.open(dst_path) as img:
				exif_data = strip_gps_metadata(img)
				img.save(src_path, "JPEG", exif=exif_data)

# Compress images by quality (save to thumbs folder)
def compress_images(folder, quality):
    thumbs_dir = os.path.join(folder, "thumbs")
    os.makedirs(thumbs_dir, exist_ok=True)

    for file in os.listdir(folder):
        if file.lower().endswith(".jpg"):
            src_path = os.path.join(folder, file)
            dst_path = os.path.join(thumbs_dir, file)
            with Image.open(src_path) as img:
                exif_data = strip_gps_metadata(img)
                img.save(dst_path, "JPEG", quality=quality, exif=exif_data)

def resize_images(folder, percent):
    thumbs_dir = os.path.join(folder, "thumbs")
    os.makedirs(thumbs_dir, exist_ok=True)

    for file in os.listdir(folder):
        if file.lower().endswith(IMAGE_EXTS):
            src_path = os.path.join(folder, file)
            dst_path = os.path.join(thumbs_dir, file)
            try:
                with Image.open(src_path) as img:
                    exif_data = strip_gps_metadata(img)
                    new_size = (int(img.width * percent / 100), int(img.height * percent / 100))
                    resized = img.resize(new_size, Image.LANCZOS)
                    
                    # Preserve original format if possible
                    format_to_save = img.format if img.format else "JPEG"
                    resized.save(dst_path, format=format_to_save, exif=exif_data)
            except Exception as e:
                print(f"Failed to resize {file}: {e}")

def setup_again(folder):
    original_dir = os.path.join(folder, "Original")

    if not os.path.exists(original_dir):
        print(f"Original folder not found in {folder}")
        return

    print("Setting up again...")

    # Remove everything except Original
    for item in os.listdir(folder):
        item_path = os.path.join(folder, item)

        if item == "Original":
            continue

        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

    # Copy originals back
    for file in os.listdir(original_dir):
        if file.lower().endswith(IMAGE_EXTS):
            src = os.path.join(original_dir, file)
            dst = os.path.join(folder, file)

            try:
                with Image.open(src) as img:
                    exif_data = keep_camera_date_metadata(img)

                    img.save(
                        dst,
                        "JPEG",
                        exif=exif_data
                    )

                print(f"Restored {file}")

            except Exception as e:
                print(f"Failed restoring {file}: {e}")

    # Create info.json from restored images
    create_info_json(folder)

    # Resize thumbnails
    percent = ask_resize_percent()
    resize_images(folder, percent)

    print("Setup again complete.")

def format_datetime(dt):
    if platform.system() == "Windows":
        # Windows-compatible formatting, strip leading zeros manually
        return dt.strftime("%d/%m/%Y %I:%M %p").lstrip("0").replace("/0", "/")
    else:
        # Unix-like systems can use the "-" flag
        return dt.strftime("%-d/%-m/%Y %-I:%M %p")

# Format EXIF date or fallback
def get_image_date(img_path):
    try:
        with Image.open(img_path) as img:
            exif_data = img._getexif()
            if exif_data:
                exif = {ExifTags.TAGS.get(tag, tag): value for tag, value in exif_data.items()}
                if "DateTimeOriginal" in exif:
                    dt = datetime.strptime(exif["DateTimeOriginal"], "%Y:%m:%d %H:%M:%S")
                    return format_datetime(dt)
    except:
        pass
    try:
        timestamp = os.path.getmtime(img_path)
        return format_datetime(datetime.fromtimestamp(timestamp))
    except:
        return format_datetime(datetime.now())

def is_camera_filename(filename):
    name = os.path.splitext(filename)[0]

    # Matches:
    # 20260614_164310
    # 20260614_164310(0)
    # IMG_0000
    # _MG_2506
    # DSC00000
    if re.fullmatch(r"\d{8}_\d{6}(\(\d+\))?", name):
        return True

    if re.fullmatch(r"IMG_\d+", name):
        return True

    if re.fullmatch(r"_MG_\d+", name):
        return True

    if re.fullmatch(r"DSC\d+", name):
        return True

    return False

# Supported image extensions
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp")

# Create info.json
def create_info_json(folder):
    convert_cr2_to_jpg_if_missing(folder)

    data = {
        "_album": {
            "title": os.path.basename(folder),
            "date": date.today().strftime("%d/%m/%Y"),
        }
    }

    untitled_index = 1

    for file in os.listdir(folder):
        if file.lower().endswith(IMAGE_EXTS):
            img_path = os.path.join(folder, file)
            filename_title = os.path.splitext(file)[0]

            if is_camera_filename(file):
                title = f"Untitled {untitled_index}"
                untitled_index += 1
            else:
                title = filename_title

            date_taken = get_image_date(img_path)

            data[file] = {
                "title": title,
                "date": date_taken
            }

        with open(os.path.join(folder, "info.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        album_title = os.path.basename(folder)

        html = f"""<!doctype html>
    <html>
        <head>
            <meta http-equiv="refresh" content="0; url=/album/?album={album_title}" />
            <title>{album_title}</title>
            <link rel="icon" type="image/png" href="/Assets/gr_logo_big.png" />
        </head>
        <body></body>
    </html>
    """

        with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)

        print("info.json created with entries for all images.")
        print("index.html created.")

# Main
if __name__ == "__main__":
    action = ask_action_dropdown()
    folder = select_folder_gui()
    if not folder:
        exit()

    if action != "Setup again":
        convert_cr2_to_jpg_if_missing(folder)
        backup_and_strip_metadata(folder)

    if action == "compress":
        quality = ask_compression_level()
        compress_images(folder, quality)

    elif action == "resize":
        percent = ask_resize_percent()
        resize_images(folder, percent)

    elif action == "info":
        create_info_json(folder)

    elif action == "Setup again":
        setup_again(folder)