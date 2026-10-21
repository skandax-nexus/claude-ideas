#!/usr/bin/env python3
"""Prepares the CC0 PBR texture sets and HDR skies for the game (phones first):
textures are resized to 512 px JPEG (colour, normal, roughness; ORM split),
HDRIs are tone-mapped to 1024 x 512 JPEG equirects used for lighting and
reflections (all hosts can serve .jpg; .hdr is not served everywhere).

    python3 -I tools/prepare-textures.py <pbr source dir> <game/assets/textures>
Sources and licences: game/assets/textures/CREDITS.md
"""
import os
import sys

import numpy as np
from PIL import Image

SETS = {
    # name: (dir, {role: filename part})
    'asphalt': ('asphalt_cracked', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'pavement': ('pavement_concrete_blocks', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'concrete': ('concrete_wall', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'concrete2': ('concrete_wall_light', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'brick': ('brick_red', {'color': 'albedo', 'normal': 'normal', 'orm': 'orm'}),
    'metal': ('metal_painted', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'rust': ('metal_rusty_painted', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'bark': ('bark', {'color': 'diff', 'normal': 'nor_gl', 'rough': 'rough'}),
    'moss': ('forest_ground_moss', {'color': 'Color', 'normal': 'NormalGL', 'rough': 'Roughness'}),
    'rock': ('rock_mossy', {'color': 'diff', 'normal': 'nor_gl', 'rough': 'rough'}),
    'stone': ('stone_blocks_wall', {'color': 'color', 'normal': 'normal', 'rough': 'roughness'}),
}
HDRS = {'night': 'st_peters_square_night_1k.hdr', 'warehouse': 'empty_warehouse_01_1k.hdr', 'plant': 'peppermint_powerplant_1k.hdr', 'dusk': 'kloppenheim_05_1k.hdr'}
SIZE = 512


def find(d, part):
    for f in sorted(os.listdir(d)):
        if part.lower() in f.lower():
            return os.path.join(d, f)
    raise FileNotFoundError(f'{part} in {d}')


def save(img, path, size=SIZE):
    img = img.resize((size, size), Image.LANCZOS)
    img.save(path, 'JPEG', quality=84, optimize=True)


def read_hdr(path):
    data = open(path, 'rb').read()
    head, i = b'', 0
    lines = []
    while True:
        j = data.index(b'\n', i)
        line = data[i:j]
        i = j + 1
        lines.append(line)
        if line.startswith(b'-Y') or line.startswith(b'+Y'):
            break
    _, h, _, w = lines[-1].split()
    h, w = int(h), int(w)
    out = np.zeros((h, w, 4), np.uint8)
    p = i
    for y in range(h):
        # new-style RLE scanlines
        assert data[p] == 2 and data[p + 1] == 2
        p += 4
        for c in range(4):
            x = 0
            while x < w:
                n = data[p]
                p += 1
                if n > 128:
                    n -= 128
                    out[y, x:x + n, c] = data[p]
                    p += 1
                else:
                    out[y, x:x + n, c] = np.frombuffer(data[p:p + n], np.uint8)
                    p += n
                x += n
    e = out[..., 3].astype(np.float32)
    scale = np.where(e > 0, np.ldexp(1.0, (e - 136).astype(np.int32)), 0)
    return out[..., :3].astype(np.float32) * scale[..., None]


def main():
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for name, (d, roles) in SETS.items():
        d = os.path.join(src, d)
        if 'orm' in roles:
            orm = Image.open(find(d, roles['orm'])).convert('RGB')
            save(orm.getchannel('G').convert('RGB'), os.path.join(dst, f'{name}_rough.jpg'))
        else:
            save(Image.open(find(d, roles['rough'])).convert('RGB'), os.path.join(dst, f'{name}_rough.jpg'))
        save(Image.open(find(d, roles['color'])).convert('RGB'), os.path.join(dst, f'{name}_color.jpg'))
        save(Image.open(find(d, roles['normal'])).convert('RGB'), os.path.join(dst, f'{name}_normal.jpg'))
        print(name)
    wn = os.path.join(src, 'water', 'procedural_water_normal_gl_1k.jpg')  # CC0 (generated)
    save(Image.open(wn).convert('RGB'), os.path.join(dst, 'water_normal.jpg'))
    for name, f in HDRS.items():
        hdr = read_hdr(os.path.join(src, 'hdri', f))
        # tone map (exposure + Reinhard), gamma; keep highlights bright for reflections
        exp = 1.0 / max(1e-4, np.percentile(hdr.mean(axis=2), 70)) * 0.35
        x = hdr * exp
        x = x / (1 + x * 0.6)
        img = np.clip(np.power(np.clip(x, 0, None), 1 / 2.2) * 255, 0, 255).astype(np.uint8)
        Image.fromarray(img).resize((1024, 512), Image.LANCZOS).save(os.path.join(dst, f'sky_{name}.jpg'), 'JPEG', quality=86)
        print('sky', name)


if __name__ == '__main__':
    main()
