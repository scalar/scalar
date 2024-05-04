# Scalar Docusaurus API Reference Plugin "Scalasaurus"

[![Version](https://img.shields.io/npm/v/%40scalar/docusaurus)](https://www.npmjs.com/package/@scalar/docusaurus)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/docusaurus)](https://www.npmjs.com/package/@scalar/docusaurus)
[![License](https://img.shields.io/npm/l/%40scalar%2Fdocusaurus)](https://www.npmjs.com/package/@scalar/docusaurus)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

![scalasaurus](docusaurus.png)

## Installation

```bash
npm install @scalar/docusaurus
```

## Usage

Simple add to the plugins section of your Docusaurus config. If you are using
typescript you can import the type options type as well

```ts
import type { ScalarOptions } from '@scalar/docusaurus'

plugins: [
  [
    '@scalar/docusaurus',
    {
      label: 'Scalar',
      route: '/scalar',
      configuration: {
        spec: {
          url: 'https://petstore3.swagger.io/api/v3/openapi.json',
        },
      },
    } as ScalarOptions,
  ],
],
```

### Example

You can find an example in this repo under [examples/docusaurus](https://github.com/scalar/scalar/tree/main/examples/docusaurus)

## Config

These configuration options are a WIP as this plugin is still in beta

### label: string

The label on the nav bar for this route

### route: string

Path at which the API Reference will be shown

### configuration: ReferenceProps

You can find the full configuration options under
[packages/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference)
minus theme.
