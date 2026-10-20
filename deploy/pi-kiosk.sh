#!/usr/bin/env bash
# Novasign kiosk installer for Raspberry Pi OS (Bookworm / Bullseye, desktop image).
#
#   sudo ./pi-kiosk.sh "http://192.168.1.50:3000/display?displayId=PASTE-ID" [--watchdog] [--nightly]
#
# What it does
#   1. installs Chromium
#   2. auto-starts it fullscreen on the display URL at login
#   3. disables screen blanking / DPMS sleep
#   4. optional: reboots the Pi if the kiosk has died (--watchdog)
#   5. optional: reboots nightly at 03:00 (--nightly)
#
# Re-run it any time to change the URL or add flags.

set -euo pipefail

URL="${1:-}"
if [[ -z "$URL" || "$URL" == -* ]]; then
  echo "Usage: sudo $0 \"http://<cms-ip>:3000/display?displayId=<id>\" [--watchdog] [--nightly]" >&2
  exit 1
fi
shift

WATCHDOG=0
NIGHTLY=0
for arg in "$@"; do
  case "$arg" in
    --watchdog) WATCHDOG=1 ;;
    --nightly)  NIGHTLY=1 ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo." >&2
  exit 1
fi

KIOSK_USER="${SUDO_USER:-$USER}"
KIOSK_HOME="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"
[[ -d "$KIOSK_HOME" ]] || { echo "No home directory for $KIOSK_USER" >&2; exit 1; }

echo "==> Installing Chromium"
if command -v chromium >/dev/null 2>&1; then
  BROWSER="$(command -v chromium)"
elif command -v chromium-browser >/dev/null 2>&1; then
  BROWSER="$(command -v chromium-browser)"
else
  apt-get update
  apt-get install -y chromium 2>/dev/null || apt-get install -y chromium-browser
  BROWSER="$(command -v chromium || command -v chromium-browser)"
fi

echo "==> Writing autostart entry (user: $KIOSK_USER)"
AUTOSTART_DIR="$KIOSK_HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_DIR/novasign-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Novasign Kiosk
Comment=Fullscreen signage player
Exec=$BROWSER --kiosk --start-fullscreen --noerrdialogs --disable-infobars --no-first-run --no-default-browser-check --disable-session-crashed-bubble --disable-features=Translate,MediaRouter --autoplay-policy=no-user-gesture-required --check-for-update-interval=31536000 "$URL"
X-GNOME-Autostart-enabled=true
Terminal=false
EOF
chown -R "$KIOSK_USER":"$(id -gn "$KIOSK_USER")" "$KIOSK_HOME/.config"

# Keep the screen awake. raspi-config handles both X11 and Wayland sessions.
echo "==> Disabling screen blanking"
if command -v raspi-config >/dev/null 2>&1; then
  raspi-config nonint do_blanking 1 || true
fi

# Replace any previous novasign cron lines, then add the requested ones.
CRON_TMP="$(mktemp)"
crontab -u "$KIOSK_USER" -l 2>/dev/null | grep -v 'novasign-kiosk' > "$CRON_TMP" || true

if [[ $WATCHDOG -eq 1 ]]; then
  # If Chromium is not running, the whole box is rebooted. Crude but bulletproof:
  # a Pi boots back into the player in ~20 seconds with no dependency on a user session.
  echo "*/10 * * * * pgrep -f 'chromium.*--kiosk' >/dev/null || /sbin/reboot # novasign-kiosk-watchdog" >> "$CRON_TMP"
fi

if [[ $NIGHTLY -eq 1 ]]; then
  echo "0 3 * * * /sbin/reboot # novasign-kiosk-nightly" >> "$CRON_TMP"
fi

crontab -u "$KIOSK_USER" "$CRON_TMP"
rm -f "$CRON_TMP"

echo
echo "Done. Reboot to test:  sudo reboot"
echo "Kiosk URL: $URL"
echo "Watchdog:  $([[ $WATCHDOG -eq 1 ]] && echo on || echo off)   Nightly reboot: $([[ $NIGHTLY -eq 1 ]] && echo on || echo off)"
echo
echo "Handy extras:"
echo "  HDMI-CEC TV power:  sudo apt install cec-utils && echo 'on 0' | cec-client -s -d 1"
echo "  Change the URL:     re-run this script with the new URL"
