#!/bin/sh
# Builds EndlessWar_art_catalog.html (self-contained): copy of index.html + tools/catalog-gen.js, rendered by headless Edge.
# Needs the local server (serve.ps1) on :8080.
cd "$(dirname "$0")/.."
sed -e 's#<head>#<head><base href="../">#' -e '/telegram-web-app/d' -e 's#</body>#<script src="tools/catalog-gen.js"></script></body>#' index.html > tools/catalog-build.html
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
"$EDGE" --headless=new --disable-gpu --no-first-run --user-data-dir="$TEMP/edgecat" --window-size=420,760 --virtual-time-budget=60000 --dump-dom "http://localhost:8080/tools/catalog-build.html" > EndlessWar_art_catalog.html 2>/dev/null
rm -f tools/catalog-build.html
ls -la EndlessWar_art_catalog.html; grep -c 'data-done="1"' EndlessWar_art_catalog.html
