# Scalar API Client React

[![Version](https://img.shields.io/npm/v/%40scalar/api-reference-react)](https://www.npmjs.com/package/@scalar/api-reference-react)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference-react)](https://www.npmjs.com/package/@scalar/api-reference-react)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference-react)](https://www.npmjs.com/package/@scalar/api-reference-react)

[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

## Installation

```bash
npm install @scalar/api-reference-react
```

## Usage

```ts
import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
      }}
    />
  )
}

export default App
```

### Example

You can find an example in this repo under [examples/react](https://github.com/scalar/scalar/tree/main/examples/react)

## Props

ApiReference only takes one prop which is the configuration object.

### configuration: ReferenceProps

You can find the full configuration options under
[packages/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference).
Here are the type definitions:

```ts
export type ReferenceProps = {
  configuration?: {
    /** A string to use one of the color presets */
    theme?: ThemeId
    /** The layout to use for the references */
    layout?: ReferenceLayoutType
    /** The Swagger/OpenAPI spec to render */
    spec?: {
      /** URL to a Swagger/OpenAPI file */
      url?: string
      /** Swagger/Open API spec */
      content?: string | Record<string, any> | (() => Record<string, any>)
    }
    /** URL to a request proxy for the API client */
    proxy?: string
    /** Whether the spec input should show */
    isEditable?: boolean
    /** Whether to show the sidebar */
    showSidebar?: boolean
    /** Whether dark mode is on or off (light mode) */
    darkMode?: boolean
    /** Key used with CNTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
    searchHotKey?:
      | 'a'
      | 'b'
      | 'c'
      | 'd'
      | 'e'
      | 'f'
      | 'g'
      | 'h'
      | 'i'
      | 'j'
      | 'k'
      | 'l'
      | 'm'
      | 'n'
      | 'o'
      | 'p'
      | 'q'
      | 'r'
      | 's'
      | 't'
      | 'u'
      | 'v'
      | 'w'
      | 'x'
      | 'y'
      | 'z'
    /**
     * If used, passed data will be added to the HTML header
     * @see https://unhead.unjs.io/usage/composables/use-seo-meta
     * */
    metaData?: MetaFlatInput
    /**
     * List of httpsnippet clients to hide from the clients menu
     * By default hides Unirest, pass `[]` to show all clients
     * @see https://github.com/Kong/httpsnippet/wiki/Targets
     */
    hiddenClients?: string[]
    /** Custom CSS to be added to the page */
    customCss?: string
    /** onSpecUpdate is fired on spec/swagger content change */
    onSpecUpdate?: (spec: string) => void
    /** Prefill authentication */
    authentication?: Partial<AuthenticationState>
  }
}
```
