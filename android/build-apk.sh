#!/usr/bin/env bash
# Builds an installable debug APK of the AFTERZERO playable build (game/) without Gradle.
# Needs: node/npx, JDK, and the Ubuntu packages aapt, dalvik-exchange, zipalign, apksigner,
# android-sdk-platform-23.   Output: android/build/AFTERZERO-v<version>.apk
#
# Every version is its own app: the version in AndroidManifest.xml (versionName) picks the
# file name and the app id (com.afterzero.v1_0 for 1.0.x), so a new version installs beside
# the old one, with its own icon and its own saves, instead of replacing it.
#
# Editions: EDITION=lastversion bash android/build-apk.sh builds AFTERZERO: THE LAST VERSION
# OF EARTH as its own app ("AFTERZERO: Last Version 2.1", com.afterzero.lastversion.v2_1, 2.1.0,
# AFTERZERO-LastVersion-v2.1.apk) from the same sources (v2.0 was com.afterzero.lastversion, "AFTERZERO: Last
# Version": 2.1 installs beside it, with its own saves), with window.AZ_EDITION set in the
# page. Without EDITION the build is the Station Zero game, unchanged.
set -euo pipefail
cd "$(dirname "$0")"
# The signing key, checked first. Every build must be signed with the same key, or Android
# refuses it as an update and the player has to uninstall (which deletes their saves): the key
# lives outside the checkout (AZ_KEYSTORE, default ~/.afterzero/debug.keystore) and is never
# made silently. AZ_NEW_KEY=1 makes one, for a first release only.
KS=${AZ_KEYSTORE:-$HOME/.afterzero/debug.keystore}
if [ ! -f "$KS" ]; then
  if [ "${AZ_NEW_KEY:-}" = 1 ]; then
    mkdir -p "$(dirname "$KS")"
    keytool -genkeypair -keystore "$KS" -storepass android -keypass android \
      -alias afterzero -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AFTERZERO Debug" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
  else
    echo "no signing key at $KS: copy the key the released APKs were signed with there (or set AZ_KEYSTORE)." >&2
    echo "AZ_NEW_KEY=1 makes a new key, but APKs signed with it cannot update installed copies." >&2
    exit 1
  fi
fi
EDITION=${EDITION:-}
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=build
MANIFEST=AndroidManifest.xml
FLAG=""
# what aapt stores without deflating: the models and the voice (Station Zero's build, unchanged)
STORED=(-0 glb -0 ogg)
if [ "$EDITION" = "lastversion" ]; then
  OUT=build-lastversion
  VER=2.1
  APP_ID="com.afterzero.lastversion.v2_1"
  APK="AFTERZERO-LastVersion-v$VER.apk"
  FLAG="window.AZ_EDITION='lastversion';"
  rm -rf "$OUT" && mkdir -p "$OUT/assets" "$OUT/classes" "$OUT/gen"
  # the edition's own manifest: its label, version and code (the id is renamed by aapt below)
  MANIFEST="$OUT/AndroidManifest.xml"
  sed -e 's/android:versionCode="[0-9]*"/android:versionCode="210"/' -e 's/android:versionName="[^"]*"/android:versionName="2.1.0"/' \
      -e 's/android:label="[^"]*"/android:label="AFTERZERO: Last Version 2.1"/' AndroidManifest.xml > "$MANIFEST"
  # its 51 models deflate by a quarter (their vertex buffers; MainActivity streams an asset either way), which keeps
  # the APK within the edition's 50 MB (OVERHAUL.md §10.2); the voice packs (Opus) stay stored
  STORED=(-0 ogg)
elif [ -n "$EDITION" ]; then
  echo "unknown EDITION '$EDITION' (lastversion, or unset for Station Zero)" >&2; exit 1
else
  VER=$(sed -n 's/.*android:versionName="\([0-9]*\.[0-9]*\).*/\1/p' AndroidManifest.xml)
  APP_ID="com.afterzero.v${VER//./_}"
  APK="AFTERZERO-v$VER.apk"
  rm -rf "$OUT" && mkdir -p "$OUT/assets" "$OUT/classes" "$OUT/gen"
fi

# 1. One HTML file with the ES modules bundled in, plus the models and voice pack beside it.
npx --yes esbuild@0.24.0 ../game/js/main.js --bundle --format=iife --minify --target=es2019 --outfile="$OUT/game.js" --log-level=warning
node - "$OUT" "$FLAG" <<'JS'
const fs = require('fs'); const out = process.argv[2]; const flag = process.argv[3] || '';
let html = fs.readFileSync('../game/index.html', 'utf8');
const css = fs.readFileSync('../game/css/style.css', 'utf8');
const js = fs.readFileSync(out + '/game.js', 'utf8').replace(/<\/script/gi, '<\\/script');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '').replace(/<link rel="icon"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
  .replace(/<script type="module" src="js\/main.js"><\/script>/, () => `${flag ? `<script>${flag}</script>` : ''}<script>${js}</script>`);
fs.writeFileSync(out + '/assets/index.html', html);
JS
# character models and the voice pack, served by MainActivity from https://afterzero.app/assets/...
# Each game carries its own people: THE LAST VERSION the models of its manifest (casting.js MANIFEST: its
# 47 people and the 4 shared models it uses), Station Zero every model but the edition's own people.
CHARS=$(node --input-type=module -e "
  const m = await import('$(pwd)/../game/js/editions/lastversion/casting.js');
  const all = (await import('node:fs')).readdirSync('../game/assets/characters').filter((f) => f.endsWith('.glb')).sort();
  const own = new Set(Object.values(m.LV_MODELS).map((x) => x.file));
  console.log((process.argv[1] === 'lastversion' ? m.MANIFEST : all.filter((f) => !own.has(f))).join(' '));" "${EDITION:-stationzero}")
mkdir -p "$OUT/assets/assets/characters" "$OUT/assets/assets/voice"
for f in $CHARS; do cp "../game/assets/characters/$f" "$OUT/assets/assets/characters/"; done
echo "characters: $(echo $CHARS | wc -w) models ($(du -ch $(for f in $CHARS; do echo ../game/assets/characters/$f; done) | tail -1 | cut -f1))"
mkdir -p "$OUT/assets/assets/looks" && cp ../game/assets/looks/*.webp "$OUT/assets/assets/looks/"
mkdir -p "$OUT/assets/assets/textures" && cp ../game/assets/textures/*.jpg ../game/assets/textures/*.hdr "$OUT/assets/assets/textures/"
# the voices: Station Zero's pack, or THE LAST VERSION's own packs (assets/voice/lv/<group>/, one per chapter
# group, OVERHAUL.md §8.3) and nothing else
copy_voice() {
  if [ "$EDITION" = "lastversion" ]; then
    for d in ../game/assets/voice/lv/*/; do
      # (an empty pack, 'cases' while every replay speaks from its own mission's pack, is never fetched: not shipped)
      [ -s "$d/voice.ogg" ] || continue
      g=$(basename "$d"); mkdir -p "$1/lv/$g"; cp "$d/voice.json" "$d/voice.ogg" "$1/lv/$g/"
    done
    echo "voices: $(for d in ../game/assets/voice/lv/*/; do [ -s "$d/voice.ogg" ] && echo "$d"; done | wc -l) packs ($(du -ch ../game/assets/voice/lv/*/voice.ogg | tail -1 | cut -f1))"
  elif [ -f ../game/assets/voice/voice.ogg ]; then cp ../game/assets/voice/voice.json ../game/assets/voice/voice.ogg "$1/"
  else echo "warning: no voice pack (tools/voice-pack.*); dialogue will use device speech"; fi
}
copy_voice "$OUT/assets/assets/voice"

# 2. Compile the Java host and convert to dex.
javac --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" src/com/afterzero/preview/MainActivity.java 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"

# 3. Package, align, sign (with the key checked at the top).
aapt package -f "${STORED[@]}" --rename-manifest-package "$APP_ID" -M "$MANIFEST" -S res -A "$OUT/assets" -I "$ANDROID_JAR" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
apksigner sign --ks "$KS" --ks-pass pass:android --key-pass pass:android --out "$OUT/$APK" "$OUT/aligned.apk"
apksigner verify "$OUT/$APK"
echo "Built $(pwd)/$OUT/$APK ($APP_ID${EDITION:+, edition $EDITION}, $(du -h "$OUT/$APK" | cut -f1))"

# 4. The web preview ($OUT/preview/index.html with its assets beside it, published as one claude.ai artifact per
#    version): the same page, with the models as glTF JSON for hosts that don't serve .glb.
P="$OUT/preview"
mkdir -p "$P/assets/voice" "$P/assets/looks" "$P/assets/textures"
cp ../game/assets/looks/*.webp "$P/assets/looks/"
cp ../game/assets/textures/*.jpg "$P/assets/textures/"
python3 -I ../tools/gltf-json.py ../game/assets/characters "$P/assets/characters" $CHARS >/dev/null
# (the first <script> is the edition flag when there is one; the preview flags go in front of it)
sed '0,/<script>/s#<script>#<script>window.AZ_MODEL_EXT=".json";window.AZ_NO_HDR=1;</script><script>#' "$OUT/assets/index.html" > "$P/index.html"
copy_voice "$P/assets/voice"
# a claude.ai preview takes binary files up to 15 MB: say so before a voice pack outgrows it
if [ "$EDITION" = "lastversion" ]; then PACKS=$(ls ../game/assets/voice/lv/*/voice.ogg); else PACKS=../game/assets/voice/voice.ogg; fi
for f in $PACKS; do
  [ -f "$f" ] || continue
  VOICE_MB=$(( $(stat -c %s "$f") / 1000000 )) # decimal MB, to be safe
  if [ "$VOICE_MB" -ge 15 ]; then echo "error: $f is $VOICE_MB MB; the web preview cannot be published (15 MB per file). Split the pack." >&2; exit 1
  elif [ "$VOICE_MB" -ge 14 ]; then echo "warning: $f is $VOICE_MB MB, close to the preview's 15 MB per-file limit" >&2; fi
done
echo "Preview in $(pwd)/$P"
