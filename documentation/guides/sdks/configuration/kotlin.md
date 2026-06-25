# Kotlin

> [!NOTE]
> The Kotlin target is experimental.

Add `kotlin` under `targets` to generate a Kotlin SDK package. Kotlin builds with Gradle and publishes to Maven Central, the same as the Java target.

```json
{
  "targets": {
    "kotlin": {
      "reverseDomain": "com.acme",
      "version": "1.0.0",
      "destinations": {
        "production": {
          "repo": "acme/acme-kotlin"
        }
      },
      "publish": {
        "maven": {
          "authMethod": "access-token",
          "sonatypePlatform": "portal",
          "homepage": "https://acme.com",
          "description": "Acme API Kotlin SDK"
        }
      }
    }
  }
}
```

## Target Options

| Property        | Type              | Description                                                      |
| --------------- | ----------------- | ---------------------------------------------------------------- |
| `reverseDomain` | `string`          | Kotlin base package, such as `com.acme`.                         |
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

Set `publish.maven` to `true` for default Maven publishing, `false` to disable it, or an object to configure the generated publishing workflow. Maven Central requires a Central Portal token and GPG signing; see [Java and Kotlin publishing](../publishing/java.md) for the setup.

| Property             | Description                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `authMethod`         | Registry authentication mechanism, such as `access-token`.          |
| `releaseEnvironment` | Release environment name used by generated publishing workflows.    |
| `sonatypePlatform`   | Maven Central or Sonatype platform, such as `portal` or `ossrh`.    |
| `homepage`           | Package homepage metadata.                                          |
| `description`        | Package description metadata.                                       |
