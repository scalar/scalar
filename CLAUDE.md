# Scalar - API Documentation Platform

Vue 3 + TypeScript monorepo for API documentation and testing tools.

## Quick Start
```bash
pnpm install          # Install
pnpm dev              # Develop
pnpm build            # Build
pnpm test             # Test
pnpm format           # Format
pnpm lint:fix         # Lint
pnpm types:check      # Type check
```

## Stack
- 40+ packages in pnpm workspaces
- Vue 3 Composition API + TypeScript
- Build: Turbo + Vite
- Test: Vitest + Playwright
- Quality: Biome + ESLint + Prettier

**Key Packages:** @scalar/api-client, @scalar/api-reference, @scalar/openapi-parser
Explore packages/ with Glob/Grep for details.

## Core Patterns

**Vue:** `<script setup lang="ts">`, strongly type props/emits, Tailwind CSS, composables for logic
**TypeScript:** `type` over `interface`, explicit return types, `unknown` not `any`
**Testing:** `*.test.ts` alongside source, explicit vitest imports, test behavior not implementation
**Monorepo:** `workspace:*` for internal deps, `pnpm --filter @scalar/pkg` for package commands

## Critical Rules
1. Run `pnpm format`, `pnpm lint:fix`, `pnpm types:check` before commits
2. Update tests when changing logic
3. Keep components small, extract logic to composables
4. Use `pnpm` not npm/yarn
5. Branch naming: `claude/feature-name`
6. Conventional commits: `feat(scope): description`

## Slash Commands
- `/test-package` - Test specific package
- `/new-package` - Create new package
- `/pr` - Create comprehensive PR
- `/check-quality` - Run all quality checks
- `/explore-package` - Explore package structure

## Specialized Agents
- **vue-expert** - Vue components
- **test-engineer** - Testing
- **openapi-specialist** - OpenAPI specs
- **monorepo-architect** - Monorepo structure

## Key Files
- Monorepo: pnpm-workspace.yaml, turbo.json
- Config: tsconfig.json, biome.json
- Hooks: lefthook.yml, .claude/hooks/

## Notes
- Linters handle style - focus on logic
- Explore incrementally
- Follow existing patterns
- See CLAUDE.backup.md for detailed guide
