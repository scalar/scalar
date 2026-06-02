# API Reference for Astro

This component provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger document with Astro.

## Installation

```bash
npm install @scalar/astro
```

## Usage

Import and use the `ScalarComponent` in your Astro page or layout:

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent configuration={{
  // How to configure Scalar:
  // https://scalar.com/products/api-references/configuration
  url: '/openapi.json',
}} />
```

The Astro component takes our universal configuration object, [read more about configuration](../configuration.md).

### Client render mode

By default, the component renders a full HTML document ahead of time. Its embedded script runs on a hard page load, but not after a client-side navigation — so on Starlight pages and other Astro sites that use [view transitions](https://docs.astro.build/en/guides/view-transitions/), the API reference can appear only after a manual refresh.

Set `renderMode="client"` to mount Scalar in the browser instead. It re-mounts around Astro's `astro:before-swap` and `astro:page-load` events, so the reference keeps working across client-side navigations.

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent
  renderMode="client"
  configuration={{
    url: '/openapi.json',
  }}
/>
```

In `client` mode the configuration is serialized into the page as JSON, so function-valued options (a custom `fetch`, `onLoaded`, plugins, …) are not carried over. Use the default `static` mode if you rely on those.

### Themes

You can use one of [our predefined themes](https://github.com/scalar/scalar/blob/main/packages/themes/src/index.ts#L15) (`alternate`, `default`, `moon`, `purple`, `solarized`) or overwrite it with `none`. All themes come with a light and dark color scheme.

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent configuration={{
  url: '/openapi.json',
  theme: 'purple',
}} />
```

### Custom page title

There's an additional option to set the page title:

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent configuration={{
  url: '/openapi.json',
  pageTitle: 'Awesome API',
}} />
```

### Custom CDN

You can use a custom CDN, the default is `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

You can also pin the CDN to a specific version by specifying it in the CDN string like `https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.28`

You can find a list of available CDN versions [here](https://www.jsdelivr.com/package/npm/@scalar/api-reference?tab=files).

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent configuration={{
  url: '/openapi.json',
  pageTitle: 'Awesome API',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
}} />
```

### Proxy URL

If you need to proxy API requests (for CORS or other reasons), you can configure a proxy URL:

```astro
---
import { ScalarComponent } from '@scalar/astro'
---

<ScalarComponent configuration={{
  url: '/openapi.json',
  proxyUrl: 'https://proxy.scalar.com',
}} />
```
