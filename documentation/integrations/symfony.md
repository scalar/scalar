# API Reference for Symfony

The official [Scalar for Symfony](https://github.com/scalar/symfony) bundle renders an interactive API reference from your OpenAPI description.

Load an API description from a file, URL, inline JSON or YAML, NelmioApiDocBundle, API Platform, or another generator. The bundle renders the reference; it does not generate or proxy your API description.

## Alternative: NelmioApiDocBundle

[NelmioApiDocBundle](https://github.com/nelmio/NelmioApiDocBundle), a popular package in the Symfony ecosystem, also supports Scalar as a documentation UI. If you already use it to generate your OpenAPI description, you can enable its Scalar UI directly.

Follow the [NelmioApiDocBundle installation guide](https://symfony.com/bundles/NelmioApiDocBundle/current/index.html#installation) to enable the Scalar route.

## Requirements

- PHP 8.2 or later within PHP 8.x
- Symfony 6.4, 7.2 or later within 7.x, or 8.x
- Symfony FrameworkBundle and TwigBundle (installed as dependencies)

The selected Symfony version may require a newer PHP version. Symfony 8 requires PHP 8.4 or later.

## Installation

```bash
composer require scalar/symfony
```

Symfony Flex enables the bundle automatically. Without Flex, add these bundles to `config/bundles.php` if they are not already enabled:

```php
return [
    Symfony\Bundle\FrameworkBundle\FrameworkBundle::class => ['all' => true],
    Symfony\Bundle\TwigBundle\TwigBundle::class => ['all' => true],
    Scalar\Symfony\ScalarSymfonyBundle::class => ['all' => true],
];
```

Create `config/packages/scalar_symfony.yaml`:

```yaml
scalar_symfony:
    url: '/openapi.yaml'
```

Create `config/routes/scalar_symfony.yaml`:

```yaml
scalar_symfony:
    resource: '@ScalarSymfonyBundle/config/routes.php'
```

Visit `/scalar`. The route is named `scalar_symfony_reference`. The application can boot before a document is configured; requesting the page without one throws `MissingOpenApiDocument` with a clear message.

## Document inputs

Use a URL fetched by the browser:

```yaml
scalar_symfony:
    url: '/openapi.yaml'
```

Or embed a local file, without exposing a separate public document URL:

```yaml
scalar_symfony:
    file: '%kernel.project_dir%/docs/openapi.yaml'
```

Use `%kernel.project_dir%` to avoid relying on the PHP process's working directory. Files are read when the page is requested. A missing, unreadable, or empty file raises an error instead of falling back silently.

Or provide inline JSON or YAML:

```yaml
scalar_symfony:
    content: |
        openapi: 3.1.0
        info:
            title: My API
            version: 1.0.0
        paths: {}
```

For a single document, `file` takes precedence over `content`, which takes precedence over `url`. Empty strings are treated as unset. These inputs belong at the top level, not inside `configuration`.

## Multiple documents

```yaml
scalar_symfony:
    sources:
        - title: API v1
          slug: v1
          url: /openapi/v1.yaml
        - title: API v2
          slug: v2
          file: '%kernel.project_dir%/docs/v2.yaml'
          default: true
```

A non-empty `sources` list overrides the single-document settings. Each source accepts `title`, `slug`, `default`, and the same `file`, `content`, and `url` inputs. Only the selected input is sent to Scalar; server file paths are never included in the client configuration. An empty list falls back to the single-document settings.

## Configuration

```yaml
scalar_symfony:
    path: /scalar
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
    configuration:
        theme: symfony
        metaData:
            title: API Reference
            description: Public API documentation
        darkMode: false
        layout: modern
        hideClientButton: true
```

All serializable [Scalar configuration options](../configuration.md) go under `configuration`, preserving camelCase names. PHP closures and JavaScript callbacks cannot be represented as JSON. Document keys (`url`, `content`, `file`, `sources`) in this map are ignored in favor of the top-level document settings.

Defaults are `theme: symfony`, `_integration: symfony`, and `metaData.title: API Reference`. Other Scalar options use the client defaults. The package does not set `proxyUrl`; configure it explicitly if your application needs a request proxy. There is no automatic development-environment authorization bypass.

The old `scalar_options` map is a deprecated compatibility alias. For this release it is recursively merged over `configuration`, retaining its previous precedence. Move all values into `configuration` for new code.

The default CDN URL loads the latest Scalar client, matching Laravel. Override `cdn` to choose a specific version or a self-hosted bundle. Laravel retains its existing framework theme, application title, and published UI/proxy defaults; those are intentional framework differences.

Use Symfony route import options to set a host or additional route requirements. Use firewalls and voters for application-specific access policies.

## Symfony theme

The default `symfony` theme uses the black and white palette of the [official Symfony identity](https://symfony.com/logo). It includes light and dark appearances, contrasting navigation and buttons, and neutral grays for secondary text and borders. Scalar's semantic colors for HTTP methods remain unchanged.

Choose another Scalar theme with `configuration.theme` (for example, `default` or `moon`). The Symfony styles are only included when `symfony` is selected. The bundle sends `theme: none` to the browser for this custom theme, following the same approach as the Laravel integration.

Use `configuration.darkMode` to choose the initial appearance. The normal Scalar light/dark toggle remains available.

## Access control

The reference page is public by default. To require a security attribute, install and enable Symfony Security:

```bash
composer require symfony/security-bundle
```

```yaml
scalar_symfony:
    file: '%kernel.project_dir%/docs/openapi.yaml'
    access_control:
        mode: attribute
        attribute: ROLE_API_DOCS
```

The attribute is checked through `security.authorization_checker` in every environment. Denied requests receive HTTP 403. Missing attributes or a missing security checker are detected during container compilation. The `public` mode works without Security installed.

This protects the HTML page. A specification fetched from a URL needs its own access rules and browser-compatible authentication/CORS settings. With `file` or `content`, the document is embedded in the protected page and remains available to authorized viewers.

## Self-hosting and template overrides

To self-host the current standalone client:

```bash
mkdir -p public/scalar
curl -fLo public/scalar/standalone.js \
  https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/browser/standalone.js
```

```yaml
scalar_symfony:
    url: /openapi.yaml
    cdn: /scalar/standalone.js
```

Override `templates/bundles/ScalarSymfonyBundle/reference.html.twig` to customize the page. The template receives `cdn`, `configuration`, script-safe `configurationJson`, and the `symfonyTheme` flag. Theme styles live in `@ScalarSymfony/theme.css.twig`, which can also be overridden.

For Subresource Integrity, compute a hash of the exact standalone asset and add `integrity` and `crossorigin="anonymous"` to its script tag. Do not reuse a hash from another version or the CDN's generated package-root response.

For a CSP nonce, generate it per request in your application, make it available to Twig, and add the same nonce to both script tags and your response's CSP header. Do not store a fixed nonce in bundle configuration. The bundle does not manage CSP headers, nonces, or SRI automatically.

## Development

```bash
composer install
composer test
composer analyse
composer lint          # PHP-CS-Fixer, read-only
composer format        # Apply formatting; composer fix also works
bash tests/Smoke/install.sh
```

The installation check creates and removes a temporary Symfony Flex application and runs Composer auto-scripts, production cache warmup, routing, and rendering without dev dependencies. Set `SYMFONY_SKELETON_VERSION='^6.4'` to test the older supported branch.

Browser checks load the default CDN client and exercise URL, file, inline, and multiple-document rendering:

```bash
npm ci
npx playwright install chromium
npm run test:browser
```

Node and Playwright are development-only dependencies and are excluded from Composer distribution archives. See [the release checklist](https://github.com/scalar/symfony/blob/main/docs/releasing.md) for validation and publication steps.

## Migrating from alex-frolov/scalar-symfony

The official Composer package is `scalar/symfony`, starting with version `0.2.0`.

Update your application's Composer requirements by removing `alex-frolov/scalar-symfony` and adding `scalar/symfony`, then run Composer update. Do not install both packages together: they use the same bundle/configuration names.

Replace PHP imports and manually registered bundle classes:

```php
// Before
FrolovGuru\ScalarSymfony\ScalarSymfonyBundle::class

// After
Scalar\Symfony\ScalarSymfonyBundle::class
```

With Flex, inspect `config/bundles.php` after changing dependencies and remove any stale community-package registration. Also update controller service overrides and test imports that reference the old PHP namespace.

These names stay unchanged:

| API | Name |
|---|---|
| Bundle | `ScalarSymfonyBundle` |
| Configuration alias | `scalar_symfony` |
| Default path | `/scalar` |
| Route | `scalar_symfony_reference` |
| Route import | `@ScalarSymfonyBundle/config/routes.php` |
| Twig template | `@ScalarSymfony/reference.html.twig` |
| Template override directory | `templates/bundles/ScalarSymfonyBundle/` |

Move `scalar_options` entries into `configuration`. The alias still works and takes precedence if both maps contain the same option, but it is deprecated for new code.

Move document inputs out of either options map into top-level `url`, `content`, `file`, or `sources`. A URL is no longer mandatory if another input is selected. Conflicting document keys in options maps are now ignored. Files and inline documents use `file > content > url`; a non-empty source list overrides all single-document settings.

The default CDN changes from the versioned Scalar 1.65.1 URL to the unversioned `https://cdn.jsdelivr.net/npm/@scalar/api-reference` URL, matching Laravel. It receives client updates independently of Composer releases. An explicit existing `cdn` setting is preserved. If you use SRI, choose an immutable versioned asset and its matching hash.

The default theme is now `symfony`. Set `configuration.theme: default` to retain the standard Scalar appearance.

The public/attribute access modes are unchanged. The package remains public by default. An application with no document configured can now compile its container, but requesting the reference raises `Scalar\Symfony\Exception\MissingOpenApiDocument`.

See the [changelog](https://github.com/scalar/symfony/blob/main/CHANGELOG.md) for other changes.
