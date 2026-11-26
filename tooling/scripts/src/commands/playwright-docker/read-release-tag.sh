#!/usr/bin/env bash
set -eu

tag=$(cat "$(dirname "$0")/release-tag")
# Reserve space for the architecture suffix on the CI build tags.
if [[ ! "$tag" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9][A-Za-z0-9_.-]*)?$ ]] || (( ${#tag} > 122 )); then
  echo 'Expected a Playwright version with an optional suffix in release-tag' >&2
  exit 1
fi

printf '%s\n' "$tag"
