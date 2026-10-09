# SDK error handling: typed errors, retries, idempotency, and timeouts

*Last updated: September 2026*

SDK error handling is how a client library turns everything that can go wrong with an API call (an error status, a dropped connection, a timeout, a rate limit) into errors the caller can recognise and act on, and how it recovers on its own from the failures that are safe to retry. A good SDK makes the common cases boring: a 404 is a `NotFoundError` you can catch by type, a 503 is retried with backoff before you ever see it, and a retried `POST` does not charge a customer twice.

Getting this right matters more than almost any other SDK feature, because error paths are where integrations fail in production and where hand-written code is least tested. This guide covers the pieces that make it work, with the real error module from a Scalar-generated SDK as the running example: typed error hierarchies in TypeScript, Python, and Go, which failures to retry and how to back off, idempotency keys, timeouts, and how an OpenAPI document tells a generator what errors an operation can return.

We make an SDK generator, so we have an interest here. Everything below also applies to SDKs you write by hand, and we link to other vendors' own documentation where we mention them.

**On this page**

- [Three kinds of failure](#three-kinds-of-failure)
- [A real error hierarchy: Warp's TypeScript SDK](#a-real-error-hierarchy-warps-typescript-sdk)
- [Catching errors in TypeScript](#catching-errors-in-typescript)
- [Catching errors in Python](#catching-errors-in-python)
- [Handling errors in Go](#handling-errors-in-go)
- [Retries and backoff](#retries-and-backoff)
- [Idempotency keys](#idempotency-keys)
- [Timeouts and cancellation](#timeouts-and-cancellation)
- [Describing errors in OpenAPI](#describing-errors-in-openapi)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## Three kinds of failure

Before any class names, it helps to separate failures by where they happen, because the right response is different for each.

1. **The server answered with an error.** There is an HTTP status, headers, and usually a body explaining what went wrong. A 400 or 422 means the request was wrong and resending it will not help. A 401 or 403 means credentials or permissions. A 404 means the resource does not exist. A 429 or a 5xx usually means "try again later".
2. **There was no usable answer.** DNS failed, the TLS handshake failed, the connection was reset, or the request timed out. There is no status code to inspect. Some of these are safe to retry, and some leave you unsure whether the server acted on the request.
3. **The client stopped the request.** The caller cancelled it with an `AbortSignal`, a Python task cancellation, or a Go `context`. This is not an API failure at all, and it should never be retried or reported as one.

An SDK that throws a single generic `Error("Request failed")` for all three forces every caller to parse strings. An SDK that models them as distinct types lets callers write `catch (err) { if (err instanceof RateLimitError) ... }` and move on.

## A real error hierarchy: Warp's TypeScript SDK

[Warp](/customers/warp) publishes the TypeScript SDK that Scalar generates for its HR and payroll API on the [`scalar-generated` branch of TeamWarp/warp-sdk-typescript](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated). The package is `warp-hr` and its default export is the `Warp` client class. Its whole error model lives in one file, [`src/core/error.ts`](https://github.com/TeamWarp/warp-sdk-typescript/blob/scalar-generated/src/core/error.ts), and it is short enough to read in a few minutes. The shape, as of the build we read in September 2026:

```text
WarpError                         every error the SDK throws
└── APIError                      has status, headers, and the parsed error body
    ├── APIUserAbortError         the caller aborted the request
    ├── APIConnectionError        no response (network, DNS, TLS)
    │   └── APIConnectionTimeoutError
    ├── BadRequestError           400
    ├── AuthenticationError       401
    ├── PermissionDeniedError     403
    ├── NotFoundError             404
    ├── ConflictError             409
    ├── UnprocessableEntityError  422
    ├── RateLimitError            429
    └── InternalServerError       500 and above
```

A few design decisions in that file are worth copying, whether you generate your SDK or write it yourself.

**One root class per SDK.** Everything extends `WarpError`, so an application that calls five different APIs can tell "this came from the Warp SDK" apart from everything else with one `instanceof` check.

**Status errors carry the evidence.** `APIError` exposes `status`, `headers`, and `error`, the parsed JSON body. The message is built from the body's `message` field when there is one, then the whole body, then a fallback, and it is prefixed with the status code. That means a log line reads `404 Worker not found` rather than `Request failed`.

**Status codes map to classes in one place.** A static `APIError.generate()` method picks the subclass from the status. A missing status or missing headers means there was no real response, so it returns an `APIConnectionError` instead. Any status without its own class (a 402 or 418, say) still becomes a plain `APIError`, so nothing falls through untyped.

**Every class sets its own name.** The last block of the file assigns `prototype.name` for each class. Without it, a subclass of `Error` reports its name as `Error` in many runtimes, and your logs, `switch (err.name)` statements, and error tracker grouping all lose the distinction the classes were created for. A comment in the generated file explains exactly that.

The same hierarchy appears in Warp's Python SDK under Python naming, which is the point of generating both from one API description: a 429 is a `RateLimitError` in both languages.

| Situation | TypeScript class (`warp-hr`) | Python class (`warp`) | Go (Warp module) | Retried by default? |
| --- | --- | --- | --- | --- |
| No response: network, DNS, TLS | `APIConnectionError` | `APIConnectionError` | Transport error returned from the call | Yes |
| Request timed out | `APIConnectionTimeoutError` | `APITimeoutError` | Deadline error from the request context | Yes |
| Caller aborted | `APIUserAbortError` | Task cancellation, not an SDK error | `context.Canceled` | No |
| 400 | `BadRequestError` | `BadRequestError` | `*sdk.Error` with `StatusCode` 400 | No |
| 401 / 403 | `AuthenticationError` / `PermissionDeniedError` | `AuthenticationError` / `PermissionDeniedError` | `*sdk.Error` | No |
| 404 | `NotFoundError` | `NotFoundError` | `*sdk.Error` | No |
| 408 | `APIError` | `APIStatusError` | `*sdk.Error` | Yes |
| 409 | `ConflictError` | `ConflictError` | `*sdk.Error` | Yes |
| 422 | `UnprocessableEntityError` | `UnprocessableEntityError` | `*sdk.Error` | No |
| 429 | `RateLimitError` | `RateLimitError` | `*sdk.Error` | Yes, honouring `Retry-After` |
| 500 and above | `InternalServerError` | `InternalServerError` | `*sdk.Error` | Yes |

The TypeScript and Python columns come from Warp's `scalar-generated` branches ([TypeScript](https://github.com/TeamWarp/warp-sdk-typescript/tree/scalar-generated), [Python](https://github.com/TeamWarp/warp-sdk-python/tree/scalar-generated)). The Go column follows the [Go SDK page](/sdk/go), which shows the Warp module returning a single `*sdk.Error` type that you inspect by status code, the idiomatic Go approach. The retry column describes the default retry policy covered below.

## Catching errors in TypeScript

Catch the most specific classes first and let everything else propagate:

```ts
import Warp, {
  APIConnectionTimeoutError,
  APIError,
  NotFoundError,
  RateLimitError,
} from 'warp-hr'

const client = new Warp() // reads WARP_API_KEY from the environment

async function findWorker(id: string): Promise<Warp.WorkerGetResponse | null> {
  try {
    return await client.workers.get(id, { timeout: 10_000, maxRetries: 4 })
  } catch (err) {
    if (err instanceof NotFoundError) {
      // An expected outcome in this flow: treat it as "no such worker"
      return null
    }
    if (err instanceof RateLimitError) {
      // Retries were already attempted and exhausted by the time this is thrown
      console.warn('Still rate limited; retry-after =', err.headers.get('retry-after'))
    } else if (err instanceof APIConnectionTimeoutError) {
      console.warn('Timed out after retries')
    } else if (err instanceof APIError) {
      console.error(err.status, err.error) // parsed error body from the API
    }
    throw err
  }
}
```

Two things are easy to miss. First, by the time a `RateLimitError` or `InternalServerError` reaches your `catch`, the SDK has already retried it. Your handler is dealing with a persistent failure, not a blip, so adding your own immediate retry loop on top usually just multiplies traffic. Second, `err.error` is the parsed body typed loosely, because an API's error bodies are often less consistently described than its success bodies. If your API describes its errors precisely in OpenAPI, you can narrow it safely; see [Describing errors in OpenAPI](#describing-errors-in-openapi).

TypeScript cannot declare which errors a function throws, so the class hierarchy is the whole contract. That is another reason stable, well-named error classes matter more in TypeScript than in languages with checked exceptions.

## Catching errors in Python

Warp's Python SDK has the same tree with Python conventions: `WarpError`, then `APIError`, which splits into `APIStatusError` (a response with a 4xx or 5xx status), `APIConnectionError` (with `APITimeoutError` beneath it), and `APIResponseValidationError` for a response that did not match the expected schema. The status-specific classes such as `NotFoundError` and `RateLimitError` subclass `APIStatusError`.

```python
import warp
from warp import Warp

client = Warp(timeout=20.0, max_retries=3)

try:
    worker = client.workers.retrieve("wrk_1234")
except warp.NotFoundError:
    worker = None
except warp.RateLimitError as err:
    print("Still rate limited:", err.response.headers.get("retry-after"))
    raise
except warp.APITimeoutError:
    print("Timed out after retries")
    raise
except warp.APIStatusError as err:
    print(err.status_code, err.body)
    raise
```

Order matters in Python in the same way it does in TypeScript: `except` clauses are tried top to bottom, and `APITimeoutError` is a subclass of `APIConnectionError`, which is a subclass of `APIError`. Put the base classes last, or they swallow the specific ones.

Method names such as `retrieve` come from the resource configuration and the `operationId` values in the document, so check the generated `api.md` in your own SDK for the exact names.

## Handling errors in Go

Go SDKs return errors as values. The idiomatic pattern is one exported error type carrying the status, headers, and raw body, extracted with `errors.As`:

```go
assignment, err := client.TimeOff.RetrieveAssignment(ctx, assignmentID)
if err != nil {
	var apiErr *sdk.Error
	if errors.As(err, &apiErr) {
		switch apiErr.StatusCode {
		case http.StatusNotFound:
			return nil, nil
		case http.StatusTooManyRequests:
			return nil, fmt.Errorf("rate limited after retries: %w", err)
		}
		log.Printf("warp API error %d: %s", apiErr.StatusCode, apiErr.RawJSON())
	}
	return nil, err
}
return assignment, nil
```

A single type with a status field, rather than one type per status, fits Go better: a `switch` on an integer is idiomatic, and wrapping with `%w` keeps the original error available up the call stack. Deadlines and cancellation come from the `context.Context`, so a timeout surfaces as `context.DeadlineExceeded` somewhere in the chain, which you check with `errors.Is`. The [Go SDK page](/sdk/go) shows the Warp module's error type and options in more detail.

Other languages map the same three failure kinds onto their own idioms: exception hierarchies in Java, Kotlin, C#, PHP, and Ruby, and a `Result` with an error enum in Rust. Java, Kotlin, and Ruby are generally available; Scalar generates the others as experimental targets; see the per-language pages from [TypeScript](/sdk/typescript) onwards for what each one looks like.

## Retries and backoff

Retrying is the SDK's most useful error-handling feature and its most dangerous one. Done well, it hides transient failures from every caller. Done badly, it turns a brief outage into a retry storm that keeps the API down.

### What to retry

The generated Warp TypeScript client's `shouldRetry` method, as of September 2026, retries:

- **Connection failures and timeouts**, where no response arrived.
- **408 Request Timeout.**
- **409 Conflict**, which the generated code comments as covering lock timeouts.
- **429 Too Many Requests.**
- **Any status of 500 or above.**

Everything else, including 400, 401, 403, 404, and 422, fails immediately, because resending the same request will get the same answer. The server can override the decision either way with an `x-should-retry: true` or `x-should-retry: false` response header. That is a non-standard header, and the code says so, but it is a useful escape hatch when the server knows better than a status-code rule, for example a 500 that is actually permanent.

Retrying 409 is a judgement call worth knowing about. If your API uses 409 for genuine conflicts, such as "this email is already registered", retrying cannot succeed, and each retry just adds latency before the `ConflictError` arrives. You can lower `maxRetries` per request for those calls.

### How long to wait

When the server says how long to wait, the Warp client does what it says. It reads `retry-after-ms` first, then the standard [`Retry-After`](https://www.rfc-editor.org/rfc/rfc9110#field.retry-after) header in either seconds or HTTP-date form. It ignores values that are missing, invalid, in the past, or longer than 60 seconds, so a malformed header cannot stall a request indefinitely.

Otherwise it uses exponential backoff with jitter. The first retry waits about 0.5 seconds, each later one doubles, capped at 8 seconds, and every delay is reduced by a random amount of up to 25 percent:

```ts
// The shape of the default backoff in the generated Warp client
const initialRetryDelay = 0.5 // seconds
const maxRetryDelay = 8.0
const sleepSeconds = Math.min(initialRetryDelay * 2 ** retryNumber, maxRetryDelay)
const jitter = 1 - Math.random() * 0.25
const delayMs = sleepSeconds * jitter * 1000
```

The jitter is the part people leave out of hand-written clients, and it is the part that matters most at scale. Without it, every client that failed at the same moment retries at the same moment, and the API sees the same spike again 0.5 seconds later.

### Configuring retries

The client default is two retries (`maxRetries: 2`), which you can change on the client or per request. In the SDK configuration, `clientSettings.defaultRetries` sets the generated default, and the `x-scalar-retries` extension sets it per operation. Both are in the [configuration reference](/products/sdk-generator/configuration/overview) and the [OpenAPI extensions reference](/products/sdk-generator/openapi-extensions). Other generators use their own extensions: Speakeasy documents [`x-speakeasy-retries`](https://www.speakeasy.com/docs/sdks/customize/runtime/retries) at the document root or on an operation, with a backoff strategy and a list of status codes, and Fern documents [retries with backoff](https://buildwithfern.com/learn/sdks/deep-dives/retries-with-backoff) in its SDK docs.

## Idempotency keys

Retrying a `GET` is harmless. Retrying a `POST` that creates a payment is not, if the first attempt reached the server and only the response was lost. The client cannot tell "the request never arrived" from "the request succeeded and the reply vanished". An idempotency key solves that: the client sends a unique key with the request, and the server remembers the result for that key, so a retry with the same key returns the original result instead of acting twice.

The convention is an `Idempotency-Key` request header. The IETF HTTPAPI working group has worked on standardising it as [draft-ietf-httpapi-idempotency-key-header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), which has not been published as an RFC. Plenty of payment and infrastructure APIs already use the header under that name or a close variant.

The generated Warp client shows how an SDK should handle it:

- When the API declares an idempotency header, every non-`GET` request gets one. If the caller does not pass `idempotencyKey` in the request options, the client generates a key of the form `scalar-node-retry-<uuid>`.
- The key is created once and written back to the request options, so **every retry of that request sends the same key**. A key that changed on each retry would defeat the purpose.
- A paginated list call gives each page its own key, because each page is a separate request. The [pagination guide](/products/sdk-generator/pagination) documents this.
- The client also sends an `X-Scalar-Retry-Count` header, so the server can tell a first attempt from a retry in its logs.

One honest caveat: the idempotency behaviour only switches on when the API description says which header the API expects. In the Warp TypeScript build we read, no idempotency header is configured, so the `idempotencyKey` request option is accepted but no header is sent. That is correct: an SDK should not invent a header the server ignores. If your API supports idempotency, declare it in the SDK configuration's client settings. Fern documents an equivalent with [`x-fern-idempotency-headers` and `x-fern-idempotent`](https://buildwithfern.com/learn/sdks/deep-dives/idempotency), which Scalar also reads when importing a Fern project.

## Timeouts and cancellation

A timeout is a promise to the caller about the longest they will wait. In a retrying client, it is worth being precise about what that promise covers.

The Warp TypeScript client defaults to a 60-second timeout, configurable on the client (`timeout`) or per request. The timeout applies **to each attempt**, and the generated code says so in its doc comment: timeouts are retried by default, so the worst case is much longer than the timeout. With the defaults of 60 seconds and two retries, a request that times out every time takes about three minutes before the caller sees an `APIConnectionTimeoutError`: three 60-second attempts plus roughly 1.5 seconds of backoff.

For anything user-facing, set both numbers deliberately:

```ts
// A search box: fail fast, retry once
const results = await client.workers.list(
  { limit: '20', workEmail: query },
  { timeout: 3_000, maxRetries: 1 },
)
```

```ts
// Let the user cancel: an aborted request throws APIUserAbortError and is never retried
const controller = new AbortController()
cancelButton.onclick = () => controller.abort()
const page = await client.workers.list({ limit: '100' }, { signal: controller.signal })
```

Python SDKs usually take a timeout in seconds, often with separate connect and read limits; Warp's Python client defaults to 60 seconds overall with 5 seconds to connect. Go SDKs usually take the deadline from the `context.Context`, which composes naturally with server request deadlines, plus an option such as `option.WithRequestTimeout` for a per-attempt limit.

## Describing errors in OpenAPI

A generator can only type what the OpenAPI document describes. Most API descriptions document the `200` response carefully and leave errors as an afterthought, which is why so many SDKs expose error bodies as `unknown`.

Describe error responses explicitly, and share one error schema:

```yaml
openapi: 3.1.0
info:
  title: Acme API
  version: 1.0.0
paths:
  /v1/invoices/{id}:
    get:
      operationId: getInvoice
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: The invoice
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Invoice' }
        '404':
          $ref: '#/components/responses/Problem'
        '429':
          $ref: '#/components/responses/Problem'
        default:
          $ref: '#/components/responses/Problem'
components:
  responses:
    Problem:
      description: An error, described with RFC 9457 problem details
      headers:
        Retry-After:
          description: Seconds to wait before retrying, sent with 429 and 503
          schema: { type: integer }
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Problem' }
  schemas:
    Problem:
      type: object
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        instance: { type: string }
    Invoice:
      type: object
      required: [id]
      properties:
        id: { type: string }
```

The `Problem` schema follows [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457), which defines a standard JSON shape for HTTP API errors and the `application/problem+json` media type. You do not have to use it, but using any single consistent error shape across every operation is what lets an SDK extract a readable message and lets callers write one error handler. Scalar's SDK configuration has an `errors` block for telling the generated runtime where your error message lives, listed in the [configuration reference](/products/sdk-generator/configuration/overview).

Documenting the statuses also feeds your docs. Warp's generated README lists the documented error statuses for its operations, and the same responses show up in the [API reference](/learn/openapi/what-is-an-api-reference) rendered from the document. The [OpenAPI documentation guide](/learn/openapi/openapi-documentation) covers response descriptions in more depth.

## Common mistakes

- **Catching the base class first.** `catch (err) { if (err instanceof APIError) ... else if (err instanceof NotFoundError) ... }` never reaches the second branch. Specific classes first, always.
- **Retrying on top of the SDK's retries.** A wrapper that retries three times around an SDK that retries twice sends up to nine requests per call. Configure the SDK instead.
- **Retrying non-idempotent requests without a key.** If the API supports idempotency keys, declare the header so the SDK sends one. If it does not, consider `maxRetries: 0` for calls that create money movements or send messages.
- **Treating 404 as exceptional when it is expected.** "Does this user exist?" is a normal question. Convert `NotFoundError` to a `null` or `None` at the boundary rather than letting it reach an error tracker.
- **Logging the whole error object.** Error objects carry request details and headers. Log the status, the error name, and the message, and check what else you are about to ship to a log pipeline.
- **Ignoring `Retry-After` in hand-written clients.** It is the server telling you exactly how long to wait. Waiting less gets you another 429.
- **Setting a timeout without accounting for retries.** A 30-second timeout with three retries can hold a request handler for two minutes.
- **Swallowing errors inside pagination loops.** An iterator that stops on the first error looks exactly like an iterator that ran out of items. See [SDK pagination](/learn/sdk/sdk-pagination) for the language-specific traps.

## Frequently asked questions

<scalar-detail title="Which HTTP status codes should an SDK retry?">
Connection failures, timeouts, 408, 429, and 5xx responses are the standard set. Some SDKs, including Scalar-generated ones, also retry 409 to cover lock timeouts. Never retry 400, 401, 403, 404, or 422 automatically, because the same request will fail the same way. Let the server override the rule with a header when it knows better.
</scalar-detail>

<scalar-detail title="What is exponential backoff with jitter?">
Exponential backoff doubles the wait after each failed attempt, for example 0.5, 1, 2, and 4 seconds, up to a cap. Jitter randomises each wait a little. Without jitter, many clients that failed together retry together and hit the API with the same spike again. With it, their retries spread out.
</scalar-detail>

<scalar-detail title="What is an idempotency key and when do I need one?">
It is a unique value sent with a request, usually in an `Idempotency-Key` header, that lets the server recognise a retry of a request it already processed and return the original result instead of acting twice. You need one whenever a non-`GET` request is retried and acting twice would be harmful, such as payments, orders, or sent messages.
</scalar-detail>

<scalar-detail title="Should an SDK throw exceptions or return errors?">
Follow the language. TypeScript, Python, Java, C#, Ruby, and PHP developers expect exceptions with a class per failure kind. Go developers expect an error value they inspect with `errors.As`, and Rust developers expect a `Result`. A generator that produces the same model in every language will feel foreign in most of them.
</scalar-detail>

<scalar-detail title="Does the timeout include retries?">
In most generated SDKs, including Scalar's, the timeout applies to each attempt, not to the whole call. The total time can be several times the timeout. If you need a hard ceiling, use an `AbortSignal` in TypeScript or a context deadline in Go.
</scalar-detail>

<scalar-detail title="How do I get typed error bodies in my SDK?">
Describe every error response in the OpenAPI document, ideally sharing one schema such as RFC 9457 problem details, and tell the generator where the message field lives. Generators can only type what the API description declares.
</scalar-detail>

## Related

- **Learn:** [SDK pagination](/learn/sdk/sdk-pagination) · [How to generate an SDK from OpenAPI](/learn/sdk/generate-sdk-from-openapi) · [SDK vs API](/learn/sdk/sdk-vs-api) · [Build vs buy an SDK](/learn/sdk/build-vs-buy-sdk)
- **Docs:** [SDK Generator configuration](/products/sdk-generator/configuration/overview) · [Python SDK generator](/sdk/python)
- **Product:** [Scalar SDK Generator](/products/sdk-generator) — typed errors, retries with backoff, idempotency keys, and timeouts generated from your OpenAPI document.
