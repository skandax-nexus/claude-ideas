#!/usr/bin/env python3
"""Voices the dialogue of a recorded trailer with the Kokoro neural TTS.

tools/record-videos.mjs writes <film>.lines.json, one entry per subtitle line
spoken during the capture ({t, who, text, voice}). This script renders each line
with a voice that fits the speaker and writes <film>.voice.wav, a single track
with every line placed at its time (later lines wait for earlier ones to finish).

    python3 tools/voice-lines.py <film>.lines.json <out.wav> <kokoro_dir>

kokoro_dir holds kokoro-v1.0.int8.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases (pip install kokoro-onnx soundfile).
"""
import hashlib
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

SR = 24000
# speaker -> (kokoro voice, speed, pitch factor)
VOICES = {
    'JUNO': ('af_heart', 1.0, 1.0),
    'TICK': ('am_puck', 1.05, 1.32),  # a small drone: brighter and quicker
    'YOU': ('af_nova', 0.98, 1.0),
    'NONE': ('bf_emma', 0.95, 1.0),  # logs and narration
    'VARGA': ('bf_alice', 0.92, 0.96),
    'CUSTODIAN': ('bm_george', 0.9, 0.9),
    'OBSERVER': ('am_onyx', 0.86, 0.85),
    'OTHER': ('af_nova', 0.92, 0.94),
}
CREW = {
    'f': ['af_bella', 'af_sarah', 'af_jessica', 'bf_lily', 'af_river', 'af_kore'],
    'm': ['am_adam', 'am_michael', 'am_eric', 'bm_daniel', 'am_liam', 'bm_lewis'],
    'n': ['af_alloy', 'am_echo', 'af_kore', 'am_eric'],
}


def pick(line):
    who = line.get('who') or 'NONE'
    if who == 'CREW':
        v = line.get('voice') or {}
        pool = CREW.get(v.get('gender', 'n'), CREW['n'])
        key = int(hashlib.md5((line.get('name') or '').encode()).hexdigest(), 16)
        return pool[key % len(pool)], v.get('rate', 1.0), 1.0
    return VOICES.get(who, VOICES['NONE'])


def clean(text):
    t = re.sub(r'<[^>]+>', '', text)
    t = re.sub(r'\s+', ' ', t).strip()
    if t == t.upper():  # TICK and the records speak in capitals
        t = t.lower().capitalize()
    return t.replace(' - ', ', ')


def pitch(samples, factor):
    if abs(factor - 1) < 1e-3:
        return samples
    # resample to shift pitch (and pace) together, like a tape running faster
    n = int(len(samples) / factor)
    return np.interp(np.linspace(0, len(samples) - 1, n), np.arange(len(samples)), samples).astype(np.float32)


def main():
    lines_path, out, kdir = sys.argv[1], sys.argv[2], sys.argv[3]
    lines = json.load(open(lines_path))
    k = Kokoro(os.path.join(kdir, 'kokoro-v1.0.int8.onnx'), os.path.join(kdir, 'voices-v1.0.bin'))
    total = max([l['t'] for l in lines] + [0]) + 30
    track = np.zeros(int(total * SR), dtype=np.float32)
    free_at = 0.0
    for l in lines:
        text = clean(l['text'])
        if not text:
            continue
        voice, speed, pf = pick(l)
        s, sr = k.create(text, voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
        s = pitch(np.asarray(s, dtype=np.float32), pf)
        start = max(l['t'] + 0.15, free_at)
        i = int(start * SR)
        if i + len(s) > len(track):
            track = np.concatenate([track, np.zeros(i + len(s) - len(track), dtype=np.float32)])
        track[i:i + len(s)] += s * 0.9
        free_at = start + len(s) / SR + 0.2
        print(f'  {start:6.2f}s  {l["who"]:<9} {voice:<10} {text[:60]}')
    sf.write(out, track, SR)


if __name__ == '__main__':
    main()
