#!/bin/sh

# Set the flag here because plain Playwright run-server drops client launch args.
if [ "${SCALAR_RUNNER_ENABLE_WEBGL:-}" != 1 ]; then
  set -- --disable-webgl "$@"
fi

exec "$0.real" "$@"
