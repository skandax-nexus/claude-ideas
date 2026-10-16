#!/usr/bin/env bash
# Builds an installable debug APK of the AFTERZERO playable build (game/) without Gradle.
# Needs: node/npx, JDK, and the Ubuntu packages aapt, dalvik-exchange, zipalign, apksigner,
# android-sdk-platform-23.   Output: android/build/AFTERZERO-preview.apk
set -euo pipefail
cd "$(dirname "$0")"
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=build
rm -rf "$OUT" && mkdir -p "$OUT/assets" "$OUT/classes" "$OUT/gen"

# 1. One offline HTML file: bundle the ES modules (WebViews can't import modules from file://).
npx --yes esbuild@0.24.0 ../game/js/main.js --bundle --format=iife --minify --target=es2019 --outfile="$OUT/game.js" --log-level=warning
node - "$OUT" <<'JS'
const fs = require('fs'); const out = process.argv[2];
let html = fs.readFileSync('../game/index.html', 'utf8');
const css = fs.readFileSync('../game/css/style.css', 'utf8');
const js = fs.readFileSync(out + '/game.js', 'utf8').replace(/<\/script/gi, '<\\/script');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '').replace(/<link rel="icon"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
  .replace(/<script type="module" src="js\/main.js"><\/script>/, () => `<script>${models()}</script><script>${js}</script>`);
// the character models ride along as data: URIs (fetch can't read file:// in a WebView)
function models() {
  const dir = '../game/assets/characters/';
  const m = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.glb'))) m[f] = 'data:model/gltf-binary;base64,' + fs.readFileSync(dir + f).toString('base64');
  return 'window.AZ_MODELS=' + JSON.stringify(m) + ';';
}
fs.writeFileSync(out + '/assets/index.html', html);
JS

# 2. Compile the Java host and convert to dex.
javac --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" src/com/afterzero/preview/MainActivity.java 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"

# 3. Package, align, sign (debug key generated on first run).
aapt package -f -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$ANDROID_JAR" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
[ -f debug.keystore ] || keytool -genkeypair -keystore debug.keystore -storepass android -keypass android \
  -alias afterzero -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AFTERZERO Debug" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
apksigner sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android --out "$OUT/AFTERZERO-preview.apk" "$OUT/aligned.apk"
apksigner verify "$OUT/AFTERZERO-preview.apk"
echo "Built $(pwd)/$OUT/AFTERZERO-preview.apk ($(du -h "$OUT/AFTERZERO-preview.apk" | cut -f1))"
