# Plugins

Build custom plugins to extend the functionality of your API reference.

## Using a Plugin

```typescript
import { MyCustomPlugin } from './my-custom-plugin.ts'

const configuration = {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  plugins: [
    MyCustomPlugin(),
  ],
}
```

## Creating a Plugin

### Specification Extensions

The OpenAPI specification allows to [**extend the format**](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#specification-extensions).
You can add custom properties. They are always prefixed with a `x-`, here is an example:

```diff
openapi: 3.1.1
+x-defaultPlanet: 'earth'
info:
  title: Hello World
  version: 1.0
paths: {}
```

#### Render with Vue

```typescript
import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import CustomVueComponent from './components/CustomVueComponent.vue'

export const XCustomExtensionPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'my-custom-plugin',
      extensions: [
        // Vue
        {
          name: 'x-defaultPlanet',
          component: CustomVueComponent,
        },
      ],
    }
  }
}
```

#### Render with React

```bash
npm install @scalar/react-renderer react react-dom
```

```typescript
import { ReactRenderer } from '@scalar/react-renderer'
import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import { CustomReactComponent } from './components/CustomReactComponent'

export const XCustomExtensionPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'my-custom-plugin',
      extensions: [
        // React
        {
          name: 'x-defaultPlanet',
          /** This is a React component. 🤯 */
          component: CustomReactComponent,
          /** Pass a custom renderer to make it work. */
          renderer: ReactRenderer,
        },
      ],
    }
  }
}
```

### Lifecycle Hooks

Plugins can hook into the API Reference lifecycle to run code at specific points.

#### Available Hooks

- `onInit({ config })` — Called when the API Reference is initialized. Receives the resolved configuration.
- `onConfigChange({ config })` — Called when the API Reference configuration changes.
- `onDestroy()` — Called when the API Reference is destroyed. Use for cleanup.

#### Example

```typescript
import type { ApiReferencePlugin } from '@scalar/types/api-reference'

export const AnalyticsPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'analytics-plugin',
      extensions: [],
      hooks: {
        onInit({ config }) {
          console.log('API Reference initialized', config)
        },
        onConfigChange({ config }) {
          console.log('Configuration changed', config)
        },
        onDestroy() {
          console.log('API Reference destroyed')
        },
      },
    }
  }
}
```

### Additional Components

Plugins can inject components at specific locations in the API Reference using views.

#### Available Views

- `content.end` - After the Models section

#### Example

```typescript
import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import CustomComponent from './components/CustomComponent.vue'

export const FeedbackPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'feedback-plugin',
      extensions: [],
      views: {
        'content.end': [
          {
            component: CustomComponent,
          },
        ],
      },
    }
  }
}
```

#### Component Props

View components receive:

- `options` - API Reference configuration options

#### Using React Components

```typescript
import { ReactRenderer } from '@scalar/react-renderer'
import { CustomComponent } from './components/CustomComponent'

export const FeedbackPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'feedback-plugin',
      extensions: [],
      views: {
        'content.end': [
          {
            component: CustomComponent,
            renderer: ReactRenderer,
          },
        ],
      },
    }
  }
}
```

# API Client Plugins

The API Reference uses the API Client to test requests. The API Client has its own plugin API and you can't pass a API Client plugin directly, to the API Reference, but you can wrap it in a API Reference plugin.

API Client Plugins can add lifecycle hooks, custom UI components, and custom response body handlers for content types the client does not natively support.

## Using a Plugin

Pass plugins when creating the API Client:

```typescript
import { createApiClientApp } from '@scalar/api-client/app'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'

const myPlugin: ClientPlugin = {
  // ...
}

createApiClientApp(el, {
  layout: 'web',
  plugins: [myPlugin],
})
```

## Example: Custom Response Body Handling

When your API returns a content type the client does not natively support (for example, MessagePack), you can register a `responseBody` handler to decode and display it:

```typescript
import { createApiReference } from '@scalar/api-reference'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferencePlugin } from '@scalar/types/api-reference'

/** Msgpack API Client Plugin */
const MsgpackApiClientPlugin: ClientPlugin = {
  responseBody: [
    {
      mimeTypes: ['application/msgpack', 'application/x-msgpack'],
      decode: async (buffer) => {
        const { decode } = await import('@msgpack/msgpack')
        const decoded = decode(new Uint8Array(buffer))
        return JSON.stringify(decoded, null, 2)
      },
      language: 'json',
    },
  ],
}

/** Wrapped in an API Reference Plugin */
const MsgpackPlugin = (): ApiReferencePlugin => {
  return () => ({
    name: 'msgpack',
    extensions: [],
    apiClientPlugins: [MsgpackApiClientPlugin],
  })
}

/** Creating a new API Reference */
createApiReference(el, {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  plugins: [MsgpackPlugin],
})
```

Each handler in `responseBody` supports:

| Property | Description |
|---|---|
| `mimeTypes` | MIME type patterns to match (exact or wildcard like `application/vnd.*+json`). |
| `decode` | Transforms the raw `ArrayBuffer` into a string or Blob for display. |
| `language` | CodeMirror language hint for the built-in raw renderer (for example, `json`). Mutually exclusive with `rawComponent`. |
| `rawComponent` | A custom Vue component for the raw view. Mutually exclusive with `language`. |
| `previewComponent` | A custom Vue component for the preview view. |

## Lifecycle Hooks

Plugins can hook into the request lifecycle:

```typescript
const loggingPlugin: ClientPlugin = {
  hooks: {
    beforeRequest: ({ requestBuilder }) => {
      requestBuilder.headers.set('X-Custom-Header', 'value')
    },
    responseReceived: ({ response }) => {
      console.log('Response status:', response.status)
    },
  },
}
```
