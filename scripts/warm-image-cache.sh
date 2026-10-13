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
CONCURRENCY=6

echo "Warming image cache against $BASE_URL ..."

# Homepage + shop grid first (heaviest/most-visited pages), then every real
# product and package page from the sitemap — a visitor landing directly on
# ANY product page (shared link, search, ad) should never be the first one
# to trigger that page's images being resized. One locale only (bn) since
# the images themselves are identical across locales, just the surrounding
# text differs.
PAGES=("$BASE_URL/bn" "$BASE_URL/bn/products")
sitemap_urls="$(curl -fsSL "$BASE_URL/sitemap.xml" || true)"
while IFS= read -r url; do
  [ -n "$url" ] && PAGES+=("$url")
done < <(grep -oE '<loc>[^<]*/bn/(products|packages)/[^<]+</loc>' <<< "$sitemap_urls" | sed -E 's#</?loc>##g')

echo "Warming ${#PAGES[@]} pages (homepage, shop grid, every product/package page)."

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
