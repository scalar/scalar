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
- `@scalar/use-tooltip` - Tooltip functionality for Vue components
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
- `@scalar/config` - Configuration schema and validation utilities
- `@scalar/types` - Shared TypeScript type definitions
- `@scalar/workspace-store` - Data store and state management

### Import & Processing
- `@scalar/import` - Import various file formats into OpenAPI documents
- `@scalar/scripts` - Script execution engine for API client automation

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
- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance tasks

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