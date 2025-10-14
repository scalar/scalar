# Plugins

Build custom plugins to extend the functionality of your API reference.

## Using a Plugin

```ts
import { MyCustomPlugin } from './my-custom-plugin.ts'

const configuration = {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
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

```ts
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

```ts
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

### View-Based Plugins

Plugins can inject components at specific locations in the API Reference using views.

#### Available Views

- `content.end` - After the Models section

#### Example

For a complete working example, see `ExampleFeedbackPlugin` in the codebase.

#### Creating Your Own Plugin

```ts
import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import FeedbackWidget from './components/FeedbackWidget.vue'

export const FeedbackPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'feedback-plugin',
      extensions: [],
      views: {
        'content.end': [
          {
            component: FeedbackWidget,
            // Optional: Pass custom props
            props: {
              apiKey: 'your-api-key',
            },
          },
        ],
      },
    }
  }
}
```

#### Component Props

View components receive:

- `store` - The workspace store
- `options` - API Reference configuration options
- Any custom props defined in the plugin

#### Using React Components

```ts
import { ReactRenderer } from '@scalar/react-renderer'
import { FeedbackWidget } from './components/FeedbackWidget'

export const FeedbackPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'feedback-plugin',
      extensions: [],
      views: {
        'content.end': [
          {
            component: FeedbackWidget,
            renderer: ReactRenderer,
          },
        ],
      },
    }
  }
}
```
