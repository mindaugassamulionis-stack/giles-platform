#!/usr/bin/env python3
"""
Re-render all 30 giles-studio-*.webp product images from clean source images onto
exact #EEEBE4 (rgb(238, 235, 228)) 1000x1000 studio canvases with:
- ZERO baked-in text banners or badges (pure product studio photography)
- Smooth white-background removal / multiplication so white boxes disappear seamlessly into #EEEBE4
- Centered 82% fill with a soft ground contact shadow
"""

import json
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

MANIFEST_PATH = "/home/mindu/Desktop/giles/studio-assets/products/studio-assets-manifest.json"
OUT_DIRS = [
    "/home/mindu/Desktop/giles/studio-assets/products",
    "/home/mindu/Desktop/giles/giles-platform/public/studio-assets/products",
    "/home/mindu/Desktop/giles/giles-platform/public/images/products",
]

BG_RGB = (238, 235, 228)  # #EEEBE4


def remove_white_bg_and_crop(im: Image.Image) -> Image.Image:
    """
    Convert any white/near-white background on the source image into transparent alpha
    and crop tightly to the non-background bounding box.
    """
    rgba = im.convert("RGBA")
    arr = np.array(rgba).astype(np.float32)
    rgb = arr[:, :, :3]
    orig_a = arr[:, :, 3] / 255.0

    # Check if image already has meaningful transparency
    transparent_ratio = float((orig_a < 0.05).mean())
    if transparent_ratio > 0.12:
        alpha = orig_a
    else:
        # Sample corner pixels to estimate background color (usually white 255,255,255)
        h, w = rgb.shape[:2]
        corners = np.vstack([
            rgb[:max(1, h // 20), :max(1, w // 20)].reshape(-1, 3),
            rgb[:max(1, h // 20), -max(1, w // 20):].reshape(-1, 3),
            rgb[-max(1, h // 20):, :max(1, w // 20)].reshape(-1, 3),
            rgb[-max(1, h // 20):, -max(1, w // 20):].reshape(-1, 3),
        ])
        bg_est = np.median(corners, axis=0)
        if bg_est.mean() > 215:
            dist = np.linalg.norm(rgb - bg_est[None, None, :], axis=2)
            # Also preserve dark or saturated pixels
            sat = rgb.max(axis=2) - rgb.min(axis=2)
            effective_dist = np.maximum(dist, sat * 1.4)
            alpha_bg = np.clip((effective_dist - 10.0) / (42.0 - 10.0), 0.0, 1.0)
            alpha = orig_a * alpha_bg
        else:
            # Photo with full-bleed real-world scene (e.g., container boiler photo):
            # keep photo intact with clean rounded/framed studio crop
            alpha = orig_a

    out = np.zeros_like(arr, dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    pil_out = Image.fromarray(out, mode="RGBA")

    # Tight bounding box crop
    mask = out[:, :, 3] > 20
    if mask.any():
        ys, xs = np.where(mask)
        pil_out = pil_out.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    return pil_out


def render_studio_canvas(src_path: str) -> Image.Image:
    im = Image.open(src_path)
    cutout = remove_white_bg_and_crop(im)

    canvas_size = 1000
    target_box = 820  # 82% fill
    scale = min(target_box / max(1, cutout.width), target_box / max(1, cutout.height))
    nw = max(1, int(round(cutout.width * scale)))
    nh = max(1, int(round(cutout.height * scale)))
    resized = cutout.resize((nw, nh), resample=Image.Resampling.LANCZOS)
    resized = resized.filter(ImageFilter.UnsharpMask(radius=1.0, percent=115, threshold=3))

    # Base #EEEBE4 warm stone studio canvas
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (*BG_RGB, 255))

    # Soft studio contact shadow beneath the product
    shadow_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    ox = (canvas_size - nw) // 2
    oy = (canvas_size - nh) // 2
    shadow_w = int(nw * 0.72)
    shadow_h = max(18, int(nh * 0.055))
    sx0 = (canvas_size - shadow_w) // 2
    sy0 = min(canvas_size - 45, oy + nh - shadow_h // 2)
    s_draw.ellipse([sx0, sy0, sx0 + shadow_w, sy0 + shadow_h], fill=(17, 22, 27, 36))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=18))

    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(resized, (ox, oy), resized)
    return canvas.convert("RGB")


def main() -> None:
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    rendered = 0
    for item in manifest["assets"]:
        fname = item["filename"]
        src_path = item["sourceImage"]
        studio_img = render_studio_canvas(src_path)
        for out_dir in OUT_DIRS:
            os.makedirs(out_dir, exist_ok=True)
            dst = os.path.join(out_dir, fname)
            studio_img.save(dst, format="WEBP", quality=90, method=6)
        rendered += 1

    print(f"Successfully re-rendered {rendered}/30 studio images onto #EEEBE4 with zero baked-in banners.")


if __name__ == "__main__":
    main()
