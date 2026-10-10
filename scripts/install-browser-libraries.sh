#!/usr/bin/env bash
# Debian 13 x86_64 runtime libraries for the pinned Playwright WebKit build.
set -euo pipefail
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_root="$(dirname "$repository_root")"
apt_root="$workspace_root/browser-os-apt"
browser_cache="$workspace_root/.cache/browser-libs"
libraries=(libgtk-4.so.1 libgraphene-1.0.so.0 libharfbuzz-icu.so.0 libmanette-0.2.so.0 libhyphen.so.0 libGLESv2.so.2 libcairo-script-interpreter.so.2 libhidapi-hidraw.so.0 liblzo2.so.2)
complete=true
for library in "${libraries[@]}"; do
    if [[ ! -f "$browser_cache/usr/lib/x86_64-linux-gnu/$library" ]]; then complete=false; fi
done
if [[ "$complete" == true ]]; then echo 'Browser runtime libraries already prepared.'; exit 0; fi
mkdir -p "$apt_root/lists/partial" "$apt_root/cache/archives/partial" "$apt_root/downloads"
cat > "$apt_root/sources.list" <<'SOURCES'
deb [arch=amd64 signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian trixie main
deb [arch=amd64 signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian-security trixie-security main
SOURCES
apt_options=(-o "Dir::Etc::sourcelist=$apt_root/sources.list" -o Dir::Etc::sourceparts=- -o "Dir::State::lists=$apt_root/lists" -o "Dir::Cache=$apt_root/cache")
apt-get "${apt_options[@]}" update
browser_downloads="$(mktemp -d "$apt_root/downloads/install.XXXXXX")"
cd "$browser_downloads"
apt-get "${apt_options[@]}" download libgtk-4-1 libgraphene-1.0-0 libharfbuzz-icu0 libmanette-0.2-0 libhyphen0 libgles2 libcairo-script-interpreter2 libhidapi-hidraw0 liblzo2-2
for package in ./*.deb; do dpkg-deb -x "$package" "$browser_cache"; done
