# Release

## Publishing new versions on npm (requires access to @scalar)

Prepare the changelog for new versions:
`$ pnpm changeset`

Build, test and bump versions:
`$ pnpm bump`

Actually publish the packages (requires access to @scalar on npm):
`$ pnpm -r publish`