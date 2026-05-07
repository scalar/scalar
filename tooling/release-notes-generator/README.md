# @scalar-internal/release-notes-generator

CI utility that turns a Changesets-style `CHANGELOG.md` section into an
AI-written, user-facing release note and appends it to the package's
`RELEASE_NOTES.md`. The API client bundles `RELEASE_NOTES.md` and parses
it at runtime to power the in-app "What's new" modal.

## What it does

1. Reads the section of a package's `CHANGELOG.md` that was added by
   `pnpm changeset version`.
2. Pulls the title and description of every PR referenced from that
   section so the model has the human-written context, not just the
   one-line commit subject.
3. Asks Anthropic Claude to summarise it in the same Linear-style tone
   used by `packages/api-client/RELEASE_NOTES.md`.
4. Validates the model output against a Zod schema mirroring the
   client's `ReleaseNote` type.
5. Inserts the generated note into `RELEASE_NOTES.md` (creating it if
   missing). Re-running for the same version replaces the previous entry
   in place, so the operation is idempotent.

The generator runs as part of `pnpm changeset version` in CI, so the
new entry lands in the same "chore: release" pull request as the
`CHANGELOG.md` and version bumps and ships inside the published npm
tarball - no separate publish step, no remote storage to keep in sync.

## Usage

```bash
ANTHROPIC_API_KEY=sk-ant-... \
  pnpm --filter @scalar-internal/release-notes-generator start \
    --package @scalar/api-client \
    --changelog packages/api-client/CHANGELOG.md \
    --output packages/api-client/RELEASE_NOTES.md
```

The version is auto-detected from the `package.json` next to
`--changelog`. Pass `--version 3.5.2` explicitly to override it.

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
