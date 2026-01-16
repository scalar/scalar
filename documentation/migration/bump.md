# Scalar vs. Bump.sh

Bump.sh is a modern API documentation platform that supports both OpenAPI and AsyncAPI. Scalar offers the same functionality. When you bring your API into Scalar, you unlock a suite of tools to enhance your API experience:

- **Scalar API Client:** A modern, open-source API testing client for Windows, macOS and Linux
- **Scalar SDKs:** Generate type-safe client libraries in TypeScript, Python, Golang, and more
- **Spectral Linting:** Validate and lint your OpenAPI documents with Spectral rules
- **Scalar Mock Server:** Spin up a fully-functional mock server from your OpenAPI document for frontend development and testing

However, if API change detection or AsyncAPI support are critical needs for your organization, Bump.sh currently has an edge in those areas. We don't offer these features yet, but the good news is that both are already on our roadmap or in progress already.

## Pricing

Scalar offers a more accessible entry point with a free tier and lower starting prices compared to Bump.sh.

| Plan       |        Scalar         |      Bump.sh      |
| ---------- | :-------------------: | :---------------: |
| Free       |           ✓           |         ✗         |
| Starter    | $24/user/month (Pro)  | $50/month (Basic) |
| Team       | $24/user/month + fees | $250/month (Pro)  |
| Enterprise |    Custom pricing     |  Custom pricing   |

- Scalar offers a free plan, Bump.sh does not
- Scalar Pro starts at $24/month vs Bump.sh Basic at $50/month
- Scalar Pro with additional seats is significantly lower than Bump.sh Pro ($250/month)
- Resource limits: Bump.sh has hard limits on docs and users per plan, while Scalar uses usage-based pricing

For detailed pricing information, visit [Scalar Pricing](https://scalar.com/pricing) and [Bump.sh Pricing](https://bump.sh/pricing/).

## Feature Comparison

| Feature                                  |     Scalar     |     Bump.sh      |
| ---------------------------------------- | :------------: | :--------------: |
| **Specification Support**                |                |                  |
| OpenAPI                                  |       ✓        |        ✓         |
| AsyncAPI                                 |  in progress   |        ✓         |
| OpenAPI Overlays                         | in the roadmap |        ✓         |
| **Documentation Publication**            |                |                  |
| API Reference                            |       ✓        |        ✓         |
| API Registry                             |       ✓        |        ✓         |
| Unified Search                           |       ✓        |        ✓         |
| API Explorer (Try-it-out)                |       ✓        |        ✓         |
| Automatic Changelog                      | in the roadmap |        ✓         |
| Branches Management                      |       ✓        |        ✓         |
| Automatic API Key Filling (OAuth)        |       ✓        |        ✓         |
| **Access Management**                    |                |                  |
| Role Based Access Management             |       ✓        |        ✓         |
| Email Invitations                        |       ✓        |        ✓         |
| Single Sign-On (SSO)                     |       ✓        |        ✓         |
| **Release Management**                   |                |                  |
| Diff (Breaking Changes Detection)        | in the roadmap |        ✓         |
| Previews                                 |       ✓        |        ✓         |
| Unrelease a Version (Rollback)           |       ✓        |        ✓         |
| Release Notes                            | in the roadmap |        ✓         |
| Manual Release Management                |       ✓        |        ✓         |
| **Branding Customization**               |                |                  |
| Custom Domain                            |       ✓        |        ✓         |
| Custom Logo, Color, Favicon & Meta Image |       ✓        |        ✓         |
| Remove "Powered by" Branding             |       ✓        | not in all plans |
| Custom CSS & JS                          |       ✓        |        ✓         |
| Embed Mode                               |  in progress   |        ✓         |
| **Integrations**                         |                |                  |
| CLI                                      |       ✓        |        ✓         |
| API                                      |       ✓        |        ✓         |
| Deploy Docs with GitHub Action           |       ✓        |        ✓         |
| Comments on PRs with GitHub Action       |       ✓        |        ✓         |
| Slack Notifications                      | in the roadmap |        ✓         |
| Custom Webhooks on API Changes           | in the roadmap |        ✓         |
| **Procurement & Compliance**             |                |                  |
| Wire Transfer                            |       ✓        |        ✓         |
| Custom Security Review                   |       ✓        |        ✓         |
| Custom Contract                          |       ✓        |        ✓         |

### Scalar SDKs

Generate type-safe client libraries from your OpenAPI documents. Scalar supports SDK generation in multiple languages:

| Language   | Status    |
| ---------- | --------- |
| TypeScript | Available |
| Python     | Available |
| Go         | Available |
| Java       | Available |
| PHP        | Available |
| Ruby       | Available |
| Swift      | Available |
| C#         | Available |

SDKs sync with your API documentation, so whenever you update your OpenAPI document, your SDKs stay up to date. Learn more in our [SDK documentation](../guides/sdks/getting-started.md).

### Spectral linting

Validate and lint your OpenAPI documents using Spectral rules. Spectral rules can be managed in the Scalar Registry alongside your OpenAPI documents and JSON Schemas.

### API prototyping

Spin up a fully-functional mock server from your OpenAPI document. The mock server automatically generates realistic API responses based on your schemas—perfect for frontend development, API prototyping, and integration testing:

```bash
npx @scalar/cli document mock openapi.json --watch
```

Alternatively, run it in a Docker container or integrate it directly into your Node.js application. Learn more in the [Scalar Mock Server documentation](../guides/mock-server/getting-started.md).

## Migrate from Bump.sh to Scalar

While the user interfaces between Bump.sh and Scalar differ, you will find that most features available in Bump.sh are also offered by Scalar. Migrating your setup will require some manual steps.

However, transitioning via the CLI is typically more straightforward:

### Bump CLI → Scalar CLI

#### Package

| Bump.sh    | Scalar        |
| ---------- | ------------- |
| `bump-cli` | `@scalar/cli` |

#### Commands

| Bump.sh                      | Scalar                                 |
| ---------------------------- | -------------------------------------- |
| `bump deploy [file]`         | `scalar registry publish [file]`       |
| `bump preview [file]`        | `scalar document serve [file]`         |
| `bump preview --live [file]` | `scalar document serve --watch [file]` |
| `bump diff`                  | coming soon                            |
| `bump overlay`               | coming soon                            |

#### Options

| Bump.sh             | Scalar                                        |
| ------------------- | --------------------------------------------- |
| `--doc <slug>`      | `--slug <slug>`                               |
| `--hub <slug>`      | `--namespace <namespace>`                     |
| `--token <token>`   | Use `scalar auth login --token <token>` first |
| `--branch <branch>` | `--version <version>`                         |

#### Environment Variables

| Bump.sh      | Scalar                                     |
| ------------ | ------------------------------------------ |
| `BUMP_TOKEN` | `scalar auth login --token SCALAR_API_KEY` |

#### GitHub Actions

Replace:

```yaml
- uses: bump-sh/github-action@v1
  with:
    doc: my-doc
    token: ${{ secrets.BUMP_TOKEN }}
    file: api.yaml
```

With:

```yaml
- run: npx @scalar/cli auth login --token ${{ secrets.SCALAR_API_KEY }}
- run: npx @scalar/cli registry publish api.yaml --namespace my-team --slug my-doc
```

#### Authentication

Replace token flags with a one-time login:

```bash
# Before (on every command)
bump deploy api.yaml --token $TOKEN

# After (login once, then publish)
scalar auth login --token $TOKEN
scalar registry publish api.yaml --namespace my-team --slug my-doc
```

#### Additional Scalar Commands

These commands have no Bump equivalent but may be useful:

| Command                          | Description                   |
| -------------------------------- | ----------------------------- |
| `scalar document lint [file]`    | Lint with Spectral rules      |
| `scalar document mock [file]`    | Start a mock server           |
| `scalar document bundle [file]`  | Resolve all `$ref` references |
| `scalar document format [file]`  | Format OpenAPI document       |
| `scalar document upgrade [file]` | Upgrade to OpenAPI 3.1        |

