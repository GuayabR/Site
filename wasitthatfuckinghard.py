import os
import json
import tkinter as tk
from tkinter import filedialog
from PIL import Image, ExifTags
from datetime import datetime
import platform


def select_info_json():
    root = tk.Tk()
    root.withdraw()

    return filedialog.askopenfilename(
        title="Select info.json",
        filetypes=[("JSON files", "*.json")]
    )


def format_datetime(dt):
    if platform.system() == "Windows":
        return dt.strftime("%d/%m/%Y %I:%M %p").lstrip("0").replace("/0", "/")
    else:
        return dt.strftime("%-d/%-m/%Y %-I:%M %p")


def get_image_date(image_path):
    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif()

            if exif_data:
                exif = {
                    ExifTags.TAGS.get(tag, tag): value
                    for tag, value in exif_data.items()
                }

                if "DateTimeOriginal" in exif:
                    dt = datetime.strptime(
                        exif["DateTimeOriginal"],
                        "%Y:%m:%d %H:%M:%S"
                    )

                    return format_datetime(dt)

    except Exception as e:
        print(f"Failed reading {image_path}: {e}")

    return None


def update_info_json(info_path):
    album_folder = os.path.dirname(info_path)
    original_folder = os.path.join(album_folder, "Original")

    with open(info_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated = 0

    for filename, entry in data.items():

        # Skip album metadata
        if filename == "_album":
            continue

        if not isinstance(entry, dict):
            continue

        original_path = os.path.join(original_folder, filename)

        if not os.path.exists(original_path):
            print(f"Missing original: {filename}")
            continue

        date_taken = get_image_date(original_path)

        if date_taken:
            old_date = entry.get("date")

            entry["date"] = date_taken

            print(
                f"{filename}\n"
                f"  {old_date} -> {date_taken}"
            )

            updated += 1
        else:
            print(f"No EXIF date found: {filename}")

    with open(info_path, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            indent=4,
            ensure_ascii=False
        )

    print()
    print(f"Updated {updated} images.")
    print("info.json saved.")


if __name__ == "__main__":
    info_path = select_info_json()

    if not info_path:
        print("No file selected.")
        exit()

    update_info_json(info_path)