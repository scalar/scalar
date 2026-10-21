# Specification Extensions

The Specification Extensions block displays extension names and values, including expandable objects and arrays. Use it to show selected `x-*` metadata in your own Vue 3 application.

Import `SpecificationExtensions` from `@scalar/blocks/specification-extensions`. It receives values directly and does not require a workspace store or event bus. There is no JavaScript mounting helper.

## Usage

```bash
npm install @scalar/blocks vue
```

```vue
<script setup lang="ts">
import { SpecificationExtensions } from '@scalar/blocks/specification-extensions'
import '@scalar/blocks/style.css'

const extensions = {
  'x-owner': 'Platform team',
  'x-internal': false,
  'x-rate-limit': { requests: 100, window: '1 minute' },
  'x-tags': ['public', 'stable'],
}
</script>

<template>
  <div class="scalar-app light-mode">
    <SpecificationExtensions :extensions="extensions" />
  </div>
</template>
```

## Props and behavior

| Prop         | Type                      | Description                                                                         |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------- |
| `extensions` | `Record<string, unknown>` | Required. The selected extension names and their original values, in display order. |

Strings, numbers, booleans, and `null` render as values. Nonempty objects and arrays have expand/collapse controls. Top-level containers start expanded; nested containers start collapsed. Empty objects and arrays display as `{}` and `[]`. An empty `extensions` object renders no content.

The component displays the keys you pass. It does not scan an API description, filter names to `x-*`, or interpret extension semantics. Select the extension fields you want to expose before passing them in.

To show extensions alongside schema properties, see the [Schema block's `showExtensions` option](schema.md#display-options).
