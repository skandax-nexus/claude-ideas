#!/usr/bin/env python3
"""Renders the game's voice pack with the Kokoro neural TTS.

tools/voice-pack.mjs writes script.json (every phrase and word the game can
speak, per speaker). This renders each one, trims and levels it, encodes it as
Ogg Opus and packs everything into game/assets/voice/voice.ogg (chained clips) + voice.json
({speaker: {key: [byteOffset, byteLength, seconds]}}).

    python3 tools/voice-pack.py <script.json> <game/assets/voice> <kokoro_dir> <ffmpeg> [cache_dir]
    python3 tools/voice-pack.py --check <script.json> <game/assets/voice> [cache_dir]   (is the pack up to date?)

Each recording is cached (cache_dir, default <out>/.cache), so a long render can
be stopped and resumed, and re-running after a script change only renders what's new.

A voice may be a blend of Kokoro voices, 'a*w+b*w' (the weighted sum of their styles): THE LAST
VERSION OF EARTH builds the same person's voices on one base (OVERHAUL.md §8.4). An item may carry
its Opus bitrate in kbps ('br'; the edition's speech is 16, its barks and hints 12; default 18).
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
    'OTHER_m': ('am_liam', 0.92, 0.94),
    'DEVICE': ('af_sky', 1.0, 1.08),
    'CREW_f': ('af_bella', 1.0, 1.0),
    'CREW_m': ('am_michael', 0.97, 1.0),
    'CREW_n': ('af_kore', 0.99, 0.97),
    # AFTERZERO: THE LAST VERSION OF EARTH (v2.0): one distinct voice per speaker
    'KAI': ('am_eric', 0.98, 0.98),
    'MIRA': ('af_river', 0.96, 1.02),
    'WITNESS': ('am_eric*0.6+am_fenrir*0.4', 0.88, 0.9),
    'ROOK': ('bm_lewis', 0.94, 0.95),
    'NIKO': ('am_echo', 1.0, 1.02),
    'SERA': ('af_jessica', 1.02, 0.98),
    'ANJA': ('bf_isabella', 0.95, 1.0),
    'IVEN': ('bm_fable', 1.0, 0.96),
    'JUN': ('bm_daniel', 1.02, 1.0),
    'TALA': ('af_aoede', 0.95, 1.0),
    'MARA': ('bf_lily', 0.92, 0.98),
    'ORREN': ('am_adam', 0.86, 0.88),
    'CHILD': ('af_river', 1.02, 1.2),
    # v2.1 (OVERHAUL.md §8.4): the same person shares a base voice. The Witness is Kai after years without
    # sleep (the VOICE in every speaker is his, recorded as WITNESS); Lin and the Child are built on Mira's
    'KAI12': ('am_eric*0.5+am_puck*0.5', 1.05, 1.25),
    'LIN': ('af_river*0.7+af_heart*0.3', 1.0, 0.97),
    # tier 2: named people with a voice of their own
    'PRYCE': ('af_sarah', 0.97, 0.96),
    'DALE': ('am_liam', 0.97, 0.96),
    'HAIG': ('af_sky*0.6+af_alloy*0.4', 1.06, 1.02),
    'ELDER': ('bf_alice*0.6+bf_emma*0.4', 0.86, 0.9),
    'CLOCKMAKER': ('bm_george', 0.88, 0.9),
    'RHEA': ('af_nova', 1.02, 0.98),
    'SERGEANT': ('am_onyx', 0.95, 0.94),
    'ODILE': ('af_sarah*0.4+bf_lily*0.6', 0.93, 0.95),
    'WARDEN': ('am_michael*0.5+am_onyx*0.5', 0.95, 0.95),
    'GARDENER': ('af_kore', 0.96, 1.02),
    'FLORIST': ('af_bella*0.5+bf_alice*0.5', 0.98, 1.0),
    'RECEPTIONIST': ('af_kore*0.5+af_nova*0.5', 1.02, 1.0),
    'DIRECTOR': ('bm_lewis*0.5+am_onyx*0.5', 0.9, 0.9),
    'PA': ('bf_alice', 0.98, 1.0),
    # the crowds: a voice by casting's sex and age (npcs.js AMBIENT voices)
    'CROWD_F': ('af_bella', 1.0, 1.0),
    'CROWD_F2': ('af_kore*0.5+af_sarah*0.5', 1.0, 0.98),
    'CROWD_M': ('am_michael', 0.97, 1.0),
    'CROWD_M2': ('am_puck', 0.98, 0.9),
    'CROWD_OLD_F': ('bf_lily*0.5+bf_alice*0.5', 0.9, 0.92),
    'CROWD_OLD_M': ('am_santa', 0.9, 0.95),
    'CROWD_CHILD': ('af_nicole*0.6+am_puck*0.4', 1.05, 1.2),
}


def style(k, spec):
    """A Kokoro voice name, or a blend 'a*w+b*w': the weighted sum of the voices' styles."""
    if '*' not in spec:
        return spec
    out = None
    for part in spec.split('+'):
        name, w = part.split('*')
        v = k.get_voice_style(name) * float(w)
        out = v if out is None else out + v
    return out.astype(np.float32)


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


def cache_id(it):
    voice, speed, pf = VOICES.get(it['voice'], VOICES['NONE'])
    text = it['say'] + ('.' if it.get('word') else '')
    return hashlib.md5(f"{voice}|{speed}|{pf}|{text}".encode()).hexdigest()


def check(script, outdir, cache):
    """--check: is the pack in outdir exactly what a render of script.json would write (every recording there, from
    the cache, byte for byte)? Prints what is stale and exits 1 if anything is, without rendering anything."""
    items = json.load(open(script))
    try:
        index = json.load(open(os.path.join(outdir, 'voice.json')))
        blob = open(os.path.join(outdir, 'voice.ogg'), 'rb').read()
    except OSError:
        print(f'{outdir}: no pack yet ({len(items)} recordings to render)')
        sys.exit(1)
    unrendered, differ, missing = [], [], []
    for it in items:
        cpath = os.path.join(cache, cache_id(it) + '.ogg')
        ref = index.get(it['voice'], {}).get(it['key'])
        if not os.path.exists(cpath):
            unrendered.append(it)
        elif not ref:
            missing.append(it)
        elif blob[ref[0]:ref[0] + ref[1]] != open(cpath, 'rb').read():
            differ.append(it)
    want = {(it['voice'], it['key']) for it in items}
    extra = sum(1 for v, lib in index.items() for k in lib if (v, k) not in want)
    for label, lst in (('not rendered yet', unrendered), ('not in the pack', missing), ('in the pack, from older text', differ)):
        for it in lst[:8]:
            print(f'  {label}: {it["voice"]}: {it["say"][:80]}')
        if len(lst) > 8:
            print(f'  ... and {len(lst) - 8} more {label}')
    stale = bool(unrendered or missing or differ or extra)
    print(f'{outdir}: {"STALE" if stale else "up to date"} ({len(items)} recordings; {len(unrendered)} not rendered, {len(missing)} not in the pack, '
          f'{len(differ)} from older text, {extra} no longer said)')
    sys.exit(1 if stale else 0)


def main():
    if sys.argv[1] == '--check':
        out = sys.argv[3]
        return check(sys.argv[2], out, sys.argv[4] if len(sys.argv) > 4 else os.path.join(out, '.cache'))
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
        cid = cache_id(it)
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
        s, _ = k.create(text, voice=style(k, voice), speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
        s = trim(pitch(np.asarray(s, dtype=np.float32), pf))
        peak = np.max(np.abs(s)) or 1
        s = s * (0.89 / peak)
        wav, ogg = os.path.join(tmp, 'a.wav'), os.path.join(tmp, 'a.ogg')
        sf.write(wav, s, SR)
        subprocess.run([ffmpeg, '-loglevel', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', f"{it.get('br', 18)}k", '-application', 'voip',
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
