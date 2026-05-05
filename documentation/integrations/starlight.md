# API Reference for Starlight (Astro)

Starlight is built on Astro, so the Scalar integration for Starlight uses `@scalar/astro`.

Use `renderMode="client"` so Scalar mounts correctly after Starlight navigation events.

## Installation

```bash
npm install @scalar/astro
```

## Usage

Use `ScalarComponent` in a Starlight page, and set `renderMode` to `client`:

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent
  renderMode="client"
  configuration={{
    // Read more about configuration:
    // https://scalar.com/products/api-references/configuration
    url: '/openapi.json',
  }}
/>
```

## Why use `renderMode="client"` in Starlight

Starlight commonly uses view transitions and client-side navigation. In this setup, static server-rendered HTML can appear empty after route changes until a full refresh.

Client mode remounts Scalar on page transitions, which avoids that issue.

## Related Astro guide

For Astro usage outside of Starlight, see [API Reference for Astro](./astro.md).
