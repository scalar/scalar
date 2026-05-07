# @scalar-internal/release-notes-generator

CI utility that turns a Changesets-style `CHANGELOG.md` section into an
AI-written, user-facing release note and appends it to the package's
`RELEASE_NOTES.md`. The Scalar app bundles `RELEASE_NOTES.md` and parses
it at runtime to power the in-app "What's new" modal.

## What it does

1. Reads the section of a package's `CHANGELOG.md` that was added by
   `pnpm changeset version`.
2. Optionally reads the just-released sections of one or more dependency
   `CHANGELOG.md` files and folds them into the same release note as
   additional context. Useful when the parent package is a thin shell
   over a dependency (for example `scalar-app` on top of
   `@scalar/api-client`).
3. Pulls the title and description of every PR referenced from those
   sections so the model has the human-written context, not just the
   one-line commit subject.
4. Asks Anthropic Claude to summarise the result in the same Linear-style
   tone used by `projects/scalar-app/RELEASE_NOTES.md`.
5. Validates the model output against a Zod schema mirroring the app's
   `ReleaseNote` type.
6. Inserts the generated note into `RELEASE_NOTES.md` (creating it if
   missing). Re-running for the same version replaces the previous entry
   in place, so the operation is idempotent.

The generator runs as part of `pnpm changeset version` in CI, so the
new entry lands in the same "chore: release" pull request as the
`CHANGELOG.md` and version bumps and ships inside the published build -
no separate publish step, no remote storage to keep in sync.

## Usage

```bash
ANTHROPIC_API_KEY=sk-ant-... \
  pnpm --filter @scalar-internal/release-notes-generator start \
    --package scalar-app \
    --changelog projects/scalar-app/CHANGELOG.md \
    --output projects/scalar-app/RELEASE_NOTES.md \
    --dependency-changelog packages/api-client/CHANGELOG.md
```

The version is auto-detected from the `package.json` next to
`--changelog`. Pass `--version 1.1.0` explicitly to override it.

`--dependency-changelog` (`-d`) accepts any number of paths. Each one
must sit next to a `package.json` so the generator can read the
just-bumped version and pull the matching `## <version>` section. Each
dependency uses its own version, since Changesets bumps every package
independently inside the same release. Missing files or sections are
skipped with a warning rather than failing the run.

Add `--dry-run` to print the generated note without touching the file.

## Authentication

- **Anthropic** - reads `ANTHROPIC_API_KEY` from the environment. When
  the variable is missing the generator prints a warning and exits
  successfully so contributors and PR builds running `pnpm changeset
  version` locally without the secret are not blocked.
- **GitHub** - reads `GITHUB_TOKEN` from the environment to fetch PR
  titles and descriptions. The repo is public, so an unauthenticated
  call works too, but the 60 requests / hour / IP rate limit is easy to
  blow through in CI. Failures (no token, rate limited, network blip)
  degrade silently to a CHANGELOG-only prompt rather than failing the
  release pipeline.
