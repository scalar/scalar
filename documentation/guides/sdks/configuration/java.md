# Java

> [!NOTE]
> The Java target is experimental.

Add `java` under `targets` to generate a Java SDK package.

```json
{
  "targets": {
    "java": {
      "reverseDomain": "com.acme",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-java"
        }
      },
      "publish": {
        "maven": {
          "authMethod": "oidc",
          "releaseEnvironment": "production",
          "sonatypePlatform": "portal",
          "homepage": "https://acme.com",
          "description": "Acme API Java SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property        | Type              | Description                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------- |
| `reverseDomain` | `string`          | Java base package, such as `com.acme`.                           |
| `version`       | `string`          | Target-specific SDK version override.                            |
| `skip`          | `boolean`         | Set to `true` to keep the config without generating this target. |
| `destinations`  | `object`          | GitHub destinations for generated output.                        |
| `publish`       | `object`          | Maven publishing configuration.                                  |
| `publish.maven` | `boolean\|object` | Maven registry publishing settings.                              |

## Destinations

Use `destinations.production` to push generated output to a GitHub repository.

| Property | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `repo`   | GitHub repository in `owner/name` form.                                     |
| `branch` | Branch to push generated output to. Defaults to the repository default.     |

## Publishing

The Java and Kotlin targets publish to [Maven Central](https://central.sonatype.com/) through the Sonatype Central Portal. Both build with Gradle and use the same coordinates: the group id comes from `reverseDomain` (for example `com.acme`) and the artifact id from the SDK name.

Maven Central does not support OIDC and requires every artifact to be **GPG-signed**, so publishing uses repository secrets: a Central Portal user token plus a GPG key.

### Enable publishing

```json
{
  "targets": {
    "java": {
      "reverseDomain": "com.acme",
      "publish": { "maven": true }
    }
  }
}
```

Kotlin is identical, under a `"kotlin"` target.

Set the registry key to an object instead of `true` to configure the generated publishing workflow:

| Property             | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `oidc` or `access-token`. |
| `releaseEnvironment` | Release environment name used by generated publishing workflows. |
| `sonatypePlatform`   | Maven Central or Sonatype platform, such as `portal` or `ossrh`. |
| `homepage`           | Package homepage metadata.                                    |
| `description`        | Package description metadata.                                 |

### One-time setup

<scalar-steps>
  <scalar-step id="maven-namespace" title="Register your namespace">

On the [Central Portal](https://central.sonatype.com/), register and verify the namespace that matches your `reverseDomain` (for example `com.acme`). This is a one-time ownership check per group id.

  </scalar-step>

  <scalar-step id="maven-token" title="Generate a user token">

In the Central Portal under **Account → Generate User Token**, create a token. It gives you a username and password pair used by the publish step.

  </scalar-step>

  <scalar-step id="maven-gpg" title="Create a GPG signing key">

Generate a key, then publish its public half to a keyserver so Central can verify signatures, and export the private half for the workflow:

```bash
gpg --gen-key
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID
gpg --armor --export-secret-keys YOUR_KEY_ID
```

  </scalar-step>

  <scalar-step id="maven-secrets" title="Add the four secrets to the repository">

Add these as repository secrets (see [Adding repository secrets](../publishing/github.md#adding-repository-secrets)):

| Secret | Value |
| ------ | ----- |
| `MAVEN_CENTRAL_USERNAME` | Central Portal user token username |
| `MAVEN_CENTRAL_PASSWORD` | Central Portal user token password |
| `MAVEN_GPG_PRIVATE_KEY` | The ASCII-armored private key from the export above |
| `MAVEN_GPG_PASSPHRASE` | The passphrase for that key |

  </scalar-step>
</scalar-steps>

### Notes

- Maven Central coordinates are immutable. The release workflow checks whether the version's POM already exists and skips publishing if so, so re-merges never fail with a rejected deployment.
- The workflow runs `./gradlew publishToMavenCentral`, which uploads to the Central Portal and releases the deployment.
