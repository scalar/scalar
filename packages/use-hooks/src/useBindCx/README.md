# Scalar useBindCx Hook

Provides a wrapper around the `cx` function that merges the component's class attribute with the provided classes.

This allows you to override tailwind classes from the parent component and `cx` will intelligently merge them while passing through other attributes.

## Example

```html
<script setup>
import { useBindCx, cva } from '@scalar/components'

defineProps<{ active?: boolean }>()

// Important: disable inheritance of attributes
defineOptions({ inheritAttrs: false })

const { cx } = useBindCx()

const variants = cva({
  base: 'border rounded p-2 bg-b-1',
  variants: { active: { true: 'bg-b-2' } },
})
</script>
<template>
  <div v-bind="cx(variants({ active }))">MockComponent</div>
</template>
```

## Playground

To see a live playground which mounts `MockComponent` see the [`@scalar/components` storybook](https://scalar-components.netlify.app/?path=/docs/playgrounds-usebindcx--docs).