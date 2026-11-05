#!/usr/bin/env bash
# Сборка APK без Gradle: aapt2 → javac → d8 → zipalign → apksigner.
# Нужны: JDK 11–21, Android SDK с build-tools;35.0.0 и platforms;android-34.
# Запуск: ANDROID_SDK=/путь/к/sdk ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_SDK:?укажи ANDROID_SDK}"
BT="$SDK/build-tools/35.0.0"; JAR="$SDK/platforms/android-34/android.jar"
VERSION_CODE="${VERSION_CODE:-1}"; VERSION_NAME="${VERSION_NAME:-1.0}"
OUT=build; rm -rf "$OUT"; mkdir -p "$OUT/gen" "$OUT/classes" "$OUT/dex"

"$BT/aapt2" compile --dir app/res -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/unsigned.apk" -I "$JAR" --manifest app/AndroidManifest.xml \
  -A app/assets --java "$OUT/gen" "$OUT/res.zip" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME"
javac -nowarn -source 8 -target 8 -encoding UTF-8 -cp "$JAR" -d "$OUT/classes" \
  $(find app/src "$OUT/gen" -name '*.java') 2>&1 | grep -v "^warning\|^Note\|bootstrap" || true
"$BT/d8" --release --lib "$JAR" --min-api 24 --output "$OUT/dex" $(find "$OUT/classes" -name '*.class')
(cd "$OUT/dex" && zip -q -j ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

# Ключ подписи хранится вне репозитория. Новая версия встанет поверх старой (с сохранением прогресса),
# только если подписана тем же ключом.
KS="${KEYSTORE:?укажи KEYSTORE=/путь/к/ключу.jks (если файла нет, он будет создан)}"
PASS="${KEYSTORE_PASS:?укажи KEYSTORE_PASS}"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$PASS" -keypass "$PASS" -alias zachet \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Zachet, O=Amberhall, C=RU" 2>/dev/null
fi
"$BT/apksigner" sign --ks "$KS" --ks-pass env:KEYSTORE_PASS --key-pass env:KEYSTORE_PASS --ks-key-alias zachet \
  --out zachet.apk "$OUT/aligned.apk"
"$BT/apksigner" verify zachet.apk && echo "Готово: $(pwd)/zachet.apk"
