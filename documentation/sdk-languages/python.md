# Python SDK generator from OpenAPI

Scalar generates a Python SDK from your OpenAPI document with a synchronous client, an async twin that exposes the same resource tree, typed models, and pagination you can loop over with a plain `for`. Python is a generally available target: every change to the generator is tested end to end by generating, installing, and calling a live server.

Below is real output, the Python conventions it follows, how it lands on PyPI, and an honest comparison with OpenAPI Generator's `python` generator.

## What the generated code looks like

This is the quickstart from the Python SDK Scalar generates for Warp's HR API, published as [TeamWarp/warp-sdk-python](https://github.com/TeamWarp/warp-sdk-python):

```python
import os

from warp import Warp

client = Warp(api_key=os.environ.get("WARP_API_KEY"))

# Auto-paginating: the next cursor page is fetched as you iterate.
for assignment in client.time_off.list_assignments(limit=50):
    print(assignment.id, assignment.policy.name)
```

The same call from async code uses `AsyncWarp` and `await`, with nothing else to learn:

```python
import asyncio

from warp import AsyncWarp


async def main() -> None:
    client = AsyncWarp()  # reads WARP_API_KEY from the environment
    page = await client.time_off.list_assignments(limit=50)
    async for assignment in page:
        print(assignment.id)


asyncio.run(main())
```

Resource names are `snake_case`, parameters are keyword arguments, and the client class is named after your API. That is what a Python developer would write by hand, and it is why the generator avoids positional `None` placeholders and `*Api` classes per tag.

## Python idioms the generator follows

**Sync and async from one description.** Every SDK ships `Warp` and `AsyncWarp` (named after your API). They share models and resources, so switching a code path to asyncio is a one-line change rather than a second SDK.

**Keyword arguments and typed models.** Request parameters are keyword arguments with type hints, and response models are typed classes, so editors and type checkers can tell you when a field does not exist. `oneOf`, `anyOf`, and `allOf` become union types with discriminator support.

**Two names, handled separately.** Python packages often install under one name and import under another. The target keeps them apart: `packageName` is what users `import` (`acme_api`), and `projectName` is what they `pip install` (`acme-api`).

**Retries, timeouts, and raw access.** Temporary failures (network errors, 408, 409, 429, 5xx) are retried twice by default, with `Retry-After` honoured. Timeouts default to 60 seconds. Both are client options and can be overridden per request:

```python
from warp import APIStatusError, Warp

client = Warp(timeout=20.0, max_retries=3)

try:
    page = client.time_off.list_assignments()
except APIStatusError as err:
    print(err.status_code, err.message)
    raise

# The underlying httpx.Response, when you need headers or want to parse it yourself.
raw = client.with_raw_response.time_off.list_assignments()
```

**Pagination with page objects.** List methods return `SyncCursorPage` or `AsyncCursorPage` (the name follows your scheme). Iterate items directly, or work a page at a time with `page.has_next_page()`, `page.get_next_page()`, and `page.iter_pages()`. The response fields, such as a `total`, remain available on the page.

**Standard logging.** The Warp SDK reads a `WARP_LOG` environment variable; set it to `info` or `debug` and HTTP logging goes through Python's `logging` module. The generated Warp SDK is built on `httpx` and states a Python 3.8 or later requirement in its README.

## Configure the target

```json
{
  "targets": {
    "python": {
      "packageName": "acme_api",
      "projectName": "acme-api",
      "destinations": {
        "production": { "repo": "acme/acme-python" }
      },
      "publish": { "pypi": true }
    }
  }
}
```

Users then run `pip install acme-api` and write `import acme_api`. The [Python configuration](/products/sdk-generator/configuration/python) reference covers every option.

## Publishing to PyPI

Scalar never publishes on your behalf. It keeps a release pull request open in your repository, and merging that pull request runs a `publish` job inside `release-please.yml`, which uploads with `pypa/gh-action-pypi-publish`.

The recommended authentication is **PyPI trusted publishing**. Add a GitHub publisher on pypi.org pointing at your repository and the workflow `release-please.yml`. For a project that does not exist yet, use a *pending publisher* from your account's Publishing page, so the very first release can go out without a token. If you prefer tokens, store a project-scoped token as `PYPI_API_TOKEN` and set `"authMethod": "access-token"`.

`skip-existing` is on, so re-running a release for a version that is already on PyPI is a no-op instead of a failed job. Details are in [PyPI publishing](/products/sdk-generator/configuration/python#publish).

## Scalar compared with OpenAPI Generator for Python

OpenAPI Generator's [`python` generator](https://openapi-generator.tech/docs/generators/python) is stable, free, and has improved a lot: its models use Pydantic, and its feature table marks `oneOf`, `anyOf`, and `allOf` as supported. It offers several HTTP libraries through the `library` option (`urllib3` by default, plus `asyncio`, `httpx`, and `httpx2`). A separate [`python-pydantic-v1`](https://openapi-generator.tech/docs/generators) generator remains for projects pinned to Pydantic 1.

The main differences are in the shape of the client and what ships around it. A call against OpenAPI Generator's [sample petstore client](https://github.com/OpenAPITools/openapi-generator/blob/master/samples/openapi3/client/petstore/python/README.md) looks like this (adapted from its README):

```python
import petstore_api
from petstore_api.rest import ApiException

configuration = petstore_api.Configuration(host="https://petstore.example.com/v2")

with petstore_api.ApiClient(configuration) as api_client:
    api_instance = petstore_api.PetApi(api_client)
    pet = api_instance.get_pet_by_id(pet_id=1)
```

| | Scalar Python target | OpenAPI Generator `python` |
| --- | --- | --- |
| Client shape | `Warp()` with resources as attributes | `Configuration` + `ApiClient` + one `*Api` class per tag |
| Async | `AsyncWarp` in every SDK, same resource tree | Chosen at generation time with `library=asyncio` or `httpx` |
| Pagination | Generated page types and iterators | Not among the generator's documented options |
| Retries | Built in, honours `Retry-After` | Not among the generator's documented options |
| Package naming | `packageName` and `projectName` separately | `packageName`, default `openapi_client` |
| Release to PyPI | Workflow and release PR generated into your repo | Generates packaging files; release process is yours |
| Cost | One target on the free plan | Free |

If your team is comfortable owning the release pipeline and the call-site ergonomics suit you, OpenAPI Generator is a reasonable choice. [OpenAPI Generator alternatives](/alternatives/openapi-generator) goes further into that decision.

## Frequently asked questions

<scalar-detail title="Is the Python SDK generator ready for production?">

Yes. Python is generally available, alongside TypeScript, Go, and the CLI. It is covered by end-to-end tests that generate, build, and run the SDK against a live server.

</scalar-detail>

<scalar-detail title="Does the generated Python SDK support asyncio?">

Yes. Every SDK includes an async client (for example `AsyncWarp`) with the same resources and methods as the sync one. Paginated methods return async pages you iterate with `async for`.

</scalar-detail>

<scalar-detail title="Which Python versions does the generated SDK support?">

The generated Warp SDK declares Python 3.8 or newer in its README. Check the README generated for your own SDK, which is filled in from the build.

</scalar-detail>

<scalar-detail title="Can I publish to PyPI before the project exists?">

Yes. Register a pending trusted publisher on PyPI for your repository and the `release-please.yml` workflow. The first merge of the release pull request creates the project.

</scalar-detail>

<scalar-detail title="How do I keep my own helper functions when the SDK is regenerated?">

Add them as you would in any repository. Each build three-way merges the new output with your changes and opens a pull request, and files you created are never touched. See [custom code](/products/sdk-generator/custom-code).

</scalar-detail>

<scalar-button
  title="Generate a Python SDK from your OpenAPI document"
  href="https://dashboard.scalar.com/register">
</scalar-button>

## Related

- **Learn:** [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [OpenAPI Generator alternatives](/alternatives/openapi-generator)
- **Docs:** [Python configuration](/products/sdk-generator/configuration/python) · [Publishing to PyPI](/products/sdk-generator/configuration/python#publish)
- **Product:** [SDK Generator](/products/sdk-generator) — one OpenAPI document, typed SDKs in every language your users write

---

*OpenAPI Generator details are taken from [openapi-generator.tech](https://openapi-generator.tech/docs/generators/python) and the [OpenAPITools/openapi-generator repository](https://github.com/OpenAPITools/openapi-generator) as of September 2026 (release 7.25.0). If something here is out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will fix it.*
