#!/bin/sh
set -eu

base=$1
tag=$2
playwright_version=$3
pr_workflow=.github/workflows/pr.yml
main_workflow=.github/workflows/main.yml
docker_helper=packages/helpers/src/playwright/docker.ts

runner_tags() {
  contents=$(git show "$1:$2") || return
  printf '%s\n' "$contents" | sed -nE \
    -e "s|^[[:space:]]*image:[[:space:]]*['\"]?scalarapi/playwright-runner:([A-Za-z0-9_.-]+).*|\1|p" \
    -e "s|^export const DEFAULT_PLAYWRIGHT_VERSION = ['\"]([A-Za-z0-9_.-]+)['\"].*|\1|p" | sort -u
}

runner_tag=$(runner_tags HEAD "$docker_helper")
if [ "${runner_tag%%-*}" != "$playwright_version" ]; then
  echo "Match the Playwright runner pin in $docker_helper to workspace Playwright $playwright_version." >&2
  exit 1
fi

# Check the active pins even when only the catalog changes. Removing a
# duplicate reference does not change the image versions a workflow uses.
pins_changed=false
for file in "$pr_workflow" "$main_workflow" "$docker_helper"; do
  head_tags=$(runner_tags HEAD "$file")
  if [ "$head_tags" != "$runner_tag" ]; then
    echo "Match every Playwright runner pin in $file to $runner_tag." >&2
    exit 1
  fi

  base_tags=$(runner_tags "$base" "$file")
  if [ "$base_tags" != "$head_tags" ]; then
    pins_changed=true
  fi
done

# Consumers can keep using the previous image while the selected release is pending.
if [ "$pins_changed" = true ] && [ "$runner_tag" != "$tag" ]; then
  echo "Adopt the selected Playwright runner tag $tag when updating runner pins." >&2
  exit 1
fi
