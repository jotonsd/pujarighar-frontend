#!/usr/bin/env bash
# Pre-warms Next's on-demand image optimizer cache right after a deploy, so
# the first REAL visitor never pays the one-time resize/encode cost that a
# page with a dozen+ images (hero + product grid) otherwise forces on
# whoever happens to load it first. Run this from CI immediately after the
# app is restarted and serving — before real traffic has a chance to.
#
# Usage: warm-image-cache.sh https://pujarighar.com
set -euo pipefail

BASE_URL="${1:?Usage: warm-image-cache.sh <base-url>}"
# Representative pages covering the heaviest image counts: the homepage
# (hero + several product rails) and the main shop grid.
PAGES=("$BASE_URL/bn" "$BASE_URL/bn/products")
CONCURRENCY=6

echo "Warming image cache against $BASE_URL ..."

image_urls=()
for page in "${PAGES[@]}"; do
  echo "  fetching $page"
  # Decode HTML entities (&amp; -> &) BEFORE extracting — otherwise the
  # literal ";" from "&amp;" breaks the URL's query string mid-match,
  # truncating every extracted URL at its first "&".
  html="$(curl -fsSL "$page" | sed 's/&amp;/\&/g' || true)"
  # Pull every /_next/image?url=... reference out of the rendered HTML
  # (both src and srcset attributes reference it the same way).
  while IFS= read -r url; do
    [ -n "$url" ] && image_urls+=("$url")
  done < <(grep -oE '/_next/image\?url=[^"'"'"' ]*' <<< "$html" | sort -u)
done

total=${#image_urls[@]}
echo "Found $total distinct image URLs to warm."

if [ "$total" -eq 0 ]; then
  echo "No image URLs found — skipping (nothing to warm, or the page fetch failed)."
  exit 0
fi

# Request each one — bounding concurrency so this doesn't itself hammer the
# just-restarted server.
printf '%s\n' "${image_urls[@]}" \
  | xargs -P "$CONCURRENCY" -I{} curl -fsSL -o /dev/null -w "  %{http_code} %{time_total}s {}\n" "$BASE_URL{}" || true

echo "Cache warm-up done."
