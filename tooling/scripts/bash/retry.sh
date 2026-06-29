#!/bin/sh
# Retry a command a few times before giving up.
#
# We use this to wrap `changeset version` during releases. Its changelog
# generator calls the GitHub GraphQL API for every changeset, and a single
# dropped connection (ERR_STREAM_PREMATURE_CLOSE) fails the whole release even
# though changesets cleanly escapes without touching any files. Retrying turns
# those transient blips into a non-event.
#
# Usage: retry.sh <command> [args...]

set -e

ATTEMPTS=3
DELAY=10

i=1
while [ "$i" -le "$ATTEMPTS" ]; do
  if "$@"; then
    exit 0
  fi

  if [ "$i" -lt "$ATTEMPTS" ]; then
    echo "Attempt $i/$ATTEMPTS failed: $*. Retrying in ${DELAY}s…" >&2
    sleep "$DELAY"
  fi

  i=$((i + 1))
done

echo "All $ATTEMPTS attempts failed: $*" >&2
exit 1
