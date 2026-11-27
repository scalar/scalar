#!/usr/bin/env bash
#
# Purge the jsDelivr cache for the @scalar/api-reference URLs we tell people
# to use, once npm actually serves the version we just released.
#
# npm scans every new version before it becomes installable, which usually
# takes about five minutes and sometimes 15 or more. Purging straight after
# `npm publish` does not help: jsDelivr refetches, still sees the previous
# version as `latest`, and caches that for another seven days. So this script:
#
#   1. Exits early when the CDN already serves $VERSION (nothing was released).
#   2. Waits until npm serves $PACKAGE@$VERSION (skipped with WAIT_FOR_NPM=false).
#   3. Waits a little longer, because jsDelivr caches npm version info for
#      about 60 seconds.
#   4. Purges every URL, checks which version the CDN serves through the
#      `x-jsd-version` response header, and purges the stale URLs again until
#      they all serve $VERSION or it runs out of attempts.
#
# Required environment variables:
#   VERSION  The version that should now be `latest` (e.g. `1.85.0`)
#
# Optional environment variables (the defaults suit CI; tests shorten them):
#   PACKAGE                  npm package name (default: @scalar/api-reference)
#   WAIT_FOR_NPM             `false` to skip the npm check and exit when the
#                            CDN is stale (default: true)
#   NPM_TIMEOUT_SECONDS      Give up waiting for npm after this long (default: 2400)
#   NPM_POLL_SECONDS         Pause between npm checks (default: 30)
#   SETTLE_SECONDS           Pause after npm serves the version (default: 90)
#   VERIFY_ATTEMPTS          Purge-and-check rounds before failing (default: 5)
#   VERIFY_INTERVAL_SECONDS  Pause between a purge and its check (default: 60)
#   CURL_COMMAND / NPM_COMMAND  Override the binaries (used by the tests)
set -euo pipefail

: "${VERSION:?Missing VERSION}"

package="${PACKAGE:-@scalar/api-reference}"
wait_for_npm="${WAIT_FOR_NPM:-true}"
npm_timeout_seconds="${NPM_TIMEOUT_SECONDS:-2400}"
npm_poll_seconds="${NPM_POLL_SECONDS:-30}"
settle_seconds="${SETTLE_SECONDS:-90}"
verify_attempts="${VERIFY_ATTEMPTS:-5}"
verify_interval_seconds="${VERIFY_INTERVAL_SECONDS:-60}"
curl_command="${CURL_COMMAND:-curl}"
npm_command="${NPM_COMMAND:-npm}"

cdn_base_url='https://cdn.jsdelivr.net/npm'
purge_base_url='https://purge.jsdelivr.net/npm'

# The URLs from our installation docs. Exact-version URLs never need purging,
# so only the version aliases (bare and `@latest`) are listed here.
paths=(
  "$package"
  "$package@latest/dist/browser/standalone.js"
  "$package/esm.js"
  "$package/dist/browser/standalone.esm.js"
)

# Check the final response because redirects may carry a version header of
# their own. Only a successful file response confirms the served version.
cdn_version() {
  "$curl_command" --silent --show-error --head --location "$cdn_base_url/$1" |
    awk '
      { sub(/\r$/, "") }
      /^HTTP\// { status = $2; version = "" }
      tolower($1) == "x-jsd-version:" { version = $2 }
      END { if (status ~ /^2[0-9][0-9]$/) print version }
    '
}

# Print the paths the CDN does not yet serve $VERSION for, one per line.
stale_paths() {
  local path served
  for path in "${paths[@]}"; do
    if ! served="$(cdn_version "$path")" || [ "$served" != "$VERSION" ]; then
      echo "$path"
    fi
  done
}

# Purge one path. A failed purge is reported but does not stop the run: the
# check that follows decides whether the run succeeded.
purge() {
  local path="$1" response status_code
  response="$("$curl_command" --silent --show-error --write-out '\n%{http_code}' "$purge_base_url/$path" 2>&1 || true)"
  status_code="${response##*$'\n'}"

  # A curl failure leaves an error message here instead of a status code.
  if ! [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
    echo "Failed to purge $path (HTTP $status_code)"
    echo "${response%$'\n'*}"
    return
  fi

  # jsDelivr limits how often a single URL can be purged and says so here.
  if [[ "$response" == *'"throttled": true'* || "$response" == *'"throttled":true'* ]]; then
    echo "Purged $path (throttled by jsDelivr)"
    return
  fi

  echo "Purged $path"
}

read_stale_paths() {
  stale=()
  local line
  while IFS= read -r line; do
    if [ -n "$line" ]; then
      stale+=("$line")
    fi
  done < <(stale_paths)
}

read_stale_paths
if [ "${#stale[@]}" -eq 0 ]; then
  echo "jsDelivr already serves $package@$VERSION; nothing to purge"
  exit 0
fi

if [ "$wait_for_npm" != 'true' ]; then
  echo "jsDelivr does not serve $package@$VERSION, but this run did not publish it; nothing to purge"
  exit 0
fi

echo "Waiting for npm to serve $package@$VERSION"
# Measure wall-clock time rather than adding up poll intervals, so slow npm
# requests count towards the timeout too.
wait_started=$SECONDS
until [ "$("$npm_command" view "$package@$VERSION" version --prefer-online 2>/dev/null || true)" = "$VERSION" ]; do
  if [ $((SECONDS - wait_started)) -ge "$npm_timeout_seconds" ]; then
    echo "npm still does not serve $package@$VERSION after ${npm_timeout_seconds}s"
    exit 1
  fi
  sleep "$npm_poll_seconds"
done
echo "npm serves $package@$VERSION after about $((SECONDS - wait_started))s"

sleep "$settle_seconds"

attempt=1
while true; do
  for path in "${stale[@]}"; do
    purge "$path"
  done

  sleep "$verify_interval_seconds"
  read_stale_paths
  if [ "${#stale[@]}" -eq 0 ]; then
    echo "jsDelivr serves $package@$VERSION for every URL"
    exit 0
  fi

  if [ "$attempt" -ge "$verify_attempts" ]; then
    break
  fi
  echo "Still stale after attempt $attempt: ${stale[*]}"
  attempt=$((attempt + 1))
done

echo "jsDelivr still does not serve $package@$VERSION after $verify_attempts attempt(s) for:"
printf '  %s\n' "${stale[@]}"
exit 1
