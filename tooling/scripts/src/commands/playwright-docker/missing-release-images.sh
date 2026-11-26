#!/bin/sh
set -eu

tag=$1
for repository in playwright playwright-runner; do
  status=$(curl --silent --show-error --head --retry 3 --connect-timeout 10 --max-time 30 \
    --output /dev/null --write-out '%{http_code}' \
    "https://hub.docker.com/v2/namespaces/scalarapi/repositories/$repository/tags/$tag")
  case "$status" in
    200) ;;
    404) printf '%s\n' "$repository" ;;
    *)
      echo "Docker Hub returned HTTP $status for scalarapi/$repository:$tag" >&2
      exit 1
      ;;
  esac
done
