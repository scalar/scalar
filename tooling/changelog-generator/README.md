# @scalar-internal/changelog-generator

Custom changelog generator for Scalar packages that creates cleaner, more readable changelogs.

## Features

- **No commit hashes**: Changelogs only show PR links, not commit hashes
- **No "Thanks" messages**: Cleaner format without contributor attribution in changelog
- **Bundled frontend versions**: `pnpm release:version` records the `@scalar/api-reference` version only in newly released integrations that declare the dependency and copy its standalone JS bundle. This covers .NET, Java, Docker, and Rust.
- **No dependency release notes**: Changes in packages such as `@scalar/workspace-store` are not repeated across dependent changelogs. Non-bundling packages receive no dependency entries.

The Changesets dependency hook stays silent because it does not receive the consumer package. The `version:packages` wrapper snapshots integration versions, runs Changesets, then adds a bundled version entry only to integrations whose versions changed. Run the root `release:version` command to include this step; running `changeset version` directly bypasses it.
