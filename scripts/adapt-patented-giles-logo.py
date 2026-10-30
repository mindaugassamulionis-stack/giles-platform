#!/usr/bin/env python3
"""
Natively adapt the patented UAB „Gilės inžinerija“ logo from logo-current-original.png:
1. Remove the top green screenshot bar (y=0..7) and the #F6F6F6 opaque background box.
2. Produce:
   - giles-patented-mark-transparent.png: 4x upscaled transparent Patented Acorn Mark (smooth anti-aliased alpha, zero raster text clutter, zero white box).
   - giles-patented-full-light.png: Full transparent light-mode patented logo.
   - giles-patented-full-dark.png: Full transparent dark-mode patented logo for #11161B / #0B0F13 dark surfaces.
   - Also update logo-current-original.png in public/studio-assets/logos/ to be trimmed & transparent.
"""

import os
import shutil
import numpy as np
from PIL import Image, ImageFilter

RAW_PATH = "/home/mindu/Desktop/giles/studio-assets/logos/logo-current-original.png"
BACKUP_PATH = "/home/mindu/Desktop/giles/studio-assets/logos/logo-current-original-raw-backup.png"

OUT_DIRS = [
    "/home/mindu/Desktop/giles/studio-assets/logos",
    "/home/mindu/Desktop/giles/giles-platform/public/studio-assets/logos",
]


def load_source() -> Image.Image:
    if not os.path.exists(BACKUP_PATH) and os.path.exists(RAW_PATH):
        im = Image.open(RAW_PATH)
        if im.size == (386, 172):
            shutil.copyfile(RAW_PATH, BACKUP_PATH)
    src = BACKUP_PATH if os.path.exists(BACKUP_PATH) else RAW_PATH
    return Image.open(src).convert("RGBA")


def extract_clean_transparent_crop(im: Image.Image) -> np.ndarray:
    """
    Crop the active logo region (x=108..204, y=32..126) from the 386x172 raw image
    and convert the #F6F6F6 background into smooth anti-aliased alpha transparency.
    """
    arr = np.array(im).astype(np.float32)
    crop = arr[32:126, 108:204, :].copy()  # 94 x 96
    rgb = crop[:, :, :3]
    bg = np.array([246.0, 246.0, 246.0], dtype=np.float32)

    dist = np.linalg.norm(rgb - bg, axis=2)
    alpha = np.clip((dist - 10.0) / (44.0 - 10.0), 0.0, 1.0)

    safe_alpha = np.maximum(alpha[:, :, None], 0.15)
    clean_rgb = (rgb - (1.0 - safe_alpha) * bg) / safe_alpha
    clean_rgb = np.clip(clean_rgb, 0.0, 255.0)

    # Harmonize green and purple to crisp patented tones (#649C1F / #7FA33A and #8C3061)
    r, g, b = clean_rgb[:, :, 0], clean_rgb[:, :, 1], clean_rgb[:, :, 2]
    is_green = (g > r + 10) & (g > b + 10)
    is_purple = (~is_green) & (alpha > 0.1)

    # Richer green for the acorn mark
    clean_rgb[is_green, 0] = np.clip(r[is_green] * 0.82, 0, 255)
    clean_rgb[is_green, 1] = np.clip(g[is_green] * 0.96, 0, 255)
    clean_rgb[is_green, 2] = np.clip(b[is_green] * 0.75, 0, 255)

    # Richer patented #8C3061 plum-purple for GILĖS
    clean_rgb[is_purple, 0] = np.clip(r[is_purple] * 0.92, 0, 255)
    clean_rgb[is_purple, 1] = np.clip(g[is_purple] * 0.65, 0, 255)
    clean_rgb[is_purple, 2] = np.clip(b[is_purple] * 0.88, 0, 255)

    out = np.zeros_like(crop, dtype=np.uint8)
    out[:, :, :3] = clean_rgb.astype(np.uint8)
    out[:, :, 3] = (alpha * 255.0).astype(np.uint8)
    return out


def build_patented_acorn_mark(clean_crop: np.ndarray) -> Image.Image:
    """
    Extract the pure Patented Gilės Acorn Mark (without the tiny raster text block on the right)
    with 100% transparent background, upscaled 4x with Lanczos and smooth edge feathering.
    """
    mark_arr = clean_crop.copy()
    # Remove the tiny raster text block (y_crop=27..50, x_crop=28..95) while preserving
    # the entire authentic acorn arch, stippled cup, and bottom stem untouched
    for y in range(27, 51):
        for x in range(28, mark_arr.shape[1]):
            if y <= 28 and x <= 50:
                continue
            mark_arr[y, x, 3] = 0

    acorn_only = mark_arr[:, :58, :]
    pil_small = Image.fromarray(acorn_only, mode="RGBA")
    arr_c = np.array(pil_small)
    ys, xs = np.where(arr_c[:, :, 3] > 16)
    cropped = pil_small.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

    # 4x upscale + smooth alpha anti-aliasing
    scale = min(228.0 / cropped.width, 228.0 / cropped.height)
    nw, nh = int(round(cropped.width * scale)), int(round(cropped.height * scale))
    resized = cropped.resize((nw, nh), resample=Image.Resampling.LANCZOS)
    resized = resized.filter(ImageFilter.UnsharpMask(radius=1.1, percent=125, threshold=3))

    final_mark = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    final_mark.paste(resized, ((256 - nw) // 2, (256 - nh) // 2), resized)
    return final_mark


def build_full_logos(clean_crop: np.ndarray) -> tuple[Image.Image, Image.Image]:
    """
    Build full transparent light-mode and dark-mode logos (4x upscaled from the clean crop).
    """
    pil_crop = Image.fromarray(clean_crop, mode="RGBA")
    arr_c = np.array(pil_crop)
    ys, xs = np.where(arr_c[:, :, 3] > 16)
    tight = pil_crop.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

    w4, h4 = tight.width * 4, tight.height * 4
    light_up = tight.resize((w4, h4), resample=Image.Resampling.LANCZOS)
    light_up = light_up.filter(ImageFilter.UnsharpMask(radius=1.1, percent=135, threshold=2))

    light_canvas = Image.new("RGBA", (w4 + 24, h4 + 24), (0, 0, 0, 0))
    light_canvas.paste(light_up, (12, 12), light_up)

    dark_arr = np.array(light_canvas).astype(np.float32)
    r, g, b, a = dark_arr[:, :, 0], dark_arr[:, :, 1], dark_arr[:, :, 2], dark_arr[:, :, 3]
    vis = a > 15
    is_green = (g > r + 10) & (g > b + 10)
    is_purple_or_dark = vis & (~is_green)
    is_green_vis = vis & is_green

    dark_arr[is_purple_or_dark, 0] = 245.0
    dark_arr[is_purple_or_dark, 1] = 243.0
    dark_arr[is_purple_or_dark, 2] = 238.0

    dark_arr[is_green_vis, 0] = np.clip(r[is_green_vis] * 1.25 + 28.0, 0, 255)
    dark_arr[is_green_vis, 1] = np.clip(g[is_green_vis] * 1.25 + 34.0, 0, 255)
    dark_arr[is_green_vis, 2] = np.clip(b[is_green_vis] * 1.10 + 16.0, 0, 255)

    dark_canvas = Image.fromarray(dark_arr.astype(np.uint8), mode="RGBA")
    return light_canvas, dark_canvas


def main() -> None:
    im = load_source()
    clean_crop = extract_clean_transparent_crop(im)
    mark_img = build_patented_acorn_mark(clean_crop)
    full_light, full_dark = build_full_logos(clean_crop)

    for out_dir in OUT_DIRS:
        os.makedirs(out_dir, exist_ok=True)
        mark_img.save(os.path.join(out_dir, "giles-patented-mark-transparent.png"), format="PNG", optimize=True)
        full_light.save(os.path.join(out_dir, "giles-patented-full-light.png"), format="PNG", optimize=True)
        full_dark.save(os.path.join(out_dir, "giles-patented-full-dark.png"), format="PNG", optimize=True)
        full_light.save(os.path.join(out_dir, "logo-current-original.png"), format="PNG", optimize=True)
        print(f"Saved logos in {out_dir}: mark={mark_img.size}, full={full_light.size}")


if __name__ == "__main__":
    main()
