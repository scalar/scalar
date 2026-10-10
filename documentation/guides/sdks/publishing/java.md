# Java and Kotlin (Maven Central)

The Java and Kotlin targets publish to [Maven Central](https://central.sonatype.com/) through the Sonatype Central Portal. Both build with Gradle and publish under the same group id, the target's `reverseDomain` (for example `com.acme`). The artifact id is `<sdk-slug>-java` or `<sdk-slug>-kotlin`; set `publish.maven.artifactId` to keep an existing coordinate. See the [Java](../configuration/java.md#publish) or [Kotlin](../configuration/kotlin.md#publish) configuration for options.

The generated workflow has no OIDC path for Maven Central, so `authMethod` is ignored, and Central requires every artifact to be **GPG-signed**. Publishing uses repository secrets: a Central Portal user token plus a GPG key.

## Enable publishing

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

Kotlin takes the same block under `"kotlin"` and publishes `<sdk-slug>-kotlin` in the same namespace, so one verified namespace covers both.

Set `reverseDomain` on any target that publishes. Without it the generator derives `com.<slug>.api`, a namespace you cannot verify. Publishing also needs a `destinations.production.repo`: without one no release workflow is generated at all, and one that is not a GitHub `owner/name` stops generation, because Central rejects a POM with no project URL.

## One-time setup

<scalar-steps>
  <scalar-step id="maven-namespace" title="Register your namespace">

On the [Central Portal](https://central.sonatype.com/), register and [verify the namespace](https://central.sonatype.org/register/central-portal/) that matches your `reverseDomain` (for example `com.acme`) before the first release. This is a one-time ownership check per group id.

  </scalar-step>

  <scalar-step id="maven-token" title="Generate a user token">

Create a [Central Portal user token](https://central.sonatype.com/usertoken). It gives you a username and password pair for the publish step; these are the token's values, not your account's own login.

  </scalar-step>

  <scalar-step id="maven-gpg" title="Create a GPG signing key">

Generate a key, publish its public half to a keyserver (`keyserver.ubuntu.com`, `keys.openpgp.org`, or `pgp.mit.edu`) so Central can verify signatures, and export the private half for the workflow:

```bash
gpg --gen-key
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID
gpg --armor --export-secret-keys YOUR_KEY_ID
```

Send the public key well before the first release: it can take hours to propagate, and a release cut minutes after sending it fails as if the artifacts were unsigned.

  </scalar-step>

  <scalar-step id="maven-secrets" title="Add the four secrets to the repository">

Add these as repository secrets (see [Adding repository secrets](github.md#adding-repository-secrets)). Each is also read under the name in the last column when it is unset, so a repository that already stores them under those names needs nothing new. When `publish.maven.releaseEnvironment` is set, an environment secret of the same name overrides the repository one.

| Secret | Value | Also accepted |
| ------ | ----- | ------------- |
| `MAVEN_CENTRAL_USERNAME` | Central Portal user token username | `SONATYPE_USERNAME` |
| `MAVEN_CENTRAL_PASSWORD` | Central Portal user token password | `SONATYPE_PASSWORD` |
| `MAVEN_GPG_PRIVATE_KEY` | The ASCII-armored private key from the export above | `GPG_SIGNING_KEY` |
| `MAVEN_GPG_PASSPHRASE` | The passphrase for that key | `GPG_SIGNING_PASSWORD` |

  </scalar-step>
</scalar-steps>

## Notes

- Maven Central coordinates are immutable. The release workflow checks whether the version's POM already exists and skips publishing if so, so re-merges never fail with a rejected deployment.
- The workflow runs `./gradlew publishToMavenCentral`, which uploads a signed deployment to the Central Portal and marks it for automatic release. Central publishes it as soon as validation passes, so there is no manual **Publish** step in the portal.
- The workflow does not wait for that validation. A new version can take several minutes to appear on Maven Central. A deployment that fails validation shows as failed under the portal's [deployments](https://central.sonatype.com/publishing/deployments), and the workflow run still succeeds.
