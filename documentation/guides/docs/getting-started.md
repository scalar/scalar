# Getting Started

Create and publish your first documentation site with Scalar Docs in minutes. Write guides in Markdown or MDX, add OpenAPI documents for interactive API references, and deploy from GitHub, the CLI, or the web editor.

## Create docs in three steps

<scalar-steps>
  <scalar-step title="Start a project" icon="phosphor/regular/folder-plus">
Create a Docs project from the dashboard, the [Starter Kit](starter-kit.md), or any folder that contains a `scalar.config.json` file.

```bash
npx @scalar/cli project preview
```
  </scalar-step>

  <scalar-step title="Add guides and APIs" icon="phosphor/regular/book-open">
Write guides in Markdown or MDX, then add OpenAPI documents for interactive API references.

```json
{
  "navigation": {
    "routes": {
      "/getting-started": {
        "type": "page",
        "filepath": "docs/getting-started.md"
      }
    }
  }
}
```
  </scalar-step>

  <scalar-step title="Preview, publish, and sync" icon="phosphor/regular/git-branch">
Use preview deployments for review, publish from the CLI, or connect GitHub Actions for automatic deployments.

```bash
npx @scalar/cli project publish
```
  </scalar-step>
</scalar-steps>

## Write anywhere

| Source | Description |
| ------ | ----------- |
| **GitHub** | Keep content and OpenAPI documents in your repository. Use [preview deployments](deployment/preview-deployments.md), [automatic deployment](deployment/automatic-deployment.md), [GitHub Actions](deployment/github-actions.md), and [scalar.config.json](configuration/scalar.config.json.md). |
| **Any folder or CLI** | Work from any folder or repository without granting repository access. Publish with [`npx @scalar/cli project publish`](deployment/cli.md). |
| **Web editor** | Edit and store docs at [docs.scalar.com](https://docs.scalar.com). No Git required. |

## Next steps

- Scaffold a project with the [Starter Kit](starter-kit.md)
- Configure your site with [scalar.config.json](configuration/scalar.config.json.md)
- Structure your sidebar with [Navigation](configuration/navigation.md)
- Deploy automatically with [GitHub Actions](deployment/github-actions.md)

<scalar-callout type="info" icon="phosphor/regular/info">
  Just need an API reference? Use the [API Reference](../../guides/api-references/getting-started.md). It is open source, free, and has integrations for REST API frameworks.
</scalar-callout>
