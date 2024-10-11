# Scalar API Client

An open-source HTTP testing tool for macOS, Windows & Linux.

## Development

### Install

```bash
$ pnpm install
```

### Run

```bash
$ pnpm dev
```

Simulate an update:

```bash
$ pnpm dev:update
```

### Build

```bash
# Requires access to our toDesktop team
$ pnpm todesktop:build
```

Web UI: https://app.todesktop.com/apps/240718bnjmcfyp4

### Release

```bash
$ pnpm todesktop:build && pnpm todesktop:release
```
