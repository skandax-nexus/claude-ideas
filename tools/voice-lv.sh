#!/bin/bash
# Records THE LAST VERSION OF EARTH's voice packs (game/assets/voice/lv/<group>/), one chapter group per
# command (OVERHAUL.md §8.10). The unit that adds or changes lines records them before its final commit:
#
#   VOICE_WORK=<dir> bash tools/voice-lv.sh act1           # one group (prologue, act1 ... act4, finale, cases, common)
#   VOICE_WORK=<dir> bash tools/voice-lv.sh common act1    # several
#   VOICE_WORK=<dir> bash tools/voice-lv.sh all            # every group
#   VOICE_WORK=<dir> bash tools/voice-lv.sh check          # render nothing: which packs are out of date?
#
# Each run writes the scripts again (node tools/voice-pack.mjs <dir>/lv-script --edition lastversion: every line
# spokenLines() walks, through the pronunciation lexicon, split per group; a piece two groups say goes to common),
# renders the named groups (tools/voice-pack.py under nice: only recordings the cache does not have yet are made,
# about 4-5 CPU minutes per minute of new speech), then checks every pack and names any still out of date (a line
# that moved into common makes common stale too: render it as well). Then: node --test tests/lastversion.test.mjs.
#
# <dir> (VOICE_WORK) holds tts/ (Kokoro: kokoro-v1.0.int8.onnx and voices-v1.0.bin from
# https://github.com/thewh1teagle/kokoro-onnx/releases, with pip install kokoro-onnx soundfile; KOKORO overrides it),
# vcache/ (the recordings cache, kept between runs; VCACHE overrides it) and lv-script/ (written each run).
# Station Zero's pack (game/assets/voice/voice.*) is never touched.
set -euo pipefail
cd "$(dirname "$0")/.."
W=${VOICE_WORK:-$HOME/.cache/afterzero-voice}
KOKORO=${KOKORO:-$W/tts}
VCACHE=${VCACHE:-$W/vcache}
SCRIPTS=${LV_SCRIPT:-$W/lv-script}
FFMPEG=${FFMPEG:-$(command -v ffmpeg || echo /usr/bin/ffmpeg)}
LV_GROUPS="common prologue act1 act2 act3 act4 finale cases"
[ $# -gt 0 ] || { sed -n '2,20p' "$0"; exit 2; }
want=()
for a in "$@"; do
  case "$a" in
    all) want=($LV_GROUPS) ;;
    check) ;;
    *) [[ " $LV_GROUPS " == *" $a "* ]] || { echo "unknown group: $a (one of: $LV_GROUPS, all, check)" >&2; exit 2; }; want+=("$a") ;;
  esac
done
node tools/voice-pack.mjs "$SCRIPTS" --edition lastversion
if [ ${#want[@]} -gt 0 ]; then
  [ -f "$KOKORO/kokoro-v1.0.int8.onnx" ] || { echo "no Kokoro model in $KOKORO (set VOICE_WORK or KOKORO)" >&2; exit 1; }
  for g in "${want[@]}"; do
    echo "=== $g $(date +%T)"
    nice -n 19 python3 tools/voice-pack.py "$SCRIPTS/$g/script.json" "game/assets/voice/lv/$g" "$KOKORO" "$FFMPEG" "$VCACHE"
  done
fi
stale=()
for g in $LV_GROUPS; do
  python3 tools/voice-pack.py --check "$SCRIPTS/$g/script.json" "game/assets/voice/lv/$g" "$VCACHE" | tail -1 || stale+=("$g")
done
if [ ${#stale[@]} -gt 0 ]; then
  echo "out of date: ${stale[*]} (record them: VOICE_WORK=$W bash tools/voice-lv.sh ${stale[*]})"
  exit 1
fi
echo "every pack is up to date; now: node --test tests/lastversion.test.mjs"
