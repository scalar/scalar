# Claude Development Guide - Scalar

## Project Overview
This is a Vue 3 + TypeScript monorepo for Scalar - an API documentation and testing platform. The project uses pnpm workspaces, Turbo for build orchestration, and modern tooling for development.

## Architecture
- **Monorepo Structure**: Multiple packages and integrations in workspaces
- **Build System**: Turbo with pnpm workspaces
- **Frontend**: Vue 3 with TypeScript and Composition API
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Linting**: ESLint for vue files + Biome for ts files
- **Formatting**: Prettier for vue files + Biome

## Key Packages

### Core API Components
- `@scalar/api-client` - The open source API testing client
- `@scalar/api-client-react` - React wrapper for the API client
- `@scalar/api-reference` - Generate beautiful API references from OpenAPI documents
- `@scalar/api-reference-react` - React wrapper for the API reference component

### Core Infrastructure
- `@scalar/build-tooling` - Build tooling and helpers for all packages
- `@scalar/components` - Scalar's Vue component library with Storybook
- `@scalar/themes` - Default CSS variables and design system
- `@scalar/icons` - SVG icon component library

### OpenAPI & Document Processing
- `@scalar/openapi-parser` - Modern OpenAPI parser written in TypeScript
- `@scalar/openapi-types` - TypeScript type definitions for OpenAPI specifications
- `@scalar/oas-utils` - Open API spec and YAML handling utilities
- `@scalar/openapi-to-markdown` - Convert OpenAPI specs to markdown for LLMs

### Code & Syntax Highlighting
- `@scalar/code-highlight` - Central methods and themes for code highlighting
- `@scalar/use-codemirror` - Vue composable for CodeMirror integration

### Utility Libraries
- `@scalar/helpers` - Collection of dependency-free utility functions
- `@scalar/object-utils` - Advanced object transformation and manipulation
- `@scalar/json-diff` - JSON comparison and merging utilities

### Vue Composables & Hooks
- `@scalar/use-hooks` - Shared Vue composables and utility functions
- `@scalar/use-toasts` - Toast notification system for Vue applications
- `@scalar/draggable` - Vue wrapper around HTML drag and drop

### Code Generation & Conversion
- `@scalar/snippetz` - HTTP client code snippet generation (25+ languages)
- `@scalar/postman-to-openapi` - Convert Postman collections to OpenAPI
- `@scalar/ts-to-openapi` - Generate OpenAPI schemas from TypeScript types

### Development & Testing Tools
- `@scalar/mock-server` - OpenAPI mock server for testing
- `@scalar/void-server` - HTTP request mirroring and testing server
- `@scalar/galaxy` - Reference OpenAPI specification for testing

### Framework-Specific Tools
- `@scalar/nextjs-openapi` - Auto-generate OpenAPI specs from Next.js API routes
- `@scalar/react-renderer` - Bridge for rendering React components in Vue

### Configuration & Types
- `@scalar/types` - Shared TypeScript type definitions
- `@scalar/workspace-store` - Data store and state management

### Import & Processing
- `@scalar/import` - Import various file formats into OpenAPI documents
- `@scalar/pre-post-request-scripts` - Script execution engine for API client automation

## Integrations

### Web Framework Integrations
- `@scalar/express-api-reference` - Express.js middleware
- `@scalar/fastify-api-reference` - Fastify plugin
- `@scalar/hono-api-reference` - Hono framework middleware
- `@scalar/nestjs-api-reference` - NestJS middleware

### Frontend Framework Integrations
- `@scalar/nextjs-api-reference` - Next.js React component
- `@scalar/nuxt` - Nuxt.js Vue framework integration
- `@scalar/sveltekit` - SvelteKit server handler
- `@scalar/docusaurus` - Docusaurus documentation integration

### .NET Integrations
- `@scalar/aspnetcore` - ASP.NET Core integration
- `@scalar/aspire` - .NET Aspire distributed applications

### Python Integrations
- `scalar_fastapi` - FastAPI web framework integration
- `scalar_django_ninja` - Django Ninja integration

### Containerization
- `@scalarapi/docker-api-reference` - Standalone Docker container

## Development Commands

### Core Commands
```bash
# Install dependencies
pnpm install

# Development server (all packages)
pnpm dev

# Build all packages
pnpm build

# Build all packages AND clear cache AND re-install packages
pnpm clean:build

# Test suite
pnpm test

# Format code
pnpm format

# Lint code
pnpm lint:check
pnpm lint:fix

# Type checking
pnpm types:check
```

### Package-Specific Commands
```bash
# API Client development
pnpm dev:client:web

# API Reference development
pnpm dev:reference
```

## Code Standards

### Vue Component Guidelines
- Use **Composition API** with `<script setup>` syntax
- TypeScript is required for all scripts (`lang="ts"`)
- Component names should be PascalCase
- Props and emits should use type-based declarations
- Prefer `type` over `interface` for type definitions

### File Structure
```
packages/
├── api-client/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── views/          # Page components
│   │   ├── layouts/        # Layout components
│   │   └── libs/           # Utility functions
│   └── playground/         # Development playground
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ApiClient.vue`)
- **Files**: kebab-case (e.g., `api-client.ts`)
- **Variables**: camelCase
- **Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

### Code Quality Rules
- Use `type` imports with `type` keyword
- Arrow functions preferred over function declarations
- Optional chaining and nullish coalescing when appropriate
- No unused variables or imports
- Consistent quote style (single quotes)
- Trailing commas in multiline structures

## Testing Strategy

### Unit Tests
- **Framework**: Vitest
- **Location**: `*.test.ts` files alongside source
- **Command**: `pnpm test`
- **Coverage**: `pnpm test:coverage`

### E2E Tests
- **Framework**: Playwright
- **Location**: `playwright/` directory
- **Command**: `pnpm test:e2e`
- **UI Mode**: `pnpm test:e2e:ui`

### Test Guidelines
- Test file names should match source files with `.test.ts` suffix
- Use descriptive test names
- Group related tests with `describe` blocks
- Mock external dependencies appropriately

## Common Patterns

### Vue Component Structure
```vue
<template>
  <div class="component-name">
    <!-- Template content -->
  </div>
</template>

<script setup lang="ts">
import type { ComponentProps } from './types'

// Props
const { prop1, prop2 = 'default' } = defineProps<ComponentProps>()

// Emits
const emit = defineEmits<{
  update: [value: string]
}>()

// Composables and logic
// Prefer tailwind for styles
</script>
```

### TypeScript Types
```typescript
// Prefer types over interfaces
export type UserConfig = {
  apiUrl: string
  theme: 'light' | 'dark'
}

// Use consistent type imports
import type { ApiResponse } from '@/types'
```

## Troubleshooting

### Common Issues
1. **Type Errors**: Check `tsconfig.json` paths and run `pnpm types:check`
2. **Lint Errors**: Use `pnpm lint:fix` to auto-fix issues

### Development Tips
- Use `pnpm dev` for hot reloading during development
- Run `pnpm format` before committing
- Use `pnpm script` for internal build scripts
- Check `turbo.json` for build optimization settings

## Git Workflow

### Branch Naming
- `claude/feature-description` - New features
- `claude/fix-description` - Bug fixes
- `claude/chore-description` - Maintenance tasks

### Commit Messages
- Follow conventional commits format
- Use present tense ("add feature" not "added feature")
- Include scope when relevant: `feat(api-client): add new endpoint`

### Pre-commit Hooks
- **Lefthook** runs linting and formatting
- **Biome** checks code quality
- **TypeScript** compilation check

## Performance Considerations
- Use `defineAsyncComponent` for code splitting
- Implement proper caching strategies
- Monitor bundle sizes with build tools
- Use `v-memo` for expensive list renders

## Key Dependencies
- **Vue 3**: Core framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Vitest**: Testing framework
- **Biome**: Linting and formatting
- **Turbo**: Monorepo orchestration
- **pnpm**: Package manager

## Documentation
- Component props should be documented with JSDoc
- Complex functions need inline comments
- README files for each package
- API documentation generated from OpenAPI specs

## Environment Variables
- Use `.env` files for local configuration
- Document required environment variables
- Use `import.meta.env` for Vite environment access

## Deployment
- **Build**: `pnpm build`
- **Test**: `pnpm test:ci`
- **Type Check**: `pnpm types:check`
- **Format Check**: `pnpm format:check`
- **Lint Check**: `pnpm lint:check`

# TypeScript

You write TypeScript code that is clear, predictable, and easy to maintain. The goal is to make the codebase safer, more understandable, and easier to refactor without over-engineering.

## Principles
* Type safety over flexibility.
* Clarity over cleverness.
* Type inference where it makes sense.

## General Guidelines
* Prefer type over interface.
* Explicit return types for functions.
* Avoid any. Use unknown when the type is unclear.
* Prefer primitive types over complex ones unless necessary.
* Use readonly when possible.
* Avoid enums. Use string literal unions instead.
* Always use const instead of let.

## Naming Conventions
* Be descriptive.
* Use suffixes appropriately.

## Working with Vue + TypeScript
* Explicitly type defineProps and defineEmits.
* Explicit return types for composables.
* Explicitly type Ref and ComputedRef.

## Testing
* Write all tests using vitest.
* Ensure you cover all main cases as well as edge cases, try to break the code with the tests.
* Create the test file alongside the file being tested, call it `name.test.ts`.

# Great Comments for All Types
* Use comments to explain why, not what. Most of the time, the code explains what is happening. Comments should clarify why a type or function exists, why you made specific decisions, or why a workaround is necessary.
* Write friendly comments that sound human. Comments should be clear and helpful, not robotic or overly formal. Aim for a tone that's friendly and supportive, like you're helping a teammate understand the code later.

Good:

```ts
/**
 * We load the user here to make sure we have fresh data when the component mounts.
 * Without this, the user info could be stale.
 */
```

Bad:

```ts
/**
 * Load user.
 */
```

* Avoid contractions in comments. Use do not instead of don't, it is instead of it's, etc. This makes comments easier to read, especially for non-native speakers.

* If you use contractions, make sure they have proper apostrophes. Sometimes contractions can make a comment more approachable. If you choose to use them, use proper punctuation.

* Comment on types when their purpose isn't obvious. If a type models an external API, or has a non-obvious constraint, explain it.

* Explain relationships between types when they're not clear.

Example:

```ts
/**
 * Maps UserStatus to a badge color used in the UI.
 * Should stay in sync with the theme color palette.
 */
export type StatusColorMap = {
  active: 'green'
  inactive: 'gray'
}
```

* Document the intent of utility types or generic types.

Example:

```ts
/**
 * Represents a partial object where at least one property is required.
 * Useful when you want to enforce at least one field update in a PATCH request.
 */
export type AtLeastOne<T> = {
  [K in keyof T]: Partial<T> & Pick<T, K>
}[keyof T]
```

* For complex function signatures or composables, describe the behavior and usage.

Example:

```ts
/**
 * useUser composable for loading and managing user data.
 * Fetches the user from the API and exposes reactive state.
 *
 * Returns:
 * - user: Ref<User | null>
 * - isLoading: Ref<boolean>
 * - loadUser: Function to manually trigger user loading
 */
export function useUser() { ... }
```

* If the type is temporary or will change later, leave a TODO comment.

Example:

```ts
/**
 * TODO: Replace with dynamic permissions from backend when available.
 */
export type Permissions = 'read' | 'write' | 'admin'
```

* Use JSDoc style consistently for types and functions that are exported or public. This improves editor support (tooltips, autocompletion) and helps other developers understand your code faster.

## Example

```ts
/**
 * A user in the system.
 * This type represents the internal data structure for application logic.
 * If you need to expose user data publicly, use `PublicUser`.
 */
export type User = {
  /** Unique identifier for the user (UUID). */
  id: string
  /** The user's full name. */
  name: string
  /** Email address. Must be validated before saving. */
  email: string
  /** ISO date string of when the user signed up. */
  createdAt: string
  /** Whether the user has verified their email. */
  isVerified: boolean
}
```

# Tests

You write tests that are clear, maintainable, and thorough. You optimize for readability and reliability. Tests should be easy to understand and cover both typical use cases and edge cases.

## Setup

* Use Vitest for most tests. Vitest is our primary testing framework.
*	No globals. Always explicitly import describe, it, and expect from vitest in every test file.
*	File naming conventions:
  * Unit/integration test files end with .test.ts.
  * Each test file matches the name of the file it tests. Example: If the code is in custom-function.ts, the test file should be named custom-function.test.ts.
  * The test file is located in the same folder as the file under test. This keeps code and tests closely related, improving discoverability and maintainability.
* Minimize mocking. Only mock when absolutely necessary. Prefer refactoring the code under test to make mocking unnecessary. Aim for simpler, pure functions that are easier to test without mocks.
* Every test file has a top-level describe().
  * The top-level describe() matches the file name under test. Example: describe('custom-function') for custom-function.test.ts.
	*	Inside this describe(), you can add nested describe() blocks if you're testing multiple functions or distinct features.
	* Deeper nesting is fine if it improves clarity.
	*	Use it() for individual tests.
	*	Keep descriptions concise and direct.
	*	Do not start with “should.”
    ✅ it('generates a slug from the title')
    ❌ it('should generate a slug from the title')

## Testing Vue Components

* Don't rely on markup for assertions.
* Avoid testing the exact structure of the DOM unless necessary.
* Do not rely on Tailwind CSS classes in assertions.
* Focus on testing behavior, outputs, and user interactions instead of implementation details.

## Playwright Tests

* Use Playwright for limited end-to-end testing.
* Playwright tests live in /playwright/test/.
* Files end with .spec.ts.
* Example file: @local.spec.ts.
* Be selective. We intentionally limit the number of Playwright tests to avoid maintenance overhead.

## Style & Best Practices

* Clarity first. Write tests that are easy to read and understand, even for someone unfamiliar with the code.
* Think like a QA engineer.
  * Cover all important code paths.
	* Test both the happy path and error handling.
	* Add tests for edge cases and potential failure scenarios.
* Comments are welcome when they add value.
	* Use comments to explain why a test exists, not what it's doing.
	* Avoid repeating what the code already makes obvious.

## Example Test File Structure

```
/src
  /lib
    custom-lib.ts
    custom-lib.test.ts
```

```ts
import { describe, it, expect } from 'vitest'
import { generateSlug } from './custom-function'

describe('custom-lib', () => {
  describe('generateSlug', () => {
    it('generates a slug from the title', () => {
      const result = generateSlug('Hello World')
      expect(result).toBe('hello-world')
    })

    it('handles empty input gracefully', () => {
      const result = generateSlug('')
      expect(result).toBe('')
    })
  })
})
```

# Writing Vue Components

You are an experienced Vue and TypeScript developer. You write components that are clean, readable, and easy to maintain. You optimize for clarity and simplicity.

## Principles

* Keep components small and focused. Each component should do one thing and do it well. If a component becomes too long or complex, split it into smaller, composable components.
* Minimize logic inside components. Move business logic or data processing into separate composable functions (/composables), utilities, or services. This makes the component easier to test and understand.
* Favor computed properties and methods over template logic. Keep templates clean and declarative. Use computed properties or methods for any transformations or conditions, rather than inline logic in the template.
* Fail gracefully. Components should be fault-tolerant. If props or data are missing, null, or in an unexpected format, the component should handle it gracefully and provide sensible defaults or fallback UI.
* Use TypeScript effectively. Strongly type props, emits, and events. Leverage Vue's defineProps and defineEmits to ensure correct usage. Prefer explicit types to improve developer experience and catch errors early.
*	Write testable code. Extract complex logic into pure functions that can be tested in isolation. Keep the component focused on rendering and user interaction.
* Consistent naming and structure.
  * Use clear, descriptive names for components, props, and events.
  * Stick to a consistent file structure (e.g., components, composables, utils).
  * Keep the <script setup> section organized: first imports, then props/emits, then state/computed/methods, and finally lifecycle hooks.

## Styling with Tailwind CSS

* Use Tailwind CSS utility classes for all styling. Avoid writing custom CSS unless necessary. Utility classes keep the styles consistent and colocated with the template.
* Keep class lists readable.
  * Break long class lists into multiple lines for readability if needed.
  * Use component-level abstractions when appropriate.
* If multiple components share the same styles, extract them into reusable Vue components or leverage Tailwind's @apply in minimal CSS files or scoped styles.
* Handle responsive and dark mode thoughtfully. Use Tailwind's responsive and dark mode variants consistently. Ensure components look good on different screen sizes and in both light/dark themes.
* Accessibility matters. Tailwind won't handle accessibility for you. Make sure you add semantic HTML, ARIA attributes where needed, and focus handling for interactive components.

## Example Structure

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useItems } from '@/composables/useItems'

const { initialItems } = defineProps<{
  initialItems?: Item[]
}>()

const { items } = useItems(props.initialItems || [])

/** We don't want to show the card when there's no item. */
const hasItems = computed(() => items.value.length > 0)
</script>

<template>
  <div v-if="items.length" class="grid gap-4 md:grid-cols-2">
    <ItemCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      class="rounded-xl shadow p-4 bg-white dark:bg-gray-800"
    />
  </div>
  <p v-else class="text-center text-gray-500">No items available.</p>
</template>
```
