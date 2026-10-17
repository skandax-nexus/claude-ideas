#!/usr/bin/env bash
# Builds an installable debug APK of the AFTERZERO playable build (game/) without Gradle.
# Needs: node/npx, JDK, and the Ubuntu packages aapt, dalvik-exchange, zipalign, apksigner,
# android-sdk-platform-23.   Output: android/build/AFTERZERO-v<version>.apk
#
# Every version is its own app: the version in AndroidManifest.xml (versionName) picks the
# file name and the app id (com.afterzero.v1_0 for 1.0.x), so a new version installs beside
# the old one, with its own icon and its own saves, instead of replacing it.
set -euo pipefail
cd "$(dirname "$0")"
VER=$(sed -n 's/.*android:versionName="\([0-9]*\.[0-9]*\).*/\1/p' AndroidManifest.xml)
APP_ID="com.afterzero.v${VER//./_}"
APK="AFTERZERO-v$VER.apk"
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=build
rm -rf "$OUT" && mkdir -p "$OUT/assets" "$OUT/classes" "$OUT/gen"

# 1. One HTML file with the ES modules bundled in, plus the models and voice pack beside it.
npx --yes esbuild@0.24.0 ../game/js/main.js --bundle --format=iife --minify --target=es2019 --outfile="$OUT/game.js" --log-level=warning
node - "$OUT" <<'JS'
const fs = require('fs'); const out = process.argv[2];
let html = fs.readFileSync('../game/index.html', 'utf8');
const css = fs.readFileSync('../game/css/style.css', 'utf8');
const js = fs.readFileSync(out + '/game.js', 'utf8').replace(/<\/script/gi, '<\\/script');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '').replace(/<link rel="icon"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
  .replace(/<script type="module" src="js\/main.js"><\/script>/, () => `<script>${js}</script>`);
fs.writeFileSync(out + '/assets/index.html', html);
JS
# character models and the voice pack, served by MainActivity from https://afterzero.app/assets/...
mkdir -p "$OUT/assets/assets/characters" "$OUT/assets/assets/voice"
cp ../game/assets/characters/*.glb "$OUT/assets/assets/characters/"
mkdir -p "$OUT/assets/assets/looks" && cp ../game/assets/looks/*.webp "$OUT/assets/assets/looks/"
mkdir -p "$OUT/assets/assets/textures" && cp ../game/assets/textures/*.jpg "$OUT/assets/assets/textures/"
if [ -f ../game/assets/voice/voice.ogg ]; then cp ../game/assets/voice/voice.json ../game/assets/voice/voice.ogg "$OUT/assets/assets/voice/"
else echo "warning: no voice pack (tools/voice-pack.*); dialogue will use device speech"; fi

# 2. Compile the Java host and convert to dex.
javac --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" src/com/afterzero/preview/MainActivity.java 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"

# 3. Package, align, sign (debug key generated on first run).
aapt package -f -0 glb -0 ogg --rename-manifest-package "$APP_ID" -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$ANDROID_JAR" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
[ -f debug.keystore ] || keytool -genkeypair -keystore debug.keystore -storepass android -keypass android \
  -alias afterzero -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AFTERZERO Debug" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
apksigner sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android --out "$OUT/$APK" "$OUT/aligned.apk"
apksigner verify "$OUT/$APK"
echo "Built $(pwd)/$OUT/$APK ($APP_ID, $(du -h "$OUT/$APK" | cut -f1))"

# 4. The web preview (AFTERZERO-v<version>-play.html, one claude.ai artifact per version): same page, with the models as glTF JSON
#    for hosts that don't serve .glb, beside it in build/preview/.
P="$OUT/preview"
mkdir -p "$P/assets/voice" "$P/assets/looks" "$P/assets/textures"
cp ../game/assets/looks/*.webp "$P/assets/looks/"
cp ../game/assets/textures/*.jpg "$P/assets/textures/"
python3 -I ../tools/gltf-json.py ../game/assets/characters "$P/assets/characters" >/dev/null
sed 's#<script>#<script>window.AZ_MODEL_EXT=".json";</script><script>#' "$OUT/assets/index.html" > "$P/index.html"
[ -f ../game/assets/voice/voice.ogg ] && cp ../game/assets/voice/voice.json ../game/assets/voice/voice.ogg "$P/assets/voice/"
echo "Preview in $(pwd)/$P"
