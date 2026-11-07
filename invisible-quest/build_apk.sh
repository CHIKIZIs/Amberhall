#!/usr/bin/env bash
# Builds the "Невидимка" Meta Quest 3 APK on Linux: ./build_apk.sh
# Downloads Godot 4.3, the export templates, the Meta OpenXR plugin and the Android SDK into $TOOLS (default ~/godot-tools).
# Needs JDK 17 (sudo apt install openjdk-17-jdk-headless).
set -euo pipefail
cd "$(dirname "$0")"
TOOLS=${TOOLS:-$HOME/godot-tools}
JAVA_HOME=${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}
GODOT=$TOOLS/godot
SDK=$TOOLS/android-sdk
TPL=$HOME/.local/share/godot/export_templates/4.3.stable
mkdir -p "$TOOLS" build

if [ ! -x "$GODOT" ]; then
  curl -sSL -o "$TOOLS/godot.zip" https://github.com/godotengine/godot/releases/download/4.3-stable/Godot_v4.3-stable_linux.x86_64.zip
  unzip -oq "$TOOLS/godot.zip" -d "$TOOLS" && mv "$TOOLS/Godot_v4.3-stable_linux.x86_64" "$GODOT" && rm "$TOOLS/godot.zip"
fi
if [ ! -f "$TPL/android_source.zip" ]; then
  curl -sSL -o "$TOOLS/templates.tpz" https://github.com/godotengine/godot/releases/download/4.3-stable/Godot_v4.3-stable_export_templates.tpz
  mkdir -p "$TPL" && unzip -oq "$TOOLS/templates.tpz" -d "$TOOLS/tpl" && mv "$TOOLS"/tpl/templates/* "$TPL/" && rm -rf "$TOOLS/tpl" "$TOOLS/templates.tpz"
fi
if [ ! -d "$SDK/platforms/android-34" ]; then
  curl -sSL -o "$TOOLS/cmd.zip" https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  mkdir -p "$SDK/cmdline-tools" && unzip -oq "$TOOLS/cmd.zip" -d "$SDK/cmdline-tools" && mv "$SDK/cmdline-tools/cmdline-tools" "$SDK/cmdline-tools/latest" && rm "$TOOLS/cmd.zip"
  yes | "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" "platform-tools" "build-tools;34.0.0" "platforms;android-34" "ndk;23.2.8568313" "cmake;3.10.2.4988404" >/dev/null
fi
if [ ! -f addons/godotopenxrvendors/plugin.gdextension ]; then
  curl -sSL -o "$TOOLS/vendors.zip" https://github.com/GodotVR/godot_openxr_vendors/releases/download/3.0.1-stable/godotopenxrvendorsaddon.zip
  rm -rf /tmp/vend && unzip -oq "$TOOLS/vendors.zip" 'asset/addons/*' -d /tmp/vend && mkdir -p addons && mv /tmp/vend/asset/addons/godotopenxrvendors addons/
fi
if [ ! -f android/.build_version ]; then
  mkdir -p android/build && unzip -oq "$TPL/android_source.zip" -d android/build
  echo -n "4.3.stable" > android/.build_version && touch android/build/.gdignore
fi
mkdir -p "$HOME/.config/godot"
cat > "$HOME/.config/godot/editor_settings-4.3.tres" <<EOT
[gd_resource type="EditorSettings" format=3]

[resource]
export/android/android_sdk_path = "$SDK"
export/android/java_sdk_path = "$JAVA_HOME"
EOT
# Signing key: one per machine. An APK signed with a different key must be uninstalled from the headset before installing.
KEY=${KEYSTORE:-$TOOLS/release.keystore}
[ -f "$KEY" ] || "$JAVA_HOME/bin/keytool" -genkeypair -keystore "$KEY" -alias amberhall -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass amberhall -keypass amberhall -dname "CN=Amberhall, O=Amberhall, C=RU"

"$GODOT" --headless --editor --quit --path . >/dev/null 2>&1 || true   # resource import
"$GODOT" --headless --xr-mode off --path . -- --selftest 2>&1 | grep -E 'SELFTEST|->'
JAVA_HOME=$JAVA_HOME ANDROID_HOME=$SDK \
GODOT_ANDROID_KEYSTORE_RELEASE_PATH=$KEY GODOT_ANDROID_KEYSTORE_RELEASE_USER=amberhall GODOT_ANDROID_KEYSTORE_RELEASE_PASSWORD=amberhall \
  "$GODOT" --headless --path . --export-release "Quest 3" build/nevidimka-quest3.apk
ls -la build/nevidimka-quest3.apk
