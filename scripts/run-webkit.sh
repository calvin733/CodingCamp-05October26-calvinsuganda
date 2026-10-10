#!/usr/bin/env bash
# Use Playwright's verified bundle with signed dependencies in the workspace cache.
set -euo pipefail
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"
webkit_launcher="$(node -p "require('playwright').webkit.executablePath()")"
webkit_root="$(dirname "$webkit_launcher")"
flavor=minibrowser-gtk
if [[ "$*" == *--headless* ]]; then flavor=minibrowser-wpe; fi
bundle="$webkit_root/$flavor"
browser_libraries="$(dirname "$repository_root")/.cache/browser-libs/usr/lib/x86_64-linux-gnu"
export WEBKIT_EXEC_PATH="$bundle/bin"
export WEBKIT_INJECTED_BUNDLE_PATH="$bundle/lib"
export WEBKIT_INSPECTOR_RESOURCES_PATH="$bundle/share"
export LD_LIBRARY_PATH="$bundle/lib:$bundle/sys/lib:$browser_libraries:${LD_LIBRARY_PATH:-}"
export WEBKIT_FORCE_COMPLEX_TEXT=1
exec "$bundle/bin/MiniBrowser" "$@"
