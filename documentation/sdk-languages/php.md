# PHP SDK generator from OpenAPI

Scalar can generate a Composer package in PHP from your OpenAPI document and make it installable from Packagist with nothing more than a Git tag. **The PHP target is experimental.** It generates working code, but it is further from GA than Java, Kotlin, Ruby, and C#, and there is no public PHP sample yet. This page sticks to what is documented: configuration, publishing, and the pagination surface, with a clear note wherever it describes what the generator targets rather than output you can inspect.

## Two names that matter in PHP

PHP packages have two identities, and the PHP target keeps them separate:

- **`packageName`** is the namespace your users write in `use` statements, for example `Acme\Api`.
- **`composerPackageName`** is the vendor/package name they install, for example `acme/api`.

```json
{
  "targets": {
    "php": {
      "packageName": "Acme\\Api",
      "composerPackageName": "acme/api",
      "destinations": {
        "production": { "repo": "acme/acme-php" }
      },
      "publish": { "packagist": true }
    }
  }
}
```

Note the escaped backslash in JSON. A third option, `composerRepositoryUrl`, points at a Composer repository other than the default, which matters if you distribute through a private Composer registry. The rest is in the [PHP configuration](/products/sdk-generator/configuration/php) reference.

## What the generator targets for PHP

<scalar-callout type="warning" icon="phosphor/regular/warning">
  There is no public PHP sample yet. The iteration code below is the call shape documented in the pagination guide; the rest of this section describes behaviour every generated SDK shares. Generate a preview from your own OpenAPI document to read the actual output.
</scalar-callout>

**Pages you can `foreach`.** The [pagination guide](/products/sdk-generator/pagination) documents that a PHP page is iterable, so walking every item is ordinary PHP:

```php
foreach ($page as $item) {
    echo $item->id, PHP_EOL;
}
```

The page also exposes `$page->pagingEachItem()` for walking items explicitly, and `$page->hasNextPage()` with `$page->getNextPage()` for page-by-page work, such as a queue job that checkpoints between pages.

**A resource tree, not one class per tag.** Resources and methods come from the same configuration as the TypeScript, Python, and Go SDKs, with the same normalised verbs (`list`, `retrieve`, `create`), so documentation and support answers translate across languages.

**The generator's shared feature set.** The SDK Generator's feature list covers retries on temporary failures (twice by default: network errors, 408, 409, 429, 5xx) with `Retry-After` support, a 60-second default timeout, typed errors carrying status, headers, and body, and credentials from your security schemes with environment variable defaults. On an experimental target, confirm how each surfaces in PHP.

**Cursor URLs are a gap.** If your API returns a complete next-page URL rather than a cursor token, the PHP target stops after the first page for that scheme today. Use a `cursor` scheme where your API supports one.

## Publishing to Packagist

This is the easiest registry Scalar publishes to. Packagist reads packages straight from Git tags, so there is no upload step and no secret to store.

1. Submit your repository's URL on [packagist.org](https://packagist.org/packages/submit). Packagist reads `composer.json` and registers the package.
2. Connect Packagist's GitHub integration, or add its webhook, so new tags appear promptly. Without it, Packagist still picks up tags on its own schedule, only more slowly.
3. Merge the release pull request Scalar keeps open. The `vX.Y.Z` tag and GitHub Release it creates are the published version.

Your users then install with:

```bash
composer require acme/api
```

No release workflow is generated for PHP, because there is nothing to push. The generated `sdk-ci.yml` still validates and tests the package on every pull request. See [Packagist publishing](/products/sdk-generator/configuration/php#publish).

## For Laravel and Symfony teams

If your API is built with Laravel, you may already be generating an OpenAPI document with a tool such as [Scribe](/products/api-references/integrations/laravel-scribe). That document can drive both your [Laravel API reference](/products/api-references/integrations/laravel) and a PHP SDK for the developers who integrate with you. One description, two outputs, and no drift between what your docs say and what your client sends.

## Scalar compared with OpenAPI Generator for PHP

OpenAPI Generator's [`php` generator](https://openapi-generator.tech/docs/generators/php) is stable and free. It builds on Guzzle, with a PSR-18 option in beta, and lets you set the namespace with `invokerPackage`, the Composer name with `composerPackageName`, and property naming with `variableNamingConvention` (default `snake_case`). There are also newer generators marked beta: [`php-nextgen` and `php-dt`](https://openapi-generator.tech/docs/generators). Its [petstore sample](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/client/petstore/php/OpenAPIClient-php/README.md) targets PHP 8.1 and later and is used by constructing an API class around a Guzzle client (adapted from its README):

```php
$apiInstance = new OpenAPI\Client\Api\PetApi(new GuzzleHttp\Client());
```

If you want the SDK to sit on Guzzle specifically, or need a stable generator today, OpenAPI Generator is the practical choice.

| | Scalar PHP target (experimental) | OpenAPI Generator `php` |
| --- | --- | --- |
| Status | Experimental | Stable (with `php-nextgen` in beta) |
| HTTP client | Generated client | Guzzle, or PSR-18 (beta) |
| Client shape | Resource tree from one client | One `*Api` class per tag |
| `oneOf` / `anyOf` / `allOf` | Lowered into typed unions; check your preview | Marked unsupported in the generator's feature table |
| Pagination | Iterable pages | Not among the generator's documented options |
| Packagist release | Tagged on merge, no secrets | Your own tagging process |
| Same config drives other languages | Yes | Separate generator run per language |

For more on that decision, see [OpenAPI Generator alternatives](/alternatives/openapi-generator).

## Frequently asked questions

<scalar-detail title="Is the PHP SDK generator production ready?">

No. PHP is experimental and generates working code, but it is further from GA than Java, Kotlin, Ruby, and C#. We would rather talk with you first than have you find a gap after your users do.

</scalar-detail>

<scalar-detail title="Do I need a Packagist API token to publish?">

No. Packagist serves the package from the Git tag Scalar creates when you merge the release pull request. Connect the repository to Packagist once and enable its GitHub integration for prompt updates.

</scalar-detail>

<scalar-detail title="Can I publish the PHP SDK to a private Composer repository?">

Set `composerRepositoryUrl` on the PHP target to point at your Composer repository. Private registries are covered in the [private registries](/products/sdk-generator/custom-code#tips) guide.

</scalar-detail>

<scalar-detail title="How do I paginate with the generated PHP SDK?">

Loop over the page with `foreach`, or call `pagingEachItem()`. For page-level control, use `hasNextPage()` and `getNextPage()`.

</scalar-detail>

<scalar-detail title="Can I see the PHP output before committing?">

Yes. Adding the PHP target creates a preview repository with the generated code, README, and `api.md`, and every target is free during your trial.

</scalar-detail>

<scalar-button
  title="Preview a PHP SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [PHP configuration](/products/sdk-generator/configuration/php) · [Publishing to Packagist](/products/sdk-generator/configuration/php#publish)
- **Product:** [SDK Generator](/products/sdk-generator) — see PHP output from your own OpenAPI document next to your other SDKs

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/php) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
