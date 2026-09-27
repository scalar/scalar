# API mocking: how an OpenAPI mock server works

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

API mocking means running a fake version of an API that answers requests with realistic responses, so that frontend code, tests, demos and integrations can be built before the real backend exists or without depending on it. An OpenAPI mock server is the most practical way to do it: it reads your OpenAPI document and serves every endpoint described there, returning the examples and schemas you already wrote.

The appeal is simple. The contract is already written down, so the mock is free. Change the document and the mock changes with it. No one has to hand-maintain a second copy of the API in a pile of JSON fixtures.

This guide explains how OpenAPI mock servers pick their responses, the difference between static, dynamic and stateful mocks, and how to run one in a terminal, in a test suite, and in Docker, with examples you can copy.

**On this page**

- [The short answer](#the-short-answer)
- [Why teams mock APIs](#why-teams-mock-apis)
- [Mocks, stubs, fakes and sandboxes](#mocks-stubs-fakes-and-sandboxes)
- [How an OpenAPI mock server works](#how-an-openapi-mock-server-works)
- [Static, dynamic and stateful mocks](#static-dynamic-and-stateful-mocks)
- [Tutorial: mock an API in one command](#tutorial-mock-an-api-in-one-command)
- [Make the mock stateful with x-handler](#make-the-mock-stateful-with-x-handler)
- [Seed data with x-seed](#seed-data-with-x-seed)
- [Mocks in tests, CI and Docker](#mocks-in-tests-ci-and-docker)
- [Common mistakes](#common-mistakes)
- [Tools for API mocking](#tools-for-api-mocking)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

An OpenAPI mock server takes an [OpenAPI document](/learn/openapi/what-is-openapi) as input and starts an HTTP server. For each request it:

1. matches the method and path to an operation in the document,
2. optionally validates the request against the parameters and request body schema,
3. picks a response (usually the first success response), and
4. returns an example from the document, or generates one from the response schema.

Because everything comes from the document, the mock is only as good as your examples and schemas. That turns out to be a feature: a mock is one of the fastest ways to notice that your API description is vague.

## Why teams mock APIs

**Frontend and backend work in parallel.** Once the contract is agreed, the frontend team builds against the mock while the backend team implements the real thing. This is the payoff of a design-first workflow.

**Tests that do not flake.** Integration tests that call a shared staging API fail when staging is down, slow, or full of someone else's data. A mock started by the test suite is fast, isolated, and resets on every run.

**Demos and prototypes.** A product manager can click through a prototype that talks to a mock long before any database exists.

**Partner and customer onboarding.** Publishing a mock alongside your [API reference](/learn/openapi/what-is-an-api-reference) lets integrators write code before they have credentials.

**Error and edge cases on demand.** Real APIs rarely return a `503` or a rate-limit response when you want them to. A mock can return exactly the status code you ask for.

**Agent and tool prototyping.** Teams building AI agents or MCP tools against an API can iterate against a mock without spending real quota or touching production data.

## Mocks, stubs, fakes and sandboxes

These words get used loosely. The distinctions matter when you decide what to build.

| Term | What it is | Where the behavior comes from | Typical use |
| --- | --- | --- | --- |
| Stub | Hard-coded responses for specific requests | Fixtures written by hand, often inside the test | Unit tests of one code path |
| Mock server | A running HTTP server that imitates an API | The API description: examples and schemas | Frontend development, integration tests, demos |
| Stateful mock (fake) | A mock that remembers what you created | The description plus handler code and an in-memory store | Realistic CRUD flows, end-to-end tests |
| Sandbox | The real API running against test data | The real implementation | Pre-production integration by customers |
| Recorded mock | Responses captured from real traffic and replayed | Recordings | Legacy APIs without a description |

A mock server generated from OpenAPI sits in the middle: more realistic than stubs, far cheaper than a sandbox, and always in sync with the contract.

## How an OpenAPI mock server works

The OpenAPI Specification does not define mocking, but it contains everything a mock server needs. Here is how the pieces map, using the behavior of [`@scalar/mock-server`](/tools/mock-server/getting-started) as the concrete example.

**Routing.** Every key under `paths` becomes a route, and every HTTP method under it becomes a handler. Path templates such as `/orders/{orderId}` match any value in that segment.

**Response selection.** By default the server picks a response and returns the first example it can find. Clients can override both with the standard [`Prefer` header](https://www.rfc-editor.org/rfc/rfc7240): `Prefer: code=404` returns the operation's `404` response, and `Prefer: example=bob` picks the example named `bob` from the `examples` map. The two can be combined, and unknown values fall back to the default instead of failing.

**Examples first, schemas second.** If a response has an `example` or named `examples`, the mock returns them. If it only has a schema, the mock generates a value that satisfies the schema, respecting types, formats, enums and required properties.

**Request validation.** Scalar's mock server validates path, query, header and cookie parameters and JSON request bodies against the operation by default. A request that breaks the contract gets a `422 Unprocessable Entity` with an `application/problem+json` body listing every violation, which is exactly the feedback a frontend developer wants while wiring up a form. You can turn this off with `validateRequest: false`.

**Authentication.** If the document declares `securitySchemes`, the mock enforces them on the operations that require them and prints instructions for authenticating at startup. For OAuth 2.0 schemes it also answers on the authorization and token URLs declared in the document with a test token, so a client can complete a flow against the mock.

**The document itself.** The mock serves the loaded document at `/openapi.json` and `/openapi.yaml`, which is handy for pointing other tools at it.

**Streaming.** When `text/event-stream` is the negotiated media type, responses are sent as real Server-Sent Events, one event per named example.

## Static, dynamic and stateful mocks

Mock servers fall into three levels of realism. Each level costs a bit more to set up.

**Static.** The mock returns the same example every time. `GET /orders` always returns the same two orders, and `POST /orders` always returns the same created order no matter what you send. This is enough for layout work and for tests that only care about the shape of the data.

**Dynamic.** The mock generates fresh values from the schema on each request, often with a fake-data library. You get variety (different names, dates, IDs), which shakes out UI bugs such as long strings breaking a layout, but the data still does not relate to what you sent.

**Stateful.** The mock keeps an in-memory store. `POST /orders` creates an order, `GET /orders` lists it, `DELETE /orders/{id}` removes it. This is what makes a mock feel like a real backend in an end-to-end test or a demo. Scalar supports this with two OpenAPI extensions: `x-handler` for request logic and `x-seed` for initial data.

## Tutorial: mock an API in one command

The quickest path uses the [Scalar CLI](/tools/cli/getting-started). Save this as `openapi.yaml`:

```yaml
openapi: 3.1.0
info:
  title: Users API
  version: 1.0.0
paths:
  /users:
    get:
      operationId: listUsers
      summary: List users
      responses:
        '200':
          description: OK
          content:
            application/json:
              examples:
                alice:
                  value:
                    - id: '1'
                      name: Alice
                bob:
                  value:
                    - id: '2'
                      name: Bob
  /users/{id}:
    get:
      operationId: getUser
      summary: Get a user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: Not found
          content:
            application/json:
              example:
                error: not_found
components:
  schemas:
    User:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
```

Then start the mock and watch the file for changes:

```bash
npx @scalar/cli document mock openapi.yaml --watch --port 3000
```

Now try it:

```bash
# First example
curl http://localhost:3000/users

# A named example
curl http://localhost:3000/users -H 'Prefer: example=bob'

# Generated from the User schema, because there is no example
curl http://localhost:3000/users/42

# Force the documented 404
curl http://localhost:3000/users/42 -H 'Prefer: code=404'
```

Edit the document while the server runs and `--watch` picks up the change. That feedback loop is the main reason to mock from the description rather than from fixtures: improving the mock and improving the documentation are the same edit.

## Make the mock stateful with x-handler

`x-handler` is a Scalar extension on an operation. Its value is JavaScript that runs for each request, with four helpers in scope:

- `store` for in-memory persistence: `list`, `get`, `create`, `update`, `delete`, `clear`
- `faker` for generated test data
- `req` for the request: `body`, `params`, `query`, `headers`
- `res` for the response examples by status code, such as `res['200']`

The status code follows from the store call: `store.create()` returns `201`, `store.get()` and `store.update()` return `200` or `404`, `store.delete()` returns `204` or `404`, and `store.list()` returns `200`. Returning `null` or `undefined` produces a `404`, using the operation's `404` example if it has one.

Here is a small, complete tasks API:

```yaml
openapi: 3.1.0
info:
  title: Tasks API
  version: 1.0.0
paths:
  /tasks:
    get:
      operationId: listTasks
      x-handler: |
        return store.list('Task')
      responses:
        '200':
          description: All tasks
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Task'
    post:
      operationId: createTask
      x-handler: |
        return store.create('Task', {
          id: faker.string.uuid(),
          title: req.body.title,
          done: false,
          createdAt: new Date().toISOString()
        })
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title]
              properties:
                title:
                  type: string
      responses:
        '201':
          description: Task created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
  /tasks/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    get:
      operationId: getTask
      x-handler: |
        return store.get('Task', req.params.id)
      responses:
        '200':
          description: The task
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '404':
          description: Task not found
          content:
            application/json:
              example:
                error: not_found
    delete:
      operationId: deleteTask
      x-handler: |
        return store.delete('Task', req.params.id)
      responses:
        '204':
          description: Task deleted
        '404':
          description: Task not found
components:
  schemas:
    Task:
      type: object
      required: [id, title, done]
      properties:
        id:
          type: string
        title:
          type: string
        done:
          type: boolean
        createdAt:
          type: string
          format: date-time
```

Create a task, then list it:

```bash
curl -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write the launch post"}'

curl http://localhost:3000/tasks
```

Because request validation runs before the handler, a `POST` without `title` gets a `422` listing the missing property, and your handler never sees the bad input. If a handler throws, the server returns a `500` with `"error": "Handler execution failed"` and your error message. The full reference is in [custom request handlers](/tools/mock-server/custom-request-handler).

## Seed data with x-seed

A stateful mock that starts empty is awkward for demos. `x-seed` goes on a schema under `components.schemas` and runs once at startup. The schema's key becomes the collection name, so seeding `Task` fills the same collection that `store.list('Task')` reads.

```yaml
components:
  schemas:
    Task:
      type: object
      required: [id, title, done]
      properties:
        id:
          type: string
        title:
          type: string
        done:
          type: boolean
      x-seed: |
        seed.count(10, () => ({
          id: faker.string.uuid(),
          title: faker.lorem.sentence(),
          done: faker.datatype.boolean()
        }))
```

`seed.count(n, factory)` creates `n` items, `seed([...])` inserts a fixed array, and `seed(factory)` creates one item. Seeding only runs when the collection is empty, so it will not duplicate data. See [data seeding](/tools/mock-server/data-seeding) for relationships between collections and other patterns.

## Mocks in tests, CI and Docker

**In a test suite.** `createMockServer()` from `@scalar/mock-server` returns a [Hono](https://hono.dev) app, so you can call it in-process without opening a port:

```ts
import { createMockServer } from '@scalar/mock-server'
import { describe, expect, it } from 'vitest'

describe('tasks client', () => {
  it('creates and lists tasks', async () => {
    const app = await createMockServer({
      document: './openapi.yaml',
      // Keep test output clean
      logger: false,
    })

    const created = await app.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Ship it' }),
    })
    expect(created.status).toBe(201)

    const task = await created.json()

    const list = await app.request('/tasks')
    const tasks = await list.json()
    expect(tasks).toContainEqual(task)
  })
})
```

The in-memory store lives for the whole process, so records created in one test are still there in the next. Assert on the records a test created rather than on exact counts, or give each test file its own process. To serve the mock over HTTP instead, pass `app.fetch` to `serve()` from `@hono/node-server`. The package needs Node.js 22 or newer.

**In Docker.** The `scalarapi/mock-server` image takes the document as a URL, an environment variable, or a mounted file, and also serves an API reference at `/scalar`:

```bash
docker run -p 3000:3000 \
  -v ./openapi.yaml:/docs/openapi.yaml:ro \
  scalarapi/mock-server
```

That makes it easy to add a mock to a `docker compose` file next to your frontend. The [Docker guide](/tools/mock-server/docker) covers the other ways to pass the document.

**For event-driven APIs.** Point the mock server at an AsyncAPI 3.1 document and it serves channels over WebSocket and Server-Sent Events. See [AsyncAPI mocking](/tools/mock-server/asyncapi).

## Common mistakes

**No examples, so the mock returns noise.** Schema-generated values are valid but rarely meaningful. Add realistic `examples` to the responses people look at most. Your documentation gets better at the same time.

**Mocking only the happy path.** Document your `400`, `401`, `404`, `409` and `422` responses with examples, then use `Prefer: code=...` to build and test the error states in your UI.

**Letting the mock drift from the real API.** A mock generated from the document is only in sync if the document is. Lint the document with [Spectral rules](/learn/openapi/spectral-rules) and check the real API against it with contract tests, or the mock will happily describe an API that no longer exists.

**Putting business logic in x-handler.** Handlers are for plausible behavior, not a second implementation. If a handler grows past a few lines, the test probably wants the real service.

**Forgetting that the store is in memory.** Stateful mock data resets when the process restarts. That is what you want in tests. For a long-lived shared demo, reseed on start with `x-seed`.

**Invalid documents.** A mock server cannot route an operation it cannot parse. Run `npx @scalar/cli document validate openapi.yaml` first.

## Tools for API mocking

Scalar is one option among several. Here is how the common open source tools describe themselves in their own repositories, as of September 2026.

- **Scalar Mock Server.** [MIT licensed](https://github.com/scalar/scalar). Reads Swagger 2.0, OpenAPI 3.x and AsyncAPI 3.1, with request validation, `Prefer` header support, and stateful mocking through `x-handler` and `x-seed`. Runs from the CLI, as a Node.js library, or in Docker. Best when your OpenAPI document is the source of truth and you want CRUD behavior without leaving it.
- **Prism.** Stoplight's mock server, [Apache-2.0 licensed](https://github.com/stoplightio/prism). It mocks OpenAPI 2 and 3 documents and Postman Collections, generates [dynamic examples with the `-d` flag](https://github.com/stoplightio/prism/blob/master/docs/guides/01-mocking.md), and has a [validation proxy](https://github.com/stoplightio/prism) mode that checks real traffic against the document. Scalar's mock server follows the same `Prefer` header conventions, so switching between the two is easy. Best if you want the validation proxy for contract testing.
- **WireMock.** [Apache-2.0 licensed](https://github.com/wiremock/wiremock), described as "a tool for mocking HTTP services". It is stub-driven rather than description-driven, which suits Java-heavy test suites and record-and-replay.
- **Mockoon.** [MIT licensed](https://github.com/mockoon/mockoon), a desktop app for running mock APIs locally with no account required. Best if you prefer building mocks in a GUI.

If you are moving off Stoplight's platform entirely, our [Stoplight migration guide](/resources/migration/stoplight) covers docs, rulesets and more.

## Frequently asked questions

<scalar-detail title="What is an OpenAPI mock server?">
It is an HTTP server that reads an OpenAPI document and answers requests for every operation in it, using the examples and schemas in the document. It lets you call an API before it is built, or without touching the real one.
</scalar-detail>

<scalar-detail title="How do I create a mock server from an OpenAPI file?">
With the Scalar CLI, run `npx @scalar/cli document mock openapi.yaml --watch`. The server starts on your machine and reloads when the file changes. You can also run `@scalar/mock-server` from Node.js or use the `scalarapi/mock-server` Docker image.
</scalar-detail>

<scalar-detail title="Can a mock server remember data between requests?">
Yes, if it supports stateful mocking. In Scalar's mock server, add an `x-handler` to an operation and use the `store` helper to create, read, update and delete records in memory, and add `x-seed` to a schema to load initial data at startup.
</scalar-detail>

<scalar-detail title="How do I return an error response from a mock?">
Send the `Prefer: code=404` header (or any other status code the operation documents). To choose between several named examples, use `Prefer: example=name`. Both directives can be combined.
</scalar-detail>

<scalar-detail title="Is API mocking the same as contract testing?">
No. A mock imitates the API so clients can be built and tested. Contract testing checks that the real API behaves the way its description says. They complement each other: mocks keep clients honest, contract tests keep the server honest.
</scalar-detail>

<scalar-detail title="Does the mock server check authentication?">
Scalar's mock server enforces the security schemes declared in the document on the operations that require them, and prints how to authenticate when it starts. See [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) for how those schemes are described.
</scalar-detail>

## Related

- **Learn:** [What is an API client?](/learn/openapi/what-is-an-api-client) · [Spectral rules](/learn/openapi/spectral-rules) · [What is OpenAPI?](/learn/openapi/what-is-openapi)
- **Docs:** [Mock Server getting started](/tools/mock-server/getting-started)
- **Product:** [Scalar Registry](/products/registry) — keep the OpenAPI documents your mocks, docs and SDKs are generated from in one versioned place.
