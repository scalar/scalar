# AGENTS.md – `@scalar/components`

## Package Overview

`@scalar/components` is the shared Vue component library used across all Scalar UI packages. It includes buttons, inputs, modals, dropdowns, code blocks, icons, and other base components. Storybook is the primary development and testing environment.

## Visual Testing

### Running Storybook

```bash
cd packages/components
pnpm dev    # Starts Storybook on http://localhost:5100
```

Or from the repo root with Turbo (auto-builds dependencies):

```bash
pnpm turbo --filter @scalar/components dev
```

Storybook runs on **port 5100** and renders all component stories.

### What to check

- **Component rendering** — verify the component renders correctly in all story variants
- **Interactive states** — hover, focus, active, disabled
- **Dark mode** — use the Storybook dark mode toggle to check both themes
- **Responsive behavior** — resize the preview panel to check layout at different widths
- **Props/controls** — use the Storybook controls panel to test different prop combinations

### Downstream impact

Components from this library are consumed by `@scalar/api-reference` and `@scalar/api-client`. After verifying changes in Storybook, also check the relevant downstream playground:

- **api-reference**: `pnpm turbo --filter @scalar/api-reference dev`
- **api-client**: `pnpm turbo --filter @scalar/api-client dev`

### E2E tests

```bash
pnpm test:e2e        # Run Playwright visual regression tests
pnpm test:e2e:ci     # CI mode
pnpm test:e2e:update # Update snapshots after intentional visual changes
```

## Scaffolding a New Component

Follow these steps to add a new component to the library. Replace `ScalarExample` / `Example` with your actual component name throughout.

### 1. Create the component directory

Create a new directory under `src/components/` using PascalCase matching the component name:

```
src/components/ScalarExample/
```

### 2. Create the minimum required files

Every component needs at least these files:

```
src/components/ScalarExample/
├── ScalarExample.vue          # Component implementation
├── ScalarExample.stories.ts   # Storybook stories
├── ScalarExample.test.ts      # Unit tests
├── index.ts                   # Public exports
```

Add these optional files when the component needs them:

```
├── types.ts                   # Shared prop/emit types (when non-trivial)
├── constants.ts               # Static variant maps or config objects
├── ScalarExample.e2e.ts       # Playwright visual snapshot tests
├── ScalarExampleSub.vue       # Subcomponents (same directory, same prefix)
├── useExample.ts              # Colocated composable
```

### 3. Write the component (`ScalarExample.vue`)

Use the two-script-block pattern: a plain `<script lang="ts">` block for component-level JSDoc, followed by `<script setup lang="ts">` for the implementation.

```vue
<script lang="ts">
/**
 * Short description of what the component does
 *
 * @example
 * <ScalarExample label="Hello" />
 */
export default {}
</script>
<script setup lang="ts">
import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'

const { label } = defineProps<{
  /** Visible label text */
  label: string
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('scalar-example')">
    {{ label }}
    <slot />
  </div>
</template>
```

Key conventions:
- **`defineOptions({ inheritAttrs: false })`** + **`useBindCx()`** — lets consumers override Tailwind classes via the `class` attribute.
- **`v-bind="cx(...)"`** on the root element merges component classes with consumer overrides.
- **`cva()`** for variant-based styling (import from `@scalar/use-hooks/useBindCx`).
- **Destructure props** with defaults: `const { size = 'md' } = defineProps<Props>()`.
- **JSDoc** on every prop, slot (`defineSlots`), and emit (`defineEmits`).
- For non-trivial props types, define them in a separate `types.ts` and import: `import type { ScalarExampleProps } from './types'`.

### 4. Write the barrel export (`index.ts`)

Export the component as a named export. Re-export any public types with `Scalar`-prefixed names.

```ts
export { default as ScalarExample } from './ScalarExample.vue'
export type { ExampleVariant as ScalarExampleVariant } from './types'
```

For components with subcomponents or composables:

```ts
export { default as ScalarExample } from './ScalarExample.vue'
export { default as ScalarExampleItem } from './ScalarExampleItem.vue'
export { useExample } from './useExample'
export type { ExampleOption as ScalarExampleOption } from './types'
```

### 5. Register the component in the package entry

Add a re-export line to `src/index.ts` in alphabetical order inside the `biome-ignore` block:

```ts
export * from './components/ScalarExample'
```

### 6. Write Storybook stories (`ScalarExample.stories.ts`)

Use `@storybook/vue3-vite` with `Meta` and `StoryObj`. Always include `tags: ['autodocs']`.

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarExample from './ScalarExample.vue'

const meta = {
  component: ScalarExample,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: { label: 'Hello' },
  render: (args) => ({
    components: { ScalarExample },
    setup() {
      return { args }
    },
    template: `
<div class="p-2">
  <ScalarExample v-bind="args" />
</div>`,
  }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
```

Conventions:
- Use `satisfies Meta` (not `as Meta`) for the config object.
- Define `argTypes` with `control: 'select'` for union-type props.
- Export one named story per meaningful variant (e.g., `Base`, `Disabled`, `WithIcon`).

### 7. Write unit tests (`ScalarExample.test.ts`)

Use Vitest and `@vue/test-utils`. Top-level `describe` must match the component name.

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarExample from './ScalarExample.vue'

describe('ScalarExample', () => {
  it('renders with a label', () => {
    const wrapper = mount(ScalarExample, {
      props: { label: 'Hello' },
    })
    expect(wrapper.text()).toContain('Hello')
  })
})
```

Conventions:
- Always import `describe`, `it`, `expect` explicitly from `vitest`.
- Test **behavior and accessibility attributes**, not DOM structure or Tailwind classes.
- Do not start test names with "should": use `it('renders with a label')` not `it('should render with a label')`.

### 8. Write visual snapshot tests (`ScalarExample.e2e.ts`) — optional but recommended

Use the extended `test` from `@test/helpers` which provides `snapshot()` and Storybook integration.

```ts
import { test } from '@test/helpers'

test.describe('ScalarExample', () => {
  test.use({ component: 'ScalarExample', crop: true, background: true })

  test('Base', async ({ snapshot }) => {
    await snapshot('base')
  })
})
```

Add `colorModes: ['light', 'dark']` in `test.use()` when the component has theme-dependent styling that warrants separate snapshots. Use `page.getByRole(...)` to interact with the component before taking additional snapshots (e.g., hover states).

### 9. Define types (`types.ts`) — when needed

Extract shared types here when props are non-trivial or types are re-exported from `index.ts`.

```ts
/** Visual variants for ScalarExample */
export type ExampleVariant = 'primary' | 'secondary'

/** Props for the ScalarExample component */
export type ScalarExampleProps = {
  /**
   * The visual variant
   *
   * @default 'primary'
   */
  variant?: ExampleVariant
  /** Visible label text */
  label: string
}
```

Conventions:
- Use `type` not `interface`.
- JSDoc on every exported type and property (with `@default` and `@example` where appropriate).
- Internal-only types stay unexported or in the `.vue` file.

### 10. Define constants (`constants.ts`) — when needed

Use this for static variant maps or large configuration objects.

```ts
import type { ExampleVariant } from './types'

/** Styles for each example variant */
export const EXAMPLE_VARIANT_STYLES = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-200 text-gray-800',
} as const satisfies Record<ExampleVariant, string>
```

### Quick reference checklist

```
- [ ] Folder created: src/components/ScalarExample/
- [ ] ScalarExample.vue with two-script-block pattern and JSDoc
- [ ] index.ts with named exports
- [ ] src/index.ts updated with re-export line
- [ ] ScalarExample.stories.ts with autodocs
- [ ] ScalarExample.test.ts with behavior tests
- [ ] ScalarExample.e2e.ts with snapshot tests (if visually meaningful)
- [ ] types.ts (if props are non-trivial)
- [ ] constants.ts (if variant maps are large)
- [ ] useBindCx / cva used for class merging
- [ ] All props, slots, and emits have JSDoc
```
