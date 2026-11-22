#!/bin/sh
# Builds the static site into dist/ for Cloudflare Pages (or any static host).
# Same layout as the Docker image: the studio at /, the photo wrap tool at /wrap/
# and the end cap maker at /cap/, each cloned from the latest main of its own repository.
set -eu

OUT=dist
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

rm -rf "$OUT"
mkdir -p "$OUT"
cp index.html studio.html geometry.js site.webmanifest _headers "$OUT/"
cp -R brand "$OUT/brand"

git clone --depth 1 https://github.com/daveo2k/bauble-image-tool.git "$TMP/wrap"
git clone --depth 1 https://github.com/daveo2k/bauble-cap.git "$TMP/cap"

for tool in wrap cap; do
  mkdir -p "$OUT/$tool"
  cp "$TMP/$tool/index.html" "$OUT/$tool/index.html"
  cp -R "$TMP/$tool/brand" "$OUT/$tool/brand"
done

echo "Built $OUT/:"
find "$OUT" -type f | sort
