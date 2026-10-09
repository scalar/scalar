# TypeScript (npm)

The TypeScript target publishes to [npm](https://www.npmjs.com/). The published package name is the target's `packageName` (for example `@acme/api`). See the [TypeScript configuration](../configuration/typescript.md#publish) for every `publish.npm` option.

Releases authenticate with **npm trusted publishing** (OIDC) by default, so nothing is stored in your repository. npm can only register a trusted publisher on a package that already exists, so a brand-new package publishes its first version with an **npm access token**, then switches to OIDC.

## Enable publishing

Turn on **Publish to npm on merge** in the target's Git settings, or add a `publish` block:

```json
{
  "targets": {
    "typescript": {
      "packageName": "@acme/api",
      "publish": { "npm": true }
    }
  }
}
```

With `"npm": true`, OIDC is used by default. Once enabled, merging the release pull request publishes the package.

## First release

Skip this section if the package is already on npm.

<scalar-steps>
  <scalar-step id="npm-token-create" title="Create an npm access token">

On npmjs.com, open **Access Tokens → Generate New Token** and create a [granular access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) with:

- **Permissions:** **Read and write (publish and stage)**. The *stage only* variant parks the version awaiting an interactive approval instead of publishing it.
- **Bypass 2FA:** on. Account-level or package-level 2FA otherwise answers the publish with a one-time-password prompt no workflow can satisfy.
- **Packages:** the npm scope for a scoped name, creating that scope or organization first, or **All packages** for an unscoped one. The selector lists only packages and scopes that already exist, so a package that has never been published is not in it.

  </scalar-step>

  <scalar-step id="npm-token-secret" title="Add it as the NPM_TOKEN secret">

Add the token to the SDK repository as a secret named **`NPM_TOKEN`**. See [Adding repository secrets](github.md#adding-repository-secrets). When `publish.npm.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

  </scalar-step>

  <scalar-step id="npm-token-config" title="Publish the first version">

Switch the target to token auth, then merge the release pull request:

```json
{
  "targets": {
    "typescript": {
      "publish": { "npm": { "authMethod": "access-token" } }
    }
  }
}
```

  </scalar-step>
</scalar-steps>

> [!WARNING]
> npm is removing direct publishing with a granular token in January 2027. Treat the token as a bootstrap for the first release only, and switch to trusted publishing as soon as that version exists.

## Trusted publishing (OIDC)

npm mints a short-lived, package-scoped credential at publish time from the workflow's GitHub Actions identity, so no secret is stored.

<scalar-steps>
  <scalar-step id="npm-oidc-add" title="Add a trusted publisher on npm">

Open the package's **Settings → Trusted Publisher** tab (`https://www.npmjs.com/package/<package>/access`), pick **GitHub Actions**, and enter:

- **Organization or user** and **Repository:** the owner and name of your [linked repository](github.md).
- **Workflow filename:** `release-please.yml`. The automated publish runs as the `publish` job inside that workflow, so that is the workflow npm sees. If you also dispatch `sdk-release.yml` to re-publish a tag by hand, add it as a second trusted publisher.
- **Environment:** `publish.npm.releaseEnvironment`, or blank when none is set.

  </scalar-step>

  <scalar-step id="npm-oidc-config" title="Use the default config">

Remove the `authMethod` override (or set it to `oidc`), so releases authenticate with OIDC:

```json
{ "targets": { "typescript": { "publish": { "npm": true } } } }
```

  </scalar-step>

  <scalar-step id="npm-oidc-revoke" title="Narrow or revoke the access token">

If you published the first version with a token, nothing reads it any more. Revoke it on npmjs.com and delete the `NPM_TOKEN` secret.

  </scalar-step>
</scalar-steps>

> [!NOTE]
> Trusted publishing needs npm 11.5.1 or newer. The generated workflow upgrades npm before publishing, so the runner's version does not matter.

## Visibility and dist-tags

- **`access`** sets npm's `--access`. It defaults to `public`, which a scoped package needs to be installable by anyone; `restricted` keeps a scoped package private and needs a paid npm plan.
- **`tag`** sets the dist-tag stable releases land on, `latest` by default. Prereleases derive their own tag from the version (`1.0.0-beta.1` publishes under `beta`), so they never move the stable tag.

See [`access`](../configuration/typescript.md#access) and [`tag`](../configuration/typescript.md#tag) for the full rules.

## Notes

- The publish step is idempotent: if the version is already on npm, it is skipped, so re-merges and re-runs never fail.
- With `publish.npm.releaseEnvironment` set, the publish job runs in that GitHub environment, so its protection rules gate the release and its secrets override repository secrets of the same name.
