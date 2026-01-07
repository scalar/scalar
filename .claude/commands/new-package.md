---
description: Create a new package in the monorepo
---

Guide the user through creating a new package in the Scalar monorepo.

Steps:
1. Ask for the following information if not provided:
   - Package name (e.g., "my-package")
   - Package description
   - Package type (library, integration, tool, etc.)

2. Create the package structure:
   - Create packages/{name}/ directory
   - Set up standard folder structure:
     - src/
     - package.json
     - tsconfig.json
     - README.md
     - vite.config.ts (if needed)
     - vitest.config.ts

3. Copy configuration from a similar existing package:
   - Use packages/helpers/ as a template for libraries
   - Use packages/express-api-reference/ for integrations

4. Update package.json with:
   - Correct package name (@scalar/{name})
   - Description
   - Dependencies based on package type
   - Scripts (build, test, lint, etc.)

5. Add the package to pnpm-workspace.yaml if needed

6. Run `pnpm install` to link the new package

7. Verify setup with `pnpm build` and `pnpm test`

8. Create initial README.md with usage examples
