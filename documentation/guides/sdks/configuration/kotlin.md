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

The Kotlin target publishes to [Maven Central](https://central.sonatype.com/) exactly like Java. Set `publish.maven` to `true` to enable it:

```json
{
  "targets": {
    "kotlin": {
      "publish": { "maven": true }
    }
  }
}
```

Maven Central requires a Central Portal user token and GPG signing. The full walkthrough (namespace registration, the user token, the GPG key, and the secrets to add) lives in the [Java configuration](java.md#publishing) and applies to Kotlin unchanged.
