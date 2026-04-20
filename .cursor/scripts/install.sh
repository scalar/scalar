#!/usr/bin/env bash
set -euo pipefail

echo "[cloud-install] Ensuring Node and pnpm versions are available..."
node --version
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.16.1 --activate >/dev/null 2>&1 || true
pnpm --version

if [ ! -f "pnpm-lock.yaml" ]; then
  echo "[cloud-install] pnpm-lock.yaml not found; aborting."
  exit 1
fi

echo "[cloud-install] Installing dependencies with a frozen lockfile..."
pnpm install --frozen-lockfile --prefer-offline

state_dir="${HOME}/.cache/cursor-cloud-agent/scalar"
build_marker_path="${state_dir}/build-packages-fingerprint.txt"
mkdir -p "${state_dir}"

git_revision="nogit"
if command -v git >/dev/null 2>&1; then
  git_revision="$(git rev-parse HEAD 2>/dev/null || echo "nogit")"
fi

fingerprint="$(
  {
    printf '%s\n' "${git_revision}"
    sha256sum pnpm-lock.yaml package.json turbo.json
  } | sha256sum | awk '{ print $1 }'
)"
previous_fingerprint=""
if [ -f "${build_marker_path}" ]; then
  read -r previous_fingerprint < "${build_marker_path}"
fi

if [ "${fingerprint}" = "${previous_fingerprint}" ]; then
  echo "[cloud-install] Skipping build:packages (fingerprint unchanged)."
else
  echo "[cloud-install] Prewarming frequently used workspace outputs..."
  pnpm build:packages
  printf '%s\n' "${fingerprint}" > "${build_marker_path}"
fi

echo "[cloud-install] Priming Vue test-utils module resolution for api-client..."
node .cursor/scripts/ensure-vue-test-utils-resolution.mjs

echo "[cloud-install] Install step completed."
