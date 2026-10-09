# Rust (crates.io)

The Rust target publishes to [crates.io](https://crates.io/). The crate name is the target's `packageName`. See the [Rust configuration](../configuration/rust.md) for options.

Releases authenticate with **OIDC trusted publishing** by default. crates.io can only register a trusted publisher on a crate that already exists and is owned by you, so a brand-new crate publishes its first version with a **crates.io API token**, then switches to OIDC.

Either way, the publishing account needs a verified email address in its [account settings](https://crates.io/settings/profile): crates.io rejects a publish from an account without one.

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

## First release

Skip this section if the crate is already on crates.io. Follow [Publishing with a crates.io token](#publishing-with-a-cratesio-token) below for the first version, then come back and set up trusted publishing.

## Trusted publishing (OIDC)

Recommended once the crate exists. The release workflow uses `rust-lang/crates-io-auth-action` to exchange the workflow's identity token for a short-lived crates.io token, so no secret is stored.

<scalar-steps>
  <scalar-step id="cargo-oidc-add" title="Add a trusted publisher on crates.io">

On [crates.io](https://crates.io/), open the crate's **Settings → Trusted Publishing** (`https://crates.io/crates/<crate>/settings`) and add a **GitHub** publisher:

- **Repository owner and name**: your [linked repository](github.md)
- **Workflow filename**: `release-please.yml`
- **Environment**: `publish.cargo.releaseEnvironment`, or blank when none is set

The automated publish runs as the `publish` job inside `release-please.yml`, so that is the workflow crates.io sees. If you also dispatch `sdk-release.yml` to re-publish a tag by hand, add it as a second publisher.

  </scalar-step>

  <scalar-step id="cargo-oidc-config" title="Use the default config">

Remove the `authMethod` override if you published the first version with a token, then revoke that token.

```json
{ "targets": { "rust": { "publish": { "cargo": true } } } }
```

  </scalar-step>
</scalar-steps>

## Publishing with a crates.io token

<scalar-steps>
  <scalar-step id="cargo-token-create" title="Create a crates.io token">

On crates.io, go to **Account Settings → [API Tokens](https://crates.io/settings/tokens) → New Token**. Grant it the `publish-new` scope for the crate's first release, and `publish-update` for later ones.

  </scalar-step>

  <scalar-step id="cargo-token-secret" title="Add it to the repository">

Add the token as a repository secret named **`CARGO_REGISTRY_TOKEN`**. See [Adding repository secrets](github.md#adding-repository-secrets). When `publish.cargo.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

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
