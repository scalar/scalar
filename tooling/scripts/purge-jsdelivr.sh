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
#   1. Skips fresh aliases on ordinary runs. A release or manual run starts
#      with all four because the runner sees only its own CDN route.
#   2. Waits until npm serves $PACKAGE@$VERSION as latest, or exits if a newer
#      version has superseded this one (skipped with WAIT_FOR_NPM=false).
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
#   PURGE_ALL                Purge all aliases on the first attempt (default: false)
#   WAIT_FOR_NPM             `false` to skip the npm check and exit when the
#                            CDN is stale (default: true)
#   REQUEST_TIMEOUT_SECONDS  Cap each npm and CDN request (default: 10)
#   NPM_TIMEOUT_SECONDS      Give up waiting for npm after this long (default: 2400)
#   NPM_POLL_SECONDS         Pause between npm checks (default: 30)
#   SETTLE_SECONDS           Pause after npm serves the version (default: 90)
#   VERIFY_ATTEMPTS          Purge-and-check rounds before failing (default: 5)
#   VERIFY_INTERVAL_SECONDS  Pause between a purge and its check (default: 60)
#   CURL_COMMAND / NPM_COMMAND  Override the binaries (used by the tests)
set -euo pipefail

: "${VERSION:?Missing VERSION}"

package="${PACKAGE:-@scalar/api-reference}"
purge_all="${PURGE_ALL:-false}"
wait_for_npm="${WAIT_FOR_NPM:-true}"
request_timeout_seconds="${REQUEST_TIMEOUT_SECONDS:-10}"
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
declare -A pending_global_purges=()

# Check the final response because redirects may carry a version header of
# their own. Only a successful file response confirms the served version.
cdn_version() {
  "$curl_command" --silent --show-error --max-time "$request_timeout_seconds" --head --location "$cdn_base_url/$1" |
    awk '
      { sub(/\r$/, "") }
      /^HTTP\// { status = $2; version = "" }
      tolower($1) == "x-jsd-version:" { version = $2 }
      END { if (status ~ /^2[0-9][0-9]$/) print version }
    '
}

# Include any alias that still needs its first successful global purge.
stale_paths() {
  local path served
  for path in "${paths[@]}"; do
    if [[ -v 'pending_global_purges[$path]' ]] || ! served="$(cdn_version "$path")" || [ "$served" != "$VERSION" ]; then
      echo "$path"
    fi
  done
}

# Require a successful request before clearing an alias's initial global purge.
purge() {
  local path="$1" response status_code
  if ! response="$("$curl_command" --silent --show-error --max-time "$request_timeout_seconds" \
    --write-out '\n%{http_code}' "$purge_base_url/$path" 2>&1)"; then
    printf 'Failed to purge %s\n%s\n' "$path" "$response"
    return 1
  fi
  status_code="${response##*$'\n'}"

  if ! [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
    echo "Failed to purge $path (HTTP $status_code)"
    echo "${response%$'\n'*}"
    return 1
  fi

  # jsDelivr limits how often a single URL can be purged and says so here.
  if [[ "$response" == *'"throttled": true'* || "$response" == *'"throttled":true'* ]]; then
    echo "Purge of $path throttled by jsDelivr"
    return 1
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

# Let npm apply its semver rules. A latest tag below VERSION is still pending,
# while a newer installable latest makes this run obsolete.
npm_latest_at_or_after_release() {
  timeout --kill-after=1s "${1}s" "$npm_command" view "$package@>=$VERSION" version dist-tags.latest \
    --json --prefer-online --fetch-retries=0 2>/dev/null |
    jq -er '(if type == "array" then . else [.] end)[] | select(.version == .["dist-tags.latest"]) | .version // empty'
}

exit_if_superseded() {
  if [ -n "$1" ] && [ "$1" != "$VERSION" ]; then
    echo "Skipping $package@$VERSION because npm latest is now $1"
    exit 0
  fi
}

if [ "$purge_all" = 'true' ]; then
  stale=("${paths[@]}")
  for path in "${paths[@]}"; do
    pending_global_purges["$path"]=1
  done
else
  read_stale_paths
fi
if [ "${#stale[@]}" -eq 0 ]; then
  echo "jsDelivr already serves $package@$VERSION; nothing to purge"
  exit 0
fi

if [ "$wait_for_npm" != 'true' ]; then
  echo "jsDelivr does not serve $package@$VERSION, but this run did not publish it; nothing to purge"
  exit 0
fi

echo "Waiting for npm to serve $package@$VERSION"
wait_started=$SECONDS
deadline=$((wait_started + npm_timeout_seconds))
latest=''
while (( (remaining = deadline - SECONDS) > 0 )); do
  if latest=$(npm_latest_at_or_after_release "$((remaining < request_timeout_seconds ? remaining : request_timeout_seconds))"); then
    break
  fi
  latest=''
  remaining=$((deadline - SECONDS))
  if (( remaining > 0 )); then
    sleep "$((remaining < npm_poll_seconds ? remaining : npm_poll_seconds))"
  fi
done
if [ -z "$latest" ]; then
  echo "npm still does not serve $package@$VERSION as latest after ${npm_timeout_seconds}s"
  exit 1
fi
exit_if_superseded "$latest"
echo "npm serves $package@$VERSION after about $((SECONDS - wait_started))s"

sleep "$settle_seconds"

attempt=1
while true; do
  # A newer version can become latest during the cache settle or a retry.
  if ! latest=$(npm_latest_at_or_after_release "$request_timeout_seconds"); then
    echo "Could not confirm npm still serves $package@$VERSION as latest before purging:"
    printf '  %s\n' "${stale[@]}"
    exit 1
  fi
  exit_if_superseded "$latest"
  for path in "${stale[@]}"; do
    if purge "$path"; then
      unset 'pending_global_purges[$path]'
    fi
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

if latest=$(npm_latest_at_or_after_release "$request_timeout_seconds"); then
  exit_if_superseded "$latest"
fi
echo "Could not confirm jsDelivr purge for $package@$VERSION after $verify_attempts attempt(s) for:"
printf '  %s\n' "${stale[@]}"
exit 1
