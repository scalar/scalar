# Scalar Components

<!-- Hide badges on Storybook -->
<div class="sb-hide">

[![Storybook](https://img.shields.io/badge/storybook-%23e1618c?logo=storybook&logoColor=%23fff)](https://scalar-components.netlify.app/)
[![Version](https://img.shields.io/npm/v/%40scalar/components)](https://www.npmjs.com/package/@scalar/components)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/components)](https://www.npmjs.com/package/@scalar/components)
[![License](https://img.shields.io/npm/l/%40scalar%2Fcomponents)](https://www.npmjs.com/package/@scalar/components)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

</div>

Scalar Components provides a library of components used across Scalar products. The library is designed to work seamlessly with our [theming system](https://github.com/scalar/scalar/tree/main/packages/themes) and includes a scoped copy of the themes reset, base variables and colors.

<!-- Hide the storybook link on Storybook -->
<div class="sb-hide">

Want to explore the components? Check out the [Storybook](https://scalar-components.netlify.app/) for a live demo.

</div>

## Installation

```bash
pnpm i @scalar/components
```

## Scoping

Because many Scalar applications are embedded into other websites the components reset and styles are scoped to the `scalar-app` class. This means you need to add this class to the root element of your application where you want the to use the components. If you are using the components in a standalone application, you can just add this class to the `body` element.

```html
<body class="scalar-app">
  <!-- Use components in here -->
</body>
```

## Usage

To get started, import the CSS styles in your main setup file (e.g., main.ts, index.ts, or App.vue):

```ts
import '@scalar/components/style.css'
```

Then, you can use the components in your Vue components. For example:

```html
<script
  setup
  lang="ts">
  import { ScalarIcon } from '@scalar/components'
</script>
<template>
  <ScalarIcon
    icon="Logo"
    size="lg" />
</template>
```

## Customizing Components

Most components can be customized using props. For example, the `ScalarIcon` component can be customized with the `size` prop to change the size of the icon.

```html
<ScalarIcon
  icon="Logo"
  size="lg" />
```

However, sometimes you need to override the default styles. Most components (soon to be all) use the `useBindCx` function to apply the Tailwind classes to the component. The function intelligently merges the component's classes with the provided classes allowing you to override preset classes.

```html
<!-- An icon you need to be really big -->
<ScalarIcon
  icon="Logo"
  class="size-24" />
```

This will apply the `size-24` class to the icon and remove the `size-full` class that would normally be applied by default. For more information see the [useBindCx](https://github.com/scalar/scalar/blob/main/packages/use-hooks/src/useBindCx/useBindCx.ts) function.

## Floating Components

The component library includes a number of floating components including the `ScalarPopover`, `ScalarDropdown`, and `ScalarListbox` as well as a `ScalarFloating` primitive. All of the components use [Floating UI](https://floating-ui.com/docs/vue) under the hood and provide the same for interacting with the Floating UI API.

When using the floating components the default slot renders reference / target element (e.g. a button) and a named slot renders the floating element (e.g. a menu). For example:

```html
<ScalarPopover>
  <!-- Reference element -->
  <ScalarButton>Open</ScalarButton>
  <template #popover>
    <!-- Floating element -->
  </template>
</ScalarPopover>
```

Since you can directly target the reference element with Tailwind classes any classes applied to the base component will be applied to the floating element (using useBindCx under the hood). For example:

```html
<!-- Will apply the class `w-48` to the floating element (the popover) -->
<ScalarPopover class="w-48">
  <!-- Will apply the class `w-full` to the reference element (the button) -->
  <ScalarButton class="w-full">Open</ScalarButton>
  <template #popover> ... </template>
</ScalarPopover>
```

## CSS Layers

The components package uses the same [CSS Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) as the themes package to apply the theme styles. For more information see the [themes README](https://github.com/scalar/scalar/tree/main/packages/themes).

## Contributing

All pull requests should include the following checklist:

```md
## Component Checklist

- [ ] Exported from `@scalar/components`
- [ ] Has JSDocs for all:
  - [ ] Components (with examples)
  - [ ] Props
  - [ ] Slots
  - [ ] Emits
  - [ ] Functions
  - [ ] Types
- [ ] Allows overriding of Tailwind classes where applicable (see useBindCx)
- [ ] Has stories showcasing any applicable variants
- [ ] Has unit tests covering any applicable interactions
```
