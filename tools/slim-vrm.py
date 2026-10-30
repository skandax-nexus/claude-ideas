#!/usr/bin/env python3
"""Slims a VRM (glTF) avatar for the game: drops the thumbnail, normal/spec maps
and every face morph except the few the game uses (blink, mouth shapes, smile),
downsizes textures to 1024 px and rewrites a compact GLB.

    python3 -I tools/slim-vrm.py in.vrm out.glb
"""
import io
import json
import struct
import sys

from PIL import Image

KEEP_MORPHS = ('Fcl_EYE_Close', 'Fcl_MTH_A', 'Fcl_MTH_I', 'Fcl_MTH_O', 'Fcl_ALL_Joy', 'Fcl_EYE_Joy')
MAX_TEX = 1024


def main():
    src, dst = sys.argv[1], sys.argv[2]
    b = open(src, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack('<I', b[off:off + 4])[0]
    binc = b[off + 8:off + 8 + bl]
    views = j['bufferViews']
    data = [binc[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in views]

    # materials: no normal / emissive maps (the game lights them itself)
    for m in j['materials']:
        for k in ('normalTexture', 'emissiveTexture', 'occlusionTexture'):
            m.pop(k, None)
        m.pop('extensions', None)  # MToon / unlit: the game builds its own materials
    j.get('extensions', {}).get('VRMC_vrm', {}).get('meta', {}).pop('thumbnailImage', None)
    for k in ('VRMC_springBone', 'VRMC_node_constraint'):
        j.get('extensions', {}).pop(k, None)
    j['extensionsUsed'] = [e for e in j.get('extensionsUsed', []) if e == 'VRMC_vrm']

    # face morphs: keep only the ones the game animates
    for me in j['meshes']:
        names = me.get('extras', {}).get('targetNames')
        if not names:
            continue
        keep = [i for i, n in enumerate(names) if n.split('.')[-1] in KEEP_MORPHS]
        for p in me['primitives']:
            if 'targets' in p:
                p['targets'] = [p['targets'][i] for i in keep]
            if p.get('extras', {}).get('targetNames'):
                p['extras']['targetNames'] = [names[i] for i in keep]
        me['extras']['targetNames'] = [names[i] for i in keep]
        if 'weights' in me:
            me['weights'] = [me['weights'][i] for i in keep]
    for n in j['nodes']:
        if 'weights' in n and 'mesh' in n:
            n['weights'] = [0] * len(j['meshes'][n['mesh']].get('extras', {}).get('targetNames', []))
    # VRM expressions point at morph indices: remap or drop
    vrm = j.get('extensions', {}).get('VRMC_vrm', {})
    for group in vrm.get('expressions', {}).values():
        for ex in group.values():
            ex['morphTargetBinds'] = []  # the game drives the kept morphs by name

    # which textures/images are still used
    used_tex = set()

    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k.endswith('Texture') and isinstance(v, dict) and 'index' in v:
                    used_tex.add(v['index'])
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(j['materials'])
    used_img = {j['textures'][t]['source'] for t in used_tex}

    # images: shrink the used ones, blank the rest
    tiny = io.BytesIO()
    Image.new('RGBA', (1, 1), (255, 255, 255, 255)).save(tiny, 'PNG')
    for i, im in enumerate(j['images']):
        bvi = im['bufferView']
        if i not in used_img:
            data[bvi] = tiny.getvalue()
            continue
        img = Image.open(io.BytesIO(data[bvi]))
        if max(img.size) > MAX_TEX:
            img = img.resize((min(MAX_TEX, img.size[0]), min(MAX_TEX, img.size[1])), Image.LANCZOS)
        out = io.BytesIO()
        if img.mode in ('RGBA', 'LA') and img.getextrema()[-1][0] < 255:
            img.save(out, 'PNG', optimize=True)
            im['mimeType'] = 'image/png'
        else:
            img.convert('RGB').save(out, 'JPEG', quality=86)
            im['mimeType'] = 'image/jpeg'
        data[bvi] = out.getvalue()

    # keep only buffer views something still references, and pack them
    used_acc = set()

    def acc_walk(o, key=None):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ('attributes',) and isinstance(v, dict):
                    used_acc.update(v.values())
                elif k == 'indices' and isinstance(v, int):
                    used_acc.add(v)
                elif k == 'targets' and isinstance(v, list):
                    for t in v:
                        used_acc.update(t.values())
                else:
                    acc_walk(v, k)
        elif isinstance(o, list):
            for v in o:
                acc_walk(v, key)
    acc_walk(j['meshes'])
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s:
            used_acc.add(s['inverseBindMatrices'])
    for a in j.get('animations', []):
        for smp in a['samplers']:
            used_acc.update([smp['input'], smp['output']])
    used_views = {j['accessors'][a]['bufferView'] for a in used_acc if 'bufferView' in j['accessors'][a]}
    for a in used_acc:  # morph targets are usually sparse accessors
        sp = j['accessors'][a].get('sparse')
        if sp:
            used_views |= {sp['indices']['bufferView'], sp['values']['bufferView']}
    used_views |= {im['bufferView'] for im in j['images']}
    remap, blob = {}, bytearray()
    for i, v in enumerate(views):
        if i not in used_views:
            continue
        while len(blob) % 4:
            blob.append(0)
        v2 = dict(v)
        v2['byteOffset'] = len(blob)
        v2['byteLength'] = len(data[i])
        remap[i] = len(remap)
        views[i] = v2
        blob += data[i]
    j['bufferViews'] = [views[i] for i in sorted(remap)]
    for i in used_acc:
        a = j['accessors'][i]
        if 'bufferView' in a:
            a['bufferView'] = remap[a['bufferView']]
        if 'sparse' in a:
            a['sparse']['indices']['bufferView'] = remap[a['sparse']['indices']['bufferView']]
            a['sparse']['values']['bufferView'] = remap[a['sparse']['values']['bufferView']]
    # accessors whose views were dropped are unused: point them at view 0 with zero count is invalid, so drop them
    old_acc = j['accessors']
    acc_map, new_acc = {}, []
    for i, a in enumerate(old_acc):
        if i in used_acc:
            acc_map[i] = len(new_acc)
            new_acc.append(a)
    j['accessors'] = new_acc

    def fix(o):
        if isinstance(o, dict):
            for k, v in list(o.items()):
                if k == 'attributes' and isinstance(v, dict):
                    o[k] = {kk: acc_map[vv] for kk, vv in v.items()}
                elif k == 'indices' and isinstance(v, int):
                    o[k] = acc_map[v]
                elif k == 'targets' and isinstance(v, list):
                    o[k] = [{kk: acc_map[vv] for kk, vv in t.items()} for t in v]
                else:
                    fix(v)
        elif isinstance(o, list):
            for v in o:
                fix(v)
    fix(j['meshes'])
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s:
            s['inverseBindMatrices'] = acc_map[s['inverseBindMatrices']]
    for a in j.get('animations', []):
        for smp in a['samplers']:
            smp['input'], smp['output'] = acc_map[smp['input']], acc_map[smp['output']]
    for im in j['images']:
        im['bufferView'] = remap[im['bufferView']]
    while len(blob) % 4:
        blob.append(0)
    j['buffers'] = [{'byteLength': len(blob)}]

    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(blob), 0x004E4942) + bytes(blob))
    print(f'{src}: {len(b) / 1e6:.2f} MB -> {total / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
