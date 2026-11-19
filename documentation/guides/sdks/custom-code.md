# Custom Code

Generated SDKs rarely cover every need. You might add a convenience method, tweak a type, write a helper, or adjust the README. Scalar lets you edit generated code directly and **carries your changes forward** on every regeneration, so you customize the SDK without forking it or losing future updates.

This works on any target [linked to a GitHub repository](publishing/github.md).

## How it works

Each build does a three-way merge: it compares the previously generated code, the newly generated code, and your repository's current state, then lands the combination on the integration branch, `scalar-next` unless `integrationBranch` renames it. Untouched generated files update cleanly; your edits are preserved; brand-new files you added are left alone.

<scalar-steps>
  <scalar-step id="custom-edit" title="Edit the generated code">

In your SDK repository, change generated files or add new ones, the same as any other code. Commit to **`scalar-next`**, the integration branch — directly or through a pull request against it. Never commit to `scalar-generated`, which holds pristine generator output.

  </scalar-step>

  <scalar-step id="custom-rebuild" title="Rebuild">

The next build regenerates from the latest OpenAPI document and merges your changes into `scalar-next`. Your edits ride along instead of being overwritten.

  </scalar-step>

  <scalar-step id="custom-review" title="Review and merge">

Review the release pull request, which Scalar keeps open from `scalar-next` against your default branch. Most changes merge automatically; only real conflicts need attention.

  </scalar-step>
</scalar-steps>

## Resolving conflicts

A conflict happens when a regenerated file changes the same lines you edited (for example, you customized a method whose signature then changed in the API). When that happens, the target's build is marked as having conflicts and the merge is parked on the `scalar-merge-conflict` branch. You can resolve it two ways:

- **In the dashboard**: open the target's conflicts view and pick the generated or your version for each conflicting file.
- **In GitHub**: resolve the conflict on the `scalar-merge-conflict` pull request like any other Git merge conflict.

Once resolved, the merge lands on `scalar-next` and the release pull request reflects the merged result.

## Tips

- **Keep custom code separate where you can.** New files in their own paths never conflict, so prefer adding a helper file over editing deep inside a generated one.
- **Add README sections in config instead of editing the README.** A section written under `readme.sections` in your Scalar SDK config is generated into every target's README (or the targets it lists), listed in the table of contents where the README has one, so the README never carries a hand edit that a regeneration can conflict with:

  ````yaml
  readme:
    sections:
      - title: Verify a local package
        body: |
          Build the package before importing it from another project:

          ```sh
          pnpm build
          ```
        position: end # or afterUsage, right after the Usage section
        targets: [typescript, cli] # optional; every target when omitted
  ````

  The body is markdown and renders as written. Use `###` or deeper headings, close every code fence on a line of its own and every HTML element, keep each HTML comment and tag on one line, close an element such as `<span>` or `<kbd>` on the line it opens, keep tags and code spans on separate lines when the line starts with a tag, and use fenced rather than indented code blocks. A section that breaks one of these rules is reported as [`Readme/InvalidSection`](diagnostics.md), which fails generation by default and lists every case. Code in a body is treated like the README's own samples: the Python README formats Python fences with ruff, the Go README checks `go` fences against the generated types, and the Rust README keeps every fence out of `cargo test`.
- **Custom CI workflows count as custom code.** A workflow you add under `.github/workflows/` is carried forward like any other file, which is how you publish to an internal registry. See [Private Registries](publishing/private-registries.md).
- **Review the release pull request.** It is the single place where generated changes and your customizations come together, so it is the natural review point before anything releases or [publishes](publishing/overview.md).
- **Custom code is per repository.** Each target keeps its own customizations in its own repository.
- **Allow merge commits on the integration branch.** Each regeneration and each resolved conflict lands on `scalar-next` (or your `integrationBranch`) as a merge commit, so do not enable *Require linear history* on it.
