# Generated Types

This folder contains auto-generated TypeScript types produced by `@scalar/schemas`.

Do **not** edit files in this directory manually — they will be overwritten on the next generation run.

## How it works

1. Schemas defined in `@scalar/schemas` are the source of truth for configuration shapes.
2. Running `pnpm types:generate` in `packages/schemas` invokes the type generator, which writes `.d.ts` files here.
3. Sibling folders in `packages/types/src/` import these generated types, re-export them (with any additional hand-written types), and expose them through the package entry points.

## Regenerating

From the repository root:

```bash
pnpm --filter @scalar/schemas types:generate
```
