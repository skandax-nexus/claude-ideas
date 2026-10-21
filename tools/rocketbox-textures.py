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
Flag patches listed in PAINT_OUT are painted out as blank patches before shrinking.
Parts listed in the optional fifth argument (comma-separated, e.g. "pistol") are skipped: the
converter drops their triangles (RB_DROP).
Prints one JSON object: {part: {color, normal, rough, alpha}} with the file names.
"""
import json
import os
import re
import sys

from PIL import Image

COLOR, NORMAL, ROUGH, ALPHA = 1024, 512, 512, 1024

# Insignia painted out of a colour map before it is shrunk (THE LAST VERSION's soldiers serve a
# fictional Continuum): colour-file stem -> search windows (x0, y0, x1, y1 on the 2048 px map).
# Inside a window, the flag's saturated red and blue texels give its box; the box (plus a margin)
# becomes a blank patch in the colour of the panel it is sewn on.
PAINT_OUT = {
    'sm024_body_color_acu': [(220, 1000, 500, 1260)],  # Military_Male_02: the sleeve flag
    'sm005_body_color_acu': [(220, 1000, 500, 1260)],  # Military_Male_04: the sleeve flag
}


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
    print(json.dumps(parts))


if __name__ == '__main__':
    main()
