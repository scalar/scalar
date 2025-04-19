# Scalar Icons

This package provide a set of icons for use Scalar applications based on [Phosphor Icons](https://phosphoricons.com/). It uses a custom Vue implementation based on the [`@phosphor-icons/vue`](https://github.com/phosphor-icons/vue) package which allows for tree shaking.

For a full list of available icons see [Phosphor Icons](https://phosphoricons.com/#beacon). The icon will be available from this package as `ScalarIcon<Icon Name in PascalCase>`.

## Installation

```bash
pnpm i @scalar/icons
```

## Usage

```vue
<script setup lang="ts">
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
</script>

<template>
  <!-- You can size and color the icons easily using Tailwind -->
  <ScalarIconMagnifyingGlass class="size-4 text-c-3" weight="bold" />
</template>
```

## Differences from [`@phosphor-icons/vue`](https://github.com/phosphor-icons/vue)

There are a few differences between this implementation and [`@phosphor-icons/vue`](https://github.com/phosphor-icons/vue) to better it align with our Scalar stack.

* **Size & Color Props:** Rather than using props you can use Tailwind classes (e.g. `size-<Number>` or `text-<color>`) to adjust the size and color of the icons. By default the icons are sized to `1em` (the size of the text around it) and set to the currentColor.
* **Mirrored Prop:** If you need to mirror an icon (e.g. for a RTL layout) you can use the `-scale-x-100` Tailwind class.
* **A11y Attributes:** In order to make the icons accessible by default icons have the `aria-hidden` and `role="presentation"` attributes set. If you set the `label` prop then the `aria-label` will be set instead.

## Development

To build the icons we use a icon generation script modified from the [`@phosphor-icons/vue`](https://github.com/phosphor-icons/vue) [`assemble.ts`](https://github.com/phosphor-icons/vue/blob/main/bin/assemble.ts) script. The icon SVGs are pulled from [`@phosphor-icons/core`](https://github.com/phosphor-icons/core) and compiled into individual Vue components for tree shaking.

To generate the icons run:

```bash
pnpm generate:icons
```

This will also update / override the exports in the index file at `src/index.ts`. See also the [development docs for `@phosphor-icons/vue`](https://github.com/phosphor-icons/vue/tree/main?tab=readme-ov-file#development).

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
