# Pagination

A paginated method returns a page instead of a raw response. The page carries the items, remembers the request that produced them, and knows how to ask for the next one — so iterating it walks the whole collection, and no caller has to reimplement your paging rules.

Pagination is declared, not guessed. An `offset` parameter is not always a pager and a `next` field is not always a cursor, so a build never decides from parameter or field names that a method pages: you state the scheme once, and every target generates its own idiomatic helper from it. The one place the generator suggests a scheme is the starter configuration it writes for a document that has none; see [Starter configuration inference](#starter-configuration-inference).

## Start here

Say the operation takes `offset` and `size` as query parameters and returns the items under `assets`:

```
GET /workspaces/{workspace_id}/assets?offset=0&size=50
```

Declare one scheme and point the method at it:

```json
{
  "pagination": [
    {
      "name": "offsetPage",
      "type": "offset",
      "request": {
        "offset": { "type": "offset", "param": "offset" },
        "size": { "type": "limit", "param": "size" }
      },
      "response": {
        "assets": { "type": "items" },
        "total": { "type": "total" }
      }
    }
  ],
  "resources": {
    "assets": {
      "methods": {
        "list": {
          "endpoint": "get /workspaces/{workspace_id}/assets",
          "paginated": "offsetPage"
        }
      }
    }
  }
}
```

That is the whole change. `offset` and `size` stay ordinary parameters your callers can pass on the first request — the SDK takes over advancing them:

<scalar-tabs default="TypeScript">
  <scalar-tab title="TypeScript">

```ts
// Walks every page.
for await (const asset of client.assets.list(workspaceId, { size: 50 })) {
  console.log(asset.id);
}

// Or a page at a time.
const page = await client.assets.list(workspaceId, { size: 50 });
page.assets; // the response fields are still there
page.total;

if (page.hasNextPage()) {
  const next = await page.getNextPage();
}

for await (const p of page.iterPages()) {
  console.log(p.assets.length);
}
```

  </scalar-tab>
  <scalar-tab title="Python">

```python
# Walks every page.
for asset in client.assets.list(workspace_id, size=50):
    print(asset.id)

# Or a page at a time.
page = client.assets.list(workspace_id, size=50)
page.assets
page.total

if page.has_next_page():
    next_page = page.get_next_page()

for p in page.iter_pages():
    print(len(p.assets))
```

The async client returns an async page, iterated with `async for` and `async for p in page.iter_pages()`.

  </scalar-tab>
  <scalar-tab title="Go">

```go
// Walks every page.
iter := client.Assets.ListAutoPaging(ctx, workspaceID, acme.AssetListParams{Size: acme.Int(50)})
for iter.Next() {
    asset := iter.Current()
    fmt.Println(asset.ID)
}
if err := iter.Err(); err != nil {
    return err
}

// Or a page at a time.
page, err := client.Assets.List(ctx, workspaceID, acme.AssetListParams{Size: acme.Int(50)})
next, err := page.GetNextPage()
```

  </scalar-tab>
</scalar-tabs>

## Declaring a scheme

A scheme can live in either place, and the shape is identical in both. Document-declared schemes are read when the configuration is derived from the document. Once you supply a configuration, its `pagination` array is the full list of schemes, and a method's `paginated` value decides whether and how it pages. The one thing still read from the document on every build is the `x-stainless-pagination-property` marker on a request parameter, and only for a method that leaves `paginated` unset: the marker then picks one of your configured schemes, never adds one. See [Binding a method](#binding-a-method).

**In the SDK configuration.** `pagination` holds an array of complete named schemes, and methods select one by name. This is the better home when the same scheme covers several operations, several documents, or several targets.

**In the OpenAPI document**, through [`x-scalar-pagination`](openapi-extensions.md). At the document root the value is that same array of named schemes. On an operation it is a scheme name, `false`, or a complete scheme inline — which is the short path when one operation has one shape:

```yaml
paths:
  /workspaces/{workspace_id}/assets:
    get:
      operationId: listAssets
      x-scalar-pagination:
        name: offsetPage
        type: offset
        request:
          offset: { type: offset, param: offset }
          size: { type: limit, param: size }
        response:
          assets: { type: items }
          total: { type: total }
```

Inline schemes that are structurally identical collapse onto one named scheme, because the name becomes a public class in every generated SDK and one shape must not produce several.

Values read from an OpenAPI document are untrusted input: a scheme that does not satisfy the configuration schema, or whose field names are not plain identifiers, is ignored rather than generated.

## Binding a method

A method opts in through `paginated`:

| Value | Effect |
| ----- | ------ |
| `"offsetPage"` | Paginates with that named scheme. |
| `false` | Never paginates, whatever the document says. |
| Omitted | Falls back to the document's pagination markers (`x-stainless-pagination-property` on request-parameter schemas). If a marker names a type and exactly one configured scheme has that type, the method adopts it. More than one match is ambiguous, so the method stays unpaginated and reports `Pagination/AmbiguousMarker`. |
| `true` | Resolves to no scheme: the method is not paginated, and document markers are not consulted. Only a Stainless import gives it meaning, matching the method against the configured schemes. |

Configuration always wins over the document: a named scheme or an explicit `false` is never overridden by a marker, and a marker can only select a scheme your configuration already defines.

## Starter configuration inference

When a build has no configuration, the generator writes a starter configuration for the document. If the document states no pagination of its own, the starter looks for one common shape, opaque-cursor paging, and writes a `cursor` scheme for each operation that matches it.

The document states pagination of its own when it carries any of these, and then nothing is inferred:

- `x-scalar-pagination`, anywhere in the document
- `x-fern-pagination` or `x-speakeasy-pagination` on an operation
- an `x-stainless-pagination-property` marker on a request parameter

An operation gets a scheme only when all of these hold:

- It is a `GET`.
- It has exactly one optional, string-typed query parameter named `cursor`, `page_token`, or `pageToken`.
- It has no query parameter of another paging style beside it: `offset`, `page`, `page_number`, `pageNumber`, `after`, `before`, `starting_after`, or `ending_before`.
- Its JSON success response is an object with exactly one array property, which becomes the items, and exactly one string property named `next_cursor`, `nextCursor`, `next_page_token`, or `nextPageToken`, which becomes the next cursor. A nullable string counts.

An integer `limit`, `page_size`, or `pageSize` query parameter, when there is exactly one, becomes the page size.

The scheme lands in the starter configuration like any other, so you can rename it, edit it, or set `paginated: false` on a method it should not cover. Once written, the starter configuration is yours and applies to every target as written.

Nothing is inferred when the document is imported as a Fern project. A document with `x-fern-*` extensions on its root, a server, or an operation, and no configuration, is read as a Fern project, and its own `x-fern-pagination` markers decide what pages. See [OpenAPI Extensions](openapi-extensions.md#imported-vendor-extensions).

## Scheme reference

| Key | Required | What it is |
| --- | -------- | ---------- |
| `name` | Yes | The name methods reference through `paginated`, and the stem of the generated page class. |
| `type` | Yes | The paging strategy. One of `offset`, `pageNumber`, `cursor`, `cursorId`, `cursorUrl`, `fakePage`. |
| `request` | Yes | The parameters the next page is built from, keyed by field name. |
| `response` | Yes | The fields read off the response, keyed by field name. |
| `description` | No | Human-readable note about how the strategy works, for whoever reads the configuration next. It is carried through the compiled output but no target renders it into generated code. |
| `paramLocation` | No | Default wire location for the request fields, `query` or `body`. A field's own `location` overrides it. |
| `continueOnEmptyItems` | No | Keep paging when a page returns no items. Off by default, because an empty page normally means the collection is exhausted. |

### Request fields

Each entry under `request` describes one parameter the SDK sets when it asks for the next page.

| Key | What it is |
| --- | ---------- |
| `type` | The field's role: `offset`, `pageNumber`, `cursor`, `cursorId`, `cursorUrl`, `limit`, or `pageSize`. |
| `param` | The wire name of the parameter. Defaults to the entry's key. |
| `location` | `query` or `body`. Defaults to `paramLocation`, then `query`. The schema also accepts `header`; Swift, Rust, and Dart send a `header` paging parameter as a header, and so do Java and Kotlin when the operation declares that header; most other targets advance it as a query parameter. |
| `path`, `property` | Where the field sits inside a request body, for body-located paging. |
| `value` | A literal value to send for this field on every request. |
| `schema` | The field's schema, which types the parameter in the generated params object. Absent, a cursor role types as a string and the numeric roles as an integer. |
| `required` | Whether the generated parameter is required. |

`limit` and `pageSize` are the same role under two names — use whichever matches your API's vocabulary.

The wire name is `param`, defaulting to the entry key, and it is also what the field is called on the generated params object.

### Response fields

Each entry under `response` describes one field the page reads out of the response.

| Key | What it is |
| --- | ---------- |
| `type` | The field's role: `items`, `cursor`, `cursorId`, `cursorUrl`, `offset`, `pageNumber`, `hasMore`, `total`, `totalPages`, `currentPage`, or `pageSize`. |
| `property` | The response property holding the value. |
| `path` | The path to it, for a value nested inside an envelope, such as `["data", "items"]`. |
| `location` | `body`, `header`, `linkHeader`, or `bodyLink`. Defaults to `body`. See [Where fields are read from](#where-fields-are-read-from). |
| `headerName`, `rel` | The header and link relation for a header or `Link`-header field. For `linkHeader` they default to `Link` and `next`; a `header` field's `headerName` defaults to the entry's key. |
| `itemCursor` | The path *within each item* to the value used as the next cursor, for `cursorId` schemes. |
| `cursorPath` | The path within this field's own object to the cursor, such as `["next"]` when the field is a `links` envelope. The field keeps its declared shape; only the cursor read descends. |
| `schema` | The field's schema, which types the member on the generated page. |

A field's entry key names the member on the generated page, while `property` and `path` say where to read it from. Both default to the key, so the two forms differ only in what the page member ends up called:

- `"assets": { "type": "items" }` reads `assets` off the body and exposes `page.assets`.
- `"items": { "type": "items", "property": "assets" }` reads the same field and exposes `page.items`.

Declare a field with the `items` role on every scheme. Without one the compiler falls back to a `data` property, which is a guess about your API rather than a statement about it.

## Strategies

### `offset`

Request an `offset` plus a `limit`/`pageSize`. The next request sets the offset parameter to the current offset plus the page size, where the page size is the limit the caller sent, falling back to the number of items the current page returned. Declare a `total` response field and paging stops once the next offset reaches it.

```json
{
  "name": "offsetPage",
  "type": "offset",
  "request": {
    "offset": { "type": "offset", "param": "offset" },
    "limit": { "type": "limit", "param": "limit" }
  },
  "response": {
    "items": { "type": "items", "property": "data" },
    "total": { "type": "total", "property": "total_count" }
  }
}
```

An absent offset counts as `0`, so a caller who passes neither parameter still gets correct paging from the first page. A page size that resolves to zero or to something that is not a number stops paging rather than looping on the same offset.

### `pageNumber`

Request a page number plus an optional page size. The next request increments the page number, starting from `1` when the caller sent none. Declare a `totalPages` response field and paging stops on the last page.

```json
{
  "name": "numberedPage",
  "type": "pageNumber",
  "request": {
    "page": { "type": "pageNumber", "param": "page" },
    "per_page": { "type": "pageSize", "param": "per_page" }
  },
  "response": {
    "items": { "type": "items", "property": "results" },
    "total_pages": { "type": "totalPages", "property": "total_pages" }
  }
}
```

### `cursor`

The response carries an opaque token that the next request sends back. Paging stops when the token is missing, empty, or not a string or number — and immediately when a `hasMore` field comes back `false`.

```json
{
  "name": "cursorPage",
  "type": "cursor",
  "request": {
    "cursor": { "type": "cursor", "param": "starting_after" },
    "limit": { "type": "limit", "param": "limit" }
  },
  "response": {
    "items": { "type": "items", "property": "data" },
    "next_cursor": { "type": "cursor", "property": "next_cursor" },
    "has_more": { "type": "hasMore", "property": "has_more" }
  }
}
```

When the token sits inside an envelope, keep the envelope as the field and point `cursorPath` at the token:

```json
{
  "links": { "type": "cursor", "property": "links", "cursorPath": ["next"] }
}
```

### `cursorId`

There is no cursor field: the next request sends an identifier taken from the last item on the page. Point `itemCursor` at the path within an item.

```json
{
  "name": "cursorIdPage",
  "type": "cursorId",
  "request": {
    "starting_after": { "type": "cursorId", "param": "starting_after" }
  },
  "response": {
    "items": { "type": "items", "property": "data", "itemCursor": ["id"] }
  }
}
```

### `cursorUrl`

The response carries a fully-formed URL for the next page rather than a token.

<scalar-callout type="warning" icon="phosphor/regular/warning">
  Support is uneven and depends on how the URL field is declared. With `location: bodyLink`, Rust, Swift, Ruby, C++, Dart, and PHP re-issue the request against the URL, while Java and Kotlin re-send the same operation with the URL's query string, so a cursor carried in the URL's path is not followed. C# treats the first page as the last, and TypeScript, Python, and Go stop after the first. Left at `location: body` in a `cursorUrl` scheme, the URL is still followed by Ruby, C++, Dart, and PHP, and by Swift when the scheme declares no request cursor parameter; under that same condition Java and Kotlin apply its query string to the same operation. Otherwise it is written into the cursor request parameter, which is not what a URL is for, and a server that ignores that parameter can return the first page again and again. Prefer a `cursor` scheme over a URL where your API offers both.
</scalar-callout>

### `fakePage`

The operation returns the whole collection in one response. There is no next page, but the result is still wrapped in a page type so callers iterate collections uniformly across your SDK.

```json
{
  "name": "singlePage",
  "type": "fakePage",
  "request": {},
  "response": {
    "items": { "type": "items", "property": "data" }
  }
}
```

## When paging stops

Under every strategy, the page asks for another only when all of these hold:

- The current page returned at least one item, unless the scheme sets `continueOnEmptyItems`.
- A `hasMore` field, if declared, is not `false`.
- The strategy can build a next request: a usable cursor, or an offset or page number that has not reached a declared `total` or `totalPages`.

Whatever the caller sent with the first request — headers, query parameters, a body, per-request options — is reused for every page after it, with only the paging parameters changed. An idempotency key is the exception: it belongs to the one request it was sent with, so each page gets its own.

## What gets generated

In TypeScript, Python, Go, Ruby, PHP, and Dart the scheme name becomes the page type, cased for each language: `offsetPage` generates `OffsetPage` in TypeScript, `SyncOffsetPage` and `AsyncOffsetPage` in Python, and so on. Java, Kotlin, and C# name a page class per method, Rust and Swift use a generic page type, and C++ generates a class template per scheme (`offsetPage` generates `OffsetPage<T>`). Two schemes that would case to the same name get a numeric suffix, so the name in your configuration is worth choosing deliberately.

Alongside the page type, a target generates a params type carrying the scheme's request fields (so a paginated method accepts `offset` and `size` as normal arguments) and a response type carrying its response fields (so page metadata such as `total` stays accessible next to the items). C++ gives each page class an accessor per boolean, integer, number or plain-string field the scheme declares in the response body (`page.total()`, `page.has_more()`, each a `std::optional`) and keeps the rest of the response body in `page.body()`, and Dart's page exposes the fields it pages by and reads the rest off the decoded body, `page.json`.

| Target | Walking every item | One page at a time |
| ------ | ------------------ | ------------------ |
| TypeScript | `for await (const item of page)` | `page.hasNextPage()`, `page.getNextPage()`, `page.iterPages()` |
| Python | `for item in page`, `async for item in page` | `page.has_next_page()`, `page.get_next_page()`, `page.iter_pages()` |
| Go | `client.X.ListAutoPaging(...)` with `Next()`, `Current()`, `Err()` | `page.GetNextPage()` |
| Java, Kotlin | `page.autoPager()` | `page.hasNextPage()`, `page.nextPage()` |
| Ruby | `page.auto_paging_each` with a block | `page.next_page` |
| C# | `await foreach (var item in page.Paginate())` | `page.HasNext()`, `page.Next()` |
| PHP | `foreach ($page as $item)`, `$page->pagingEachItem()` | `$page->hasNextPage()`, `$page->getNextPage()` |
| Rust | `let mut pager = ...paginate();` then `pager.next().await` | `Pager::next_page` |
| Dart | `await for (final item in client.x.list().autoPaging())` | `page.hasNextPage`, `page.nextPage()`, `page.pages()` |
| C++ | `for (const auto& item : page.auto_paging())` | `page.items()`, `page.has_next_page()`, `page.next_page()` |
| Swift | `for try await item in client.x.list(...)` | `.pages`, `firstPage()`, `page.hasNextPage`, `page.nextPage()` |

Your generated README also picks up a `## Pagination` section walking a real paginated operation, on every target. Choose which one with `readme.exampleRequests.pagination`.

## Where fields are read from

Generated pages read their fields out of the **response body**. A field declared with `location: header` or `linkHeader` is carried through the compiled output and the generated manifests. Only Swift's, C++'s, Dart's, and PHP's pages advance from a `header` cursor, and only C++, Dart, and PHP follow a `linkHeader` field. A scheme whose only cursor is in a `header` field therefore stops after the first page on every target but Swift, C++, Dart, and PHP, and one whose only cursor is in a `linkHeader` field stops after the first page everywhere but C++, Dart, and PHP. `bodyLink` is followed as a next-page URL by Rust, Swift, Ruby, C++, Dart, and PHP; Java and Kotlin apply its query string to the same operation.

`itemCursor` is read by every target; `cursorPath` is read by TypeScript, Python, Swift, Ruby, Java, Kotlin, C++, Dart, and PHP. On the other targets a scheme relying on `cursorPath` stops after the first page, so prefer a top-level cursor field where your API offers one.

If your API pages by a `Link` header and you need it followed on a target other than C++, Dart, or PHP, tell us — it is a gap we are tracking, not a design decision.

## Diagnostics

Three rules watch pagination, and all three report against a specific method or scheme:

| Code | Severity | What it means |
| ---- | -------- | ------------- |
| `Pagination/UnknownScheme` | `error` | A method's `paginated` names a scheme that `pagination` does not define. That method degrades to unpaginated. |
| `Pagination/AmbiguousMarker` | `warn` | The document's markers matched more than one configured scheme of the same type. The compiler refuses to guess, so the method stays unpaginated. Set `paginated` explicitly. |
| `Pagination/UnusedScheme` | `warn` | A configured scheme is bound to no method — usually the remains of a renamed or removed `paginated` reference. |

See [Diagnostics](diagnostics.md) for how findings are graded, suppressed, and used to fail a build.

## Related

- [Configuration](configuration.md) — the `pagination` block in context, beside `resources` and `clientSettings`
- [OpenAPI Extensions](openapi-extensions.md) — declaring schemes in the document with `x-scalar-pagination`
- [Diagnostics](diagnostics.md) — what a build reports when a scheme cannot be resolved
