#!/usr/bin/env python3
"""
Download real completed project photos ("Atlikti darbai") from gilesinzinerija.com/wp-content/uploads/
and process them into 1200x900 background-cleaned / studio-harmonized #EEEBE4 architectural studio
visuals with floor plane, ground contact shadow, and hardware lighting/contrast enhancement.
"""

import io
import json
import os
import urllib.request
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

OUT_DIRS = [
    "/home/mindu/Desktop/giles/giles-platform/public/studio-assets/projects",
    "/home/mindu/Desktop/giles/studio-assets/projects",
]

CACHE_DIR = "/tmp/giles_raw_projects"
ONNX_MODEL_PATH = "/tmp/u2netp.onnx"
ONNX_MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx"

CANVAS_W = 1200
CANVAS_H = 900
WALL_RGB = (238, 235, 228)   # #EEEBE4 warm stone architectural studio backdrop
FLOOR_RGB = (229, 224, 213)  # #E5E0D5 studio floor plane
HORIZON_RGB = (213, 207, 195)

PROJECTS_MANIFEST = [
    {
        "id": "darbas-01",
        "filename": "giles-darbas-01.webp",
        "category": "boiler_retrofits",
        "categoryLabel": "Katilų perdarymas į granulinius",
        "title": "Ketinio katilo Viadrus U26 perdarymas su Megatherm MPB granulių degikliu",
        "location": "Kauno r.",
        "powerKw": "25–35 kW",
        "boilerModel": "Viadrus U26 (6 sekcijų ketinis katilas)",
        "burnerOrEquipment": "Megatherm MPB 35 kW savaime išsivalantis degiklis + CNC durelių flanšas",
        "resultMetric": "Darbo laikas 4–6 val. · Pilna automatika",
        "sourcePageUrl": "https://www.gilesinzinerija.com/montavimas/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2014/02/U26-MEGATHERM-1.jpg",
    },
    {
        "id": "darbas-02",
        "filename": "giles-darbas-02.webp",
        "category": "boiler_retrofits",
        "categoryLabel": "Katilų perdarymas į granulinius",
        "title": "Viadrus U26 katilinės mazgas su 460 L granulių bunkeriu ir sraigtu",
        "location": "Vilniaus r.",
        "powerKw": "30 kW",
        "boilerModel": "Viadrus U26 + 460 L cinkuotas granulių bunkeris",
        "burnerOrEquipment": "Komplektas „Link lyderių“ (Megatherm 10–35 kW + 1,5 m sraigtas + kompresorius)",
        "resultMetric": "Autonominis darbas 7–10 parų be papildymo",
        "sourcePageUrl": "https://www.gilesinzinerija.com/montavimas/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2014/02/U26-MEGATHERM-3.jpg",
    },
    {
        "id": "darbas-03",
        "filename": "giles-darbas-03.webp",
        "category": "boiler_retrofits",
        "categoryLabel": "Katilų perdarymas į granulinius",
        "title": "Plieninio katilo Buderus Logano S111 automatizavimas granulių degikliu",
        "location": "Kaunas",
        "powerKw": "24 kW",
        "boilerModel": "Buderus Logano S111 plieninis kieto kuro katilas",
        "burnerOrEquipment": "Pelltech PV20a granulių degiklis + 300 L kuro talpa + patalpos termostatas",
        "resultMetric": "Naudingumo koeficientas pakeltas iki 89 %",
        "sourcePageUrl": "https://www.gilesinzinerija.com/galerija/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2013/11/s111_buderus.jpg",
    },
    {
        "id": "darbas-04",
        "filename": "giles-darbas-04.webp",
        "category": "boiler_retrofits",
        "categoryLabel": "Katilų perdarymas į granulinius",
        "title": "Dakon DOR 32 katilo modernizavimas su Pelltech PV20a degikliu (Komplektas „Nord komfortui“)",
        "location": "Ukmergės r.",
        "powerKw": "32 kW",
        "boilerModel": "Dakon DOR 32 kieto kuro katilas",
        "burnerOrEquipment": "Pelltech PV20a (Estija) su akumuliatoriumi ir pneumatiniu šlako valymu",
        "resultMetric": "Savaiminis užsikūrimas ir moduliacija 8–20 kW",
        "sourcePageUrl": "https://www.gilesinzinerija.com/galerija/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2013/11/dakon_32_pv20.jpg",
    },
    {
        "id": "darbas-05",
        "filename": "giles-darbas-05.webp",
        "category": "boiler_retrofits",
        "categoryLabel": "Katilų perdarymas į granulinius",
        "title": "Individualaus namo katilo perdarymas su CNC pakrovimo durelių adapteriu",
        "location": "Trakų r.",
        "powerKw": "25 kW",
        "boilerModel": "Kieto kuro katilas su dvigubomis durelėmis ir ekonomaizeriu",
        "burnerOrEquipment": "Granulių degiklis + šilumokaičio užsklandos + automatinis sraigtas",
        "resultMetric": "Išsaugota galimybė kūrenti malkomis per 15 min.",
        "sourcePageUrl": "https://www.gilesinzinerija.com/galerija/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2013/11/DSCN0284.jpg",
    },
    {
        "id": "darbas-06",
        "filename": "giles-darbas-06.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "500 kW pramoninė konteinerinė biokuro katilinė GK-500 (gamyklinis surinkimas)",
        "location": "Kauno r.",
        "powerKw": "500 kW",
        "boilerModel": "Gilės GK-500 konteinerinis biokuro modulis (6 058 × 2 438 × 2 896 mm)",
        "burnerOrEquipment": "Pramoninis katilas su judančiomis ardelėmis, multiciklonu ir GSM/SCADA",
        "resultMetric": "-42 % šildymo sąnaudų lyginant su LPG dujomis",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_1231-500kw-scaled.jpg",
    },
    {
        "id": "darbas-07",
        "filename": "giles-darbas-07.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "750 kW pramoninė konteinerinė katilinė gamybiniam ir logistikos pastatui",
        "location": "Kėdainių r.",
        "powerKw": "750 kW",
        "boilerModel": "Gilės GK-750 modulinė pramoninė biokuro katilinė",
        "burnerOrEquipment": "Sraigtinis kuro tiekimas + pneumatinis šilumokaičio valymas + dūmsiurbė",
        "resultMetric": "Šildomas plotas iki 6 500 m² · Pilna telemetrija",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_1280-750kw-scaled.jpeg",
    },
    {
        "id": "darbas-08",
        "filename": "giles-darbas-08.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "2,0 MW modulinė pramoninė katilinė su kuro sandėliu ir dūmų valymo sistema",
        "location": "Šiaulių r.",
        "powerKw": "2 000 kW (2,0 MW)",
        "boilerModel": "Gilės GK-2000 pramoninis kaskadinis katilinės kompleksas",
        "burnerOrEquipment": "Walking-Floor kuro sandėlis + multiciklonas + automatinis pelenų šalinimas",
        "resultMetric": "Atitinka ES EcoDesign ir Aplinkos apsaugos normas",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_1304-2mw-scaled.jpg",
    },
    {
        "id": "darbas-09",
        "filename": "giles-darbas-09.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "Mobili konteinerinė katilinė (150–500 kW) nuomai, statyboms ir avariniam šildymui",
        "location": "Visoje Lietuvoje",
        "powerKw": "150–500 kW",
        "boilerModel": "Mobili hidraulinio šildymo katilinė ant priekabos / rėmo",
        "burnerOrEquipment": "Greito prijungimo DN50/DN65 movos + integruotas kuro bunkeris + GSM valdymas",
        "resultMetric": "Pristatymas ir pajungimas objekte per 24 val.",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2026/01/IMG_2942-mobili-scaled.jpg",
    },
    {
        "id": "darbas-10",
        "filename": "giles-darbas-10.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "500 kW konteinerinė dujinė katilinė sumontuota Šiauliuose ant pastato stogo",
        "location": "Šiauliai",
        "powerKw": "500 kW",
        "boilerModel": "Stoginė konteinerinė dujinė katilinė (Envira projektas #4281)",
        "burnerOrEquipment": "Kaskadiniai katilai + nerūdijančio plieno dūmtraukiai + siurblių grupė",
        "resultMetric": "Sumontuota ant stogo be vidaus ploto praradimo",
        "sourcePageUrl": "https://www.gilesinzinerija.com/katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2018/04/IMG_20171117_161616.jpg",
    },
    {
        "id": "darbas-11",
        "filename": "giles-darbas-11.webp",
        "category": "heat_pumps_boiler_rooms",
        "categoryLabel": "Šilumos siurbliai ir katilinės",
        "title": "200 kW katilinės šilumos mazgas, kolektoriai ir IMI TA balansavimo sistema",
        "location": "Šiauliai",
        "powerKw": "200 kW",
        "boilerModel": "Pramoninis šilumos mazgas (Envira projektas #4295)",
        "burnerOrEquipment": "Wilo Stratos/Yonos siurbliai + IMI TA STAD/STAP balansiniai vožtuvai + Pneumatex",
        "resultMetric": "Tikslus srautų balansavimas ir 30 % mažesnės el. sąnaudos",
        "sourcePageUrl": "https://www.gilesinzinerija.com/katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2018/04/IMG_20180116_170846.jpg",
    },
    {
        "id": "darbas-12",
        "filename": "giles-darbas-12.webp",
        "category": "service_automation",
        "categoryLabel": "Servisas ir automatika",
        "title": "25 kW katilinės su 2 šildymo kontūrais ir nuotoline GSM telemetrija įrengimas",
        "location": "Semeliškės (Elektrėnų sav.)",
        "powerKw": "25 kW",
        "boilerModel": "Automatinė katilinė su 2 kontūrų pamaišymo mazgu (Envira projektas #4345)",
        "burnerOrEquipment": "Danfoss / HERZ pamaišymo vožtuvai + GSM antena ir nuotolinis monitoringas",
        "resultMetric": "Pilnas montavimas iki rakto su 24 mėn. garantija",
        "sourcePageUrl": "https://www.gilesinzinerija.com/katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2018/06/DSC_0604.jpg",
    },
    {
        "id": "darbas-13",
        "filename": "giles-darbas-13.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "250 kW konteinerinė biokuro katilinė su 6,5 m izoliuotu dūmtraukiu",
        "location": "Kauno r.",
        "powerKw": "250 kW",
        "boilerModel": "Gilės GK-250 konteinerinė katilinė (Envira projektas #4384)",
        "burnerOrEquipment": "250 kW biokuro katilas + dūmtraukis + integruotas granulių bunkeris",
        "resultMetric": "Pastatoma ant pamatinių blokų be statybos leidimo",
        "sourcePageUrl": "https://www.gilesinzinerija.com/katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2018/06/250kw.jpg",
    },
    {
        "id": "darbas-14",
        "filename": "giles-darbas-14.webp",
        "category": "industrial_containers",
        "categoryLabel": "Pramoninės ir konteinerinės katilinės",
        "title": "Pramoninė biodujų katilinė su aktyvuotos anglies dujų filtravimo sistema",
        "location": "Radviliškio r.",
        "powerKw": "500 kW",
        "boilerModel": "Gilės biodujų ir biokuro pramoninis šilumos modulis",
        "burnerOrEquipment": "Biodujų filtrai + nerūdijančio plieno kolektoriai + pramoninis degiklis",
        "resultMetric": "Savaiminės biodujų energijos panaudojimas 92 % NK",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2026/01/bioduju-katiline-scaled.jpg",
    },
    {
        "id": "darbas-15",
        "filename": "giles-darbas-15.webp",
        "category": "heat_pumps_boiler_rooms",
        "categoryLabel": "Šilumos siurbliai ir katilinės",
        "title": "120 kW mobili granulinė karšto vandens ir šildymo katilinė Pellmobil",
        "location": "Vilnius",
        "powerKw": "120 kW",
        "boilerModel": "Pellmobil 120 kW su buitinio karšto vandens (BKV) ruošimo mazgu",
        "burnerOrEquipment": "2×60 kW granulių katilai + plokštelinis šilumokaitis + akumuliacinė talpa",
        "resultMetric": "Šildymas ir karštas vanduo iki 2 500 m² pastatui",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2024/01/karsto-vandens-120kw-1-scaled.jpg",
    },
    {
        "id": "darbas-16",
        "filename": "giles-darbas-16.webp",
        "category": "service_automation",
        "categoryLabel": "Servisas ir automatika",
        "title": "80–190 kW pramoninis karšto oro šildytuvas su automatikos ir serviso mazgu",
        "location": "Kaunas",
        "powerKw": "80–190 kW",
        "boilerModel": "Mobilus granulinis / dyzelinis karšto oro generatorius",
        "burnerOrEquipment": "Aukšto slėgio ventiliatoriai + lankstūs ortakiai + serviso diagnostikos pultas",
        "resultMetric": "Tiesioginis oro šildymas iki 12 000 m³/val. srautu",
        "sourcePageUrl": "https://www.gilesinzinerija.com/mobilios-katilines/",
        "sourceImageUrl": "https://www.gilesinzinerija.com/wp-content/uploads/2025/03/karsto-oro-sildytuvas-80-190kw-scaled.jpg",
    },
]


def ensure_u2netp_session() -> ort.InferenceSession:
    if not os.path.exists(ONNX_MODEL_PATH):
        req = urllib.request.Request(ONNX_MODEL_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(ONNX_MODEL_PATH, "wb") as f:
                f.write(resp.read())
    return ort.InferenceSession(ONNX_MODEL_PATH, providers=["CPUExecutionProvider"])


def compute_equipment_alpha(im: Image.Image, sess: ort.InferenceSession) -> np.ndarray:
    """
    Combine U2NetP neural saliency with spatial equipment preservation so distracting dark/cluttered
    cellar walls and ceilings around the perimeter are removed cleanly while the boiler, burner,
    hopper, piping, or container boiler room remains 100% solid and sharp.
    """
    rgb_320 = im.convert("RGB").resize((320, 320), Image.Resampling.BILINEAR)
    arr = np.asarray(rgb_320, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm = (arr - mean) / std
    inp = np.transpose(norm, (2, 0, 1))[None, :, :, :]

    input_name = sess.get_inputs()[0].name
    pred = sess.run(None, {input_name: inp})[0][0, 0]
    p_min, p_max = float(pred.min()), float(pred.max())
    if p_max - p_min > 1e-6:
        pred = (pred - p_min) / (p_max - p_min)
    else:
        pred = np.ones_like(pred)

    # Resize neural mask back to image resolution
    w, h = im.size
    mask_pil = Image.fromarray((pred * 255.0).astype(np.uint8), mode="L").resize(
        (w, h), Image.Resampling.BICUBIC
    )
    neural = np.asarray(mask_pil, dtype=np.float32) / 255.0

    # Also compute color/saturation cue (boilers/burners/pipes have strong red/orange/blue/brass/metal structure)
    rgb_full = np.asarray(im.convert("RGB"), dtype=np.float32)
    sat = (rgb_full.max(axis=2) - rgb_full.min(axis=2)) / 255.0

    # Spatial studio framing weight: preserve central equipment core and suppress noisy cellar wall corners/edges
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx / max(1.0, w - 1.0)) * 2.0 - 1.0
    ny = (yy / max(1.0, h - 1.0)) * 2.0 - 1.0
    dist_edge = np.maximum(np.abs(nx), np.abs(ny))
    core_boost = np.clip(1.15 - 0.85 * (dist_edge ** 2), 0.0, 1.0)
    corner_suppress = np.clip((1.03 - dist_edge) / 0.22, 0.0, 1.0)

    combined = np.clip(neural * 0.78 + core_boost * 0.34 + sat * 0.28, 0.0, 1.0)
    # Soft threshold to create solid equipment subject without internal holes
    alpha = np.clip((combined - 0.32) / 0.36, 0.0, 1.0) * corner_suppress

    # Ensure central equipment body is solid
    inner_core = np.clip(1.0 - (nx / 0.62) ** 4 - (ny / 0.66) ** 4, 0.0, 1.0)
    alpha = np.maximum(alpha, inner_core * 0.92)

    alpha_pil = Image.fromarray((alpha * 255.0).astype(np.uint8), mode="L")
    alpha_pil = alpha_pil.filter(ImageFilter.GaussianBlur(radius=max(3, min(w, h) // 140)))
    return np.asarray(alpha_pil, dtype=np.float32) / 255.0


def build_studio_backdrop() -> Image.Image:
    """
    Create a 1200x900 architectural studio canvas (#EEEBE4 wall + #E5E0D5 floor plane)
    whose outer borders match #EEEBE4 (238, 235, 228) for seamless card integration.
    """
    yy, xx = np.mgrid[0:CANVAS_H, 0:CANVAS_W].astype(np.float32)
    horizon_y = int(CANVAS_H * 0.78)  # y = 702

    wall = np.array(WALL_RGB, dtype=np.float32)
    floor = np.array(FLOOR_RGB, dtype=np.float32)

    is_floor = (yy >= horizon_y).astype(np.float32)[:, :, None]
    # Feather floor toward #EEEBE4 at the very bottom/edges so outer border is seamless
    edge_x = np.clip(np.minimum(xx, CANVAS_W - 1 - xx) / 90.0, 0.0, 1.0)[:, :, None]
    floor_weight = is_floor * edge_x * 0.85

    canvas = wall[None, None, :] * (1.0 - floor_weight) + floor[None, None, :] * floor_weight
    # Subtle center horizon line
    hx = (xx >= 100) & (xx <= CANVAS_W - 100)
    canvas[horizon_y : horizon_y + 1, :, :] = np.where(
        hx[horizon_y : horizon_y + 1, :, None],
        np.array(HORIZON_RGB, dtype=np.float32),
        canvas[horizon_y : horizon_y + 1, :, :],
    )
    return Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), mode="RGB")


def process_project_photo(raw_im: Image.Image, sess: ort.InferenceSession) -> Image.Image:
    im = ImageOps.exif_transpose(raw_im).convert("RGB")

    # 1. Auto-level & lift dark cellar shadows + crisp hardware contrast
    arr = np.asarray(im, dtype=np.float32) / 255.0
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    mean_lum = float(lum.mean())
    gamma = 0.84 if mean_lum < 0.45 else (0.92 if mean_lum < 0.58 else 0.98)
    arr = np.power(np.clip(arr, 0.0, 1.0), gamma)
    enhanced = Image.fromarray((arr * 255.0).astype(np.uint8), mode="RGB")
    enhanced = ImageEnhance.Contrast(enhanced).enhance(1.12)
    enhanced = ImageEnhance.Color(enhanced).enhance(1.06)
    enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.18)

    # 2. Extract foreground alpha & crop to equipment bounding box
    alpha = compute_equipment_alpha(enhanced, sess)
    rgba_arr = np.zeros((enhanced.height, enhanced.width, 4), dtype=np.uint8)
    rgba_arr[:, :, :3] = np.asarray(enhanced, dtype=np.uint8)
    rgba_arr[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)

    mask = rgba_arr[:, :, 3] > 28
    if mask.any():
        ys, xs = np.where(mask)
        cutout = Image.fromarray(rgba_arr, mode="RGBA").crop(
            (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        )
    else:
        cutout = Image.fromarray(rgba_arr, mode="RGBA")

    # 3. Fit onto 1200x900 #EEEBE4 studio canvas (82% width/height fill)
    target_w = int(CANVAS_W * 0.80)
    target_h = int(CANVAS_H * 0.80)
    scale = min(target_w / max(1, cutout.width), target_h / max(1, cutout.height))
    nw = max(1, int(round(cutout.width * scale)))
    nh = max(1, int(round(cutout.height * scale)))
    resized = cutout.resize((nw, nh), Image.Resampling.LANCZOS)

    studio_bg = build_studio_backdrop().convert("RGBA")

    # 4. Ground contact shadow on the #E5E0D5 floor plane
    ox = (CANVAS_W - nw) // 2
    oy = max(36, int(CANVAS_H * 0.78) - nh + int(nh * 0.08))
    if oy + nh > CANVAS_H - 28:
        oy = CANVAS_H - 28 - nh

    shadow_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    shadow_w = int(nw * 0.82)
    shadow_h = max(26, int(nh * 0.08))
    sx0 = (CANVAS_W - shadow_w) // 2
    sy0 = oy + nh - int(shadow_h * 0.55)
    s_draw.ellipse([sx0, sy0, sx0 + shadow_w, sy0 + shadow_h], fill=(17, 22, 27, 52))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=22))

    composited = Image.alpha_composite(studio_bg, shadow_layer)
    composited.paste(resized, (ox, oy), resized)
    return composited.convert("RGB")


def main() -> None:
    os.makedirs(CACHE_DIR, exist_ok=True)
    for out_dir in OUT_DIRS:
        os.makedirs(out_dir, exist_ok=True)

    sess = ensure_u2netp_session()
    manifest_out = []

    for item in PROJECTS_MANIFEST:
        fname = item["filename"]
        url = item["sourceImageUrl"]
        cache_file = os.path.join(CACHE_DIR, item["id"] + os.path.splitext(url)[1])
        if not os.path.exists(cache_file):
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=25) as resp:
                with open(cache_file, "wb") as f:
                    f.write(resp.read())

        raw_im = Image.open(cache_file)
        orig_w, orig_h = raw_im.size
        processed = process_project_photo(raw_im, sess)

        for out_dir in OUT_DIRS:
            dst = os.path.join(out_dir, fname)
            processed.save(dst, format="WEBP", quality=90, method=6)

        out_path = os.path.join(OUT_DIRS[0], fname)
        file_kb = round(os.path.getsize(out_path) / 1024.0, 1)
        print(
            f"Processed {fname} | src={orig_w}x{orig_h} -> studio={processed.size[0]}x{processed.size[1]} | {file_kb} KB"
        )
        manifest_out.append({
            **item,
            "publicPath": f"/studio-assets/projects/{fname}",
            "originalResolution": f"{orig_w}x{orig_h}",
            "studioResolution": f"{processed.size[0]}x{processed.size[1]}",
            "fileSizeKb": file_kb,
            "studioCanvasHex": "#EEEBE4",
            "floorPlaneHex": "#E5E0D5",
        })

    for out_dir in OUT_DIRS:
        with open(os.path.join(out_dir, "atlikti-darbai-manifest.json"), "w", encoding="utf-8") as f:
            json.dump(
                {
                    "generatedBy": "scripts/process-giles-atlikti-darbai.py",
                    "totalProjects": len(manifest_out),
                    "studioBackdrop": "#EEEBE4",
                    "floorPlane": "#E5E0D5",
                    "projects": manifest_out,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

    print(f"Done: {len(manifest_out)} real gilesinzinerija.com project photos processed to #EEEBE4 1200x900 .webp")


if __name__ == "__main__":
    main()
