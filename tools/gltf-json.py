#!/usr/bin/env python3
"""Converts .glb models to self-contained glTF JSON (buffers as data: URIs), for
hosts that serve .json but not .glb (the web preview). The game loads them when
window.AZ_MODEL_EXT = '.json'.

    python3 -I tools/gltf-json.py <dir with .glb> <out dir>
"""
import base64
import json
import os
import struct
import sys


def convert(src, dst):
    b = open(src, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack('<I', b[off:off + 4])[0]
    binc = b[off + 8:off + 8 + bl]
    j['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(binc).decode()
    open(dst, 'w').write(json.dumps(j, separators=(',', ':')))


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.glb'):
            convert(os.path.join(src, f), os.path.join(out, f[:-4] + '.json'))
            print(f, '->', f[:-4] + '.json', os.path.getsize(os.path.join(out, f[:-4] + '.json')))
