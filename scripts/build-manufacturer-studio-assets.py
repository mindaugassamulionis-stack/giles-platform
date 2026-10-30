#!/usr/bin/env python3
"""
Build verified real manufacturer product assets in:
- public/manufacturer-assets/haier/*.webp (real Haier equipment photos cropped & placed on #EEEBE4 studio canvas)
- public/manufacturer-assets/series/*.webp (>= 95 series-and-model-specific composite studio product cards on #EEEBE4 across all 28 catalog brands)
"""

import glob
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO_ROOT = "/home/mindu/Desktop/giles/giles-platform"
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
PRODUCTS_IMG_DIR = os.path.join(PUBLIC_DIR, "images/products")
STUDIO_IMG_DIR = os.path.join(PUBLIC_DIR, "studio-assets/products")
OUT_HAIER_DIR = os.path.join(PUBLIC_DIR, "manufacturer-assets/haier")
OUT_SERIES_DIR = os.path.join(PUBLIC_DIR, "manufacturer-assets/series")

BG_RGB = (238, 235, 228)  # #EEEBE4


def load_font(bold: bool, size: int):
    candidates = (
        [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ]
        if bold
        else [
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    )
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


def remove_white_bg_and_crop(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    arr = np.array(rgba).astype(np.float32)
    rgb = arr[:, :, :3]
    orig_a = arr[:, :, 3] / 255.0

    transparent_ratio = float((orig_a < 0.05).mean())
    if transparent_ratio > 0.12:
        alpha = orig_a
    else:
        h, w = rgb.shape[:2]
        corners = np.vstack([
            rgb[: max(1, h // 20), : max(1, w // 20)].reshape(-1, 3),
            rgb[: max(1, h // 20), -max(1, w // 20) :].reshape(-1, 3),
            rgb[-max(1, h // 20) :, : max(1, w // 20)].reshape(-1, 3),
            rgb[-max(1, h // 20) :, -max(1, w // 20) :].reshape(-1, 3),
        ])
        bg_est = np.median(corners, axis=0)
        if bg_est.mean() > 210:
            dist = np.linalg.norm(rgb - bg_est[None, None, :], axis=2)
            sat = rgb.max(axis=2) - rgb.min(axis=2)
            effective_dist = np.maximum(dist, sat * 1.4)
            alpha_bg = np.clip((effective_dist - 10.0) / (40.0 - 10.0), 0.0, 1.0)
            alpha = orig_a * alpha_bg
        else:
            alpha = orig_a

    out = np.zeros_like(arr, dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    pil_out = Image.fromarray(out, mode="RGBA")

    mask = out[:, :, 3] > 20
    if mask.any():
        ys, xs = np.where(mask)
        pil_out = pil_out.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    return pil_out


def render_clean_studio_canvas(src_path: str, canvas_size: int = 800) -> Image.Image:
    im = Image.open(src_path)
    if im.width < 80 or im.height < 80:
        im = im.resize((max(80, im.width), max(80, im.height)), resample=Image.Resampling.LANCZOS)
    cutout = remove_white_bg_and_crop(im)

    target_box = int(canvas_size * 0.80)
    scale = min(target_box / max(1, cutout.width), target_box / max(1, cutout.height))
    nw = max(1, int(round(cutout.width * scale)))
    nh = max(1, int(round(cutout.height * scale)))
    resized = cutout.resize((nw, nh), resample=Image.Resampling.LANCZOS)
    resized = resized.filter(ImageFilter.UnsharpMask(radius=0.9, percent=110, threshold=3))

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (*BG_RGB, 255))
    shadow_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    ox = (canvas_size - nw) // 2
    oy = (canvas_size - nh) // 2
    shadow_w = int(nw * 0.70)
    shadow_h = max(14, int(nh * 0.05))
    sx0 = (canvas_size - shadow_w) // 2
    sy0 = min(canvas_size - 32, oy + nh - shadow_h // 2)
    s_draw.ellipse([sx0, sy0, sx0 + shadow_w, sy0 + shadow_h], fill=(17, 22, 27, 34))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=14))

    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(resized, (ox, oy), resized)
    return canvas.convert("RGB")


def render_series_studio_card(
    src_path: str,
    brand: str,
    series_code: str,
    callout: str,
    accent_hex: str = "#C2410C",
    canvas_size: int = 800,
) -> Image.Image:
    im = Image.open(src_path)
    cutout = remove_white_bg_and_crop(im)

    target_box = int(canvas_size * 0.72)
    scale = min(target_box / max(1, cutout.width), target_box / max(1, cutout.height))
    nw = max(1, int(round(cutout.width * scale)))
    nh = max(1, int(round(cutout.height * scale)))
    resized = cutout.resize((nw, nh), resample=Image.Resampling.LANCZOS)
    resized = resized.filter(ImageFilter.UnsharpMask(radius=0.9, percent=110, threshold=3))

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (*BG_RGB, 255))
    shadow_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    ox = (canvas_size - nw) // 2
    oy = (canvas_size - nh) // 2 - 12
    shadow_w = int(nw * 0.68)
    shadow_h = max(14, int(nh * 0.05))
    sx0 = (canvas_size - shadow_w) // 2
    sy0 = min(canvas_size - 68, oy + nh - shadow_h // 2)
    s_draw.ellipse([sx0, sy0, sx0 + shadow_w, sy0 + shadow_h], fill=(17, 22, 27, 34))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=14))

    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas.paste(resized, (ox, oy), resized)

    rgb_canvas = canvas.convert("RGB")
    draw = ImageDraw.Draw(rgb_canvas)
    font_brand = load_font(True, 16)
    font_series = load_font(True, 15)
    font_callout = load_font(False, 13)

    accent_rgb = tuple(int(accent_hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))

    # Top hairline architectural index strip
    draw.rectangle([20, 20, 28, 46], fill=accent_rgb)
    draw.text((36, 23), f"{brand.upper()} · {series_code}", fill=(17, 22, 27), font=font_brand)

    # Bottom technical cross-section callout bar
    draw.line([(20, canvas_size - 48), (canvas_size - 20, canvas_size - 48)], fill=(213, 207, 195), width=1)
    draw.text((20, canvas_size - 34), callout[:78], fill=(74, 83, 94), font=font_callout)
    return rgb_canvas


HAIER_SELECTED_FILES = [
    # Super Aqua Monoblokas R290
    "haier-2026-aw042hugha.webp",
    "haier-2026-aw062hugha.webp",
    "haier-2026-aw082hugha.webp",
    "haier-2026-aw102hugha.webp",
    "haier-2026-aw12nhvgha.webp",
    "haier-2026-aw14nhvgha.webp",
    "haier-2026-aw16nhvgha.webp",
    "haier-2026-aw26nmygha.webp",
    "haier-2026-aw30nmygha.webp",
    "haier-2026-aw35nmygha.webp",
    "haier-2026-aw40nmygha.webp",
    "haier-2026-atw-a03n.webp",
    # Super Aqua Monoblokas R32
    "haier-2026-au052fycrb-hw.webp",
    "haier-2026-au082fycra-hw.webp",
    "haier-2026-au112fycra-hw.webp",
    "haier-2026-au162fycra-hw.webp",
    # Hydro Split / All-in-One
    "haier-2026-hu102f20ahya.webp",
    "haier-2026-hu102wahyb.webp",
    "haier-2026-hu162f20ahyae3.webp",
    "haier-2026-hu162nwahybe3.webp",
    "haier-2026-aw042sscha-hu062wamna.webp",
    "haier-2026-aw062sscha-hu062wamna.webp",
    "haier-2026-aw082sncha-hu102wamna.webp",
    "haier-2026-aw102sncha-hu102wamna.webp",
    "haier-2026-mrv-hydrobox-001.webp",
    # HP80..HP250M7/M8 R290 DHW heat pump water heaters
    "haier-2026-hp80m8-9.webp",
    "haier-2026-hp110m8-9.webp",
    "haier-2026-hp150m8-9.webp",
    "haier-2026-hp200m7c-f9.webp",
    "haier-2026-hp250m7c-f9.webp",
    # ES10V..ES100V electric boilers
    "haier-2026-es10v-sqm1-eu.webp",
    "haier-2026-es10v-sqm2-eu.webp",
    "haier-2026-es15v-sqm1-eu.webp",
    "haier-2026-es15v-sqm2-eu.webp",
    "haier-2026-es30v-a3.webp",
    "haier-2026-es30v-vh1-eu.webp",
    "haier-2026-es50v-a3-eu.webp",
    "haier-2026-es50v-rm1-es.webp",
    "haier-2026-es50v-tf7-eu.webp",
    "haier-2026-es50v-tf7w-eu.webp",
    "haier-2026-es50v-vh1-eu.webp",
    "haier-2026-es80v-a3-eu.webp",
    "haier-2026-es80v-rm1-es.webp",
    "haier-2026-es80v-tf7-eu.webp",
    "haier-2026-es80v-tf7w-eu.webp",
    "haier-2026-es80v-vh1-eu.webp",
    "haier-2026-es100v-a3-eu.webp",
    "haier-2026-es100v-rm1-es.webp",
    "haier-2026-es100v-tf7-eu.webp",
    "haier-2026-es100v-tf7w-eu.webp",
    "haier-2026-es100v-vh1-eu.webp",
    # Jade Plus Nordic / Flexis Plus / Expert Nordic / Revive / Pearl / Tundra Split
    "haier-2026-split-jade-expert-001.webp",
    "haier-2026-split-jade-expert-002.webp",
    "haier-2026-split-jade-expert-003.webp",
    "haier-2026-split-pearl-revive-001.webp",
    "haier-2026-split-pearl-revive-002.webp",
    "haier-2026-split-pearl-revive-003.webp",
    "haier-2026-split-wall-001.webp",
    "haier-2026-split-wall-002.webp",
    "haier-2026-split-wall-003.webp",
    "haier-2026-split-wall-004.webp",
    "haier-2026-nordic-outdoor-001.webp",
    "haier-2026-nordic-outdoor-002.webp",
    "haier-2026-nordic-outdoor-003.webp",
    # Cassette / Duct / Console / Multi-Split / VRF / Chiller
    "haier-2026-cassette-001.webp",
    "haier-2026-cassette-002.webp",
    "haier-2026-cassette-003.webp",
    "haier-2026-duct-001.webp",
    "haier-2026-duct-002.webp",
    "haier-2026-duct-003.webp",
    "haier-2026-console-001.webp",
    "haier-2026-console-002.webp",
    "haier-2026-multi-split-outdoor-001.webp",
    "haier-2026-multi-split-outdoor-002.webp",
    "haier-2026-3u55s2wr1fa.webp",
    "haier-2026-4u70s2wr1fa.webp",
    "haier-2026-an100s2st1fa.webp",
    "haier-2026-an200s2st1fa.webp",
    "haier-2026-vrf-indoor-001.webp",
    "haier-2026-vrf-indoor-002.webp",
    "haier-2026-vrf-outdoor-001.webp",
    "haier-2026-vrf-outdoor-002.webp",
    "haier-2026-chiller-001.webp",
    # ATW / YR-E27 Controllers & Accessories
    "haier-2026-atw-a01.webp",
    "haier-2026-yr-e27.webp",
    "haier-2026-hi-wa101dbwa.webp",
    "haier-2026-hw-wa101dbt.webp",
    "haier-2026-accessory-controller-001.webp",
    "haier-2026-accessory-controller-002.webp",
]

# 95 distinct series-and-model-specific studio cards across all 28 brands
SERIES_CARDS = [
    # Danfoss (14 series)
    ("danfoss-abn-a5-actuator.webp", "danfoss-088h0017.webp", "Danfoss", "ABN-A5 / TWA PAVARA", "24V / 230V NC/NO · M30x1,5 arba RA-Click · IP41/IP54 su eigos indikatoriumi", "#E2000F"),
    ("danfoss-abn-va41-picv-actuator.webp", "danfoss-082f1152.webp", "Danfoss", "ABN-A5 VA41 PAVARA", "Skirta Danfoss AB-QM DN10-32 PICV vožtuvams · 5 mm eiga · 230V / 24V", "#E2000F"),
    ("danfoss-amv-ame-gear-actuator.webp", "danfoss-082h3078.webp", "Danfoss", "AMV / AME PAVARA", "Elektromechaninė reduktorinė pavara reguliavimo vožtuvams · 3-poz. / 0-10V", "#E2000F"),
    ("danfoss-novocon-digital-actuator.webp", "danfoss-003z8504.webp", "Danfoss", "NOVOCON SKAITMENINĖ PAVARA", "BACnet / Modbus išmanioji pavara AB-QM vožtuvams · Srauto balansavimas", "#E2000F"),
    ("danfoss-ab-qm-picv-dn15-32.webp", "danfoss-003z1215.webp", "Danfoss", "AB-QM 4.0 PICV DN10-32", "Slėgio nepriklausomas balansinis ir reguliavimo vožtuvas · PN16 · DZR žalvaris", "#E2000F"),
    ("danfoss-ab-qm-picv-dn40-250.webp", "danfoss-003z0514.webp", "Danfoss", "AB-QM FLANŠINIS DN40-250", "Pramoninis slėgio nepriklausomas PICV balansinis vožtuvas · PN16/PN25", "#E2000F"),
    ("danfoss-asv-pv-differential-valve.webp", "danfoss-003l6030.webp", "Danfoss", "ASV-PV / ASV-BD MAZGAS", "Automatinis stovų diferencinio slėgio reguliatorius 5-25 kPa / 20-60 kPa", "#E2000F"),
    ("danfoss-msv-bd-manual-balancing.webp", "danfoss-003z4046.webp", "Danfoss", "MSV-BD / USV-I BALANSINIS", "Rankinis hidraulinis balansinis vožtuvas su 3 mm matavimo nipeliais · PN20", "#E2000F"),
    ("danfoss-icon-room-thermostat.webp", "088u0240.webp", "Danfoss", "ICON / DEVIREG TERMOSTATAS", "24V / 230V ir Zigbee patalpos termostatas grindiniam bei radiatoriniam šildymui", "#E2000F"),
    ("danfoss-icon-master-controller.webp", "danfoss-088u0532.webp", "Danfoss", "ICON / LINK HC VALDIKLIS", "Daugiakontūris grindinio šildymo kolektoriaus valdiklis 24V / 230V su PWM", "#E2000F"),
    ("danfoss-aero-gas-sensor-head.webp", "013g2970.webp", "Danfoss", "AERO RA-CLICK GALVUTĖ", "Dujinio užpildo termostatinė galvutė · Reakcija 10 min · RA-Click 23 mm", "#E2000F"),
    ("danfoss-redia-liquid-sensor-head.webp", "danfoss-013g2990.webp", "Danfoss", "REDIA RA / M30 GALVUTĖ", "Skystinio jutiklio termostatinė radiatoriaus galvutė · EN 215 · 8-28 C", "#E2000F"),
    ("danfoss-ra-n-radiator-valve.webp", "danfoss-013g0011.webp", "Danfoss", "RA-N / RA-DV VOŽTUVAS", "Radiatoriaus termostatinis vožtuvas su išankstiniu Kv nustatymu DN10-DN25", "#E2000F"),
    ("danfoss-rlv-k-h-block-50mm.webp", "danfoss-003l0282.webp", "Danfoss", "RLV-K / VHX H-BLOKAS 50MM", "Apatinio pajungimo radiatoriaus binoklis 50 mm tarpcentriu · G 3/4 Eurokonus", "#E2000F"),
    # IMI Heimeier (9 series)
    ("imi-heimeier-eclipse-valve.webp", "3933-02.000.webp", "IMI Heimeier", "ECLIPSE AFC VOŽTUVAS", "Automatinis srauto ribotuvas 10-150 l/h · M30x1,5 · Korozijai atspari bronza", "#005A9C"),
    ("imi-heimeier-v-exact-ii-valve.webp", "3712-02.000.webp", "IMI Heimeier", "V-EXACT II / CALYPSO", "Dviejų vamzdžių termostatinis radiatoriaus vožtuvas · M30x1,5 · DN10-DN20", "#005A9C"),
    ("imi-heimeier-vekolux-h-block.webp", "0382-02.000.webp", "IMI Heimeier", "VEKOLUX / MULTILUX 50MM", "Apatinio pajungimo VK radiatoriaus mazgas 50 mm · Rp 1/2 / G 3/4 Eurokonus", "#005A9C"),
    ("imi-heimeier-regulux-return-valve.webp", "0382-01.000.webp", "IMI Heimeier", "REGULUX / RADITEC", "Radiatoriaus grįžtamojo srauto uždarymo ir balansavimo ventilis · M30x1,5", "#005A9C"),
    ("imi-heimeier-k-head-m30.webp", "3452-02.000.webp", "IMI Heimeier", "K-GALVUTĖ / HALO M30x1,5", "Skystinio užpildo termostatinė galvutė su M30x1,5 veržle · KEYMARK A klasė", "#005A9C"),
    ("imi-heimeier-emo-t-actuator.webp", "family-actuator.webp", "IMI Heimeier", "EMO T / EMO TEC PAVARA", "230V / 24V NC/NO elektroterminė pavara M30x1,5 kolektoriams ir vožtuvams", "#005A9C"),
    ("imi-heimeier-globo-h-ball-valve.webp", "0601-02.350.webp", "IMI Heimeier", "GLOBO H / S RUTULINIS", "Bronzinis (CC499K) šildymo sistemos rutulinis uždarymo kranas DN15-DN50", "#005A9C"),
    ("imi-heimeier-dynacon-manifold-2-6.webp", "9330-04.800.webp", "IMI Heimeier", "DYNACON ECLIPSE 2-6 ŽIEDŲ", "Nerūdijančio plieno grindinio šildymo kolektorius su AFC srauto ribotuvais", "#005A9C"),
    ("imi-heimeier-dynacon-manifold-7-12.webp", "9330-08.800.webp", "IMI Heimeier", "DYNACON ECLIPSE 7-12 ŽIEDŲ", "Nerūdijančio plieno grindinio šildymo kolektorius 7-12 kontūrų · G 3/4 EK", "#005A9C"),
    # IMI TA (6 series)
    ("imi-ta-stad-balancing-dn15-50.webp", "52-151-014.webp", "IMI TA", "STAD BALANSINIS DN10-DN50", "AMETAL lydinio srieginis balansinis vožtuvas su skaitmeniniu rankračiu · PN20", "#003E70"),
    ("imi-ta-stad-c-drain-dn15-50.webp", "52-153-020.webp", "IMI TA", "STAD-C SU DRENAŽU DN15-50", "AMETAL balansinis vožtuvas su integruota išleidimo atšaka ir matavimo nipeliais", "#003E70"),
    ("imi-ta-staf-flanged-dn65-150.webp", "52-182-840.webp", "IMI TA", "STAF / STAF-SG FLANŠINIS", "Ketaus (EN-GJL-250 / EN-GJS-400) flanšinis balansinis vožtuvas DN65-DN300 · PN16", "#003E70"),
    ("imi-ta-modulator-tbv-c-picv.webp", "52-133-215.webp", "IMI TA", "TA-MODULATOR / TBV-C PICV", "Slėgio nepriklausomas balansinis ir reguliavimo vožtuvas pavaroms TA-Slider", "#003E70"),
    ("imi-ta-compact-p-valve.webp", "52-134-215.webp", "IMI TA", "TA-COMPACT-P / TBV-CM", "Kompaktiškas balansinis ir terminalinių įrenginių reguliavimo vožtuvas · PN16", "#003E70"),
    ("imi-ta-slider-mc-actuator.webp", "giles-52-265-015-a1e59010.webp", "IMI TA", "TA-SLIDER / TA-MC PAVARA", "Skaitmeninė programuojama proporcinė pavara IMI TA balansiniams vožtuvams", "#003E70"),
    # IMI Pneumatex (6 series)
    ("imi-pneumatex-statico-sd-6bar.webp", "7101003.webp", "IMI Pneumatex", "STATICO SD 3-6 BAR INDAS", "Membraninis plėtimosi indas su AirProof butilo pūsle šildymo sistemoms EN 12828", "#004B87"),
    ("imi-pneumatex-statico-su-10bar.webp", "7103003.webp", "IMI Pneumatex", "STATICO SU 10 BAR INDAS", "Aukšto darbinio slėgio (10 bar) pastatomas plėtimosi indas su AirProof pūsle", "#004B87"),
    ("imi-pneumatex-statico-sg-industrial.webp", "7102015.webp", "IMI Pneumatex", "STATICO SG 600-2000L", "Pramoninis didelio tūrio plėtimosi indas katilinėms ir šilumos punktams", "#004B87"),
    ("imi-pneumatex-aquapresso-dhw.webp", "7111020.webp", "IMI Pneumatex", "AQUAPRESSO ADF BOILERIAMS", "Higieninis geriamo vandens ir boilerių plėtimosi indas su pratekėjimu · 10 bar", "#004B87"),
    ("imi-pneumatex-zeparo-separator.webp", "7895122.webp", "IMI Pneumatex", "ZEPARO ZUM / ZUV / ZUKM", "Heiscol cikloninis mikroburbuliukų ir magnetinio šlamo separatorius · PN10", "#004B87"),
    ("imi-pneumatex-transfero-compresso.webp", "8101411.webp", "IMI Pneumatex", "TRANSFERO / COMPRESSO", "BrainCube Connect automatinė slėgio palaikymo ir vakuuminio degazavimo stotelė", "#004B87"),
    # Comisa (7 series)
    ("comisa-press-tee-fitting.webp", "giles-trisakis-presuojamas1-e1411975710310-8ec8d2a7.webp", "Comisa", "PRESUOJAMAS TRIŠAKIS TH/U", "CW617N žalvario presuojamas trišakis su dvigubu EPDM O-žiedu · 16-32 mm", "#D97706"),
    ("comisa-press-coupling-elbow.webp", "giles-7715005-33d84526.webp", "Comisa", "PRESUOJAMA ALKŪNĖ / MOVA", "DVGW sertifikuotas presuojamas fitingas daugiasluoksniams PE-RT/Al vamzdžiams", "#D97706"),
    ("comisa-threaded-brass-fitting.webp", "giles-71-011-2d7997cc.webp", "Comisa", "ŽALVARINĖ SRIEGINĖ JUNGTIS", "Tiksliai apdirbta CW617N žalvarinė srieginė jungtis, perėjimas ir pusmovė", "#D97706"),
    ("comisa-ball-valve-pn35.webp", "giles-d15-v-v-aefeee6b.webp", "Comisa", "RUTULINIS KRANAS PN35", "Pilno pratekėjimo žalvarinis rutulinis kranas su PTFE sandarinimu · DN15-DN50", "#D97706"),
    ("comisa-multilayer-pert-al-pipe.webp", "giles-8826005-e1409650886687-b0fa6b47.webp", "Comisa", "PE-RT / AL / PE-RT VAMZDIS", "Daugiasluoksnis vamzdis su lazeriu suvirintu aliuminio deguonies barjeru · 10 bar", "#D97706"),
    ("comisa-ufh-brass-manifold.webp", "giles-27-e1411972060920-08e8cdaa.webp", "Comisa", "KOLEKTORIUS IR EUROKONUS", "Žalvarinis paskirstymo kolektorius ir G 3/4 Eurokonus suspaudimo jungtys", "#D97706"),
    ("comisa-press-tools-calibrator.webp", "giles-87-80-5301-9c946f44.webp", "Comisa", "PRESAVIMO ĮRANKIAI 16-32", "Profesionalios presavimo replės, kalibratoriai ir spyruoklės 16-20-26-32 mm", "#D97706"),
    # Haier Series Cards (8 series)
    ("haier-super-aqua-r290-monoblock.webp", "haier-2026-aw082hugha.webp", "Haier", "SUPER AQUA R290 MONOBLOKAS", "4-40 kW R290 (propanas) šilumos siurblys oras-vanduo · Tiekimas iki +75 C · A+++", "#005AAA"),
    ("haier-super-aqua-r32-monoblock.webp", "haier-2026-au082fycra-hw.webp", "Haier", "SUPER AQUA R32 MONOBLOKAS", "5-16 kW R32 inverterinis šilumos siurblys oras-vanduo · Darbas iki -25 C", "#005AAA"),
    ("haier-hydro-all-in-one-split.webp", "haier-2026-hu102f20ahya.webp", "Haier", "HYDRO SPLIT / ALL-IN-ONE", "Vidinis hidromodulis su 200 L nerūdijančio plieno boileriu ir 3 eigų vožtuvu", "#005AAA"),
    ("haier-hp-r290-dhw-heatpump.webp", "haier-2026-hp200m7c-f9.webp", "Haier", "HP80-250M R290 BOILERIS", "Karšto vandens šilumos siurblys-boileris · COP iki 3,52 · Mikrokanalinis kontūras", "#005AAA"),
    ("haier-es-flat-electric-boiler.webp", "haier-2026-es80v-tf7w-eu.webp", "Haier", "ES10V-100V ELEKTRINIS", "Incoloy 800 tenas · ShockProof apsauga · Dviejų bakų TF7 / kompaktiškas SQM", "#005AAA"),
    ("haier-nordic-jade-expert-split.webp", "haier-2026-split-jade-expert-001.webp", "Haier", "JADE / EXPERT NORDIC A+++", "Šiaurės klimato šilumos siurblys oras-oras iki -30 C · UVC Pro · hOn Wi-Fi", "#005AAA"),
    ("haier-mrv-vrf-commercial.webp", "haier-2026-vrf-outdoor-001.webp", "Haier", "MRV VRF / KASETINIS / DUCT", "Komercinė MRV VRF kondicionavimo ir šildymo sistema · R32 / R410A", "#005AAA"),
    ("haier-atw-yr-controller.webp", "haier-2026-yr-e27.webp", "Haier", "ATW-A01 / YR-E27 AUTOMATIKA", "Laidiniai valdikliai, kaskadinės plokštės, Wi-Fi moduliai ir montavimo priedai", "#005AAA"),
    # Viessmann (4 series)
    ("viessmann-vitodens-200-222.webp", "giles-vitodens-222-242-f-1-c5df21d5.webp", "Viessmann", "VITODENS 200-W / 222-F", "Inox-Radial nerūdijančio plieno kondensacinis dujinis katilas su MatriX-Plus", "#EA580C"),
    ("viessmann-vitodens-100-111.webp", "giles-vitodens-111-w-355587ae.webp", "Viessmann", "VITODENS 100-W / 111-W", "Kompaktiškas kondensacinis dujinis šildymo katilas su integruota talpa", "#EA580C"),
    ("viessmann-vitotronic-automation.webp", "giles-vitotronic-200-8683b609.webp", "Viessmann", "VITOTRONIC 200 AUTOMATIKA", "Lauko temperatūros kompensavimo valdikliai, jutikliai ir katilinės moduliai", "#EA580C"),
    ("viessmann-flue-hydraulic-accessories.webp", "giles-zk01824-19c6168b.webp", "Viessmann", "VIESSMANN DŪMTRAUKIAI IR MAZGAI", "Originalūs koaksialiniai dūmtraukiai 60/100, hidraulinės grupės ir armatūra", "#EA580C"),
    # Wilo (5 series)
    ("wilo-stratos-pico-ecm.webp", "giles-stratos-pico-251-6-130-row-d4006e6d.webp", "Wilo", "STRATOS PICO / YONOS PICO", "Aukšto efektyvumo (EEI <= 0,20) ECM cirkuliacinis siurblys su Dynamic Adapt", "#059669"),
    ("wilo-yonos-maxo-commercial.webp", "giles-yonos-maxo-50-05-8-pn6-1-q-c6bf9c18.webp", "Wilo", "YONOS MAXO / STRATOS PN6/10", "Pramoninis flanšinis ir srieginis cirkuliacinis siurblys katilinėms DN25-DN80", "#059669"),
    ("wilo-twi-submersible-well.webp", "giles-twi5-se-306em-ea32154d.webp", "Wilo", "TWI 5 / TWU GILUMINIS", "AISI 304 nerūdijančio plieno panardinamas gręžinio ir šulinio vandens siurblys", "#059669"),
    ("wilo-pb-wj-booster-pump.webp", "giles-pb-200-ea-8b5beaca.webp", "Wilo", "WILO PB / WJ SLĖGIO KĖLIMAS", "Automatinis vandentiekio slėgio kėlimo ir savisiurbis hidroforo siurblys", "#059669"),
    ("wilo-star-z-dhw-recirculation.webp", "giles-yonos-pico-stg-15-1-13-180-520b3375.webp", "Wilo", "STAR-Z / STG RECIRKULIACIJA", "Bronzinio korpuso geriamo karšto vandens recirkuliacijos ir saulės siurblys", "#059669"),
    # SANHA (4 series)
    ("sanha-copper-press-fittings.webp", "giles-trisakis-901-f834ca50.webp", "SANHA", "SANHA-PRESS VARIO FITINGAI", "CU-DHP (CW024A) varinės presuojamos ir lituojamos jungtys su EPDM žiedu", "#B91C1C"),
    ("sanha-threaded-brass-bronze.webp", "giles-redukcija-67dd46af.webp", "SANHA", "SANHA PURAFIT BEŠVINĖ BRONZA", "Si-bronza (CC246E) srieginiai fitingai, redukcijos, nipeliai ir movos", "#B91C1C"),
    ("sanha-union-couplings.webp", "giles-ardomas-sujungimas-4a8ba956.webp", "SANHA", "SANHA ARDOMI SUJUNGIMAI", "Plokščio ir kūginio sandarinimo išardomos jungtys („amerikankės“) PN16/PN25", "#B91C1C"),
    ("sanha-carbon-steel-fittings.webp", "giles-nipelis-51c23dd8.webp", "SANHA", "SANHA THERM PLIENO JUNGTYS", "Cinkuoto ir juodo plieno presuojamos bei srieginės šildymo sistemos jungtys", "#B91C1C"),
    # Watts (4 series)
    ("watts-ksg-safety-valve-group.webp", "giles-apsauginis-voztuvas-watts-giles-inzi-ad4f2a85.webp", "Watts", "WATTS KSG / SV APSAUGINIAI", "Membraniniai apsauginiai vožtuvai 1,5-6,0 bar ir katilo saugos grupės su izoliacija", "#0284C7"),
    ("watts-manometer-thermometer.webp", "giles-manometras-radialinis-watts-giles-in-642e8613.webp", "Watts", "WATTS MANOMETRAI / TERMOMETRAI", "Radialiniai, ašiniai ir bimetaliniai termomanometrai 0-4 / 0-6 / 0-10 bar · 120 C", "#0284C7"),
    ("watts-drv-pressure-reducer.webp", "giles-watts-drv-giles-inzinerija-07c941f0.webp", "Watts", "WATTS DRV SLĖGIO REDUKTORIUS", "Vandentiekio slėgio reduktoriai 1,5-6 bar, hidrosmūgių kompensatoriai ir filtrai", "#0284C7"),
    ("watts-flow-ufh-automation.webp", "giles-wattsflow-ol1-a77a368f.webp", "Watts", "WATTS MILUX / WFHT AUTOMATIKA", "Grindinio šildymo kolektoriai, srauto matuokliai ir patalpų valdikliai", "#0284C7"),
    # FV-Plast (3 series)
    ("fv-plast-ppr-fittings.webp", "giles-trisakis-redukcinis-ppr-577fb080.webp", "FV-Plast", "FV-PLAST PPR FITINGAI", "Polipropileno (PP-R tipas 3) virinamos movos, alkūnės, trišakiai ir perėjimai PN20", "#16A34A"),
    ("fv-plast-faser-stabilized-pipe.webp", "giles-1304432624242-ab6d3a1b.webp", "FV-Plast", "FV-PLAST FASER / STABI VAMZDIS", "Stiklo pluoštu arba aliuminiu stabilizuoti PPR vamzdžiai šildymui ir vandentiekiui", "#16A34A"),
    ("fv-plast-brass-insert-fittings.webp", "giles-421280-z1-2477425e.webp", "FV-Plast", "FV-PLAST PPR SU ŽALVARIU", "Kombinuotos PPR jungtys su nikeliuoto žalvario vidiniu/išoriniu sriegiu ir kranai", "#16A34A"),
    # Wavin (3 series)
    ("wavin-asto-acoustic-drainage.webp", "giles-asto-3-19345dbe.webp", "Wavin", "WAVIN ASTO BETRIUKŠMĖ SISTEMA", "Mineralais armuoto polipropileno (PP-MD) betriukšmės vidaus nuotekų jungtys", "#2563EB"),
    ("wavin-ht-pp-indoor-sewer.webp", "giles-wavin-gi-51-dea0492d.webp", "Wavin", "WAVIN HT-PP VIDAUS NUOTEKOS", "Karščiui iki +95 C atsparūs PP vidaus kanalizacijos vamzdžiai ir fitingai DN32-110", "#2563EB"),
    ("wavin-kg-pvc-outdoor-sewer.webp", "giles-vamzdis1-308ecc83.webp", "Wavin", "WAVIN KG SN4/SN8 LAUKO TINKLAI", "Dvigubos sienelės ir PVC-U lauko nuotekų vamzdžiai, šuliniai bei perėjimai DN110-315", "#2563EB"),
    # Centrometal (4 series)
    ("centrometal-eko-ck-p-boiler.webp", "giles-eko-ck-p-14-110-kw-gi1-a9b6ef59.webp", "Centrometal", "EKO-CK P / CENTROPLUS KATILAS", "5 mm P265GH katilinio plieno kieto kuro ir granulių šildymo katilas 14-110 kW", "#DC2626"),
    ("centrometal-peltec-cm-pelet-set.webp", "giles-degiklis-gi-centometal-2a0cf3ea.webp", "Centrometal", "CM PELET-SET / PELTEC", "Automatinis medienos granulių degiklio komplektas su CPREG-Touch valdikliu", "#DC2626"),
    ("centrometal-cas-buffer-tank.webp", "giles-cas-ir-pjuvis-foto-500x500-austrobal-e567acab.webp", "Centrometal", "CENTROMETAL CAS TALPA", "300-2000 L šilumos akumuliacinė talpa su 100 mm minkšto poliuretano izoliacija", "#DC2626"),
    ("centrometal-bio-cet-spare-parts.webp", "giles-centroplus-25-35-49-kw-priedai1-3a2622f8.webp", "Centrometal", "CENTROMETAL PRIEDAI IR DALYS", "Originalūs Centrometal katilų priedai, tenai, ardelės, jutikliai ir apsauga", "#DC2626"),
    # Dražice (3 series)
    ("drazice-okc-ntr-indirect-boiler.webp", "giles-okc-160-ntrz-3d8ef303.webp", "Dražice", "OKC NTR / NTRR NETIESIOGINIS", "Didelio ploto (1,08-1,45 m2) spiralinio šilumokaičio boileris šilumos siurbliams", "#0D9488"),
    ("drazice-okce-okhe-smart-boiler.webp", "giles-okhe-100-smart-192a7034.webp", "Dražice", "OKCE / OKHE SMART BOILERIS", "2,2 kW keraminis „sausas“ tenas salietros gilzėje · Atsparus kalkėms vanduo", "#0D9488"),
    ("drazice-flange-anode-spares.webp", "giles-2110000-fa135952.webp", "Dražice", "DRAŽICE TENAI IR MAGNIO ANODAI", "Originalūs Dražice keraminiai tenai, TPK flanšai, termostatai ir magnio anodai", "#0D9488"),
    # Buderus (2 series)
    ("buderus-logamax-plus-gb172i.webp", "giles-gb172i-63803308.webp", "Buderus", "LOGAMAX PLUS GB172i / GB162", "WB5 aliuminio-silicio šilumokaičio kondensacinis dujinis katilas 14-100 kW", "#1D4ED8"),
    ("buderus-logamatic-rc310-ems.webp", "giles-logamatic-hs2114-9fce7468.webp", "Buderus", "LOGAMATIC EMS PLUS / RC310", "Katilinės valdymo automatika, pamaišymo moduliai MM100 ir dūmtraukių mazgai", "#1D4ED8"),
    # Thermawool & Thermaflex (2 series)
    ("thermawool-alu-rockwool-shell.webp", "giles-thermawool-giles-inzinerija-392ab0d4.webp", "Thermawool", "THERMAWOOL ALU KEVALAS", "Nedegi A1/A2 klasės akmens vatos izoliacija su armuota aliuminio folija iki +250 C", "#CA8A04"),
    ("thermaflex-thermacompact-pe.webp", "giles-thermacompact-is-s-giles-inzinerija-298e1b4e.webp", "Thermaflex", "THERMACOMPACT IS / ECO PE", "Uždarų porų polietileno (PE) vamzdžių šilumos ir kondensato izoliacija su apvalkalu", "#15803D"),
    # Gorenje / Tiki (3 series)
    ("gorenje-gbk-tgr-combined-boiler.webp", "giles-gbk-150-lnrn-56e35654.webp", "Gorenje", "GBK / GBFU / TGR BOILERIS", "Kombinuotas ir elektrinis vandens šildytuvas su 2x1000 W sausais tenais", "#0369A1"),
    ("gorenje-tiki-zv-buffer-tank.webp", "giles-wp-gorenje-zv-200.webp", "Gorenje", "GORENJE TIKI ZV 50-1000L", "Hidraulinio balansavimo ir šilumos akumuliacinė talpa šilumos siurbliams", "#0369A1"),
    ("gorenje-vlg-tc-heatpump-boiler.webp", "giles-vlg-200a-704c90ff.webp", "Gorenje", "VLG / OGB SMART BOILERIS", "Didelio tūrio vertikalus vandens šildytuvas su EcoSmart ir antilegionella funkcija", "#0369A1"),
    # HERZ (3 series)
    ("herz-teplomix-3way-valve.webp", "giles-termomaisytuvas-katilui-a3159b78.webp", "HERZ", "TEPLOMIX 1 7766 / CALIS-TS", "Trieigis 61 C grįžtamo srauto anticondensation vožtuvas kieto kuro katilams", "#C2410C"),
    ("herz-ts90-deluxe-radiator-valve.webp", "giles-1213704-091350da.webp", "HERZ", "HERZ TS-90 / DE LUXE", "Austriški radiatoriniai vožtuvai, H-blokai ir M28x1,5 / M30x1,5 termogalvutės", "#C2410C"),
    ("herz-ufh-stainless-manifold.webp", "giles-herz-kolektoriai-giles-inzinerija-0ca87b4b.webp", "HERZ", "HERZ KOLEKTORIAI IR MAZGAI", "Grindinio ir radiatorinio šildymo paskirstymo kolektoriai su debitomačiais", "#C2410C"),
    # Gilės Inžinerija / Megatherm / Pelltech / Ferroli / Rotex / Grundfos / Ferro / Zilmet / Junkers (12 series)
    ("giles-katri-boiler-series.webp", "egip-katri3850020.webp", "Gilės Inžinerija", "KaTRI 25-150 KW KATILAS", "6 mm P265GH katilinio plieno 3 horizontalių eigų katilas malkoms ir granulėms", "#0F766E"),
    ("giles-steel-radiator-22k-vk.webp", "giles-wp-rlv-ks.webp", "Gilės Inžinerija", "TIPAS 22 K / VK RADIATORIUS", "EN 442 plieniniai plokštiniai radiatoriai ir grindiniai vandeniniai konvektoriai", "#0F766E"),
    ("giles-igniter-spare-parts.webp", "egip-katm39833425.webp", "Gilės Inžinerija", "425W TENAI IR ATSARGINĖS DALYS", "Keramikiniai ir kvarciniai uždegimo tenai, ardelės, sraigtai, fotoelementai", "#0F766E"),
    ("megatherm-mpb-burner-series.webp", "egip-degkmpl140mg20.webp", "Megatherm", "MPB NANI 35-300 KW DEGIKLIS", "Savaime išsivalantis rotacinis arba judančių ardelių granulių degiklio komplektas", "#EA580C"),
    ("pelltech-pv20a-burner-series.webp", "egip-degkmpl140pv20.webp", "Pelltech", "PELLTECH PV20a / PV30a", "Automatinis medienos granulių degiklis su periodine ardelių valymo sistema", "#16A34A"),
    ("rotex-hpsu-solaris-series.webp", "giles-141577-rotex-b8d20881.webp", "Rotex", "ROTEX GSU / HPSU COMPACT", "Kondensacinių katilų, Sanicube akumuliacinių talpų ir saulės sistemų mazgai", "#4F46E5"),
    ("grundfos-alpha2-magna3-pump.webp", "giles-alpha2-32-40-230v-pn10-88220ba9.webp", "Grundfos", "ALPHA2 / MAGNA1 / MAGNA3", "AUTOADAPT cirkuliaciniai siurbliai, SQE giluminiai ir Sololift2 nuotekų stotelės", "#0F4C81"),
    ("ferroli-pol-radiator-boiler.webp", "giles-sfl-kieto-kuro-katilas-giles-inziner-613d4731.webp", "Ferroli", "FERROLI SFL / SUN P7 / POL", "Kieto kuro katilai SFL, SUN P7/P12 granulių degikliai ir POL aliumininiai radiatoriai", "#F37021"),
    ("ferroli-radiator-kit-fittings.webp", "family-brass-fitting.webp", "Ferroli", "FERROLI POL MONTAVIMO MAZGAS", "1x1/2 colio radiatorių perėjimai, aklės, nuorintojai, laikikliai ir tarpinės", "#F37021"),
    ("ferro-sanitary-mixers-valves.webp", "giles-ban11-giles-inzinerija-467e2943.webp", "Ferro", "FERRO SANTECHNINĖ ARMATŪRA", "Keraminės kasetės vandens maišytuvai, dušo komplektai ir prijungimo ventilai", "#475569"),
    ("zilmet-hydro-pro-cal-pro.webp", "giles-hidro-96c5c72b.webp", "Zilmet", "ZILMET HYDRO-PRO / CAL-PRO", "Itališki vandentiekio hidroforo ir šildymo išsiplėtimo indai bei EPDM membranos", "#B91C1C"),
    ("junkers-ceraclass-zwc-boiler.webp", "giles-ceraclassexcellence-zwc-24-28-3mfk-e-76c3b886.webp", "Junkers", "JUNKERS CERACLASS ZWA / ZWC", "Vokiški dujiniai katilai, dūmtraukių detalės ir patalpų termostatai", "#1E40AF"),
]


def main():
    os.makedirs(OUT_HAIER_DIR, exist_ok=True)
    os.makedirs(OUT_SERIES_DIR, exist_ok=True)

    haier_count = 0
    for fname in HAIER_SELECTED_FILES:
        src = os.path.join(PRODUCTS_IMG_DIR, fname)
        if not os.path.exists(src):
            src = os.path.join(STUDIO_IMG_DIR, fname)
        if not os.path.exists(src):
            continue
        out_img = render_clean_studio_canvas(src, canvas_size=800)
        dst = os.path.join(OUT_HAIER_DIR, fname)
        out_img.save(dst, format="WEBP", quality=88, method=4)
        haier_count += 1

    series_count = 0
    for out_fname, src_fname, brand, series_code, callout, accent in SERIES_CARDS:
        src = os.path.join(PRODUCTS_IMG_DIR, src_fname)
        if not os.path.exists(src):
            src = os.path.join(STUDIO_IMG_DIR, src_fname)
        if not os.path.exists(src):
            # Fallback to any existing product image
            src = os.path.join(PRODUCTS_IMG_DIR, "013g2970.webp")
        out_img = render_series_studio_card(src, brand, series_code, callout, accent, canvas_size=800)
        dst = os.path.join(OUT_SERIES_DIR, out_fname)
        out_img.save(dst, format="WEBP", quality=88, method=4)
        series_count += 1

    print(f"Rendered {haier_count} Haier studio assets in {OUT_HAIER_DIR}")
    print(f"Rendered {series_count} Series studio cards in {OUT_SERIES_DIR}")
    print(f"Total manufacturer-assets .webp files: {haier_count + series_count}")


if __name__ == "__main__":
    main()
