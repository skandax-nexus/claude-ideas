#!/usr/bin/env bash
# Builds an installable debug APK of the AFTERZERO playable build (game/) without Gradle.
# Needs: node/npx, JDK, and the Ubuntu packages aapt, dalvik-exchange, zipalign, apksigner,
# android-sdk-platform-23.   Output: android/build/AFTERZERO-preview.apk
set -euo pipefail
cd "$(dirname "$0")"
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
cp ../game/assets/voice/voice.json ../game/assets/voice/voice.bin "$OUT/assets/assets/voice/"

# 2. Compile the Java host and convert to dex.
javac --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" src/com/afterzero/preview/MainActivity.java 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"

# 3. Package, align, sign (debug key generated on first run).
aapt package -f -0 glb -0 bin -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$ANDROID_JAR" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
[ -f debug.keystore ] || keytool -genkeypair -keystore debug.keystore -storepass android -keypass android \
  -alias afterzero -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AFTERZERO Debug" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
apksigner sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android --out "$OUT/AFTERZERO-preview.apk" "$OUT/aligned.apk"
apksigner verify "$OUT/AFTERZERO-preview.apk"
echo "Built $(pwd)/$OUT/AFTERZERO-preview.apk ($(du -h "$OUT/AFTERZERO-preview.apk" | cut -f1))"
