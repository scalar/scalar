# Scalar Components Testing

This directory contains the testing infrastructure for Scalar Components, specifically automated snapshot testing using Playwright.

## Overview

The testing setup uses Playwright to capture visual snapshots of Storybook stories, ensuring visual consistency and catching regressions across all component variants. Each component can have multiple stories tested, and custom interaction tests can be added for components with dynamic behavior.

## How It Works

1. **Storybook Integration**: Tests run against the built Storybook static files
2. **Docker Container**: Playwright runs in a Docker container for consistent cross-platform results
3. **Snapshot Generation**: Screenshots are captured of each story and stored in component-specific `snapshots/` directories
4. **Visual Regression Detection**: Playwright compares new screenshots against stored snapshots to detect changes

## Running Tests

### Building Storybook

If you're not running the components dev server Playwright will automatically start serving the built Storybook files from `storybook-static`. This means **before running tests you have to run**,

```bash
pnpm build:storybook
```

It's recommend to run the tests against the built Storybook files rather than the dev server because that's what's used in CI and will yield the most accurate snapshots.

### Local Development

The Playwright browser is run in a Docker container to have consistent results with CI. In order to run the test locally or update snapshots you **must** have Docker set up on your system. 

```bash
# Run tests (starts Docker container automatically)
pnpm test:e2e

# Run specific test file
pnpm test:e2e ScalarCard.e2e.ts

# Update snapshots
pnpm test:e2e --update-snapshots
```

### Debugging Tests

Run the playwright UI to debug your tests

```bash
pnpm test:e2e:ui
```

### CI/CD

Tests run automatically in CI using the same Docker container for consistency. The CI environment:
- Uses the containerized Playwright setup
- Compares snapshots against committed baseline images
- Fails the build if visual regressions are detected

## Contributing

When adding new components or modifying existing ones:

1. **Create test file**: Add `ComponentName.e2e.ts` with appropriate stories
2. **Generate snapshots**: Run tests to create initial snapshots
3. **Review snapshots**: Ensure they capture the intended visual state
4. **Commit snapshots**: Include snapshot files in your pull request
5. **Update on changes**: Regenerate snapshots when making visual modifications

The testing setup ensures that all visual changes are intentional and documented, maintaining the quality and consistency of the Scalar Components library.

### Basic Component Test

To capture a basic snapshots of your stories create an `.e2e.ts` file next to your component:

```ts
import { takeSnapshot, test } from '@test/helpers'

test.describe('ScalarCard', 
  () => ['Base', 'With Actions', 'Minimal']
  // takeSnapshot is a simple test function that just take a single snapshot
  .forEach((story) => test(story, takeSnapshot))
)
```

### Advanced Component Test with Interactions

For components that require user interaction:

```ts
import { test } from '@test/helpers'

test.describe('ScalarDropdown', () =>
  ['Base', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Open the dropdown
      await page.getByRole('button', { name: 'Click Me' }).click()
      // Take a snapshot
      await snapshot()
    }),
  ))
```

### Fixtures and Options

The test helper automatically tries to pull the component name and the story name from the describe block title and from the test title. If you want to use a different test title you can set the component name and story manually via [`test.use`](https://playwright.dev/docs/test-use-options#configuration-scopes).

#### Available fixtures

Fixtures are accessible via the test context.

**`snapshot(suffix?)`**: Captures a screenshot named `story[-suffix].png` using the configured options.

#### Available options:

Options can be configured using [`test.use`](https://playwright.dev/docs/test-use-options#configuration-scopes).


- **`component: string`**: The component name in Storybook, _inferred from the nearest `test.describe` title if not provided explicitly_.
- **`story: string`**: The story name in Storybook, _inferred from the `test` title if not provided explicitly_.
- **`scale: number`**: Device scale factor for crisp screenshots (default 2).
- **`background: boolean`**: Render with background (default false).
- **`crop: boolean`**: Crop to `#storybook-root > *` instead of full page (default false).



