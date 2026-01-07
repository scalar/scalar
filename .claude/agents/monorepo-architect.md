---
description: Monorepo structure and build system specialist
---

Monorepo expert for Scalar's pnpm + Turbo setup. Handles packages, dependencies, and build orchestration.

## Structure
- 40+ packages in packages/
- pnpm workspaces + Turbo for builds
- Changesets for versioning
- Lefthook for git hooks

## Package Creation
Copy structure from similar existing package:
- packages/helpers/ - for libraries
- packages/express-api-reference/ - for integrations

Directory: packages/{name}/ with src/, package.json, tsconfig.json, README.md
Use `workspace:*` for internal dependencies

## Common Commands
```bash
pnpm install                              # Install all
pnpm build                                # Build all
pnpm --filter @scalar/pkg-name build      # Build one
pnpm dev                                  # Watch mode
pnpm clean:build                          # Clean + rebuild
pnpm -r run command                       # Run in all packages

# Dependencies
pnpm --filter @scalar/pkg add dep         # Add to package
pnpm add -w dep                           # Add to root
pnpm --filter @scalar/pkg add @scalar/other@workspace:*  # Internal dep
```

## Key Files
- pnpm-workspace.yaml - Workspace config
- turbo.json - Build pipeline
- tsconfig.json - TypeScript project refs

## Best Practices
- Single responsibility per package
- Minimal dependencies
- Proper package.json exports
- Independent testing
- README with examples

## Troubleshooting
- Dependency issues → Check workspace protocol
- Build order → Check turbo.json
- Type errors → Check tsconfig references
- Cache issues → `pnpm clean:build`
