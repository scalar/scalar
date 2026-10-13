# Ruby (RubyGems)

The Ruby target publishes to [RubyGems](https://rubygems.org/). The gem name is the target's `gemName`. See the [Ruby configuration](../configuration/ruby.md#publish) for options.

Authenticate the release with **OIDC trusted publishing** (the default, recommended) or a **RubyGems API key**. RubyGems accepts a *pending* trusted publisher for a gem that does not exist yet, so even a brand-new gem can publish its first version without a key.

## Enable publishing

```json
{
  "targets": {
    "ruby": {
      "gemName": "acme",
      "publish": { "rubygems": true }
    }
  }
}
```

## Trusted publishing (OIDC)

Recommended. The release workflow exchanges its GitHub Actions identity for a short-lived, gem-scoped API key, so no secret is stored.

<scalar-steps>
  <scalar-step id="gem-oidc-add" title="Add a trusted publisher on RubyGems">

For a gem with no releases yet, register a *pending* publisher at [rubygems.org/profile/oidc/pending_trusted_publishers](https://rubygems.org/profile/oidc/pending_trusted_publishers). It names the gem up front and becomes an ordinary publisher on the first successful push. For a gem that already exists, use its own **Trusted publishers** page instead (`https://rubygems.org/gems/<gem>/trusted_publishers`).

Enter:

- **Repository**: your [linked repository](github.md)
- **Workflow filename**: `release-please.yml`
- **Environment**: `publish.rubygems.releaseEnvironment`, or blank when none is set

The automated publish runs as the `publish` job inside `release-please.yml`, so that is the workflow RubyGems sees. If you also dispatch `sdk-release.yml` to re-publish a tag by hand, add it as a second publisher.

  </scalar-step>

  <scalar-step id="gem-oidc-config" title="Keep the default config">

```json
{ "targets": { "ruby": { "publish": { "rubygems": true } } } }
```

  </scalar-step>
</scalar-steps>

## Publishing with an API key

<scalar-steps>
  <scalar-step id="gem-key-create" title="Create a RubyGems API key">

On [rubygems.org](https://rubygems.org/profile/api_keys), create an API key with the **Push rubygem** scope. Scope it to your gem once it exists.

The key only works unattended at the right [MFA level](https://guides.rubygems.org/setting-up-multifactor-authentication/): at **UI and API**, every push is answered with a one-time-password prompt no workflow can satisfy. Either publish over OIDC, or set the account to **UI and gem signin** and leave MFA off this key.

  </scalar-step>

  <scalar-step id="gem-key-secret" title="Add it to the repository">

Add the key as a repository secret named **`RUBYGEMS_API_KEY`**. See [Adding repository secrets](github.md#adding-repository-secrets). An existing `GEM_HOST_API_KEY` secret is read when `RUBYGEMS_API_KEY` is unset. When `publish.rubygems.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

  </scalar-step>

  <scalar-step id="gem-key-config" title="Switch the target to key auth">

```json
{
  "targets": {
    "ruby": {
      "publish": { "rubygems": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

In key mode the workflow passes the key to `gem push` as `GEM_HOST_API_KEY`. Switching to OIDC later is a config change and nothing else: register the trusted publisher, then remove the `authMethod` override.

## Notes

- The workflow checks the RubyGems API for the version first and skips `gem push` if it is already published, so re-merges are safe.
