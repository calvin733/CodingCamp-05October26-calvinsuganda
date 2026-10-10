#!/usr/bin/env bash
# Prepare signed vendor browser packages without changing the system installation.
set -euo pipefail
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_root="$(dirname "$repository_root")"
browser_cache="${DASHBOARD_BROWSER_CACHE:-$workspace_root/.cache}"
apt_root="${DASHBOARD_BROWSER_APT:-$workspace_root/browser-apt}"
chrome_binary="$browser_cache/google-chrome/opt/google/chrome/chrome"
edge_binary="$browser_cache/microsoft-edge/opt/microsoft/msedge/msedge"
if [[ -x "$chrome_binary" && -x "$edge_binary" ]]; then
    "$chrome_binary" --version
    "$edge_binary" --version
    exit 0
fi
mkdir -p "$apt_root/lists/partial" "$apt_root/cache/archives/partial" "$apt_root/downloads" "$apt_root/gnupg"
chmod 700 "$apt_root/gnupg"
curl --fail --silent --show-error --location https://dl.google.com/linux/linux_signing_key.pub -o "$apt_root/google.key"
gpg --homedir "$apt_root/gnupg" --batch --yes --dearmor --output "$apt_root/google.gpg" "$apt_root/google.key"
curl --fail --silent --show-error --location https://packages.microsoft.com/keys/microsoft.asc -o "$apt_root/microsoft.key"
gpg --homedir "$apt_root/gnupg" --batch --yes --dearmor --output "$apt_root/microsoft.gpg" "$apt_root/microsoft.key"
cat > "$apt_root/sources.list" <<SOURCES
deb [arch=amd64 signed-by=$apt_root/google.gpg] https://dl.google.com/linux/chrome/deb/ stable main
deb [arch=amd64 signed-by=$apt_root/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main
SOURCES
apt_options=(-o "Dir::Etc::sourcelist=$apt_root/sources.list" -o Dir::Etc::sourceparts=- -o "Dir::State::lists=$apt_root/lists" -o "Dir::Cache=$apt_root/cache")
apt-get "${apt_options[@]}" update
browser_downloads="$(mktemp -d "$apt_root/downloads/install.XXXXXX")"
cd "$browser_downloads"
# APT verifies signed repository metadata and package hashes; TLS remains enabled.
apt-get "${apt_options[@]}" download google-chrome-stable microsoft-edge-stable
dpkg-deb -x ./google-chrome-stable_*.deb "$browser_cache/google-chrome"
dpkg-deb -x ./microsoft-edge-stable_*.deb "$browser_cache/microsoft-edge"
"$chrome_binary" --version
"$edge_binary" --version
