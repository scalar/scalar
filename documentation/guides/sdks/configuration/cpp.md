<!--
Generated from scalar-sdk.config.schema.json. Do not edit by hand.

Published at https://scalar.com/products/sdk-generator/configuration/cpp, which is where the links to
pages outside this reference resolve.
-->
# C++

> [!NOTE]
> The C++ target is experimental.

Add `cpp` under `targets` to generate a C++ SDK.

```json
{
  "targets": {
    "cpp": {
      "options": {
        "namespace": "acme"
      },
      "destinations": {
        "production": {
          "repo": "acme/acme-cpp"
        }
      }
    }
  }
}
```

C++ has no package registry the generator publishes to, so this target generates the library and its CI workflow but no publishing workflow. Distribute the build artifacts from your GitHub release.

## options

**Type:** `object`

C++ emitter options.

### namespace

**Type:** `string`

C++ namespace the generated client, models and resources are declared in, such as `acme` or `acme::v2`. Each `::` segment is lowercase snake_case that starts with a letter, with no doubled or trailing `_`; a segment that C++, the C library or a dependency reserves fails generation: for example a keyword, `std`, a macro such as `linux` or `min`, or a C library function such as `time` as the first segment. The namespace also names the public include directory, the umbrella header and the macro prefix (`acme::v2` gives `include/acme_v2/`, `acme_v2.hpp` and `ACME_V2_`). Defaults to the package name passed to the generator, else the SDK's slug, converted to snake_case.

**Constraints:** `pattern: ^[a-z](_?[a-z0-9])*(::[a-z](_?[a-z0-9])*)*$`

### libraryName

**Type:** `string`

Name of the generated CMake project and library target, and of the package `find_package` looks for. The value is converted to snake_case. The public headers live under `include/` in a directory named after `namespace`, not this. Defaults to the package name passed to the generator, else the SDK's slug, converted to snake_case. A value that does not start with a letter once converted, or one CMake, a dependency or Windows reserves (such as `test`, `install` or `con`), fails generation.

### async

**Type:** `boolean`

Generates an asynchronous client beside the synchronous one, whose methods return a `std::future` or take a completion callback. Set `false` to leave it out, which shortens build times for a very large API. The asynchronous client is not generated yet; today `false` only leaves out the executor runtime header it will use. Defaults to `true`.

**Default:** `true`

### preserveUnknownFields

**Type:** `boolean`

Gives every generated model an `extra_fields` member that keeps the JSON keys the API document does not describe, so a model decoded from a response and written back into a request round-trips them unchanged. Set `false` to drop the member and discard those keys on decode. Defaults to `true`.

**Default:** `true`

## destinations

**Type:** `object`

Per-target GitHub destinations for pushing generated output.

### production

**Type:** `object`

Primary repository this target's generated output is published to. Setting it turns on the generated GitHub Actions: the CI workflow, the release-please configuration, and the versioning policy. A release workflow is added too when `publish` enables a registry that needs one; a registry served from git tags publishes from the release tag alone. Without a production destination the target is still generated, but with no workflows.

| Property | Description |
| --- | --- |
| `repo`* | GitHub repository in `owner/name` form that generated output for this target is pushed to. An `owner/name#branch` suffix is tolerated and supplies the default branch when `branch` does not, but prefer setting `branch` on its own: not every target strips the suffix back off when it writes the repository URL into published package metadata. |
| `branch` | Default branch of the destination repository, which release pull requests target. Generated output is pushed to the `scalar-generated` branch and merged with your custom code on the integration branch (`integrationBranch`, `scalar-next` by default); the release pull request is opened from there against this branch. Defaults to a `#branch` suffix on `repo`, then `main`. A value that is not a safe git branch name is skipped in favor of the next one. |
| `integrationBranch` | Branch where generated output is combined with your custom code; defaults to `scalar-next`. Commit customizations here: each regeneration is merged into it, release pull requests are opened from it, and each released version is synced back to it. An empty string means the default. The name must be a safe git branch name, and it cannot be the default branch or collide with the branches Scalar and release-please manage, such as `scalar-generated`. |

## skip

**Type:** `boolean`

When true, the target is not generated.

## readmeTitle

**Type:** `string`

Heading of this target's generated README, overriding the SDK-wide `readme.title`. Plain text: markdown in it is shown as written, not rendered.

## promotion

**Type:** `"automatic" | "manual"`

When a successful build's generated output reaches this target's production destination. `automatic`, the default, pushes every build, which opens a release pull request. `manual` holds each build at the staging playground until you promote it.

This changes when the push happens, never what is generated: a `manual` target still gets the GitHub Actions, release-please configuration, and versioning policy that `destinations.production` turns on. A target with no production destination is never pushed, whatever this is set to.

**Default:** `"automatic"`
