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
import { ApiClientReact } from '@scalar/api-client-react'
import React, { useState } from 'react'

export const Wrapper = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Click me to open the Api Client
      </button>

      <ApiClientReact
        close={() => setIsOpen(false)}
        isOpen={isOpen}
        request={{
          url: 'https://api.sampleapis.com',
          type: 'GET',
          path: '/simpsons/products',
        }}
      />
    </>
  )
}
```

You will also need one of the following classes on a parent element:

```css
.dark-mode
.light-mode
```

## Props

ApiReference only takes one prop which is the configuration object.

### configuration: ReferenceProps

```ts
export type ClientRequestConfig = {
  id?: string
  name?: string
  url: string
  /** HTTP Request Method */
  type: string
  /** Request path */
  path: string
  /** Variables */
  variables?: BaseParameter[]
  /** Query parameters */
  query?: Query[]
  /** Cookies */
  cookies?: Cookie[]
  /** Request headers */
  headers?: Header[]
  /** Content type matched body */
  body?: string
  /** Optional form data body */
  formData?: FormDataItem[]
}
```
