# Community Plugins

Plugins built and maintained by the community to extend Scalar API References.

> [!WARNING]
> **Community plugins are built and maintained by third parties.** Scalar does not review, audit, endorse or support them, and is not responsible for their code, security, licensing or behavior. Plugins are listed automatically from metadata their authors publish, and a listing is not a recommendation.
>
> A plugin runs with the same privileges as the page that hosts your API reference. Read its source, pin an exact version and only use plugins you trust.

## Plugins

<div class="community-plugins-filters">
  <input class="community-plugins-search" type="search" placeholder="Search plugins" aria-label="Search plugins" />
  <div class="community-plugins-chips" role="group" aria-label="Filter by package ecosystem">
    <button type="button" data-filter-group="ecosystems" data-filter-value="" aria-pressed="true">All</button>
    <button type="button" data-filter-group="ecosystems" data-filter-value="npm" aria-pressed="false">npm</button>
    <button type="button" data-filter-group="ecosystems" data-filter-value="nuget" aria-pressed="false">NuGet</button>
    <button type="button" data-filter-group="ecosystems" data-filter-value="pypi" aria-pressed="false">PyPI</button>
    <button type="button" data-filter-group="ecosystems" data-filter-value="maven" aria-pressed="false">Maven</button>
    <button type="button" data-filter-group="ecosystems" data-filter-value="crates" aria-pressed="false">crates.io</button>
  </div>
  <div class="community-plugins-chips" role="group" aria-label="Filter by plugin API">
    <button type="button" data-filter-group="capabilities" data-filter-value="" aria-pressed="true">Any API</button>
    <button type="button" data-filter-group="capabilities" data-filter-value="extensions" aria-pressed="false">Extensions</button>
    <button type="button" data-filter-group="capabilities" data-filter-value="views" aria-pressed="false">Views</button>
    <button type="button" data-filter-group="capabilities" data-filter-value="hooks" aria-pressed="false">Hooks</button>
    <button type="button" data-filter-group="capabilities" data-filter-value="documentTypes" aria-pressed="false">Document types</button>
    <button type="button" data-filter-group="capabilities" data-filter-value="apiClientPlugins" aria-pressed="false">API Client</button>
  </div>
  <p class="community-plugins-empty" hidden>No plugins match your search.</p>
</div>

<!-- community-plugins:start -->
No community plugins are listed yet. [List yours](#list-your-plugin).
<!-- community-plugins:end -->

## How the List Works

Once a day, a GitHub Action searches public GitHub repositories for a `scalar-plugin.json` file in the repository root. Each file it finds is:

1. Validated against the plugin manifest schema. Invalid files are skipped and the reason is logged.
2. Checked against the package registries it names. Every package must exist, and its `repository` field must point back to the repository that holds the manifest.
3. Added to the list with the latest version, license and deprecation status from the registry.

The Action never installs or runs a plugin. It reads metadata only.

The result is opened as a pull request, and a Scalar maintainer reviews it before it is published. That review keeps out spam and invalid entries. It is not a security review of the plugin.

Plugins from the [`scalar`](https://github.com/scalar) GitHub organization are marked as official. Every other plugin is marked as community.

## List Your Plugin

Add a `scalar-plugin.json` file to the root of your plugin's public GitHub repository:

```json
{
  "title": "Arazzo Workflows",
  "description": "Renders Arazzo workflows in the API reference",
  "links": {
    "repoUrl": "https://github.com/acme/scalar-plugin-arazzo",
    "docsUrl": "https://acme.dev/scalar-plugin-arazzo"
  },
  "packages": [
    { "ecosystem": "npm", "name": "scalar-plugin-arazzo" },
    { "ecosystem": "nuget", "name": "Acme.Scalar.Arazzo" }
  ],
  "pluginUrl": "https://cdn.jsdelivr.net/npm/scalar-plugin-arazzo@1.0.0/dist/plugin.js",
  "icon": "assets/icon.png",
  "screenshots": [
    { "src": "docs/images/workflow.png", "alt": "A workflow with its steps and diagram" }
  ],
  "capabilities": ["documentTypes", "views"],
  "compatibility": {
    "@scalar/api-reference": ">=1.40.0"
  }
}
```

Your plugin shows up within a day or two, after GitHub has indexed the file and the next list update is merged.

### Manifest Fields

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Display name of the plugin. |
| `description` | No | One sentence about what the plugin does. Falls back to the GitHub repository description. |
| `links.repoUrl` | No | Source repository. Falls back to the repository that holds the manifest. |
| `links.docsUrl` | No | Documentation for the plugin. |
| `links.websiteUrl` | No | Website for the plugin. |
| `packages` | Yes | The packages that ship the plugin. Each entry has an `ecosystem` and a `name`. |
| `pluginUrl` | No | URL of an ESM build for [`pluginUrls`](../plugins.md#loading-a-plugin-from-a-url). Pin an exact version. |
| `capabilities` | Yes | The parts of the plugin API the plugin uses. |
| `icon` | No | Square image shown on the plugin's card, at least 128×128 pixels. PNG, JPEG, WebP or SVG. |
| `screenshots` | No | Up to three images of the plugin in use. Each entry has a `src` and an `alt`. The first one is shown on the card. |
| `compatibility` | No | Supported versions of `@scalar/api-reference`, as a semver range. |

Supported `ecosystem` values:

- `npm`
- `nuget`
- `pypi`
- `maven`
- `crates`

Supported `capabilities` values:

| Value | Plugin API |
|---|---|
| `extensions` | [Specification extensions](../plugins.md#specification-extensions) |
| `views` | [Additional components](../plugins.md#additional-components) |
| `hooks` | [Lifecycle hooks](../plugins.md#lifecycle-hooks) |
| `documentTypes` | Document types API Reference does not support natively |
| `apiClientPlugins` | [API Client plugins](../plugins.md#api-client-plugins) |

### Images

Paths in `icon` and `screenshots` are relative to your repository root. Images are copied when the list is updated, so they keep working if you move or delete them later. Images must not imitate Scalar's logo or branding.

### Packages Outside npm

Plugins run in the browser, so the plugin itself is always JavaScript. A package for another ecosystem, such as a NuGet or PyPI package, usually adds that JavaScript to the `pluginUrls` option of a Scalar server integration. List every package that ships the plugin so people find the one that fits their stack.

### Not on GitHub

If your plugin is hosted somewhere else, open a pull request that adds your manifest to `documentation/plugins/manual.json` in the [Scalar repository](https://github.com/scalar/scalar).

## Removing a Plugin

To remove your own plugin, delete `scalar-plugin.json` from your repository. It disappears from the list after the next update.

To report a plugin that is malicious, impersonates another project or breaks these rules, email [support@scalar.com](mailto:support@scalar.com). Reported plugins are added to an ignore list and are not listed again.

<style>
.community-plugins-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.community-plugins-search {
  width: 100%;
  padding: 8px 12px;
  font: inherit;
  font-size: var(--scalar-small);
  color: var(--scalar-color-1);
  background: var(--scalar-background-1);
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
}
.community-plugins-search:focus {
  outline: none;
  border-color: var(--scalar-color-accent);
}
.community-plugins-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.community-plugins-chips button {
  padding: 3px 10px;
  font: inherit;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  background: var(--scalar-background-2);
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-full);
  cursor: pointer;
}
.community-plugins-chips button[aria-pressed='true'] {
  color: var(--scalar-background-1);
  background: var(--scalar-color-1);
  border-color: var(--scalar-color-1);
}
.community-plugins-empty {
  color: var(--scalar-color-3);
}
.community-plugins-grid {
  column-count: 2;
  column-gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 720px) {
  .community-plugins-grid {
    column-count: 1;
  }
}
.community-plugin {
  display: flex;
  flex-direction: column;
  gap: 12px;
  break-inside: avoid;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--scalar-background-1);
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-xl);
}
.community-plugin[hidden] {
  display: none;
}
.community-plugin-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.community-plugin-icon {
  width: 24px;
  height: 24px;
  margin: 0;
  border-radius: var(--scalar-radius);
}
.community-plugin-title {
  font-weight: var(--scalar-semibold, 600);
  color: var(--scalar-color-1);
  margin-right: auto;
}
.community-plugin-pill {
  padding: 1px 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--scalar-color-2);
  background: var(--scalar-background-2);
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-full);
}
.community-plugin-screenshot {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  object-position: top left;
  margin: 0;
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
}
.community-plugin-description,
.community-plugin-uses {
  margin: 0;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
}
.community-plugin-uses {
  color: var(--scalar-color-3);
}
.community-plugin-packages {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.community-plugin-packages img {
  height: 20px;
  max-width: none;
}
.community-plugin-packages a,
.community-plugin-packages img {
  display: block;
  margin: 0;
  border: none;
  text-decoration: none;
}
.community-plugin-links {
  display: flex;
  gap: 8px;
  margin-top: auto;
}
.community-plugin-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: var(--scalar-small);
  font-weight: var(--scalar-semibold, 600);
  color: var(--scalar-color-1) !important;
  text-decoration: none !important;
  background: var(--scalar-background-2);
  border: var(--scalar-border-width, 1px) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  transition: background 0.15s;
}
.community-plugin-link:hover {
  background: var(--scalar-background-3);
}
.community-plugin-link scalar-icon,
.community-plugin-link svg {
  width: 16px;
  height: 16px;
}
</style>
