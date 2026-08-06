# Custom Code

Generated SDKs rarely cover every need. You might add a convenience method, tweak a type, write a helper, or adjust the README. Scalar lets you edit generated code directly and **carries your changes forward** on every regeneration, so you customize the SDK without forking it or losing future updates.

This works on any target [linked to a GitHub repository](publishing/github.md).

## How it works

Each build does a three-way merge: it compares the previously generated code, the newly generated code, and your repository's current state, then lands the combination on the `scalar-next` branch. Untouched generated files update cleanly; your edits are preserved; brand-new files you added are left alone.

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
- **Review the release pull request.** It is the single place where generated changes and your customizations come together, so it is the natural review point before anything releases or [publishes](publishing/overview.md).
- **Custom code is per repository.** Each target keeps its own customizations in its own repository.
