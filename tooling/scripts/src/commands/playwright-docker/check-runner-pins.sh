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

# Removing a duplicate pin does not change the image versions a workflow uses.
pins_changed=false
for file in "$pr_workflow" "$main_workflow" "$docker_helper"; do
  base_tags=$(runner_tags "$base" "$file")
  head_tags=$(runner_tags HEAD "$file")
  if [ "$base_tags" != "$head_tags" ]; then
    pins_changed=true
    break
  fi
done

# Consumers can keep using the previous image while the selected release is pending.
if [ "$pins_changed" = false ]; then
  exit 0
fi

if [ "${tag%%-*}" != "$playwright_version" ]; then
  echo "Update the workspace Playwright pin to ${tag%%-*} when adopting runner tag $tag." >&2
  exit 1
fi

for file in "$pr_workflow" "$main_workflow" "$docker_helper"; do
  tags=$(runner_tags HEAD "$file")
  if [ "$tags" != "$tag" ]; then
    echo "Update every Playwright runner pin in $file to $tag." >&2
    exit 1
  fi
done
