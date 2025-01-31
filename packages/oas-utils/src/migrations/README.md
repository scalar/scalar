# Migrations

This directory contains data migrations for the Scalar API client. Migrations help handle breaking changes in the data structure between versions.

Generally speaking you will need a new migration when you are changing any of the schemas from entities/spec. If you are just adding a new property to an existing schema, you can probably just add it to the existing migration.

## Generating a New Migration

To generate a new migration:

1. Copy the existing migration folder and rename it to the new version number.
2. Run `pnpm typegen:migration` to generate the types for the previous version.
3. Rename the types to the new version number in `types.generated.ts` and `index.ts`.
4. Update the data-version.ts file to the new version number.
5. Add a test for the new migration in `migration.test.ts`.
6. Update the migrator.ts file to include the new migration.
