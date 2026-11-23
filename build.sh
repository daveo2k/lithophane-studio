#!/bin/sh
# Builds the whole site into dist/ for Cloudflare (or any static host): the studio at /, the photo wrap tool at
# /wrap/ and the end cap maker at /cap/. All three live in this repository; the shared logo in brand/ is copied
# next to each tool.
set -eu

OUT=dist
rm -rf "$OUT"
mkdir -p "$OUT"
cp index.html studio.html geometry.js site.webmanifest _headers "$OUT/"
cp -R brand "$OUT/brand"
for tool in wrap cap; do
  mkdir -p "$OUT/$tool"
  cp "$tool/index.html" "$tool/site.webmanifest" "$OUT/$tool/"
  cp -R brand "$OUT/$tool/brand"
done

echo "Built $OUT/:"
find "$OUT" -type f | sort
