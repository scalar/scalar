# Backfill release notes

Run **Backfill release notes** from GitHub Actions on `main`. The workflow is
manual and does not version or publish packages.

1. Leave **dry-run** enabled to list and validate missing releases without AI calls.
2. Set **since** to the earliest release date to include. The default is June 1,
   2026, covering the gaps in all four product changelogs.
3. Run again with **dry-run** disabled to generate the notes and open a draft PR.
4. Review and merge the generated notes PR to update the documentation.

The workflow needs `ANTHROPIC_API_KEY`, `RELEASE_BOT_APP_ID`, and
`RELEASE_BOT_PRIVATE_KEY`. It uses the existing `release-bot` environment and the
release bot to open a PR that triggers CI.

The script reads the first-parent history of `main`. Release dates use the UTC
commit date when the version bump reached `main`. Changelog sections and bundled
API Client dependency versions come from that same commit. Historical code is
never checked out or executed.

Existing versions are skipped. Successful notes are saved individually. If a
provider call fails, the workflow opens or updates the draft PR with completed
entries and reports failure. Rerun it to resume from that PR branch. Notes already
on `main` take precedence over notes on the backfill branch.

To validate locally without an API key:

```bash
pnpm --filter @scalar/release-notes... build
BACKFILL_DRY_RUN=true pnpm exec tsx .github/actions/backfill-release-notes/run.ts
```

Use `BACKFILL_SINCE=YYYY-MM-DD` to change the starting date. Keep a full Git history
available, as a shallow checkout cannot identify all missing releases.
