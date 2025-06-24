# Scalar API Reference for React

[React](https://react.dev/) is one of the most popular libraries for web and native user interfaces. If you plan to render an API reference in React, we’ve got great news for you: There’s a React integration of our package to render OpenAPI documents and here’s how you can use it:

## Installation

```bash
npm install @scalar/api-reference-react
```

## Usage

The API Reference package is written in Vue. That shouldn’t stop you from using it in React, though. We have created a client side wrapper in React:

> [!WARNING]\
> This is untested on SSR/SSG!

```ts
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      }}
    />
  )
}

export default App
```

We wrote a [detailed integration guide for React](https://github.com/scalar/scalar/tree/main/documentation/integrations/react.md), too.

### Example

You can find an example in this repo under [examples/react](https://github.com/scalar/scalar/tree/main/examples/react)

## Props

ApiReference only takes one prop which is the configuration object.

### configuration: ReferenceProps

You can find the full configuration options under
[packages/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference).

## Guide

### Create a new React project (optional)

There are [tons of ways to set up a new React project](https://react.dev/learn/start-a-new-react-project). Here is an easy one using [Vite](https://vitejs.dev/) to get you started:

:::scalar-callout{ type=info }
We’re using [pnpm](https://pnpm.io/installation) here. You can also just use npm, yarn or whatever you're used to. ✌️
:::

```bash
pnpm create vite my-awesome-app
```

You’ll see some questions that you can answer to your liking. We just picked `React` here:

```bash
? Select a framework: › - Use arrow-keys. Return to submit.
    Vanilla
    Vue
❯   React
    Preact
    Lit
    Svelte
    Solid
    Qwik
    Others
```

And we’re big TypeScript fans, but used plain `JavaScript` for the sake of this tutorial:

```bash
? Select a variant: › - Use arrow-keys. Return to submit.
    TypeScript
    TypeScript + SWC
❯   JavaScript
    JavaScript + SWC
    Remix ↗
```

Okay, your new React project is ready. Jump into the folder, install the dependencies and let’s go!

```bash
cd my-awesome-app
pnpm install
pnpm run dev
```

This boots your development server. Open <http://localhost:5173/> to see the beautiful Vite/React example page. That wasn’t too hard, was it? :)

### Render your OpenAPI document with Scalar

Cool, you’ve got your (existing) React project and want to render an API reference. That’s awesome! You’re just two steps away. First, install our package for React:

```bash
pnpm add @scalar/api-reference-react
```

And then, add a new component or just replace the `App.jsx` with the following content:

```jsx
// src/App.jsx
import { ApiReferenceReact } from '@scalar/api-reference-react'

import '@scalar/api-reference-react/style.css'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      }}
    />
  )
}

export default App
```

Open <http://localhost:5173/> and you should see your API reference. Done!
