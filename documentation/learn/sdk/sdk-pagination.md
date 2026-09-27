# SDK pagination: patterns, iterators, and how OpenAPI describes them

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

SDK pagination is the part of a client library that walks a paginated API endpoint for you, fetching the next page when the current one runs out, so the caller writes one loop over items instead of juggling cursors, offsets, and stop conditions by hand. The API still returns one page per request. What changes is who owns the paging logic: every caller, or the SDK.

That sounds like a small convenience. In practice, pagination is where hand-written API integrations break most quietly. A loop that stops one page early loses records without an error. A loop that never stops burns through a rate limit. And a loop written against today's page size fails when somebody changes the default. Putting the logic in the SDK means it is written once, tested once, and fixed once.

This guide covers the four pagination patterns you will meet in HTTP APIs, what an auto-paginating iterator looks like in TypeScript, Python, and Go, how an OpenAPI document tells a generator which pattern an endpoint uses, and a real example from an SDK Scalar generates. We make an SDK generator, so we have an interest here. We link to other vendors' own documentation where we mention them.

**On this page**

- [The four pagination patterns](#the-four-pagination-patterns)
- [What an SDK adds on top of the API](#what-an-sdk-adds-on-top-of-the-api)
- [Auto-paginating iterators in TypeScript](#auto-paginating-iterators-in-typescript)
- [Auto-paginating iterators in Python](#auto-paginating-iterators-in-python)
- [Auto-paginating iterators in Go](#auto-paginating-iterators-in-go)
- [How OpenAPI describes pagination](#how-openapi-describes-pagination)
- [A real example: the Warp TypeScript SDK](#a-real-example-the-warp-typescript-sdk)
- [Common mistakes](#common-mistakes)
- [Designing an API that paginates well in SDKs](#designing-an-api-that-paginates-well-in-sdks)
- [Frequently asked questions](#frequently-asked-questions)

## The four pagination patterns

Almost every paginated REST endpoint uses one of four patterns, or a small variation of one. The pattern decides what the client has to remember between requests and how it knows when to stop.

| Pattern | Request carries | Response carries | How the client knows it is done | Main weakness |
| --- | --- | --- | --- | --- |
| Offset and limit | `offset=200&limit=100` | Items, often a `total` | Offset reaches `total`, or a short or empty page | Rows inserted or deleted while paging shift the window, so items are skipped or repeated |
| Page number | `page=3&per_page=100` | Items, often `total_pages` | Page number reaches `total_pages`, or an empty page | Same drift problem as offset; deep pages are slow on many databases |
| Cursor | `cursor=eyJpZCI6...` or `after_id=usr_123` | Items plus a next cursor, often `has_more` | Cursor missing or `has_more` is `false` | Cannot jump to page 40; cursors can expire |
| Link header | Nothing extra; the client follows a URL | Items in the body, next URL in a `Link` header | No `rel="next"` link | The next URL lives outside the body, so typed clients often ignore it |

### Offset and limit

The client asks for a window: skip the first N rows and return the next M. It is the easiest pattern to implement on the server (`LIMIT 100 OFFSET 200` in SQL) and the easiest to understand. It is also the one that behaves worst under concurrent writes. If a record near the start of the list is deleted while you are on page three, every later record shifts back by one, and the record that was first on page four is now last on page three, which you already fetched. You skip it silently.

### Page number

A friendlier face on offset pagination: `page=3` with a page size is `offset = (page - 1) * size`. It carries the same drift problem. It is common in admin-style APIs where a person clicks through numbered pages, and it maps neatly onto a UI with page links.

### Cursor

The server hands back an opaque token that marks where the page ended, and the client sends it back to get the next one. Sometimes the token is a real opaque string. Sometimes it is simply the ID of the last item, as in `starting_after=cus_123` or `afterId=wrk_1234`. Cursor pagination is stable under inserts and deletes, because the next page is defined relative to a record rather than a row number, and it is cheap on the database because it can use an index seek. The cost is that you cannot jump to an arbitrary page, and some APIs expire cursors after a while. For SDKs, cursor pagination is the easiest pattern to wrap cleanly, because "is there a next cursor?" is an unambiguous stop condition.

### Link header

The server sends the next page's URL in an HTTP `Link` header, using the format defined in [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288):

```http
Link: <https://api.example.com/items?page=4>; rel="next", <https://api.example.com/items?page=9>; rel="last"
```

GitHub's REST API is a well-known example of this style ([GitHub docs](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)). It is elegant, because the client does not need to understand the paging scheme at all, only follow `rel="next"`. It is also the pattern generated SDKs tend to support least consistently, because the pagination state lives in a header rather than in the typed response body. We come back to that below, including a gap in Scalar's own generator.

## What an SDK adds on top of the API

Without SDK support, every caller writes some version of this loop, in every language, for every list endpoint:

```ts
// Hand-rolled cursor loop against the raw API
let cursor: string | undefined
do {
  const url = new URL('https://api.example.com/v1/customers')
  url.searchParams.set('limit', '100')
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const body = (await res.json()) as { data: { id: string }[]; next_cursor: string | null }
  for (const customer of body.data) {
    console.log(customer.id)
  }
  cursor = body.next_cursor ?? undefined
} while (cursor)
```

Nothing is wrong with that loop. The problem is that it is repeated in hundreds of codebases, each with its own small bug: forgetting to carry the original filters onto page two, forgetting `has_more`, retrying page seven from the beginning after a 429. A well-built SDK moves all of that into one place and gives the caller three things:

1. **An item iterator.** One loop that yields items across every page. This is what most callers want.
2. **A page iterator, or page-at-a-time methods.** For batch jobs that checkpoint after each page, or UIs that show one page and a "next" button.
3. **The original page metadata.** Fields such as `total` or `has_more` stay readable next to the items.

The SDK also carries everything else from the first request onto later pages, including filters, headers, and timeouts, and it runs each page request through the same retry and error handling as any other call. That last point matters more than it looks: see [SDK error handling](/learn/sdk/sdk-error-handling) for what a generated client does when page 40 of 60 gets a 503.

## Auto-paginating iterators in TypeScript

The idiomatic TypeScript shape is an object that is both a promise for the first page and an async iterable over every item. `for await` then walks the whole collection:

```ts
import Acme from 'acme'

const client = new Acme()

// Every invoice for one customer, across however many pages that takes
for await (const invoice of client.invoices.list({ customer: 'cus_123', limit: 100 })) {
  console.log(invoice.id, invoice.amountDue)
}
```

If you need page boundaries, `await` the call instead and work with the page object:

```ts
let page = await client.invoices.list({ customer: 'cus_123', limit: 100 })
console.log(page.total) // response fields are still there

while (page.hasNextPage()) {
  page = await page.getNextPage()
  await saveCheckpoint(page)
}
```

Those method names, `hasNextPage()`, `getNextPage()`, and `iterPages()`, are what Scalar's TypeScript target generates, documented in the [pagination guide](/products/sdk-generator/pagination). Other generators use similar names. The pattern underneath is plain JavaScript: an object with a `[Symbol.asyncIterator]` method. If you are writing a thin client by hand, a small async generator gets you most of the way:

```ts
type Page<T> = { data: T[]; next_cursor: string | null }

async function* paginate<T>(fetchPage: (cursor?: string) => Promise<Page<T>>): AsyncGenerator<T> {
  let cursor: string | undefined
  do {
    const page = await fetchPage(cursor)
    yield* page.data
    cursor = page.next_cursor ?? undefined
  } while (cursor)
}

for await (const customer of paginate((cursor) => api.listCustomers({ cursor, limit: 100 }))) {
  console.log(customer.id)
}
```

One advantage of the async-iterator shape is that breaking out of the loop stops fetching. If you only need the first matching record, `break` after you find it, and no further pages are requested.

## Auto-paginating iterators in Python

Python SDKs usually offer the same idea in two flavours, because most Python SDKs ship a synchronous and an asynchronous client:

```python
from acme import Acme, AsyncAcme

client = Acme()

# Synchronous: a plain for loop walks every page
for invoice in client.invoices.list(customer="cus_123", limit=100):
    print(invoice.id, invoice.amount_due)

# Page at a time, for checkpointing
page = client.invoices.list(customer="cus_123", limit=100)
while page.has_next_page():
    page = page.get_next_page()
    save_checkpoint(page)
```

```python
import asyncio

async def main() -> None:
    client = AsyncAcme()
    async for invoice in client.invoices.list(customer="cus_123", limit=100):
        print(invoice.id)

asyncio.run(main())
```

The generated page classes follow the name of the pagination scheme, so a scheme called `cursorPage` produces `SyncCursorPage` and `AsyncCursorPage` in Scalar's Python output. If you are writing Python by hand, a generator function with `yield from page["data"]` gives you the item iterator, and the standard library's `itertools.islice` lets callers take the first N items without fetching more pages than they need.

## Auto-paginating iterators in Go

Go does not have a `for await`, and until range-over-func iterators arrived in Go 1.23, the idiomatic shape was the one the standard library uses for `bufio.Scanner` and `sql.Rows`: `Next()`, `Current()`, and `Err()`.

```go
iter := client.Invoices.ListAutoPaging(ctx, acme.InvoiceListParams{
	Customer: acme.String("cus_123"),
	Limit:    acme.Int(100),
})
for iter.Next() {
	invoice := iter.Current()
	fmt.Println(invoice.ID, invoice.AmountDue)
}
if err := iter.Err(); err != nil {
	return err
}
```

The important line is the last one. `Next()` returns `false` both when the collection is exhausted and when a request fails, so a Go caller who forgets to check `Err()` treats a network failure as "no more results". This is the Go equivalent of the silent-truncation bug from the hand-rolled loop, and it is worth a linter rule in any codebase that consumes a paginating Go SDK.

For page-at-a-time work, the plain `List` method returns a page with `GetNextPage()`. Scalar's Go target generates both, and the [Go SDK page](/sdk/go) shows real output from Warp's Go module. The `context.Context` passed to `ListAutoPaging` covers every page request, so cancelling it stops the iteration.

## How OpenAPI describes pagination

Here is the uncomfortable fact for anyone generating SDKs: **OpenAPI has no standard way to say that an operation is paginated.** An OpenAPI document can describe a `cursor` query parameter and a `next_cursor` response field precisely, but nothing in the [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.1.html) links the two or says "send this value back to get the next page". The `links` object comes close in spirit, since it can describe how a value from one response feeds a parameter of another operation, but it was designed for navigation between operations, and generators do not use it for pagination.

So every generator fills the gap its own way, with a vendor extension in the document, a separate configuration file, or both. The extensions below exist and are documented by the vendors that own them. There is no widely adopted neutral `x-pagination` extension, whatever you may read elsewhere; if you see one in a document, it was invented by the team or tool that wrote it.

- **`x-speakeasy-pagination`** (Speakeasy), placed on an operation, with `offsetLimit`, `cursor`, and `url` types and JSONPath expressions for the results and next values. See [Speakeasy's pagination docs](https://www.speakeasy.com/docs/sdks/customize/runtime/pagination).
- **`x-fern-pagination`** (Fern), placed on an operation, supporting offset, cursor, URI, and path schemes. See [Fern's auto-pagination docs](https://buildwithfern.com/learn/sdks/deep-dives/auto-pagination).
- **`x-scalar-pagination`** (Scalar), either an array of named schemes at the document root, or a scheme name, `false`, or an inline scheme on an operation. See the [OpenAPI extensions reference](/products/sdk-generator/openapi-extensions).
- **Stainless** configured pagination mainly in `stainless.yml` rather than in the document, and [auto-paginated methods named `list_*` by convention](https://www.stainless.com/docs/sdks/configure/pagination/). Its hosted generator is winding down; see [our write-up of the wind-down](/resources/stainless-wind-down).

Here is a valid OpenAPI 3.1 fragment using Scalar's extension for an API that paginates by the last item's ID and reports `hasMore`:

```yaml
openapi: 3.1.0
info:
  title: Acme API
  version: 1.0.0
x-scalar-pagination:
  - name: afterIdPage
    type: cursorId
    request:
      afterId:
        type: cursorId
        param: afterId
      limit:
        type: limit
        param: limit
    response:
      items:
        type: items
        property: data
        itemCursor: [id]
      hasMore:
        type: hasMore
        property: hasMore
paths:
  /v1/customers:
    get:
      operationId: listCustomers
      x-scalar-pagination: afterIdPage
      parameters:
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 100 }
        - name: afterId
          in: query
          schema: { type: string }
      responses:
        '200':
          description: A page of customers
          content:
            application/json:
              schema:
                type: object
                required: [data, hasMore]
                properties:
                  data:
                    type: array
                    items:
                      type: object
                      required: [id]
                      properties:
                        id: { type: string }
                  hasMore: { type: boolean }
```

The same scheme can live in the SDK configuration file instead of the document, which is the better home when the OpenAPI document is public and consumed by other tools that do not care about SDK hints. The [SDK generation guide](/learn/sdk/generate-sdk-from-openapi) covers that trade-off.

A design choice worth copying from whichever tool you use: **declare pagination, do not infer it.** A generator that guesses from parameter names will eventually decide that a `page` parameter on a document-rendering endpoint is pagination, or that a `next` field on a workflow object is a cursor. Scalar's generator refuses to guess for exactly that reason; a method paginates only when it names a scheme. If you are moving between generators, Scalar also reads `x-speakeasy-pagination`, `x-fern-pagination`, and Stainless's pagination hints, which the [extensions reference](/products/sdk-generator/openapi-extensions) lists.

## A real example: the Warp TypeScript SDK

[Warp](/customers/warp), the HR and payroll platform, publishes its TypeScript SDK on GitHub. The [`scalar-generated` branch of TeamWarp/warp-sdk-typescript](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated) is generated by Scalar. The package is `warp-hr`, and the default export is the client class, `Warp` (not `WarpAPI`).

Warp's list endpoints use cursor pagination by ID. Listing workers accepts `limit`, `afterId`, and `beforeId`, and returns `hasMore`, `count`, and `data`. As of the build we read in September 2026, those list methods are **not** bound to a pagination scheme, so `client.workers.list()` returns one typed page rather than an iterator. That is a useful example precisely because it shows what a caller has to write when pagination is not declared:

```ts
import Warp from 'warp-hr'

const client = new Warp() // reads WARP_API_KEY from the environment

async function* allWorkers(
  params: Omit<Warp.WorkerListParams, 'afterId'>,
): AsyncGenerator<Warp.WorkerListResponse.Data> {
  let afterId: string | undefined
  while (true) {
    const page = await client.workers.list({ ...params, afterId })
    yield* page.data
    const last = page.data.at(-1)
    if (!page.hasMore || !last) return
    afterId = last.id
  }
}

for await (const worker of allWorkers({ limit: '100', statuses: ['active'] })) {
  console.log(worker.id, worker.position)
}
```

Two details are worth noticing. First, `limit` is typed as a string. The SDK follows the OpenAPI document, and a limit declared as a string in the document becomes a string in every generated language. That is an API description fix, not an SDK fix, and a good reason to [lint your OpenAPI document](/learn/openapi/spectral-rules) before generating. Second, the loop checks both `hasMore` and that the page had a last item, because a `cursorId` scheme has nothing to continue from on an empty page.

Declaring the `afterIdPage` scheme from the previous section against these operations would replace that helper with a generated one, and the call site would become `for await (const worker of client.workers.list({ limit: '100' }))`. The generated page would still expose `hasMore` and `count`. That is the whole point of declared pagination: the API does not change, the document gains one extension, and every caller in every language loses a loop. You can see the declared version in Warp's Go module, where time-off assignments come back through `ListAssignmentsAutoPaging` and a `Next()` loop; the [Go SDK page](/sdk/go) walks through that output.

## Common mistakes

These show up in hand-written clients and in generated SDKs built from vague API descriptions alike.

- **Dropping filters on page two.** The first request has `status=active`, and the next-page request only carries the cursor. The iterator quietly switches to listing everything. A generated iterator should reuse every parameter from the first request and change only the paging ones.
- **Treating a short page as the last page.** Many APIs return fewer items than `limit` on a page that is not the last one, for example when a filter is applied after the database query. Use the API's explicit signal (`has_more`, a missing cursor, `total`) where one exists.
- **Treating an empty page as an error.** An empty first page is a valid empty collection. An empty later page usually means the end, which is why Scalar's generator stops on an empty page unless the scheme sets `continueOnEmptyItems`.
- **Ignoring the iterator's error channel.** In Go that is `iter.Err()`. In TypeScript and Python, it is an exception thrown from inside the loop body, which means a `try` around the whole loop, not around the first call.
- **Using offset pagination for sync jobs.** If a job exports a table that changes while it runs, offset pagination will skip or duplicate rows. Cursor pagination, ideally ordered by an immutable key, avoids that.
- **Loading everything into memory.** `Array.fromAsync(iterator)` or `list(iterator)` on a million-row collection is a memory problem. Stream, and checkpoint by page.
- **Assuming the page size you asked for is the page size you get.** Servers clamp `limit` to their own maximum. An offset iterator that adds your requested `limit` rather than the number of items actually returned will skip records. Scalar's offset strategy advances by the limit the caller sent, falling back to the items returned, so send a limit within the server's maximum.

## Designing an API that paginates well in SDKs

If you own the API, a few choices make pagination easy to generate and hard to misuse.

1. **Prefer cursor pagination for anything that changes.** Offset is fine for small, stable collections.
2. **Put the pagination state in the response body.** A `next_cursor` or `has_more` field in JSON is visible to every generator and every typed client. A `Link` header is correct HTTP, but many generated SDKs, including Scalar's today, do not advance pages from a header. Our [pagination guide](/products/sdk-generator/pagination) is explicit that a scheme whose only cursor lives in a header stops after the first page, and that it is a gap we are tracking. If you can, send both.
3. **Return an explicit "more" signal.** `has_more: false` is unambiguous. Inferring the end from an empty page costs one extra request per collection.
4. **Use the same shape everywhere.** One envelope (`data`, `next_cursor`, `has_more`) across every list endpoint means one pagination scheme, one generated page class, and one thing for developers to learn.
5. **Describe it in the OpenAPI document.** Use named component schemas for the page envelope, and add the pagination extension your generator reads, or its configuration equivalent. The [OpenAPI documentation guide](/learn/openapi/openapi-documentation) covers the rest of what a generator needs from the document.
6. **Document the maximum page size** with `maximum` on the `limit` parameter schema, so both the SDK types and your [API reference](/learn/openapi/what-is-an-api-reference) show it.

## Frequently asked questions

<scalar-detail title="What is the difference between cursor and offset pagination?">
Offset pagination asks for "skip N, take M", so the page is defined by a row position. Cursor pagination asks for "the items after this marker", so the page is defined by a record. Cursor pagination stays correct when rows are inserted or deleted during paging and is usually faster on large tables. Offset pagination lets you jump to any page, which cursor pagination cannot.
</scalar-detail>

<scalar-detail title="Does OpenAPI have a standard pagination field?">
No. OpenAPI 3.0, 3.1, and 3.2 can describe the parameters and response fields involved, but nothing in the specification says an operation is paginated or which field feeds the next request. Generators use vendor extensions such as `x-speakeasy-pagination`, `x-fern-pagination`, and `x-scalar-pagination`, or their own configuration files.
</scalar-detail>

<scalar-detail title="How do I paginate with for await in TypeScript?">
Use an object that implements `Symbol.asyncIterator`. Generated SDKs return one from list methods, so `for await (const item of client.things.list())` walks every page. Writing it by hand takes a few lines with an `async function*` that fetches a page, uses `yield*` on its items, and loops while a next cursor exists.
</scalar-detail>

<scalar-detail title="Can a generated SDK follow Link header pagination?">
Some can, and support varies by generator and by language. Scalar's generator reads pagination from the response body today; a scheme whose only cursor is in a `Link` header stops after the first page. If you design the API, return the next cursor in the body as well.
</scalar-detail>

<scalar-detail title="What happens if a page request fails halfway through iteration?">
In a well-built SDK, each page request goes through the normal retry logic first, so a 429 or 503 is retried with backoff. If retries are exhausted, the iterator raises the typed error from inside your loop (or returns it from `Err()` in Go). Items already yielded stay processed, so checkpoint by page if restarting from the beginning is expensive.
</scalar-detail>

<scalar-detail title="Should the SDK fetch pages in parallel?">
Usually not. Cursor pagination is inherently sequential, because each page's cursor comes from the previous response. Offset pagination can be parallelized, but doing it inside an SDK iterator makes rate limits and ordering harder to reason about. Leave parallelism to the caller.
</scalar-detail>

## Related

- **Learn:** [SDK error handling](/learn/sdk/sdk-error-handling) · [How to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [What is an SDK?](/learn/sdk/what-is-an-sdk) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [SDK Generator pagination guide](/products/sdk-generator/pagination) · [TypeScript SDK generator](/sdk/typescript) · [Python SDK generator](/sdk/python)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — declare pagination once and get idiomatic iterators in TypeScript, Python, Go, and every other target.
