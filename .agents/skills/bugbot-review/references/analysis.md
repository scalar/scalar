# Reverse-engineering Cursor Bugbot

How the [`bugbot-review`](../SKILL.md) prompt was derived, what the raw comments
gave away, and where a Claude reimplementation will and will not match.

## Method

GitHub search reports **667 pull requests in `scalar/scalar` with a comment from
`cursor[bot]`** (`repo:scalar/scalar is:pr commenter:cursor[bot]`). Fourteen
comments across seven PRs were pulled in full and are reproduced verbatim in
[`examples.md`](./examples.md). The comments' raw markdown carries a surprising
amount of internal structure, which is where most of the derivation comes from.

## The wire format

Every review comment has the same skeleton. The HTML comments are not decoration
— they are Bugbot's own machine-readable fields, which means the model behind it
is emitting a structured object that a renderer wraps, not free-form markdown.

```markdown
### Filter misses changelog generator

**High Severity**

<!-- DESCRIPTION START -->
The turbo filter `./{packages,integrations,tooling/changelog-generator}/**` expands to …
<!-- DESCRIPTION END -->

<!-- BUGBOT_BUG_ID: 26683979-24f7-452d-bce4-8326a7f1217f -->

<!-- LOCATIONS START
.github/workflows/release.yml#L208-L209
LOCATIONS END -->

<div><a href="https://cursor.com/open?link=…">Fix in Cursor</a> <a href="https://cursor.com/agents?link=…">Fix in Web</a></div>

<sup>Reviewed by [Cursor Bugbot](https://cursor.com/bugbot) for commit 0764423e…. Configure [here](https://www.cursor.com/dashboard/bugbot).</sup>
```

Field by field:

- **`### Title`** — 3–5 words, always. Noun phrase, sentence case, no period, no
  leading article. Across all fourteen: `Filter misses changelog generator`,
  `Stale array schema on rename`, `Share images lost site-wide`,
  `Duplicate properties with allOf`. It names the defect, never the fix.
- **`**<Level> Severity**`** — exactly three levels observed: High (1), Medium (8),
  Low (5). No "Critical", no "Info", no emoji.
- **`DESCRIPTION START/END`** — the payload. 2–4 sentences in every sample; the
  longest is four.
- **`BUGBOT_BUG_ID`** — a per-finding UUID, distinct from the `redisKey` UUID in
  the fix links below. An identifier carried in the comment body, on a bot that
  re-reviews every push, is almost certainly there for dedupe. A Claude
  reimplementation cannot mint stable UUIDs across runs, so key on something
  deterministic instead — `hash(path + normalized title)` works.
- **`LOCATIONS START/END`** — one or more `path#Lstart-Lend` entries. The first is
  the anchor; the rest also get a visible `<details><summary>Additional
  Locations (N)</summary>` block with permalinks pinned to the reviewed SHA.
- **Fix buttons** — the base64 blobs decode to plain JSON:
  `{"version":1,"type":"BUGBOT_FIX_IN_CURSOR","data":{"redisKey":"bugbot:<uuid>","encryptionKey":"…","branch":"claude/fix-release-changelog-generator","repoOwner":"scalar","repoName":"scalar"}}`,
  and the web variant adds `prNumber`, `commitSha`, `provider`. So the full
  finding is persisted server-side under an (encrypted) Redis key and handed to a
  fixing agent on click — the comment is a pointer, not the payload. Whatever
  context the fixer gets, it is richer than the four sentences in the comment.
- **`<sup>Reviewed by … for commit <sha></sup>`** — confirms per-commit runs.
  In PR #9584, four comments carry four different SHAs; earlier threads show
  `is_outdated: true`.
- **`<sup>Triggered by learned rule: <name></sup>`** — appears on exactly one
  comment, linking to
  `cursor.com/dashboard/bugbot/rules/learned/79f184ba-…`, named *"Prefer
  @scalar/helpers shared utilities over local type guard reimplementations"*.
  Bugbot maintains a per-repo store of conventions it has induced from past
  reviews and injects them as extra criteria.

## The behavioural fingerprint

Six things the corpus shows that a naive "review this PR" prompt will not
reproduce.

**1. It reads the PR description as a spec.** Three of fourteen comments are
literally "the summary claims X, the diff does not deliver X":
*"never adds the page-level `head.title` overrides the summary relies on"*,
*"the claimed unique SEO titles are not applied"*, *"the case the PR description
calls out"*, *"The PR intended to scope only title/description tags to the
homepage"*. This is the single highest-yield behaviour and the easiest to
instruct.

**2. Nearly every finding cites something outside the diff.** `withHook` in
`workspace-events.ts`. `DEFAULT_PLAYWRIGHT_VERSION` in
`packages/helpers/src/playwright/docker.ts`. `integrations/nuxt/playwright.config.ts`
defining a `firefox` project. `mergeAllOfSchemas`. The catalog pin in
`pnpm-workspace.yaml`. A reviewer that only reads the hunk cannot produce these,
which is why the skill makes "open the whole file and grep for callers" a
mandatory step rather than a suggestion.

**3. Volume is low and the bar is high.** One to four comments per PR; several
PRs with substantial diffs got zero. There is no nitpick tail — nothing about
naming, formatting, missing tests, or missing JSDoc, in a repo whose own
`CLAUDE.md` has strong opinions on all three. That restraint has to be instructed
explicitly, because the default failure mode of an LLM reviewer is a long list of
low-value observations.

**4. It never proposes a patch.** Zero code blocks in fourteen comments. It
describes the defect precisely enough to be actionable and stops. The "Fix in
Cursor" button is where the fix lives — that is a product decision, but it also
keeps the comment short and keeps the model from anchoring the author on a
possibly-wrong repair.

**5. Consequences are concrete.** *"Non-homepage shares on Slack/X/LinkedIn now
have no preview image."* *"Those Firefox runs will fail because the browser
binary is missing."* *"`changeset version` can keep failing with
`MODULE_NOT_FOUND`."* *"The factored fields can appear twice in the reference
UI."* Never "this may cause unexpected behavior".

**6. It pre-empts the author's defense.** *"The change is not a no-op when the
model updates after the tick."* *"contradicting the `parseBracketKey` rules in
this change."* *"despite declaring a large-image card."* The model has clearly
been told to argue against the finding before publishing it, and it keeps the
surviving counter-argument in the comment.

## Calibration: it is not always right

PR #9772's High-severity finding claimed the turbo glob still skipped
`@scalar-internal/changelog-generator`. The author checked against the pinned
turbo version and found the glob did match — then changed the code anyway,
because not depending on per-version glob behaviour was the better diff. Useful
to know when tuning: a Bugbot-style reviewer optimizes for *surfacing the
question*, and some fraction of High-severity calls will be wrong on the facts.
The skill's step 4 (adversarial self-refutation) is the lever to trade recall for
precision here — tighten it if false positives cost more than misses in your
workflow.

## Reproducing it with Claude

Three ways to run the skill, in increasing order of fidelity:

**Inline.** `Skill(bugbot-review)` on a PR you have checked out. Fine for a
single pass; the weak point is that one context does both the finding and the
judging, and models are reluctant to kill their own candidates.

**Two-pass.** Find candidates in one pass, then start a *fresh* context per
candidate whose only job is to refute it, given the candidate plus the repo. Kill
anything the refuter cannot rule out. This maps directly onto Bugbot's observed
precision and is the biggest single quality win.

**Fan-out.** Several finders with different lenses (PR-intent-vs-code,
cross-file/caller drift, invariant violation, config/version drift), then the
refutation pass, then dedupe by `path + title`. This is what `/code-review` and
the `Workflow` tool are for — worth it on large diffs, overkill on a three-file
PR.

For posting: one review comment per surviving finding, anchored to the last line
of the primary location, via `add_comment_to_pending_review` on a pending review
plus `submit_pending` with `event: COMMENT`. Batch them into one review rather
than posting individually, so the author gets a single notification.

## Bugbot configuration in this repo

There is no `BUGBOT.md`, no `.cursor/` directory, and no Bugbot workflow file in
`scalar/scalar` — it runs entirely from the GitHub App's server-side
configuration at `cursor.com/dashboard/bugbot`, plus the learned-rules store.
Anything repo-local you want a Claude equivalent to honour has to be written into
the skill, `AGENTS.md`, or a rules file of your own.
