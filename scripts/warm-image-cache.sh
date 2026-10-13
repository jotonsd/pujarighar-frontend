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
# Runs detached on the server now (see deploy.yml), not blocking CI — so
# there's no pressure to finish fast anymore. Kept low (not higher) on
# purpose: every warm request is real CPU competing with actual live
# traffic on the same Node process for image encoding, on a VPS already
# shown to struggle under concurrent encode load (see next.config.mjs's
# AVIF-removal notes). Taking longer in the background costs nothing;
# contending harder with a real visitor's request does.
CONCURRENCY=3

echo "Warming image cache against $BASE_URL ..."

# Homepage + shop grid, plus every real product/package page from the
# sitemap. Blog isn't included — not business-critical the way product
# pages are. One locale only (bn) since the images themselves are
# identical across locales, just the surrounding text differs.
PAGES=("$BASE_URL/bn" "$BASE_URL/bn/products")
sitemap_urls="$(curl -fsSL "$BASE_URL/sitemap.xml" || true)"
while IFS= read -r url; do
  [ -n "$url" ] && PAGES+=("$url")
done < <(grep -oE '<loc>[^<]*/bn/(products|packages)/[^<]+</loc>' <<< "$sitemap_urls" | sed -E 's#</?loc>##g')

echo "Warming ${#PAGES[@]} product/package pages."

# Breakpoints above this are only ever requested by a full-width hero/
# banner slot on a high-DPR (3x) large monitor — a rare combination, and
# the single most expensive tier to encode (the `w=3840` variant alone
# took 2.4s in one real warm run vs ~0.2-0.3s for the rest). Every real
# product/package page's own `sizes` hint tops out well under this anyway
# (max is the detail page's fixed 610px, ~1220px at 2x DPR), so this only
# ever trims the homepage hero/banner's largest, rarely-hit variants —
# never a genuine product image a typical visitor would land on.
MAX_WIDTH=1200

image_urls=()
for page in "${PAGES[@]}"; do
  echo "  fetching $page"
  # Decode HTML entities (&amp; -> &) BEFORE extracting — otherwise the
  # literal ";" from "&amp;" breaks the URL's query string mid-match,
  # truncating every extracted URL at its first "&".
  html="$(curl -fsSL "$page" | sed 's/&amp;/\&/g' || true)"
  # Pull every /_next/image?url=... reference out of the rendered HTML
  # (both src and srcset attributes reference it the same way), skipping
  # any width above MAX_WIDTH.
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    width="$(grep -oE '[&?]w=[0-9]+' <<< "$url" | grep -oE '[0-9]+')"
    if [ -z "$width" ] || [ "$width" -le "$MAX_WIDTH" ]; then
      image_urls+=("$url")
    fi
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
