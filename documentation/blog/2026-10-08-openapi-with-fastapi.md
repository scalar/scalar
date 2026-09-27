---
date: 2026-10-08
---

# OpenAPI with FastAPI

FastAPI generates an OpenAPI document for your API automatically, from the type hints, Pydantic models and decorators you already write. Start any FastAPI app and the document is at `/openapi.json`. The interesting work is not turning it on. It is making the document accurate enough that other tools can rely on it.

This is part one of a three-part series and it is vendor-neutral. Everything below is plain FastAPI and Pydantic, and it applies whatever you later point at the document: a documentation UI, an SDK generator, a linter, or a contract test. Part two covers what you can build from the document, and part three walks through one concrete setup.

Behaviour described here matches the [FastAPI documentation](https://fastapi.tiangolo.com/) and [release notes](https://fastapi.tiangolo.com/release-notes/) as of September 2026, when the latest release was 0.141.1.

## How FastAPI builds the document

FastAPI walks every route registered on the app, and for each one it collects:

- the path, the HTTP method, and path, query, header and cookie parameters from the function signature,
- the request body schema from Pydantic models,
- the response schema from the return type annotation or `response_model`,
- any metadata you pass to the decorator (summary, tags, responses, and so on).

Pydantic produces JSON Schema for every model, and FastAPI assembles those schemas into `components.schemas` with the paths around them. The result is generated on the first request to `/openapi.json` and cached on `app.openapi_schema`.

Since [FastAPI 0.99.0](https://github.com/fastapi/fastapi/releases/tag/0.99.0), the output is OpenAPI 3.1.0, which means schemas are JSON Schema 2020-12. Nullable fields come out as `anyOf` with a `null` type rather than the 3.0-only `nullable: true`. That is correct and matches what Pydantic v2 produces natively, but it catches people who feed the document to a tool that only reads 3.0. More on that below.

## The minimum app

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Bookstore API", version="1.0.0")


class Book(BaseModel):
    id: int
    title: str
    subtitle: str | None = None


@app.get("/books/{book_id}")
def get_book(book_id: int) -> Book:
    return Book(id=book_id, title="Dune")
```

Run it with `fastapi dev main.py` and you get three URLs:

| URL | What it is | Controlled by |
| --- | --- | --- |
| `/openapi.json` | The OpenAPI document | `openapi_url` |
| `/docs` | Swagger UI | `docs_url` |
| `/redoc` | ReDoc | `redoc_url` |

Set any of them to `None` to turn it off. Setting `openapi_url=None` disables the document and both UIs, because the UIs read from it.

## Describe the API, not only the types

A document generated from types alone is valid but thin. Here is what to add, ordered by how much it helps the people and tools that read it.

### App-level metadata

```python
app = FastAPI(
    title="Bookstore API",
    version="1.0.0",
    summary="Books, authors and orders.",
    description="Use this API to manage the catalogue and place orders.",
    contact={"name": "API team", "email": "api@example.com"},
    license_info={"name": "MIT", "identifier": "MIT"},
    openapi_tags=[
        {"name": "books", "description": "Browse and manage the catalogue."},
        {"name": "orders", "description": "Place and track orders."},
    ],
)
```

`openapi_tags` sets the order and description of tag groups. Documentation UIs use it for navigation, and several SDK generators use tags to group methods into namespaces. `description` accepts Markdown.

### Per-operation metadata

```python
@app.get(
    "/books/{book_id}",
    tags=["books"],
    summary="Get a book",
    response_description="The requested book",
    responses={404: {"description": "Book not found"}},
)
def get_book(book_id: int) -> Book:
    """
    Returns a single book by ID.

    Books that have been removed from the catalogue return **404**.
    """
    ...
```

The docstring becomes the operation description, and Markdown in it is preserved. `summary` defaults to a title-cased version of the function name, which is fine for `get_book` and less fine for `handle_v2_lookup`.

### Document every response, not only the happy path

This is the most common gap in FastAPI documents. FastAPI knows the success response from your return type, and it adds a `422` validation error response to every operation that takes parameters or a body. It does not know about the `404` you raise with `HTTPException` inside the function, because that happens at runtime.

Declare those with `responses`, and give them a model when the body has a shape:

```python
class ErrorMessage(BaseModel):
    detail: str


@app.get(
    "/books/{book_id}",
    responses={404: {"model": ErrorMessage, "description": "Book not found"}},
)
def get_book(book_id: int) -> Book:
    ...
```

If most of your endpoints share error responses, define the dictionary once and merge it in: `responses={**common_errors, 404: {...}}`.

### Parameters and fields

Use `Annotated` with `Path`, `Query`, `Header` and Pydantic's `Field` to add descriptions, constraints and examples. Constraints become schema keywords that validators and generated clients understand:

```python
from typing import Annotated
from fastapi import Path, Query
from pydantic import Field


class Book(BaseModel):
    id: int = Field(description="Unique identifier")
    title: str = Field(max_length=200, examples=["Dune"])
    subtitle: str | None = Field(default=None, examples=["Book one"])


@app.get("/books")
def list_books(
    limit: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
    cursor: Annotated[str | None, Query(description="Cursor from the previous page")] = None,
) -> list[Book]:
    ...
```

Examples in Pydantic `Field(examples=[...])` go into the JSON Schema. If you want OpenAPI's named examples on a request body (several labelled examples that a UI can switch between), use `Body(openapi_examples={...})` instead.

## Make operation IDs stable

Every operation in the document has an `operationId`. FastAPI generates it from the function name, the path and the method, so `get_book` on `GET /books/{book_id}` becomes something like `get_book_books__book_id__get`. That is unique, which is what the spec requires, but it is not pleasant, and it changes if you rename the function or move the path.

It matters because SDK generators name methods after operation IDs. An unstable ID is an unstable SDK method name, which is a breaking change for anybody using a generated client. FastAPI's own [SDK generation guide](https://fastapi.tiangolo.com/advanced/generate-clients/) recommends a custom `generate_unique_id_function`:

```python
from fastapi import FastAPI
from fastapi.routing import APIRoute


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(generate_unique_id_function=custom_generate_unique_id)
```

That gives you `books-get_book`, and it only changes when you rename the function or its tag on purpose. Note that this example assumes every route has at least one tag; add a fallback if yours do not. You can also pass `operation_id="getBook"` to a single decorator.

## Authentication

FastAPI's security utilities are dependencies that also register security schemes in the document. Use them rather than reading headers by hand, and the document describes your auth correctly for free:

```python
from fastapi import Depends
from fastapi.security import APIKeyHeader, HTTPBearer

api_key = APIKeyHeader(name="X-API-Key")
bearer = HTTPBearer()


@app.get("/orders")
def list_orders(key: str = Depends(api_key)) -> list[Order]:
    ...
```

This adds an `apiKey` scheme to `components.securitySchemes` and a security requirement to the operation. `OAuth2PasswordBearer(tokenUrl="token")` does the same for the OAuth 2.0 password flow. Documentation UIs read these to show an authentication form, and SDK generators read them to decide what the client constructor asks for.

If you read `request.headers["Authorization"]` directly instead, the endpoint works but the document says it is unauthenticated, and every tool downstream believes it.

## Input and output schemas

Since [FastAPI 0.102.0](https://fastapi.tiangolo.com/how-to/separate-openapi-schemas/), a model used for both requests and responses can produce two schemas, `Book-Input` and `Book-Output`. The reason is honest: a field with a default is optional when you send it, but always present when the server returns it. Two schemas describe that precisely.

If your consumers find the split confusing, or a generator produces awkward type names from it, turn it off:

```python
app = FastAPI(separate_input_output_schemas=False)
```

You get a single `Book` schema, and fields with defaults are not marked as required. The cleaner fix, if the input and output really differ, is to define two models (`BookCreate` and `Book`) and name them yourself.

## Webhooks

OpenAPI 3.1 has a top-level `webhooks` section for requests your API sends to other people. FastAPI supports it:

```python
class OrderEvent(BaseModel):
    order_id: int
    status: str


@app.webhooks.post("order-updated")
def order_updated(body: OrderEvent):
    """Sent when an order changes status."""
```

The function is never called. It exists so the document describes the payload your subscribers will receive.

## Customize the whole document

When decorator arguments are not enough (adding a vendor extension, a logo, or a `servers` list that differs per environment), override `app.openapi`:

```python
from fastapi.openapi.utils import get_openapi


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        summary=app.summary,
        description=app.description,
        routes=app.routes,
    )
    schema["servers"] = [{"url": "https://api.example.com"}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
```

For a single operation, `openapi_extra={...}` on the decorator merges arbitrary keys into that operation. It is the right tool for vendor extensions such as `x-codeSamples`.

If you run behind a proxy with a path prefix, set `root_path` (or pass `--root-path` to the server) so the document's `servers` entry points at the public URL rather than the internal one.

## Export the document for CI

Serving the document from a running app is fine for development. For CI you want a file you can lint, diff against the last release, commit, and hand to other tools. FastAPI can produce it without starting a server:

```python
# scripts/export_openapi.py
import json
from main import app

with open("openapi.json", "w") as f:
    json.dump(app.openapi(), f, indent=2)
```

Run it in CI after tests, fail the build if the linter complains, and compare the result with the previous release to catch breaking changes before your users do. Our [Spectral rules guide](/learn/openapi/spectral-rules) has a sensible starting ruleset.

## Common mistakes

- **Raising `HTTPException` without declaring the response.** The endpoint works; the document says it can only succeed.
- **Leaving operation IDs to the default.** Fine for a demo, painful for an SDK.
- **Returning `dict` instead of a model.** A function annotated `-> dict` produces an untyped response schema. Return a Pydantic model and the document gets a real schema.
- **Reading auth headers by hand.** Use the `fastapi.security` dependencies so the scheme is documented.
- **Feeding 3.1 output to a 3.0-only tool.** Upgrade the tool if you can. If you cannot, convert the file rather than downgrading your app's output.
- **Hiding internals with `include_in_schema=False` and forgetting about it.** It hides the route from the document, not from the internet.

## What to do with the document

Now you have an accurate OpenAPI 3.1 document coming out of your app and your CI. The value is in what reads it:

- **A documentation UI.** FastAPI ships Swagger UI and ReDoc. You can serve any other UI that reads OpenAPI from a route with `include_in_schema=False`.
- **Client SDKs** in Python, TypeScript and the other languages your users write.
- **An MCP server** so AI agents can call the operations you choose.
- **Contract tests and breaking-change checks** against the last published document.

Part two of this series covers each of those. For the short version today, the [FastAPI API documentation](/docs-for/fastapi) page shows a two-line setup, and the [FastAPI integration guide](/products/api-references/integrations/fastapi) lists every option.

## Frequently asked questions

<scalar-detail title="Where is the FastAPI OpenAPI document?">
At `/openapi.json` by default. Change it with `FastAPI(openapi_url="/api/openapi.json")`, or disable it with `openapi_url=None`.
</scalar-detail>

<scalar-detail title="Which OpenAPI version does FastAPI generate?">
OpenAPI 3.1.0, since FastAPI 0.99.0. There is no built-in switch to emit 3.0.
</scalar-detail>

<scalar-detail title="How do I export the FastAPI OpenAPI document to a file?">
Import the app and call `app.openapi()`, then write the result with `json.dump`. No server is needed.
</scalar-detail>

<scalar-detail title="Why are there Model-Input and Model-Output schemas in my document?">
Since FastAPI 0.102.0, a model used for both requests and responses gets separate schemas, because fields with defaults are optional on input but always present on output. Pass `separate_input_output_schemas=False` to get one schema per model.
</scalar-detail>

<scalar-detail title="How do I change FastAPI operation IDs?">
Pass `generate_unique_id_function` to `FastAPI()` or `APIRouter()` to change them everywhere, or `operation_id="..."` on a single route decorator.
</scalar-detail>

<scalar-detail title="How do I add authentication to the FastAPI OpenAPI document?">
Use the dependencies in `fastapi.security`, such as `APIKeyHeader`, `HTTPBearer` or `OAuth2PasswordBearer`. They validate the request and register the matching security scheme in the document.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [Generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi)
- **Docs:** [FastAPI integration guide](/products/api-references/integrations/fastapi)
- **Product:** [FastAPI API documentation](/docs-for/fastapi) — turn the document from this post into interactive docs with one package
