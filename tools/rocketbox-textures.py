#!/usr/bin/env python3
"""Shrinks one Microsoft Rocketbox avatar's textures for the game (phones first).
Called by tools/rocketbox-to-glb.mjs; it can also be run on its own:

    python3 -I tools/rocketbox-textures.py <avatar>/Textures <out dir> [color px] [normal px]

For every material part (body, head, hat, ...: files named <id>_<part>_<kind>.tga):
  <part>_color.jpg   colour, 1024 px (JPEG)
  <part>_normal.jpg  tangent-space normal map, 512 px
  <part>_rough.jpg   glTF metallic-roughness map, 512 px: the specular map turned
                     into roughness (G), metalness 0 (B)
Cut-out parts (hair, lashes, glasses: <id>_[<part>_]opacity_color.tga, RGBA)
become <part>_color.png with alpha, colour-quantised to stay small.
Accessories (hat, helmet, tools, glasses, stethoscope) are made at half size.
Prints one JSON object: {part: {color, normal, rough, alpha}} with the file names.
"""
import json
import os
import re
import sys

from PIL import Image

COLOR, NORMAL, ROUGH, ALPHA = 1024, 512, 512, 1024


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
    os.makedirs(dst, exist_ok=True)
    parts = {}
    for f in sorted(os.listdir(src)):
        m = re.match(r'^[a-z]\d+_(\w+)\.tga$', f)
        if not m or 'wrinkle' in f:
            continue
        rest = m.group(1)
        kind = next((k for k in ('opacity_color', 'color', 'normal', 'specular') if rest == k or rest.endswith('_' + k)), None)
        if not kind:
            continue
        # <id>_opacity_color is the hair/lash part ("opacity"); <id>_glasses_opacity_color the glasses
        part = rest[:-len(kind) - 1] if rest != kind else 'opacity'
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
