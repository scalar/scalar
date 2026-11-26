# C# (NuGet)

The C# target publishes to [NuGet](https://www.nuget.org/). The package id is the target's `packageName` reduced to a PascalCase .NET identifier: `acme-api` and `Acme.Api` both publish as `AcmeApi`. See the [C# configuration](../configuration/csharp.md#publish) for options.

Authenticate the release with **OIDC trusted publishing** (recommended) or a **NuGet API key**.

## Enable publishing

```json
{
  "targets": {
    "csharp": {
      "packageName": "AcmeApi",
      "publish": { "nuget": true }
    }
  }
}
```

## Trusted publishing (OIDC)

Recommended. The release workflow uses the `NuGet/login` action to exchange the workflow's identity token for a short-lived API key, so no long-lived key is stored. NuGet's OIDC login still needs your profile name as one secret.

<scalar-steps>
  <scalar-step id="nuget-oidc-policy" title="Add a trusted publishing policy on NuGet">

On [nuget.org](https://www.nuget.org/), open **your username → Trusted Publishing** and add a policy for:

- **Package owner**: you, or an organization you are an active member of
- **Repository owner and name**: your [linked repository](github.md)
- **Workflow file**: `release-please.yml`
- **Environment**: `publish.nuget.releaseEnvironment`, or blank when none is set

The policy's **scopes** and **package glob** decide whether it may publish a package that does not exist yet: select the scope that allows publishing new packages, and a glob the package id matches, or the first release is rejected.

The automated publish runs as the `publish` job inside `release-please.yml`, so that is the workflow NuGet sees. If you also dispatch `sdk-release.yml` to re-publish a tag by hand, add it as a second policy.

A new policy is sometimes only provisionally active for 7 days (nuget.org says this usually happens for a private repository); the first successful publish inside that window makes it permanent. You can restart the window at any time, including after it lapses.

  </scalar-step>

  <scalar-step id="nuget-oidc-user" title="Add your NuGet username as a secret">

Add a repository secret named **`NUGET_USER`** set to your nuget.org profile name (not your email). See [Adding repository secrets](github.md#adding-repository-secrets). This is the only secret OIDC needs; the API key itself is issued at publish time.

  </scalar-step>

  <scalar-step id="nuget-oidc-config" title="Keep the default config">

```json
{ "targets": { "csharp": { "publish": { "nuget": true } } } }
```

  </scalar-step>
</scalar-steps>

## Publishing with a NuGet API key

<scalar-steps>
  <scalar-step id="nuget-token-create" title="Create a NuGet API key">

On nuget.org, go to [API Keys](https://www.nuget.org/account/apikeys) → **Create**, give it the scope to push new packages and package versions with a glob that matches your package id, and copy the key.

  </scalar-step>

  <scalar-step id="nuget-token-secret" title="Add it to the repository">

Add the key as a repository secret named **`NUGET_API_KEY`**. See [Adding repository secrets](github.md#adding-repository-secrets). When `publish.nuget.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

  </scalar-step>

  <scalar-step id="nuget-token-config" title="Switch the target to token auth">

```json
{
  "targets": {
    "csharp": {
      "publish": { "nuget": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

## Notes

- The workflow pushes with `--skip-duplicate`, so re-publishing an existing version is a no-op.

## Strong naming

With [`options.strongName`](../configuration/csharp.md#strongname) set, the release has to sign the package with your `.snk` key, which the generator never creates or writes. Provide it in one of two ways before the first release:

- **Commit it** at its `keyFile` path on the integration branch.
- **Store it as a secret** named **`STRONG_NAME_KEY`**, holding the key file base64-encoded (`base64 -w0 Sdk.snk` on Linux, `base64 -i Sdk.snk` on macOS). The release workflows write it to `keyFile` before building, so the key never has to be committed. When `publish.nuget.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

The release workflows check for the key before anything builds, and stop with an error if neither the file nor the secret is there: an unsigned package is never published.

The generated CI also has a **Strong-name key** check on the release PR, which fails if the key is missing. Wait for it before merging: merging the release PR is what tags the release, and the publish job runs after that. A pull request run cannot read environment secrets, so with `releaseEnvironment` set and no repository-level key, the check only warns.

If a release was tagged without a key anyway, its publish job fails. To publish it, add the `STRONG_NAME_KEY` secret, then re-run the failed `publish` job or dispatch `sdk-release.yml` at that tag. Committing the key does not help here, because both workflows build the tagged commit, which does not contain it. This needs the tagged commit to contain workflows that restore the key. A tag cut before the SDK was regenerated with them still runs the old workflows, so cut a new release instead.
