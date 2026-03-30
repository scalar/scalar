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
