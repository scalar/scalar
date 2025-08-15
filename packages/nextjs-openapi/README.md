# [PRE-ALPHA] Scalar Next.js API Reference Handler

[![Version](https://img.shields.io/npm/v/%40scalar/nextjs-openapi)](https://www.npmjs.com/package/@scalar/nextjs-openapi)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/nextjs-openapi)](https://www.npmjs.com/package/@scalar/nextjs-openapi)
[![License](https://img.shields.io/npm/l/%40scalar%2fnextjs-openapi)](https://www.npmjs.com/package/@scalar/nextjs-openapi)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This plugin automatically generates an OpenAPI schema file based on a Next.js API.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/scalar/scalar/assets/2039539/5837adad-a605-4edb-90ec-b929ff2b803b">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/scalar/scalar/assets/2039539/4f58202d-f40f-47b3-aeaa-44681b424a45">
  <img alt="Screenshot of an API Reference" src="https://github.com/scalar/scalar/assets/2039539/4f58202d-f40f-47b3-aeaa-44681b424a45">
</picture>

## Installation

```bash
npm install @scalar/nextjs-openapi
```

## Usage

Currently this plugin is strictly for the app router with typescript. Currently we generate the spec from the Request/Context types as well as the returns in the HTTP method. You can find a simple example in the `playground` folder.

Also is currently under heavy development, all API's are likely to change. However we are looking for feedback! If you have an open API OR would like to share a private one, let us know so we can test the integration with it.

You just need to drop this file into the `app/api/openapi/[[...openapi]]` folder. You can rename the openapi folder to whatever you like but the dynamic folder must be catch-all as we will be serving two endpoints.

```ts
// app/api/openapi/[[...slug]]/route.ts
import { OpenAPI } from '@scalar/nextjs-openapi'

export const GET = OpenAPI().GET
```
