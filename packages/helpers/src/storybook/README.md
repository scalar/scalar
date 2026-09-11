# Storybook helpers (`@scalar/helpers/storybook`)

Shared Storybook configuration for the Scalar packages that run one. Today that is `@scalar/components` and `@scalar/api-reference`, whose `.storybook` folders held byte-identical copies of this code before it moved here.

Nothing in this folder is meant for consumers of `@scalar/helpers`. It is internal tooling that happens to live in the same package, the same way `@scalar/helpers/playwright` does.

## `themes` (`./themes`)

The Scalar theme presets, expressed as Storybook toolbar options.

### `themeVariants`

Every theme a story can render under, keyed by id. Built from `@scalar/themes`, plus two radius variants (`rounded-none` and `rounded-full`) that push `--scalar-radius` to either end of the scale so components can be snapshotted at both extremes.

The `default` variant injects nothing, because it is the theme the preview already loads. The `none` preset is dropped, because `getThemeStyles` resolves it back to the default preset anyway.

### `applyThemeVariant(id)`

Injects the variant's CSS into a single style element that it owns, replacing rather than stacking styles. Preset CSS arrives wrapped in `@layer scalar-theme`, which outranks the `scalar-base` layer the default preset loads into, so it wins on layer order rather than specificity. This is the same mechanism the API reference uses to apply a theme at runtime.

### `defaultThemeVariant` and `ThemeVariantId`

The variant stories render under unless a story or a test asks for another one, and the union of every valid variant id.

## `globals` (`./globals`)

The toolbar controls every Scalar Storybook shares: a **Theme** picker and a **Color mode** picker.

Color mode defaults to the operating system preference, resolved once when the preview loads, so Storybook opens in whichever mode the rest of the machine is already in. Snapshot tests never see that default — they set the mode classes themselves for every screenshot, light ones included, so baselines do not depend on the machine running them.

### `scalarGlobalTypes` / `scalarInitialGlobals`

Drop these into a `Preview` object as `globalTypes` and `initialGlobals`. They are plain object literals rather than Storybook types, so this package does not have to depend on Storybook — each preview type checks them when it assigns them.

Declaring the globals is also what lets a visual test select one from the story URL, since Storybook drops any global that is not declared:

```text
?globals=theme:laserwave;colorMode:dark
```

### `applyScalarGlobals(globals)`

Applies both globals to the document. Call it from a decorator so it re-runs when the toolbar changes:

```ts
decorators: [
  (story, context) => {
    applyScalarGlobals(context.globals)
    return story()
  },
]
```

### Import

```ts
import { applyScalarGlobals, scalarGlobalTypes, scalarInitialGlobals } from '@scalar/helpers/storybook/globals'
import { type ThemeVariantId, defaultThemeVariant } from '@scalar/helpers/storybook/themes'
```

### Environment

`themes` imports `@scalar/themes`, which is a **devDependency** of this package. Anything importing `@scalar/helpers/storybook/*` has to provide it, the same way `@scalar/helpers/playwright/docker` expects `@playwright/test`.
