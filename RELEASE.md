# Release

## Publishing new versions on npm (requires access to @scalar)

To give users a nice changelog we add so called changesets to our PRs.

A changeset is an intent to release a set of packages at particular semver bump types with a summary of the changes made. The following command allows you to write changeset files as you make changes:
`$ pnpm changeset`

Once you’re ready to publish new versions, bump the versions:
`$ pnpm bump`

Actually publish the packages (requires access to @scalar on npm):
`$ pnpm -r publish`
