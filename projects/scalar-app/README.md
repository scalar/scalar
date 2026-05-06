# Scalar App

[![GitHub License](https://img.shields.io/github/license/scalar/scalar)](https://github.com/scalar/scalar/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)
[![Scalar App](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.todesktop.com%2Fv1%2FgetReleaseBuildIds%3FappId%3D240718bnjmcfyp4&query=%24.releases%5B%3A1%5D.version&label=Scalar%20App&labelColor=%231a1a1a&color=%23e7e7e7)](https://scalar.com/download)

OpenAPI-based API Client for macOS, Windows & Linux. Offline-first, fully open-source and built on open standards.

## Download

Visit our official download page at <https://scalar.com/download> to get the latest version of the Scalar App for free. Available for macOS, Windows, and Linux, our app provides a powerful and intuitive interface for all your HTTP testing needs.

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

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
