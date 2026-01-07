# Scalar - API Documentation Platform

## What (Project Context)

Scalar is a Vue 3 + TypeScript monorepo providing API documentation and testing tools.

**Architecture:**
- 40+ packages in pnpm workspaces
- Build: Turbo + Vite
- Frontend: Vue 3 Composition API + TypeScript
- Testing: Vitest (unit) + Playwright (E2E)
- Quality: Biome + ESLint + Prettier

**Key Package Categories:**
- **Core**: @scalar/api-client, @scalar/api-reference
- **OpenAPI**: @scalar/openapi-parser, @scalar/oas-utils
- **Utilities**: @scalar/helpers, @scalar/snippetz
- **Integrations**: Express, Fastify, NestJS, Next.js, Nuxt, FastAPI, etc.

Use Glob/Grep to explore packages/ directory for full details.

## Why (Purpose)

Generate beautiful API references from OpenAPI specifications and provide powerful API testing tools for developers.

## How (Development Guidelines)

### Quick Start

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm format           # Format code
pnpm lint:fix         # Fix lint issues
pnpm types:check      # Check TypeScript
```

### Core Patterns

**Vue Components:**
- Use Composition API with `<script setup lang="ts">`
- Strongly type defineProps and defineEmits
- Extract logic to composables
- Style with Tailwind utility classes
- Keep components small and focused

**TypeScript:**
- Prefer `type` over `interface`
- Explicit return types for functions
- Use `unknown` instead of `any`
- Avoid enums, use string literal unions

**Testing:**
- Create `*.test.ts` alongside source files
- Import from vitest explicitly (no globals)
- Test behavior, not implementation
- Cover main cases and edge cases

**Monorepo:**
- Use workspace protocol: `"@scalar/package": "workspace:*"`
- Run commands per package: `pnpm --filter @scalar/package-name`
- Turbo handles build orchestration

### Critical Rules

1. **Always** run quality checks before commits:
   - `pnpm format` and `pnpm lint:fix`
   - `pnpm types:check` must pass
   - Update tests when changing logic

2. **Component best practices:**
   - Fail gracefully with sensible defaults
   - Use semantic HTML for accessibility
   - Computed properties over template logic
   - Move business logic to composables/utilities

3. **Git workflow:**
   - Branch naming: `claude/feature-description`
   - Conventional commits: `feat(scope): description`
   - Use `pnpm` not npm/yarn

4. **Monorepo commands:**
   - Run from root directory
   - Use pnpm workspaces and filters
   - Check turbo.json for build config

### Common Tasks

**Explore a package:** Use `/explore-package` command or read:
- packages/{name}/README.md
- packages/{name}/package.json
- packages/{name}/src/

**Create a package:** Use `/new-package` command or follow existing package structure

**Run tests:** Use `/test-package` or `pnpm test`

**Quality checks:** Use `/check-quality` command

**Create PR:** Use `/pr` command for comprehensive PR descriptions

### Available Commands

Use slash commands for common workflows:
- `/test-package` - Test a specific package
- `/new-package` - Create new package
- `/pr` - Create comprehensive PR
- `/check-quality` - Run all quality checks
- `/explore-package` - Explore package structure

### Specialized Agents

Invoke subagents for specialized help:
- **vue-expert** - Vue components and architecture
- **test-engineer** - Testing strategies and Vitest
- **openapi-specialist** - OpenAPI specs and API docs
- **monorepo-architect** - Monorepo structure and builds

## Key Files

- **monorepo**: packages/ directory, pnpm-workspace.yaml, turbo.json
- **config**: tsconfig.json, biome.json, .prettierrc
- **build**: vite.config.ts, vitest.config.ts in each package
- **hooks**: lefthook.yml, .claude/hooks/

## Anti-Patterns to Avoid

- Don't use npm/yarn (use pnpm)
- Don't skip formatting/linting
- Don't write code without types
- Don't test implementation details
- Don't create bloated components
- Don't ignore accessibility
- Don't commit without running quality checks

## Notes

- Linters handle code style - focus on logic and architecture
- The monorepo is complex - explore incrementally
- Use existing patterns from similar packages
- Ask questions before major architectural changes
- Check CLAUDE.backup.md for detailed original guide
