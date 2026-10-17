#!/usr/bin/env python3
"""Renders the game's voice pack with the Kokoro neural TTS.

tools/voice-pack.mjs writes script.json (every phrase and word the game can
speak, per speaker). This renders each one, trims and levels it, encodes it as
Ogg Opus and packs everything into game/assets/voice/voice.ogg (chained clips) + voice.json
({speaker: {key: [byteOffset, byteLength, seconds]}}).

    python3 tools/voice-pack.py <script.json> <game/assets/voice> <kokoro_dir> <ffmpeg> [cache_dir]

Each recording is cached (cache_dir, default <out>/.cache), so a long render can
be stopped and resumed, and re-running after a script change only renders what's new.
"""
import json
import hashlib
import os
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

SR = 24000
# speaker -> (kokoro voice, speed, pitch factor)
VOICES = {
    'JUNO': ('af_heart', 1.0, 1.0),
    'TICK': ('am_puck', 1.05, 1.32),
    'YOU': ('af_nova', 0.98, 1.0),
    'YOU_m': ('am_liam', 0.98, 1.0),
    'NONE': ('bf_emma', 0.95, 1.0),
    'VARGA': ('bf_alice', 0.92, 0.96),
    'CUSTODIAN': ('bm_george', 0.9, 0.9),
    'OBSERVER': ('am_onyx', 0.86, 0.85),
    'OTHER': ('af_nova', 0.92, 0.94),
    'DEVICE': ('af_sky', 1.0, 1.08),
    'CREW_f': ('af_bella', 1.0, 1.0),
    'CREW_m': ('am_michael', 0.97, 1.0),
    'CREW_n': ('af_kore', 0.99, 0.97),
}


def pitch(s, factor):
    if abs(factor - 1) < 1e-3:
        return s
    n = int(len(s) / factor)
    return np.interp(np.linspace(0, len(s) - 1, n), np.arange(len(s)), s).astype(np.float32)


def trim(s, thr=0.012, pad=0.03):
    idx = np.where(np.abs(s) > thr)[0]
    if not len(idx):
        return s
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(s), idx[-1] + int(pad * 1.5 * SR))
    s = s[a:b].copy()
    f = int(0.008 * SR)  # tiny fades so spliced pieces never click
    s[:f] *= np.linspace(0, 1, f)
    s[-f:] *= np.linspace(1, 0, f)
    return s


def main():
    script, outdir, kdir, ffmpeg = sys.argv[1:5]
    cache = sys.argv[5] if len(sys.argv) > 5 else os.path.join(outdir, '.cache')
    items = json.load(open(script))
    k = None
    os.makedirs(outdir, exist_ok=True)
    os.makedirs(cache, exist_ok=True)
    index, blob, total = {}, bytearray(), 0.0
    tmp = tempfile.mkdtemp()
    for i, it in enumerate(items):
        voice, speed, pf = VOICES.get(it['voice'], VOICES['NONE'])
        text = it['say']
        if it.get('word'):
            text = text + '.'  # names alone get a clean, complete reading
        cid = hashlib.md5(f"{voice}|{speed}|{pf}|{text}".encode()).hexdigest()
        cpath = os.path.join(cache, cid + '.ogg')
        if os.path.exists(cpath):
            data = open(cpath, 'rb').read()
            dur = float(open(cpath + '.dur').read())
            index.setdefault(it['voice'], {})[it['key']] = [len(blob), len(data), dur]
            blob += data
            total += dur
            continue
        if k is None:
            k = Kokoro(os.path.join(kdir, 'kokoro-v1.0.int8.onnx'), os.path.join(kdir, 'voices-v1.0.bin'))
        s, _ = k.create(text, voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
        s = trim(pitch(np.asarray(s, dtype=np.float32), pf))
        peak = np.max(np.abs(s)) or 1
        s = s * (0.89 / peak)
        wav, ogg = os.path.join(tmp, 'a.wav'), os.path.join(tmp, 'a.ogg')
        sf.write(wav, s, SR)
        subprocess.run([ffmpeg, '-loglevel', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', '18k', '-application', 'voip',
                        '-ac', '1', '-map_metadata', '-1', '-fflags', '+bitexact', ogg], check=True)
        data = open(ogg, 'rb').read()
        dur = round(len(s) / SR, 3)
        open(cpath, 'wb').write(data)
        open(cpath + '.dur', 'w').write(str(dur))
        index.setdefault(it['voice'], {})[it['key']] = [len(blob), len(data), dur]
        blob += data
        total += dur
        if i % 50 == 0:
            print(f'  {i}/{len(items)}  {it["voice"]:<9} {text[:60]}', flush=True)
    open(os.path.join(outdir, 'voice.ogg'), 'wb').write(blob)
    json.dump(index, open(os.path.join(outdir, 'voice.json'), 'w'), separators=(',', ':'))
    print(f'{len(items)} recordings, {total / 60:.1f} min, {len(blob) / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
