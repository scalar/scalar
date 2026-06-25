# Rust (crates.io)

The Rust target publishes to [crates.io](https://crates.io/). The crate name is the target's `packageName`.

Authenticate the release with **OIDC trusted publishing** (recommended) or a **crates.io API token**.

## Enable publishing

```json
{
  "targets": {
    "rust": {
      "packageName": "acme",
      "publish": { "cargo": true }
    }
  }
}
```

## Trusted publishing (OIDC)

Recommended. The release workflow uses `rust-lang/crates-io-auth-action` to exchange the workflow's identity token for a short-lived crates.io token, so no secret is stored.

<scalar-steps>
  <scalar-step id="cargo-oidc-add" title="Add a trusted publisher on crates.io">

On [crates.io](https://crates.io/), open the crate's **Settings → Trusted Publishing** and add a **GitHub** publisher:

- **Repository owner and name**: your [linked repository](github.md)
- **Workflow filename**: `sdk-release.yml`
- **Environment**: leave blank (unless you set `releaseEnvironment`)

  </scalar-step>

  <scalar-step id="cargo-oidc-config" title="Keep the default config">

```json
{ "targets": { "rust": { "publish": { "cargo": true } } } }
```

  </scalar-step>
</scalar-steps>

## Publishing with a crates.io token

<scalar-steps>
  <scalar-step id="cargo-token-create" title="Create a crates.io token">

On crates.io, go to **Account Settings → API Tokens → New Token** and grant it the `publish-update` scope.

  </scalar-step>

  <scalar-step id="cargo-token-secret" title="Add it to the repository">

Add the token as a repository secret named **`CARGO_REGISTRY_TOKEN`**. See [Adding repository secrets](github.md#adding-repository-secrets).

  </scalar-step>

  <scalar-step id="cargo-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "rust": {
      "publish": { "cargo": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

## Notes

- Before `cargo publish`, the workflow queries the crates.io API for the version and skips it if it already exists, so re-merges are safe.
