---
description: Create a new package in the monorepo
---

Create a new package in Scalar monorepo.

1. Ask for: name, description, type (library/integration/tool)
2. Create packages/{name}/ with: src/, package.json, tsconfig.json, README.md
3. Copy template from similar package:
   - packages/helpers/ for libraries
   - packages/express-api-reference/ for integrations
4. Update package.json: @scalar/{name}, deps, scripts
5. Add to pnpm-workspace.yaml if needed
6. Run `pnpm install`
7. Verify with `pnpm build` and `pnpm test`
8. Create README with usage examples
