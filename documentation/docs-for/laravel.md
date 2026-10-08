# Laravel API documentation

Render your Laravel API's OpenAPI document as an interactive API reference at `/scalar`, with the official `scalar/laravel` package and one line of config.

Laravel does not produce an OpenAPI document on its own, so good Laravel API documentation is a two-part job. A generator reads your routes, form requests, and resources and writes the document. A renderer turns that document into something people can read and try. Scalar is the renderer. It works with whichever generator you already use, and this page uses [Scramble](https://scramble.dedoc.co/) as the example because it needs no annotations.

## Set it up in three steps

<scalar-steps>
<scalar-step title="Generate an OpenAPI document">

```bash
composer require dedoc/scramble
```

Scramble documents every route that starts with `api` and serves the result at `/docs/api.json` by default. For a file you can commit and review, export it:

```bash
php artisan scramble:export
```

This writes `api.json` to your application's root folder. [Scribe](https://github.com/knuckleswtf/scribe) and [laravel-openapi](https://github.com/vyuldashev/laravel-openapi) work just as well; Scalar only needs the document.

</scalar-step>
<scalar-step title="Install Scalar for Laravel">

```bash
composer require scalar/laravel
php artisan scalar:install
```

The install command publishes `config/scalar.php`. If you prefer to publish by hand, `php artisan vendor:publish --tag="scalar-config"` does the same.

</scalar-step>
<scalar-step title="Point Scalar at your document">

```php
// config/scalar.php

'file' => base_path('api.json'),
```

`file` is read on the server and embedded in the page, so the document never needs a public URL. To render Scramble's live route instead, set `'url' => '/docs/api.json'`. When more than one is set, `file` wins over `content`, which wins over `url`.

</scalar-step>
</scalar-steps>

Visit `/scalar` and your API reference is there, styled with a Laravel theme by default (`'theme' => 'laravel'`).

## See it live

The Scalar Galaxy demo runs the same renderer on an example API with authentication schemes, schemas, and webhooks. Try the search, the generated code samples, and the "Test Request" button.

<scalar-button
  title="Open the live demo"
  href="https://galaxy.scalar.com/"
  icon="phosphor/regular/rocket-launch">
</scalar-button>

## What you get

**A reference that respects Laravel conventions.** Access is controlled by a `viewScalar` gate, just like Horizon or Telescope. Define it in `AppServiceProvider` to limit who can see the docs outside local environments:

```php
use App\Models\User;
use Illuminate\Support\Facades\Gate;

Gate::define('viewScalar', function (?User $user) {
    return in_array($user?->email, [
        //
    ]);
});
```

**Several APIs behind one page.** Versioned APIs, or public and internal references, go in the `sources` array, and Scalar shows a document switcher:

```php
'sources' => [
    ['title' => 'API v1', 'slug' => 'v1', 'url' => '/openapi/v1.yaml'],
    ['title' => 'API v2', 'slug' => 'v2', 'url' => '/openapi/v2.yaml', 'default' => true],
],
```

When the list is dynamic, register documents from a service provider with the `Scalar` facade: `Scalar::document('API v1')->url('/openapi/v1.yaml')`.

**An API client.** Each operation has a "Test Request" button that opens the [Scalar API client](/products/api-client) with parameters and auth prefilled. It is also available as a standalone open-source app for desktop and web.

**SDKs.** The [Scalar SDK generator](/products/sdk-generator) reads the same `api.json`. TypeScript, Python, Go, Java, Kotlin, Ruby, and CLI targets are generally available. A PHP SDK target exists but is experimental, alongside C#, Rust, Swift, Dart, and C++. Every plan includes one SDK.

**A hosted MCP server.** Scalar can host an [MCP server](/products/agent/mcp) generated from your OpenAPI document, with OAuth, so AI agents can call the endpoints you choose. Scalar runs it; there is no MCP code to add to your Laravel app. Hosted MCP servers are included from the Pro plan.

The package and the renderer are MIT licensed. Hosted docs, SDKs, and MCP servers are on the [pricing page](/pricing).

## Common gotchas

**The page is blank or shows the Galaxy example.** Until you set `file`, `content`, or `url`, the package renders Scalar's example document. If you set `url` to a relative path, check that the route actually returns JSON or YAML in that environment, and is not blocked by the generator's own access rules.

**A committed `api.json` drifts from the code.** Run `php artisan scramble:export` in CI and fail the build when the file changes without being committed. The reference then always matches the code that shipped.

**The docs need a different domain or middleware.** `config/scalar.php` has `domain` and `middleware` keys. Serving the reference on `docs.example.com`, or behind your auth middleware, is a config change rather than a custom route.

## Migrating from Swagger UI or Redoc

If your Laravel app serves Swagger UI or Redoc today, the OpenAPI document behind it is the part worth keeping. The move looks like this:

1. Find the URL or file path of the document your current UI loads. It is usually a JSON route or a generated file on disk.
2. Put that location in `config/scalar.php` (`url` for a route, `file` for a path on disk).
3. Check that `/scalar` renders everything, then remove the old UI route or package.

Your annotations, attributes, or generator config do not change, because Scalar reads the same OpenAPI 3.x (or Swagger 2.0) document. If you use Scribe, there is a dedicated guide for [using Scalar as Scribe's UI](/products/api-references/integrations/laravel-scribe). The general steps are in the [Swagger UI migration guide](/resources/migration/swagger-ui).

## Frequently asked questions

<scalar-detail title="Does scalar/laravel generate the OpenAPI document?">
No. It renders an existing document. Pair it with a generator such as Scramble, Scribe, or laravel-openapi, or with a hand-written OpenAPI file.
</scalar-detail>

<scalar-detail title="Is scalar/laravel an official Scalar package?">
Yes. It is maintained by Scalar at github.com/scalar/laravel and installed from Composer as `scalar/laravel`.
</scalar-detail>

<scalar-detail title="How do I change the /scalar URL?">
Set the `path` key in `config/scalar.php`. The default is `/scalar`. The route uses the `web` middleware group by default, which you can change with the `middleware` key.
</scalar-detail>

<scalar-detail title="How do I hide the docs in production?">
Override the `viewScalar` gate in `AppServiceProvider` and return true only for the users who should see the reference.
</scalar-detail>

<scalar-detail title="Does it work with Laravel Octane?">
Yes. Register documents once in a service provider, because the manager is a long-lived singleton under Octane. If you register per request, call `Scalar::flush()` first so documents do not stack up.
</scalar-detail>

<scalar-detail title="What does it cost?">
The package and renderer are free and MIT licensed. Hosted Scalar docs start free; Pro is $150 per month and Business is $600 per month.
</scalar-detail>

## Get started

```bash
composer require scalar/laravel && php artisan scalar:install
```

Or [create a free Scalar account](https://dashboard.scalar.com/register) to publish the same reference on its own domain.

## Related

- **Learn:** [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [API documentation best practices](/learn/openapi/api-documentation-best-practices)
- **Docs:** [Laravel integration reference](/products/api-references/integrations/laravel)
- **Product:** [Scalar API References](/products/api-references) — the open-source renderer behind `scalar/laravel`
