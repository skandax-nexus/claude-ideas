#!/usr/bin/env python3
"""A machine's ear over THE LAST VERSION's voice packs (game/assets/voice/lv/<group>/): each clip is cut from its pack,
decoded the way a browser decodes it, and heard back by a speech recogniser (Whisper small.en through sherpa-onnx),
then checked: every number word and every name it should say heard, most of its other words heard, its decoded
peak under full scale, its pace and its gaps. A clip the recogniser cannot place is flagged, with what it heard,
for a person (or the lexicon) to decide.

    python3 tools/voice-ear.py <repo> <lv-script dir> <whisper dir> <out dir> [n=240] [--all] [--seed=7] [--only=key|key]
    python3 tools/voice-ear.py <repo> <lv-script dir> - <out dir> --rescore=<an earlier ear.json>   (judge again, hear nothing)
    python3 tools/voice-ear.py <repo> <lv-script dir> - <out dir> --peaks   (every clip's decoded peak; those at full scale)
    --grep=<regex> hears only the clips whose text matches (--grep=seventeen); --only-file=<file> the keys listed in a file, '|' between

<lv-script dir>: what `node tools/voice-pack.mjs <dir> --edition lastversion` wrote (tools/voice-lv.sh writes it).
<whisper dir>: sherpa-onnx-whisper-small.en (small.en-encoder.int8.onnx, small.en-decoder.int8.onnx, small.en-tokens.txt;
https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models), with pip install sherpa-onnx numpy.
Without --all it hears n clips across every pack: every clip that says a number or the lexicon's names first (up to
half of n, spread over the packs), the rest drawn at random from each pack in proportion to its size. It writes
<out dir>/ear.json (every clip heard, its checks and flags) and <out dir>/ear.html (flagged clips first, each
playable). Exit status 0 always: the flags are for reading.
"""
import base64, html, json, os, random, re, subprocess, sys

import numpy as np

repo, scripts, wdir, out = sys.argv[1:5]
rest = sys.argv[5:]
N = next((int(a) for a in rest if a.isdigit()), 240)
ALL = '--all' in rest
SEED = next((int(a.split('=')[1]) for a in rest if a.startswith('--seed=')), 7)
ONLY = next((set(a.split('=', 1)[1].split('|')) for a in rest if a.startswith('--only=')), None)
ONLY = next((set(open(a.split('=', 1)[1]).read().strip().split('|')) for a in rest if a.startswith('--only-file=')), ONLY)
GREP = next((re.compile(a.split('=', 1)[1], re.I) for a in rest if a.startswith('--grep=')), None)
PEAKS = '--peaks' in rest
GROUPS = ['common', 'prologue', 'act1', 'act2', 'act3', 'act4', 'finale', 'cases']
os.makedirs(out, exist_ok=True)

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
NUMS = set(ONES) | set(TENS[2:]) | {'hundred', 'thousand', 'oh', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
                                    'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
                                    'eighteenth', 'nineteenth', 'twentieth', 'thirtieth', 'fortieth', 'percent'}
NUMS.discard('second')  # (a unit of time as often as an ordinal)
NUMS.discard('oh')
ORD = {'one': 'first', 'two': 'second', 'three': 'third', 'five': 'fifth', 'eight': 'eighth', 'nine': 'ninth', 'twelve': 'twelfth'}


def nw(n):
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000: return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' and ' + nw(n % 100))
    if 1000 <= n <= 2199 and n % 100: return nw(n // 100) + ' ' + (('oh ' + ONES[n % 100]) if n % 100 < 10 else nw(n % 100))  # (a year: 1077 BC, ten seventy-seven)
    if n < 1000000: return nw(n // 1000) + ' thousand' + ('' if n % 1000 == 0 else ' ' + nw(n % 1000))
    return str(n)


def ordw(n):
    w = nw(n).split()
    last = w[-1]
    w[-1] = ORD.get(last) or (last[:-1] + 'ieth' if last.endswith('y') else last + 'th')
    return ' '.join(w)


def norm(s):
    """What was said as words: digits, times, ordinals and percentages in words, as the lexicon writes them."""
    s = s.lower().replace('’', "'")
    s = re.sub(r'\b([a-z])\.(?=[a-z]\.)', r'\1', s)  # (B.C. as one word, as a recogniser writes it: bc)
    s = re.sub(r'\b(thir|four|fif|six|seven|eigh|nine)-teen', r'\1teen', s)  # (the lexicon's seven-teen is seventeen)
    s = s.replace('oh-deel', 'odile').replace('reeya', 'rhea')
    s = re.sub(r'\b(\d{1,2}):(\d{2})\b', lambda m: (('oh ' + ONES[int(m[1])]) if m[1][0] == '0' and len(m[1]) == 2 else nw(int(m[1]))) + ' '
               + ("o'clock" if m[2] == '00' else ('oh ' + ONES[int(m[2])]) if int(m[2]) < 10 else nw(int(m[2]))), s)
    s = re.sub(r'(\d),(\d{3})', r'\1\2', s)
    s = re.sub(r'(\d)([a-z])\b', r'\1 \2', s)  # (41B: forty-one B)
    s = re.sub(r'\b(\d+)(st|nd|rd|th)\b', lambda m: ordw(int(m[1])), s)
    s = re.sub(r'(\d+)\s?%', lambda m: nw(int(m[1])) + ' percent', s)
    s = re.sub(r'\d+', lambda m: nw(int(m[0])), s)
    s = s.replace('-', ' ')
    return re.sub(r"[^a-z' ]", ' ', s).split()


def readings(s):
    """Other ways a recogniser's digits may have been said: 804 as 'eight oh four', 1540 as 'fifteen forty'."""
    out = []
    for m in re.findall(r'\d{3,4}', s.replace(',', '')):
        n = int(m)
        hi, lo = n // 100, n % 100
        out += nw(hi).split() + (['oh', ONES[lo]] if lo < 10 else nw(lo).split())
    return out


# words a recogniser writes for another that sounds the same
HOMO = {'four': {'for', 'fore'}, 'two': {'to', 'too'}, 'one': {'won'}, 'eight': {'ate'}, 'oh': {'o', 'owe'}, 'by': {'bye', 'buy'},
        'there': {'their', "they're"}, 'their': {'there', "they're"}, 'its': {"it's"}, "it's": {'its'}, 'right': {'write'}, 'no': {'know'},
        'know': {'no'}, 'hear': {'here'}, 'here': {'hear'}, 'see': {'sea'}, 'sea': {'see'}, 'one\'s': {'ones'}, 'whole': {'hole'}, 'hole': {'whole'}}


def stem(w):
    return w.strip("'").removesuffix("'s")


def lev(a, b):
    if a == b: return 0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def sounds(w):
    """A rough sound key for names a recogniser spells its own way (Kai/Kye, Joon/June, Varen/Varin)."""
    w = re.sub(r'[^a-z]', '', w.lower())
    if not w: return ''
    w = w.replace('ph', 'f').replace('ck', 'k').replace('c', 'k').replace('q', 'k').replace('x', 'ks').replace('z', 's').replace('y', 'i')
    head, tail = w[0], re.sub(r'[aeiouhw]', '', w[1:])
    return head + re.sub(r'(.)\1+', r'\1', tail)


def name_heard(n, have):
    k = sounds(n)
    for h in have:
        if h == n or lev(h, n) <= max(1, len(n) // 4) or (k and sounds(h) == k):
            return True
    return False


# the packs and what each clip says
items = []
for g in GROUPS:
    sj = os.path.join(scripts, g, 'script.json')
    pj = os.path.join(repo, 'game/assets/voice/lv', g, 'voice.json')
    if not os.path.exists(sj) or not os.path.exists(pj): continue
    say = {(it['voice'], it['key']): it['say'] for it in json.load(open(sj))}
    idx = json.load(open(pj))
    for voice, lib in idx.items():
        for key, (off, ln, sec) in lib.items():
            s = say.get((voice, key))
            if s is None: continue
            items.append({'group': g, 'voice': voice, 'key': key, 'say': s, 'off': off, 'len': ln, 'sec': sec})
print(f'{len(items)} clips in {len(GROUPS)} packs')

# names: a word in capitals inside a sentence (not its first word, not I), anywhere in the script
caps = {}
for it in items:
    for sent in re.split(r'(?<=[.!?])\s+', it['say']):
        ws = re.findall(r"[A-Za-z][A-Za-z']*", sent)
        for w in ws[1:]:
            if w[0].isupper() and w not in ('I', "I'm", "I'll", "I've", "I'd") and not w.isupper():
                caps[stem(w.lower())] = caps.get(stem(w.lower()), 0) + 1
lower = {}
for it in items:
    for w in re.findall(r"\b[a-z][a-z']*\b", it['say']):
        lower[stem(w)] = lower.get(stem(w), 0) + 1
SPEAKERS = {v.lower() for it in items for v in [it['voice']] if v.isalpha() and not v.startswith('CROWD') and v not in ('NONE', 'PA', 'CHILD', 'ELDER', 'WITNESS', 'GARDENER', 'WARDEN', 'FLORIST', 'RECEPTIONIST', 'DIRECTOR', 'SERGEANT', 'CLOCKMAKER')}
NAMES = {w for w, c in caps.items() if c >= 3 * lower.get(w, 0) and len(w) > 2} | (SPEAKERS - {'kai12'})


def kinds(it):
    ws = [stem(w) for w in norm(it['say'])]
    return [w for w in ws if w in NUMS], [w for w in ws if w in NAMES]


for it in items:
    it['nums'], it['names'] = kinds(it)

if ONLY:
    pick = [it for it in items if it['key'] in ONLY]
elif GREP:
    pick = [it for it in items if GREP.search(it['say'])]
elif ALL:
    pick = list(items)
else:
    rnd = random.Random(SEED)
    pick, seen = [], set()
    special = [it for it in items if it['nums'] or it['names']]
    rnd.shuffle(special)
    bygroup = {}
    for it in special: bygroup.setdefault(it['group'], []).append(it)
    # numbers and names first, round-robin over the packs, up to half
    while len(pick) < N // 2 and any(bygroup.values()):
        for g in GROUPS:
            if bygroup.get(g) and len(pick) < N // 2:
                it = bygroup[g].pop()
                pick.append(it); seen.add(id(it))
    left = N - len(pick)
    for g in GROUPS:
        pool = [it for it in items if it['group'] == g and id(it) not in seen]
        rnd.shuffle(pool)
        k = round(left * sum(1 for it in items if it['group'] == g) / len(items))
        for it in pool[:k]:
            pick.append(it); seen.add(id(it))
print(f'hearing {len(pick)} clips ({sum(1 for it in pick if it["nums"])} with numbers, {sum(1 for it in pick if it["names"])} with names)')

if PEAKS:
    # every clip decoded as a browser decodes it (48 kHz), its peak measured; no recogniser
    blobs0, out_rows = {}, []
    for i, it in enumerate(items):
        if it['group'] not in blobs0:
            blobs0[it['group']] = open(os.path.join(repo, 'game/assets/voice/lv', it['group'], 'voice.ogg'), 'rb').read()
        data = blobs0[it['group']][it['off']:it['off'] + it['len']]
        x = np.frombuffer(subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'pipe:0', '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'],
                                         input=data, capture_output=True, check=True).stdout, dtype=np.float32)
        pk = float(np.max(np.abs(x))) if len(x) else 0
        out_rows.append({'group': it['group'], 'voice': it['voice'], 'key': it['key'], 'say': it['say'], 'peak': round(pk, 4)})
        if pk >= 0.999: print(f"FULL SCALE {pk:.4f} {it['group']:<8} {it['voice']:<12} {it['key']} {it['say'][:60]!r}", flush=True)
    full = [r for r in out_rows if r['peak'] >= 0.999]
    json.dump({'clips': len(out_rows), 'full_scale': len(full), 'max': max(r['peak'] for r in out_rows), 'rows': full}, open(os.path.join(out, 'peaks.json'), 'w'), indent=1)
    print(json.dumps({'clips': len(out_rows), 'full_scale': len(full), 'max': max(r['peak'] for r in out_rows)}))
    sys.exit(0)

import sherpa_onnx  # noqa: E402

rec = None if any(a.startswith('--rescore=') for a in rest) else sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=os.path.join(wdir, 'small.en-encoder.int8.onnx'), decoder=os.path.join(wdir, 'small.en-decoder.int8.onnx'),
    tokens=os.path.join(wdir, 'small.en-tokens.txt'), language='en', task='transcribe', num_threads=3)

blobs = {}


def clip(it):
    if it['group'] not in blobs:
        blobs[it['group']] = open(os.path.join(repo, 'game/assets/voice/lv', it['group'], 'voice.ogg'), 'rb').read()
    return blobs[it['group']][it['off']:it['off'] + it['len']]


def decode(data, rate):
    return np.frombuffer(subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'pipe:0', '-f', 'f32le', '-ac', '1', '-ar', str(rate), '-'],
                                        input=data, capture_output=True, check=True).stdout, dtype=np.float32)


def judge(it, got, peak, dur, gap):
    """The checks of one clip from what was heard and measured: -> (share of its words heard, cps, flags)."""
    want, have = [stem(w) for w in norm(it['say'])], [stem(w) for w in norm(got)]
    hs = set(have) | set(readings(got))
    # a name run into the next word (Kai Varen heard as Kivarin) is heard by its sound
    # two words written as one (every one: everyone), and a name run into the next word (Kai Varen heard as Kivarin)
    merged = set()
    for a, b in zip(want, want[1:]):
        k = sounds(a + b)
        if a + b in hs or ((a in NAMES or b in NAMES) and k and any(sounds(h) == k for h in have)): merged |= {a, b}
    # an ordinal written as its number (the fourteenth of March: 14 March), a word heard with an s on it (fourteenths)
    card = {ordw(n): nw(n) for n in range(1, 100)}
    heard = lambda w: (w in hs or w + 's' in hs or bool(HOMO.get(w, set()) & hs) or w in merged or (w in NAMES and name_heard(w, have))
                       or (w in card and card[w].split()[-1] in hs))
    hit = sum(1 for w in want if heard(w)) / max(1, len(want))
    miss_n = [w for w in it['nums'] if not heard(w)]
    miss_name = [w for w in it['names'] if not (name_heard(w, have) or w in merged)]
    cps = len(it['say']) / max(dur, 0.01)
    why = []
    if miss_n: why.append('number not heard: ' + ' '.join(miss_n))
    if miss_name: why.append('name not heard: ' + ' '.join(miss_name))
    if hit < 0.6 and len(want) >= 3: why.append(f'heard {hit:.0%} of its words')
    if len(want) < 3 and hit < 0.5: why.append(f'heard {hit:.0%} of a short clip')
    if peak >= 0.999: why.append(f'peaks at {20 * np.log10(peak):+.2f} dBFS')
    if not 5 <= cps <= 25 and len(it['say']) > 6: why.append(f'{cps:.1f} chars/s')  # (a word alone is said slower)
    if gap > 0.9: why.append(f'{gap:.1f} s gap')
    return hit, cps, why


rows = []
RESCORE = next((a.split('=', 1)[1] for a in rest if a.startswith('--rescore=')), None)
if RESCORE:
    # the checks again over a run already heard (ear.json): what was heard and measured is kept, the clips' text and
    # the judging are today's
    byk = {(it['group'], it['voice'], it['key']): it for it in items}
    for r in json.load(open(RESCORE))['rows']:
        it = byk.get((r['group'], r['voice'], r['key']))
        if not it: continue
        hit, cps, why = judge(it, r['heard'], r['peak'], r['dur'], r['gap'])
        row = {k: it[k] for k in ('group', 'voice', 'key', 'say', 'nums', 'names')}
        row.update({k: r[k] for k in ('heard', 'peak', 'rms', 'dur', 'gap')}, hit=round(hit, 3), cps=round(cps, 1), flags=why)
        row['_b64'] = base64.b64encode(clip(it)).decode()
        rows.append(row)
    pick = []
for i, it in enumerate(pick):
    data = clip(it)
    full = decode(data, 48000)  # (Opus decodes at 48 kHz: the browser's peak)
    a = decode(data, 16000)
    dur = len(a) / 16000
    peak = float(np.max(np.abs(full))) if len(full) else 0
    rms = float(np.sqrt(np.mean(a ** 2))) if len(a) else 0
    fr = a[: len(a) // 320 * 320].reshape(-1, 320)
    quiet = np.sqrt(np.mean(fr ** 2, axis=1)) < 10 ** (-45 / 20)
    gap = run = 0
    for q in quiet[3:-3]:
        run = run + 1 if q else 0
        gap = max(gap, run)
    gap *= 0.02
    s = rec.create_stream()
    s.accept_waveform(16000, np.concatenate([np.zeros(1600, np.float32), a, np.zeros(4800, np.float32)]))
    rec.decode_stream(s)
    got = s.result.text.strip()
    hit, cps, why = judge(it, got, peak, dur, gap)
    row = {k: it[k] for k in ('group', 'voice', 'key', 'say', 'nums', 'names')}
    row.update(heard=got, hit=round(hit, 3), peak=round(peak, 4), rms=round(rms, 4), dur=round(dur, 2), cps=round(cps, 1), gap=round(gap, 2), flags=why)
    rows.append(row)
    print(f"{'FLAG' if why else 'ok  '} {i + 1:4}/{len(pick)} {it['group']:<8} {it['voice']:<12} {it['say'][:58]!r:<62} heard {got[:58]!r}  {'; '.join(why)}", flush=True)
    row['_b64'] = base64.b64encode(data).decode()

flagged = [r for r in rows if r['flags']]
summary = {'clips': len(rows), 'packs': sorted({r['group'] for r in rows}), 'flagged': len(flagged),
           'with_numbers': sum(1 for r in rows if r['nums']), 'with_names': sum(1 for r in rows if r['names']),
           'numbers_missed': sum(1 for r in rows if any(f.startswith('number') for f in r['flags'])),
           'names_missed': sum(1 for r in rows if any(f.startswith('name') for f in r['flags'])),
           'peaks': sum(1 for r in rows if any(f.startswith('peaks') for f in r['flags'])),
           'median_hit': float(np.median([r['hit'] for r in rows])) if rows else 0,
           'per_pack': {g: sum(1 for r in rows if r['group'] == g) for g in GROUPS}}
json.dump({'summary': summary, 'rows': [{k: v for k, v in r.items() if k != '_b64'} for r in rows]}, open(os.path.join(out, 'ear.json'), 'w'), indent=1)
trs = []
for r in sorted(rows, key=lambda r: (not r['flags'], r['group'])):
    trs.append(f"<tr class='{'bad' if r['flags'] else ''}'><td>{r['group']}</td><td>{html.escape(r['voice'])}</td><td>{html.escape(r['say'])}<br><small>heard: "
               f"{html.escape(r['heard'])} ({r['hit']:.0%})</small></td><td>{r['dur']} s · {r['cps']} c/s · peak {r['peak']}<br><b>{html.escape('; '.join(r['flags']))}</b></td>"
               f"<td><audio controls preload='none' src='data:audio/ogg;base64,{r['_b64']}'></audio></td></tr>")
open(os.path.join(out, 'ear.html'), 'w').write(
    f"<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>Voice ear check</title>"
    f"<style>body{{font:14px system-ui,sans-serif;margin:16px;background:#f6f6f4;color:#222}}table{{border-collapse:collapse;width:100%}}"
    f"td{{border-bottom:1px solid #ccc;padding:6px;vertical-align:top}}small{{color:#555}}tr.bad{{background:#fde8e4}}</style>"
    f"<h1>The voice packs, heard back</h1><p>{summary['clips']} clips from {len(summary['packs'])} packs, {summary['flagged']} flagged "
    f"(Whisper small.en listening). Median {summary['median_hit']:.0%} of a clip's words heard.</p><table>{''.join(trs)}</table>")
print(json.dumps(summary))
