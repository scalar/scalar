#!/usr/bin/env bash
#
# Delete all Cloudflare Pages preview deployments for a given PR branch.
#
# Each push to a PR creates a new immutable Cloudflare Pages deployment under
# the `pr-<number>` branch alias. Cloudflare keeps every deployment around
# forever, so once a PR is closed or merged we want to clean up after
# ourselves and remove all of its preview deployments — both the latest one
# pointed at by the branch alias and every prior unique-hash deployment in
# the history.
#
# This script paginates through the project's preview deployments, filters
# them down to the ones whose trigger branch matches $BRANCH (e.g. `pr-9101`),
# and deletes each one via the Cloudflare API. It is typically invoked from
# the `pull_request: closed` workflow, but can also be run locally to prune
# stale previews.
#
# Required environment variables:
#   CLOUDFLARE_API_TOKEN   API token with Pages:Edit permission
#   CLOUDFLARE_ACCOUNT_ID  Cloudflare account ID that owns the project
#   PROJECT_NAME           Cloudflare Pages project name (the preview project)
#   BRANCH                 Branch alias to clean up (e.g. `pr-9101`)
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Missing CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?Missing CLOUDFLARE_ACCOUNT_ID}"
: "${PROJECT_NAME:?Missing PROJECT_NAME}"
: "${BRANCH:?Missing BRANCH}"

curl_command="${CURL_COMMAND:-curl}"
base_url="${CLOUDFLARE_API_BASE_URL:-https://api.cloudflare.com/client/v4}"
per_page="${CLOUDFLARE_PER_PAGE:-100}"

echo "Looking for preview deployments on branch: $BRANCH"

deployment_ids_file="$(mktemp)"
page=1

while true; do
  response_file="$(mktemp)"
  status_code="$("$curl_command" --silent --show-error --write-out '%{http_code}' --output "$response_file" \
    "$base_url/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments?env=preview&page=$page&per_page=$per_page" \
    --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN")"

  if [ "$status_code" -lt 200 ] || [ "$status_code" -ge 300 ]; then
    echo "Failed to list Cloudflare Pages deployments (HTTP $status_code)"
    jq -r '.errors[]?.message // .' "$response_file"
    exit 1
  fi

  if [ "$(jq -r '.success' "$response_file")" != 'true' ]; then
    echo "Failed to list Cloudflare Pages deployments"
    jq -r '.errors[]?.message // .' "$response_file"
    exit 1
  fi

  jq -r --arg branch "$BRANCH" \
    '.result // [] | .[] | select(.deployment_trigger.metadata.branch? == $branch) | .id' \
    "$response_file" >> "$deployment_ids_file"

  result_count="$(jq -r '.result // [] | length' "$response_file")"
  echo "Scanned Cloudflare deployment page $page"

  # Stop once we receive a partial page. Cloudflare's listing endpoint does not
  # always populate result_info.total_pages, so we paginate by page size instead.
  if [ "$result_count" -lt "$per_page" ]; then
    break
  fi

  page=$((page + 1))
done

mapfile -t deployment_ids < <(sort -u "$deployment_ids_file")

if [ "${#deployment_ids[@]}" -eq 0 ]; then
  echo "No preview deployments found for $BRANCH; nothing to delete"
  exit 0
fi

failed=0
for deployment_id in "${deployment_ids[@]}"; do
  response_file="$(mktemp)"
  status_code="$("$curl_command" --silent --show-error --request DELETE --write-out '%{http_code}' --output "$response_file" \
    "$base_url/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments/$deployment_id?force=true" \
    --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN")"

  if [ "$status_code" -lt 200 ] || [ "$status_code" -ge 300 ]; then
    echo "Failed to delete Cloudflare Pages deployment $deployment_id (HTTP $status_code)"
    jq -r '.errors[]?.message // .' "$response_file"
    failed=$((failed + 1))
    continue
  fi

  if [ "$(jq -r '.success' "$response_file")" != 'true' ]; then
    echo "Failed to delete Cloudflare Pages deployment $deployment_id"
    jq -r '.errors[]?.message // .' "$response_file"
    failed=$((failed + 1))
    continue
  fi

  echo "Deleted deployment $deployment_id"
done

if [ "$failed" -gt 0 ]; then
  echo "Failed to delete $failed of ${#deployment_ids[@]} deployment(s) for $BRANCH"
  exit 1
fi
