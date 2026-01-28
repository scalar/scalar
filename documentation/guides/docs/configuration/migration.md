# Migrate from Scalar Docs 1.0

With Scalar Docs 2.0 we've completely started from scratch. We tried to stick to the patterns we already had, so they way you set it up is not too different.

**TL;DR**

Migrate your scalar.config.json with: `npx @scalar/cli project upgrade`

## New Features in Scalar Docs 2.0

* MDX support with custom components
* `[relative Markdown paths](../your-other-file.md)`
* Per-operation page rendering for API references (huge performance boost for large OpenAPI documents)
* Configurable navigation structures: nested, grouped, or flattened
* Full `<head>` customization (meta tags, scripts, stylesheets)
* Local file imports for CSS, scripts, and static assets
* Local OpenAPI file references with `$ref` resolution
* Subpath deployment with unified cross-project search
* "Copy as Markdown"
* … and so much more, it's crazy.

## How do I know whether I use Scalar Docs 1.0?

If you created a project before February 2026, you probably use Scalar Docs 1.0:

```json
// scalar.config.json (Scalar Docs 1.0)
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config.json",
  "siteConfig": {
    // …
  },
  "guides": [
    // …
  ],
  "references": [
    // …
  ],
}
```

For Scalar Docs 2.0 we still use the `scalar.config.json`, but the structure changed a bit:

```json
// scalar.config.json (Scalar Docs 2.0)
{
  "$schema": "https://cdn.scalar.com/schema/scalar-config-next.json",
  "scalar": "2.0.0",
  "info": {
    // …
  },
  "siteConfig": {
    // …
  },
  "navigation": {
    "routes": {
      // …
    }
  }
}
```

## Do you have to switch to 2.0?

Actually, under the hood, you’re using Scalar Docs Version 2 already.

If you want to actually use new features and upgrade your configuration file use the CLI to upgrade:

```bash
npx @scalar/cli project upgrade
```

Check how your documentation looks with:

```bash
npx @scalar/cli project preview
```

If it's good, commit and push the upgraded configuration to your repository – done!

