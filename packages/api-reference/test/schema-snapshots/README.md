# Schema rendering snapshots

A corpus of OpenAPI schemas rendered through `Schema.vue` and serialized into
readable text snapshots. It exists to answer one question quickly: **when we
change the schema components, or the schema types underneath them, what actually
changes on screen?**

## Adding a case

Drop a YAML file into `fixtures/`. There is no test code to write.

```yaml
# fixtures/my-case.yaml
title: What this case is about
notes: |
  Why it exists, or what is interesting about it.
schema:
  type: object
  properties:
    id: { type: string }
```

Then run the suite to generate the snapshot:

```bash
cd packages/api-reference
pnpm vitest test/schema-snapshots --run          # verify
pnpm vitest test/schema-snapshots --run -u       # accept changes
```

Optional fixture keys:

| Key          | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `title`      | Human readable label, written into the snapshot header.               |
| `notes`      | Why the case exists. Also written into the header.                    |
| `knownIssue` | Documents rendering we believe is wrong but currently ship.           |
| `options`    | `SchemaOptions` overrides, e.g. `hideReadOnly` or a `document`.       |
| `name`       | The name the schema renders under. Defaults to the file name.         |

Everything is expanded by default, so a snapshot captures the whole tree rather
than the collapsed state.

## Why text and not screenshots

Screenshots answer "did the pixels move", which is a different and much smaller
question, and they answer it slowly: a built bundle, a browser, and a binary diff
a reviewer has to squint at. There are a handful of those in
`test/features/schema-rendering.e2e.ts` and that is the right size for them.

These snapshots instead serialize the *meaning* of the rendering: names, types,
constraints, flags and nesting. Two consequences matter:

- **Restructuring the components does not churn the snapshots.** Wrapper
  elements, scoped style hashes and Tailwind classes are never read, so a
  refactor that preserves behavior produces an empty diff. That is what makes
  this usable as a safety net while the components are being cleaned up.
- **A diff is readable.** `- id — integer {required}` becoming
  `- id — string {required}` says exactly what regressed, in review, without
  running anything.

## Recording known-bad rendering

A corpus captured from existing code inevitably captures its bugs too. Say so in
the fixture rather than letting the baseline bless them:

```yaml
knownIssue: An empty string default is dropped instead of rendered as `""`.
```

The note is written into the snapshot header, so the file reads as "this is what
we do today, and it is wrong" instead of quietly looking correct.

## Known limitations

- **Only the selected branch of a composition is captured.** `oneOf` and `anyOf`
  render behind a picker, so a snapshot pins the selector plus whichever branch
  is selected first. Covering the other branches means driving the listbox, which
  is not wired up yet. Until then, a fixture that needs to pin a specific branch
  should reorder its members.
- **`$ref` only resolves against a document.** Give the fixture an
  `options.document` when a case needs references, as
  `recursive-self-reference.yaml` and `discriminator-mapping.yaml` do.
- **Interaction is out of scope.** Toggles, hover cards and copy buttons are
  recorded as present but never driven.

## Real-world fixtures

`real-world-*.yaml` are vendored slices of real API descriptions, extracted with
`$ref`s inlined to a fixed depth so they stay reviewable. They are committed
rather than fetched, so the suite is offline and pinned: a snapshot changes when
our rendering changes, never because someone republished their API description.
