# Release

## Publishing new versions on npm

To give users a nice changelog we add so called changesets to our PRs.

A changeset is an intent to release a set of packages at particular semver bump types with a summary of the changes made. The following command allows you to write changeset files as you make changes:
`$ pnpm changeset`

Once a PR with a changeset is merged into main the Release workflow will create a PR. Once we’re ready to release new versions, we just need to merge the PR.

When the release PR lands in main, the release workflow will run again and publish the new version to npm then.
