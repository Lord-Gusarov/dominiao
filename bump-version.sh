#!/usr/bin/env bash
# Bump the cache-busting version everywhere it appears so a release reaches
# every client: the ?v= query strings in index.html and the service worker's
# CACHE_NAME + precache list in sw.js.
#
# Usage: ./bump-version.sh        (increments the current version by one)
#        ./bump-version.sh 42     (sets an explicit version)
set -euo pipefail
cd "$(dirname "$0")"

current=$(grep -oP "CACHE_NAME = 'dominiao-v\K[0-9]+" sw.js)
next=${1:-$((current + 1))}

if ! [[ $next =~ ^[0-9]+$ ]]; then
  echo "Version must be a number, got: $next" >&2
  exit 1
fi

sed -i -E "s/\?v=[0-9]+/?v=$next/g" index.html sw.js
sed -i -E "s/dominiao-v[0-9]+/dominiao-v$next/" sw.js

# Every versioned reference must now agree, or offline precaching will miss files.
stale=$(grep -nE "\?v=[0-9]+|dominiao-v[0-9]+" index.html sw.js | grep -vE "(\?v=|dominiao-v)$next\b" || true)
if [[ -n $stale ]]; then
  echo "Some references were not updated:" >&2
  echo "$stale" >&2
  exit 1
fi

echo "Version $current -> $next"
grep -nE "\?v=$next|dominiao-v$next" index.html sw.js
