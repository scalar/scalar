# Scalar API Client React

[![Version](https://img.shields.io/npm/v/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client-react)](https://www.npmjs.com/package/@scalar/api-client-react)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-client-react
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

### close: function

function to close the dialog, as seen above

### isOpen: boolean

boolean which controls the visibility of the dialog containing the client

### request: ClientRequestConfig

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

## ApiClientReactBase

We also export the base component if you do not want the modal.
`ApiClientReactBase`

Details on how to use it can be found in the source code for `ApiClientReact`
