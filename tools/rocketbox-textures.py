#!/usr/bin/env python3
"""Shrinks one Microsoft Rocketbox avatar's textures for the game (phones first).
Called by tools/rocketbox-to-glb.mjs; it can also be run on its own:

    python3 -I tools/rocketbox-textures.py <avatar>/Textures <out dir> [color px] [normal px]

For every material part (body, head, hat, ...: files named <id>_<part>_<kind>.tga, where the id
is letters then digits: f004_, m112_, the children's cf001_ / cm012_, the soldiers' sm024_):
  <part>_color.jpg   colour, 1024 px (JPEG)
  <part>_normal.jpg  tangent-space normal map, 512 px
  <part>_rough.jpg   glTF metallic-roughness map, 512 px: the specular map turned
                     into roughness (G), metalness 0 (B)
Cut-out parts (hair, lashes, glasses: <id>_[<part>_]opacity_color.tga, RGBA)
become <part>_color.png with alpha, colour-quantised to stay small.
Accessories (hat, helmet, tools, glasses, stethoscope) are made at half size.
Colour maps that come in a named variant (<part>_color_acu, <part>_color_blue) count as the
plain colour map when the plain one is missing.
Flag patches listed in PAINT_OUT are painted out as blank patches before shrinking, and the
pieces listed in TRANSPLANT are covered with plain cloth from elsewhere in the same map.
Parts listed in the optional fifth argument (comma-separated, e.g. "pistol") are skipped: the
converter drops their triangles (RB_DROP).
The optional sixth argument names an edit (EDITS) made to one output's maps before they are shrunk:
'age' makes a face old (the Elder: her hair silvered, lines at the brow, the eyes, the mouth and the
neck in the colour and the normal map, the skin paler and less rosy, the lips paler), 'tomas' gives a
boy his own hair and freckles (Tomas Vale, on the body young Kai has too).
Prints one JSON object: {part: {color, normal, rough, alpha}} with the file names.
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

COLOR, NORMAL, ROUGH, ALPHA = 1024, 512, 512, 1024

# Insignia painted out of a colour map before it is shrunk (THE LAST VERSION's soldiers serve a
# fictional Continuum): colour-file stem -> search windows (x0, y0, x1, y1 on the 2048 px map).
# Inside a window, the flag's saturated red and blue texels give its box; the box (plus a margin)
# becomes a blank patch in the colour of the panel it is sewn on.
PAINT_OUT = {
    'sm024_body_color_acu': [(220, 1000, 500, 1260)],  # Military_Male_02: the sleeve flag
    'sm005_body_color_acu': [(220, 1000, 500, 1260)],  # Military_Male_04: the sleeve flag
}


# A piece of a colour map covered with plain cloth from the same map (THE LAST VERSION: the #38 on
# Male_Child_02's jersey, worn by the toy boy, Tomas and 2196's children, would read as a clue the
# story does not have): colour-file stem -> [(window (x0, y0, x1, y1 on the 2048 px map), the
# source's offset (dx, dy))]. The source is matched to the window's surroundings in colour and
# blended in over a feathered edge.
TRANSPLANT = {
    'cm012_body_color': [((822, 1146, 1222, 1468), (0, -800))],  # Male_Child_02: the jersey's 38
}


def transplant(img, pieces):
    img = img.convert('RGB')
    px = img.load()
    k = img.width / 2048
    for (x0, y0, x1, y1), (dx, dy) in pieces:
        x0, y0, x1, y1, dx, dy = (round(v * k) for v in (x0, y0, x1, y1, dx, dy))
        f = round(28 * k)  # the feathered edge

        def ring(ox, oy):
            # the mean colour of a band just outside the window (offset by ox, oy)
            vals = [px[x + ox, y + oy] for y in range(y0 - f, y1 + f) for x in range(x0 - f, x1 + f)
                    if not (x0 <= x < x1 and y0 <= y < y1)]
            return [sum(v[c] for v in vals) / len(vals) for c in range(3)]
        here, there = ring(0, 0), ring(dx, dy)
        shift = [here[c] - there[c] for c in range(3)]
        src = img.crop((x0 - f + dx, y0 - f + dy, x1 + f + dx, y1 + f + dy)).load()
        for y in range(y0 - f, y1 + f):
            for x in range(x0 - f, x1 + f):
                # weight 1 inside the window, falling to 0 across the feather
                d = min(x - (x0 - f), (x1 + f - 1) - x, y - (y0 - f), (y1 + f - 1) - y)
                w = min(1.0, d / f)
                s_ = src[x - (x0 - f), y - (y0 - f)]
                o = px[x, y]
                px[x, y] = tuple(max(0, min(255, round(o[c] * (1 - w) + (s_[c] + shift[c]) * w))) for c in range(3))
    return img


def paint_out(img, windows):
    img = img.convert('RGB')
    px = img.load()
    k = img.width / 2048
    for (x0, y0, x1, y1) in windows:
        x0, y0, x1, y1 = (round(v * k) for v in (x0, y0, x1, y1))
        xs, ys = [], []
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b = px[x, y]
                if (r > 140 and g < 90 and b < 90) or (b > 120 and r < 90 and g < 110):
                    xs.append(x)
                    ys.append(y)
        if len(xs) < 50:
            raise SystemExit(f'no insignia to paint out in {(x0, y0, x1, y1)}')
        m = round(8 * k)
        bx0, bx1, by0, by1 = min(xs) - m, max(xs) + m, min(ys) - m, max(ys) + m
        # the panel's colour: the median of a strip just under the patch
        strip = sorted(px[x, y] for y in range(by1 + 2, by1 + 2 + round(8 * k)) for x in range(bx0 + m, bx1 - m))
        base = strip[len(strip) // 2]
        for y in range(by0, by1 + 1):
            for x in range(bx0, bx1 + 1):
                n = ((x * 7919 + y * 104729) % 23) - 11  # a little woven noise
                px[x, y] = tuple(max(0, min(255, c + n)) for c in base)
    return img


# --- edits: one output's own maps (the sixth argument) -------------------------------------------------------------
# Places are on the 2048 px map, read off each avatar's own head map (its face in the middle, the hair round it, the
# eyes' and mouth's pieces in the lower left).

def _arr(img, mode='RGB'):
    return np.asarray(img.convert(mode), np.float32) / 255


def _img(a, mode='RGB'):
    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8), mode)


def _lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def _ramp(x, a, b):
    # 0 at a, 1 at b (falling when b < a)
    return np.clip((x - a) / (b - a), 0.0, 1.0)


def _boxes(shape, boxes, k):
    # boxes (x0, y0, x1, y1), or ellipses ('e', cx, cy, rx, ry)
    m = np.zeros(shape[:2], np.float32)
    for b in boxes:
        if b[0] == 'e':
            _, cx, cy, rx, ry = b
            yy, xx = np.ogrid[:shape[0], :shape[1]]
            m = np.maximum(m, (((xx / k - cx) / rx) ** 2 + ((yy / k - cy) / ry) ** 2 <= 1).astype(np.float32))
            continue
        x0, y0, x1, y1 = b
        m[round(y0 * k):round(y1 * k), round(x0 * k):round(x1 * k)] = 1
    return m


def _blur(m, r):
    return _arr(_img(m, 'L').filter(ImageFilter.GaussianBlur(r)), 'L')


def _curve(p0, p1, p2, n=12):
    # a quadratic Bezier through p1's pull, as a polyline
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
            for t in (i / n for i in range(n + 1))]


def _lines(size, strokes, k):
    # strokes: (points, width px, depth 0..1) -> a depth field 0..1 (a soft groove along each)
    H = np.zeros((size[1], size[0]), np.float32)
    for pts, w, d in strokes:
        layer = Image.new('L', size, 0)
        ImageDraw.Draw(layer).line([(x * k, y * k) for x, y in pts], fill=255, width=max(1, round(w * k)), joint='curve')
        H = np.maximum(H, _arr(layer.filter(ImageFilter.GaussianBlur(max(0.6, w * k * 0.45))), 'L') * d)
    return H


def _hair_mask(a, k, face, keep, dark=(0.31, 0.39), all_hair=()):
    # the hair painted on a head map: what is darker than skin, outside the face and the parts kept (ears, neck, the
    # eyes' and mouth's pieces), and all of the pieces that are only hair (a bun)
    covered = (a.sum(2) > 0.12).astype(np.float32)
    m = _ramp(_lum(a), dark[1], dark[0]) * covered * (1 - _blur(_boxes(a.shape, list(face) + list(keep), k), 4 * k))
    m = np.maximum(m, _boxes(a.shape, all_hair, k) * covered)
    return _blur(m, 1.5 * k) * covered


def _silver(a, m, lo=0.44, hi=0.93, tint=(1.0, 0.985, 0.955)):
    # grey to white by the hair's own light and shade (strands, roots and partings kept: brown hair is 0.05-0.3 light)
    v = lo + (hi - lo) * np.clip((_lum(a) - 0.05) / 0.25, 0, 1)
    g = v[..., None] * np.array(tint, np.float32)
    return a * (1 - m[..., None]) + g * m[..., None]


def _teal(a):
    # a bright teal hair tie
    return np.clip((a[..., 1] - a[..., 0] - 0.1) * 6, 0, 1) * np.clip((a[..., 2] - a[..., 0] - 0.05) * 6, 0, 1)


# Female_Adult_09 (the Elder): her face, read off f009_head_color
F009 = {
    # (the eyes, nostrils and mouth, the ears, the neck and the eyes' and mouth's pieces are not hair, however dark)
    'face': [(790, 530, 1260, 900)], 'keep': [('e', 495, 740, 92, 118), ('e', 1550, 740, 92, 118), (600, 1080, 1450, 1500), (0, 1180, 780, 2048)],
    'bun': [(1080, 1470, 2048, 2048)], 'brows': [(795, 478, 960, 528), (1055, 478, 1240, 528)], 'lips': [(915, 795, 1135, 875)],
    'lashes': [(1650, 1280, 2030, 1760)],
    'lines': [
        # the brow: three lines across the forehead, two between the brows
        (_curve((860, 365), (1025, 350), (1190, 365)), 7, 0.55), (_curve((870, 405), (1025, 392), (1180, 405)), 7, 0.6),
        (_curve((885, 442), (1025, 433), (1165, 442)), 6, 0.45), ([(1003, 515), (998, 562)], 6, 0.5), ([(1047, 515), (1052, 562)], 6, 0.5),
        # the eyes: crow's feet at the outer corners, the hollows and bags beneath
        ([(822, 568), (770, 548)], 5, 0.5), ([(820, 585), (760, 590)], 5, 0.55), ([(822, 602), (772, 630)], 5, 0.5),
        ([(1228, 568), (1280, 548)], 5, 0.5), ([(1230, 585), (1290, 590)], 5, 0.55), ([(1228, 602), (1278, 630)], 5, 0.5),
        (_curve((845, 612), (885, 634), (935, 615)), 8, 0.45), (_curve((1115, 615), (1165, 634), (1205, 612)), 8, 0.45),
        (_curve((850, 642), (890, 664), (935, 645)), 7, 0.35), (_curve((1115, 645), (1160, 664), (1200, 642)), 7, 0.35),
        # the mouth: the folds from the nose, the lines down from its corners, above the lip, the chin
        (_curve((968, 735), (920, 780), (906, 858)), 12, 0.75), (_curve((1082, 735), (1130, 780), (1144, 858)), 12, 0.75),
        ([(915, 870), (900, 940)], 9, 0.45), ([(1135, 870), (1150, 940)], 9, 0.45),
        ([(975, 772), (978, 796)], 3, 0.3), ([(1000, 770), (1001, 795)], 3, 0.3), ([(1050, 770), (1049, 795)], 3, 0.3), ([(1075, 772), (1072, 796)], 3, 0.3),
        (_curve((975, 962), (1025, 950), (1075, 962)), 8, 0.3), ([(868, 900), (880, 995)], 20, 0.25), ([(1182, 900), (1170, 995)], 20, 0.25),
        # the neck
        (_curve((800, 1150), (1025, 1178), (1250, 1150)), 8, 0.4), (_curve((820, 1240), (1025, 1264), (1230, 1240)), 8, 0.35),
    ],
    'spots': [(880, 420, 7), (1170, 330, 6), (1210, 470, 8), (840, 700, 7), (1240, 720, 6), (1300, 560, 9), (760, 500, 8), (1120, 760, 5)],
}


def age_head(img, f):
    k = img.width / 2048
    a = _arr(img)
    covered = (a.sum(2) > 0.12).astype(np.float32)
    hair = _hair_mask(a, k, f['face'], f['keep'], all_hair=f['bun'])
    brows = _blur(_ramp(_lum(a), 0.52, 0.36) * _boxes(a.shape, f['brows'], k), k)
    tie = _teal(a)
    # the skin paler and less rosy, the lips paler
    skin = (1 - hair) * covered
    L = _lum(a)[..., None]
    pale = L + (a - L) * 0.8
    pale = pale * 0.97 + 0.03 * np.array([0.92, 0.88, 0.82], np.float32)
    a = a * (1 - skin[..., None]) + pale * skin[..., None]
    lips = _blur(_boxes(a.shape, f['lips'], k), 8 * k)[..., None]
    L = _lum(a)[..., None]
    a = a * (1 - lips) + (L + (a - L) * 0.72) * lips
    # the lines: each a darker groove (the normal map gives it its edge in the light)
    H = _lines(img.size, f['lines'], k)
    a = a * (1 - 0.24 * H)[..., None]
    # a few age spots
    spots = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(spots)
    for x, y, r in f['spots']:
        d.ellipse([(x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k], fill=255)
    sp = _arr(spots.filter(ImageFilter.GaussianBlur(3 * k)), 'L')[..., None] * 0.3
    a = a * (1 - sp) + a * np.array([0.78, 0.68, 0.58], np.float32) * sp
    # the hair silver, the brows grey, the hair tie a dark cord
    a = _silver(a, hair)
    a = _silver(a, brows * 0.75, lo=0.42, hi=0.6)
    a = a * (1 - tie[..., None]) + np.array([0.22, 0.15, 0.1], np.float32) * tie[..., None]
    return _img(a)


def age_normal(img, f):
    # the lines as grooves in the normal map (tangent space, green up)
    k = img.width / 2048
    H = _blur(_lines(img.size, f['lines'], k), k)
    n = _arr(img) * 2 - 1
    gy, gx = np.gradient(H)
    s = 3.5 / k
    n[..., 0] += s * gx
    n[..., 1] -= s * gy
    n /= np.maximum(1e-6, np.linalg.norm(n, axis=2, keepdims=True))
    return _img(n * 0.5 + 0.5)


def age_hair(img, f):
    # the hair cards silver, the lashes a darker grey, the hair tie a dark cord
    k = img.width / 2048
    a = _arr(img, 'RGBA')
    rgb, alpha = a[..., :3], a[..., 3:]
    tie = _teal(rgb)
    lashes = _boxes(a.shape, f['lashes'], k)
    rgb = _silver(rgb, (1 - lashes) * (1 - tie))
    rgb = _silver(rgb, lashes, lo=0.3, hi=0.62)
    rgb = rgb * (1 - tie[..., None]) + np.array([0.22, 0.15, 0.1], np.float32) * tie[..., None]
    return _img(np.concatenate([rgb, alpha], axis=2), 'RGBA')


# Male_Child_01 (Tomas, on the body young Kai has too): his hair sandy, not Kai's dark brown, and freckles
CM001 = {
    'face': [(660, 375, 1390, 1150)], 'keep': [(420, 600, 600, 860), (1460, 600, 1640, 860), (0, 1200, 780, 2048)],
    'freckles': [(780, 600, 960, 730), (1090, 600, 1270, 730), (975, 600, 1075, 700)],
}


def tomas_head(img, f):
    k = img.width / 2048
    a = _arr(img)
    hair = _hair_mask(a, k, f['face'], f['keep'], dark=(0.36, 0.5))
    v = np.clip(0.42 + 1.25 * _lum(a), 0, 1)[..., None]
    sandy = v * np.array([0.86, 0.68, 0.46], np.float32)
    a = a * (1 - hair[..., None]) + sandy * hair[..., None]
    rng = np.random.default_rng(13)
    dots = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(dots)
    for x0, y0, x1, y1 in f['freckles']:
        for _ in range(int((x1 - x0) * (y1 - y0) / 900)):
            x, y, r = rng.uniform(x0, x1), rng.uniform(y0, y1), rng.uniform(2.5, 5)
            d.ellipse([(x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k], fill=int(rng.uniform(120, 255)))
    fr = _arr(dots.filter(ImageFilter.GaussianBlur(1.2 * k)), 'L')[..., None] * 0.35
    a = a * (1 - fr) + a * np.array([0.82, 0.66, 0.52], np.float32) * fr
    return _img(a)


# edit -> colour-file stem (or normal / opacity file) -> what is done to it, with the face it is done to
EDITS = {
    'age': {'f009_head_color': (age_head, F009), 'f009_head_normal': (age_normal, F009), 'f009_opacity_color': (age_hair, F009)},
    'tomas': {'cm001_head_color': (tomas_head, CM001)},
}


def fit(img, size):
    # never upscale; keep the aspect (some parts are 2:1)
    s = min(1.0, size / max(img.size))
    if s < 1:
        img = img.resize((max(4, round(img.width * s)), max(4, round(img.height * s))), Image.LANCZOS)
    return img


def roughness(spec):
    # Rocketbox specular maps are intensity (0 = matte cloth, ~0.6 = oily skin,
    # 1 = metal buckles): brighter specular -> smoother surface
    lum = spec.convert('L')
    g = lum.point(lambda v: int(max(0.28, min(0.95, 0.94 - (v / 255) * 0.62)) * 255))
    w, h = g.size
    return Image.merge('RGB', (Image.new('L', (w, h), 255), g, Image.new('L', (w, h), 0)))


def main():
    src, dst = sys.argv[1], sys.argv[2]
    color_px = int(sys.argv[3]) if len(sys.argv) > 3 else COLOR
    normal_px = int(sys.argv[4]) if len(sys.argv) > 4 else NORMAL
    drop = set(p for p in (sys.argv[5] if len(sys.argv) > 5 else '').split(',') if p)
    edit_name = sys.argv[6] if len(sys.argv) > 6 else ''
    if edit_name and edit_name not in EDITS:
        raise SystemExit(f'no edit {edit_name}')
    edit, edited = EDITS.get(edit_name, {}), set()
    os.makedirs(dst, exist_ok=True)
    parts = {}
    files = sorted(os.listdir(src))
    for f in files:
        m = re.match(r'^[a-z]+\d+_(\w+)\.tga$', f)
        if not m or 'wrinkle' in f:
            continue
        rest = m.group(1)
        # a colour map in a named variant (soldiers' _color_acu, a paramedic's _color_blue) is the
        # colour map, unless the plain one is there too
        v = re.match(r'^(\w+_color)_(acu|blue)$', rest)
        if v:
            if any(re.match(r'^[a-z]+\d+_' + v.group(1) + r'\.tga$', g) for g in files):
                continue
            rest = v.group(1)
        kind = next((k for k in ('opacity_color', 'color', 'normal', 'specular') if rest == k or rest.endswith('_' + k)), None)
        if not kind:
            continue
        # <id>_opacity_color is the hair/lash part ("opacity"); <id>_glasses_opacity_color the glasses
        part = rest[:-len(kind) - 1] if rest != kind else 'opacity'
        if part in drop:
            continue
        img = Image.open(os.path.join(src, f))
        if f[:-4] in edit:
            fn, face = edit[f[:-4]]
            img = fn(img, face)
            edited.add(f[:-4])
        p = parts.setdefault(part, {})
        # accessories (hat, helmet, tools, glasses, stethoscope) are small on screen: half size
        k = 1 if part in ('body', 'head', 'opacity') else 2
        if kind == 'opacity_color':
            rgba = fit(img.convert('RGBA'), min(ALPHA, color_px) // k)
            q = rgba.quantize(colors=64, method=Image.FASTOCTREE, dither=Image.NONE)
            name = f'{part}_color.png'
            q.save(os.path.join(dst, name), 'PNG', optimize=True)
            p['color'], p['alpha'] = name, True
        elif kind == 'color':
            if p.get('alpha'):
                continue
            name = f'{part}_color.jpg'
            stem = f[:-4]
            if stem in PAINT_OUT:
                img = paint_out(img, PAINT_OUT[stem])
            if stem in TRANSPLANT:
                img = transplant(img, TRANSPLANT[stem])
            fit(img.convert('RGB'), color_px // k).save(os.path.join(dst, name), 'JPEG', quality=80, optimize=True)
            p['color'] = name
        elif kind == 'normal':
            name = f'{part}_normal.jpg'
            fit(img.convert('RGB'), normal_px // k).save(os.path.join(dst, name), 'JPEG', quality=86, optimize=True)
            p['normal'] = name
        elif kind == 'specular':
            name = f'{part}_rough.jpg'
            roughness(fit(img, ROUGH // k)).save(os.path.join(dst, name), 'JPEG', quality=82, optimize=True)
            p['rough'] = name
    if set(edit) - edited:
        raise SystemExit(f'{edit_name}: no {sorted(set(edit) - edited)} in {src}')
    print(json.dumps(parts))


if __name__ == '__main__':
    main()
