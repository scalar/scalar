# How to set up an OpenAPI mock server

To create a mock server for your OpenAPI document, download the [Scalar CLI](https://github.com/scalar/scalar/blob/main/documentation/guides/cli/getting-started.md):

```
npm -g install @scalar/cli
```

> **Note:** There’s another `scalar` CLI which is bundled with Git. If you run into naming conflicts and never use the other CLI anyway, you can replace it like this:
>
> ```
> npm -g --force install @scalar/cli
> ```

Once installed, run the `document mock` command pointing at your OpenAPI document (no matter if it’s JSON or YAML, local or remote).

```
scalar document mock https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/3.1.json
```

This launches a fully functional HTTP server that responds to every endpoint in your OpenAPI file with realistic mock data based on your schema definitions. You’ll see a color-coded output of available paths for you to make requests to:

[![](https://substackcdn.com/image/fetch/$s_!2R58!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6b371a54-a7ef-4d61-9814-674e728b26b0_2316x1402.png)](https://substackcdn.com/image/fetch/$s_!2R58!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6b371a54-a7ef-4d61-9814-674e728b26b0_2316x1402.png)

When you make those requests, you’ll get responses as if that server exists:

[![](https://substackcdn.com/image/fetch/$s_!U65N!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa671e140-f544-4418-9987-213226ede16b_1178x700.png)](https://substackcdn.com/image/fetch/$s_!U65N!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa671e140-f544-4418-9987-213226ede16b_1178x700.png)

The mock server also has a few options to customize it:

* `--port` to change the port from the default of `3000`.
* `--watch` to watch for file changes and reload when you modify the OpenAPI file.
* `--once` to run tests once. Boots the server, responds to requests, and exits. Perfect for CI pipelines.

## Why does OpenAPI mocking matter anyways?

Mock servers are more than just “fake APIs.” They unlock workflows that speed up development and reduce dependencies.

1. **Parallel development:** Frontend and backend teams can work independently without needing to wait for the real API to be built.
2. **Testing without risk:** Safely run tests and automations against the mock server without hitting production or staging (and the real errors that come with them).
3. **Faster prototyping:** Build and validate API contracts early in the process, before you’ve written any business logic.
4. **Fewer third-party dependencies:** Developers can work with third-party APIs without their rate limits, costs, and availability constraints.

A good mock server gives you confidence in the API while keeping the whole team moving.

## How does Scalar’s OpenAPI mock server work under the hood?

Under the hood, the CLI relies on Scalar’s open source `mock-server` [package](https://github.com/scalar/scalar/tree/main/packages/mock-server) to generate routes and serve requests.

The whole request flow looks like this:

1. The Scalar CLI detects whether your input is a file or URL then loads, dereferences, and [validates](./2025-07-07-how-to-do-openapi-validation-and.md) it with the `@scalar/openapi-parser` [package](https://github.com/scalar/scalar/tree/main/packages/openapi-parser).
2. With the OpenAPI doc, the `mock-server` package generates routes for each path in Hono syntax and responses based on schemas. It also validates parameters, sets up authentication (if [security schemes](./2025-03-26-a-guide-to-openapi-security-and-how.md) are defined), and returns appropriate HTTP status codes.
3. The generated routes are then served using Hono, a lightweight, fast HTTP framework. Hono is responsible for route matching, authentication checking, parameter extraction, and mock response generation.
4. The mock responses use Scalar’s open source `oas-utils` [package](https://github.com/scalar/scalar/tree/main/packages/oas-utils) to generate realistic data from OpenAPI schemas. This uses examples when available.
5. The generated data respects schema constraints like data types, formats, and validation rules to create mock responses that match your API specification.

All this gives you a fast, spec-compliant, developer-friendly mock server you can start in seconds.

**Aug 19, 2025**
