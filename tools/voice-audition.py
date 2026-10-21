#!/usr/bin/env python3
"""The audition page for THE LAST VERSION's voice packs (OVERHAUL.md §8.5): N clips rendered since a time, on one
HTML page (each clip playable), with what Kokoro was asked to say, the phonemes it read it as, and automatic
checks of each recording (length for its text, level, clipping, a long gap inside). The pronunciation set
first: years, times, Jun, the Acts. Write it to the scratchpad and listen before committing a pack.

    python3 tools/voice-audition.py <repo> <lv-script dir> <cache dir> <since: epoch seconds> <out.html> [n=40]

(<lv-script dir> is what tools/voice-pack.mjs --edition lastversion wrote; <cache dir> what voice-pack.py cached.)
"""
import base64, glob, hashlib, html, io, json, os, random, re, subprocess, sys, wave

import numpy as np
from kokoro_onnx.tokenizer import Tokenizer

repo, scripts, cache, since, out = sys.argv[1:6]
N = int(sys.argv[6]) if len(sys.argv) > 6 else 40
since = float(since)
src = open(os.path.join(repo, 'tools/voice-pack.py')).read()
V = {m.group(1): (m.group(2), float(m.group(3)), float(m.group(4))) for m in re.finditer(r"'(\w+)': \('([\w*.+]+)', ([\d.]+), ([\d.]+)\)", src)}
tok = Tokenizer()

items = []
for f in sorted(glob.glob(os.path.join(scripts, '*/script.json'))):
    g = os.path.basename(os.path.dirname(f))
    for it in json.load(open(f)):
        v, sp, pf = V.get(it['voice'], V['NONE'])
        cid = hashlib.md5(f"{v}|{sp}|{pf}|{it['say']}".encode()).hexdigest()
        p = os.path.join(cache, cid + '.ogg')
        if os.path.exists(p) and os.path.getmtime(p) >= since:
            items.append({**it, 'group': g, 'spec': v, 'path': p})
print(f'{len(items)} new clips')
rnd = random.Random(5)
special = [x for x in items if re.search(r'\d|\bjun\b|\bact\b', x['key'])]
rnd.shuffle(special)
pick = special[: N // 2]
rest = [x for x in items if x not in pick]
rnd.shuffle(rest)
pick += rest[: N - len(pick)]

rows, flags = [], 0
for x in pick:
    pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', x['path'], '-f', 's16le', '-ac', '1', '-ar', '24000', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    dur = len(a) / 24000
    rms = float(np.sqrt(np.mean(a ** 2))) if len(a) else 0
    peak = float(np.max(np.abs(a))) if len(a) else 0
    # the longest stretch inside the clip quieter than -45 dBFS (20 ms frames)
    fr = a[: len(a) // 480 * 480].reshape(-1, 480)
    quiet = np.sqrt(np.mean(fr ** 2, axis=1)) < 10 ** (-45 / 20)
    gap, run = 0, 0
    for q in quiet[3:-3]:
        run = run + 1 if q else 0
        gap = max(gap, run)
    gap *= 0.02
    cps = len(x['say']) / max(dur, 0.01)
    ph = tok.phonemize(x['say'], 'en-gb' if x['spec'].startswith('b') else 'en-us')
    why = []
    if not 7 <= cps <= 24: why.append(f'{cps:.1f} chars/s')
    if rms < 0.02: why.append('quiet')
    if peak > 0.99: why.append('clips')
    if gap > 0.9: why.append(f'{gap:.1f} s gap')
    if why: flags += 1
    b64 = base64.b64encode(open(x['path'], 'rb').read()).decode()
    rows.append(f"<tr class='{'bad' if why else ''}'><td>{html.escape(x['group'])}</td><td>{html.escape(x['voice'])}<br><small>{html.escape(x['spec'])}</small></td>"
                f"<td>{html.escape(x['key'])}</td><td>{html.escape(x['say'])}<br><small>/{html.escape(ph)}/</small></td>"
                f"<td>{dur:.2f} s · {cps:.1f} c/s · rms {rms:.3f} · gap {gap:.2f} s{('<br><b>' + ', '.join(why) + '</b>') if why else ''}</td>"
                f"<td><audio controls preload='none' src='data:audio/ogg;base64,{b64}'></audio></td></tr>")
    print(f"{'FLAG ' if why else 'ok   '}{x['voice']:<12} {dur:5.2f}s {cps:5.1f}c/s rms {rms:.3f} gap {gap:.2f}  {x['say'][:60]!r} /{ph[:60]}/  {', '.join(why)}")
page = f"""<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>U5 audition</title>
<style>body{{font:14px system-ui,sans-serif;margin:16px;background:#f6f6f4;color:#222}}table{{border-collapse:collapse;width:100%}}td{{border-bottom:1px solid #ccc;padding:6px;vertical-align:top}}
small{{color:#666}}tr.bad{{background:#fde8e4}}</style>
<h1>THE LAST VERSION: audition of {len(pick)} new clips</h1><p>{len(items)} clips were rendered for U5. Pronunciation first: years, times, Jun, the Acts. {flags} flagged by the automatic checks.</p>
<table><tr><th>pack</th><th>voice</th><th>key (the subtitle)</th><th>what Kokoro said, and its phonemes</th><th>checks</th><th>listen</th></tr>{''.join(rows)}</table>"""
open(out, 'w').write(page)
print(f'{len(pick)} clips, {flags} flagged -> {out}')
