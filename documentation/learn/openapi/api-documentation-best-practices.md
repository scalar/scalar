# API documentation best practices

*Last updated: September 2026*

*By Marc Laventure · Reviewed by: pending*

API documentation best practices are the habits that make an API easy to adopt: keep one accurate, machine-readable description of the API (usually an OpenAPI document), generate the reference from it, pair that reference with task-based guides, show realistic examples and every error, make authentication obvious, and publish automatically whenever the API changes. Everything else is refinement.

This guide collects the practices that make the biggest difference in our experience building documentation tooling around OpenAPI. Each one explains why it matters and how to apply it, with examples you can copy.

**On this page**

- [The checklist](#the-checklist)
- [1. Know who is reading](#1-know-who-is-reading)
- [2. Keep one source of truth](#2-keep-one-source-of-truth)
- [3. Get people to a first successful call fast](#3-get-people-to-a-first-successful-call-fast)
- [4. Write descriptions that explain, not repeat](#4-write-descriptions-that-explain-not-repeat)
- [5. Show real examples everywhere](#5-show-real-examples-everywhere)
- [6. Document every error](#6-document-every-error)
- [7. Make authentication impossible to miss](#7-make-authentication-impossible-to-miss)
- [8. Organize around how users think](#8-organize-around-how-users-think)
- [9. Let people try it](#9-let-people-try-it)
- [10. Automate validation, linting, and publishing](#10-automate-validation-linting-and-publishing)
- [11. Version deliberately and keep a changelog](#11-version-deliberately-and-keep-a-changelog)
- [12. Write for AI agents too](#12-write-for-ai-agents-too)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The checklist

If you only have five minutes, use this table to audit your current docs.

| Practice               | Why it matters                        | Quick test                                                        |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| One source of truth    | Docs, SDKs, and mocks cannot disagree | Is the reference generated from an OpenAPI document?              |
| Quickstart             | First success keeps people going      | Can a new user make an authenticated call in under five minutes?  |
| Useful descriptions    | Names are not explanations            | Does every operation have a summary that is not just the path?    |
| Real examples          | People copy, then adapt               | Are there examples with realistic values, not `"string"`?         |
| Every error documented | Errors are where people get stuck     | Are `4xx` responses and their bodies described?                   |
| Obvious authentication | It is the first blocker               | Is "how to get a key" reachable in one click from the home page?  |
| Task-based navigation  | Users search by goal                  | Do tags match product concepts, not code modules?                 |
| Interactivity          | Trying beats reading                  | Can you send a request from the docs?                             |
| Automated checks       | Humans forget                         | Is the OpenAPI document validated and linted in CI?               |
| Automated publishing   | Drift starts with manual steps        | Do docs redeploy on every merge?                                  |
| Changelog              | Integrators need to plan              | Is there a dated list of changes, with breaking ones called out?  |
| Machine-readable       | Agents and tools read docs too        | Is the OpenAPI document downloadable, and is there an `llms.txt`? |

## 1. Know who is reading

API docs have more audiences than it seems:

- **Evaluators** decide whether to use your API. They skim the overview, pricing, limits, and a quickstart.
- **First-time integrators** follow a guide end to end.
- **Experienced integrators** live in the reference and search for specific fields.
- **Maintainers** come back when something breaks, looking at errors and the changelog.
- **Tools and agents** read the OpenAPI document, SDKs, and plain-text versions of your pages.

Each needs a different entry point. A common failure is a docs home page that serves only one group, usually the experienced integrator, with a list of endpoints and nothing else.

The [Diátaxis framework](https://diataxis.fr/) is a useful way to organize for all of them: tutorials for learning, how-to guides for tasks, reference for lookup, and explanation for understanding. The reference is one quadrant, and [what an API reference is](/learn/openapi/what-is-an-api-reference) covers it in depth.

## 2. Keep one source of truth

The single most effective practice is to describe your API once, in an [OpenAPI document](/learn/openapi/what-is-openapi), and generate as much as possible from it: the reference, code samples, SDKs, mock servers, and MCP servers.

Why it matters: every hand-maintained copy of the same information will eventually disagree with the others. When the reference, the SDK, and the API disagree, developers stop trusting all three.

How to apply it:

- If your framework can generate OpenAPI from code, use that, and check the generated file into version control so changes show up in review.
- If you design first, keep the OpenAPI document in the same repository as the implementation and test the implementation against it.
- Store shared schemas once, in `components`, and reference them with `$ref`.
- Put guide content that belongs to an operation (units, side effects, gotchas) in the operation's `description`, not only in a separate guide.

## 3. Get people to a first successful call fast

The first successful call is the moment someone decides your API works. Shorten the path to it:

1. Explain in one sentence what the API does.
2. Show how to get credentials, with a direct link.
3. Show one complete request, ready to paste, and the response it returns.
4. Point to the next two or three things people usually do.

Put this quickstart on the docs home page or one click away. Use a real, safe endpoint (a "get current user" or "list" call is ideal) rather than one that creates or charges anything.

## 4. Write descriptions that explain, not repeat

Generated structure tells readers that `amount` is an integer. Only you can tell them it is in cents, that it must be positive, and that it cannot change after capture.

Good descriptions include:

- **Units and formats.** Cents or dollars? Seconds or milliseconds? UTC?
- **Defaults and limits.** Page size default, maximum, and what happens beyond it.
- **Side effects.** Does this send an email, charge a card, or trigger a webhook?
- **Idempotency.** Is it safe to retry?
- **Relationships.** Where does this ID come from?

Compare these two versions of the same parameter:

```yaml
# Before
- name: limit
  in: query
  schema:
    type: integer
```

```yaml
# After
- name: limit
  in: query
  description: |
    Maximum number of results per page. Use the `next_cursor`
    from the response to fetch the next page.
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20
```

The second version answers the questions a developer would otherwise have to test for. For field-by-field advice, see [OpenAPI documentation](/learn/openapi/openapi-documentation).

## 5. Show real examples everywhere

Developers copy examples first and read schemas second. Give them something worth copying:

- Use **realistic values**: `ord_8f2k1`, `2026-09-26T10:00:00Z`, `"shipped"`, not `"string"` and `0`.
- Provide **named examples** for different cases (a card payment and a bank transfer, a success and a validation error).
- Make sure **examples validate** against their schema. A linter can check this.
- Include **complete code samples** that run as-is, with the auth header and base URL in place.

If you ship SDKs, show SDK calls in the reference alongside raw HTTP, so readers see the code they will actually write. See [what an SDK is](/learn/sdk/what-is-an-sdk) for why that matters.

## 6. Document every error

Errors are where integrations get stuck, and they are the part of API documentation most often left out. For each operation, document the status codes it can actually return and what they mean in context.

Use one consistent error format across the API. [RFC 9457 (Problem Details for HTTP APIs)](https://www.rfc-editor.org/rfc/rfc9457.html) is a good standard to adopt. Define it once and reuse it:

```yaml
openapi: 3.1.1
info:
  title: Payments API
  version: 1.0.0
paths:
  /payments:
    post:
      summary: Create a payment
      responses:
        '201':
          description: The payment was created.
        '422':
          $ref: '#/components/responses/ValidationError'
components:
  responses:
    ValidationError:
      description: |
        The request was well-formed but contained invalid values.
        The `errors` array lists each invalid field.
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/Problem'
          example:
            type: https://api.example.com/problems/validation
            title: Your request is not valid.
            status: 422
            errors:
              - field: amount
                detail: Must be greater than 0.
  schemas:
    Problem:
      type: object
      required: [type, title, status]
      properties:
        type:
          type: string
          format: uri
        title:
          type: string
        status:
          type: integer
        detail:
          type: string
        errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              detail:
                type: string
```

Beyond the schema, add a short guide listing your error types and what to do about each one: retry, fix the input, or contact support.

## 7. Make authentication impossible to miss

Authentication is the first thing every new user has to solve, and the most common reason they give up. Make it easy:

- Describe every scheme in `components.securitySchemes` and apply them with `security`, so tools can generate correct samples and "try it" forms. [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) walks through each type.
- Explain where to get credentials, how long they last, and how scopes work.
- Show one complete authenticated request early in the docs.
- If some endpoints need different permissions, say so on those endpoints.

## 8. Organize around how users think

Tags become navigation. Name them after product concepts ("Customers," "Invoices," "Webhooks") rather than internal service names ("billing-svc-v2"). Order them in the sequence people usually need them, starting with authentication and the core resource.

For larger APIs, group tags into sections. OpenAPI 3.2 supports nested tags natively with the `parent` field; for earlier versions, many tools support the `x-tagGroups` extension. Both are documented in [Scalar's OpenAPI extensions reference](/products/api-references/openapi).

Search matters more as the API grows. Readers should be able to type a field name or operation and land on it.

## 9. Let people try it

Reading about an endpoint is slower than calling it. An interactive reference lets developers send a real request with their own credentials without leaving the page, and see the exact response. For deeper work (saved requests, environments, chained calls), give them an [API client](/learn/openapi/what-is-an-api-client) that imports your OpenAPI document directly.

Two practical notes: sandbox or test-mode credentials make "try it" far safer, and browser requests need CORS headers or a proxy.

## 10. Automate validation, linting, and publishing

Documentation quality decays unless something checks it. Treat the OpenAPI document like code:

- **Validate** it against the specification on every pull request.
- **Lint** it against your style rules: summaries present, consistent casing, examples valid, errors documented. See [OpenAPI linting](/learn/openapi/spectral-rules) and [Spectral rules](/learn/openapi/spectral-rules).
- **Publish** docs automatically on every merge to your main branch.

A minimal GitHub Actions workflow using the [Scalar CLI](/tools/cli/getting-started):

```yaml
# .github/workflows/validate-openapi.yml
name: Validate OpenAPI

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npx @scalar/cli document validate openapi.yaml
      - run: npx @scalar/cli document lint openapi.yaml
```

## 11. Version deliberately and keep a changelog

Integrators need to know what changed and whether they have to act.

- Keep `info.version` meaningful, and publish a dated changelog.
- Call out breaking changes clearly, with migration steps and a timeline.
- Mark operations and parameters as `deprecated: true` before removing them, and say in the description what to use instead.
- If you run multiple major versions at once, keep separate references and make the version switcher obvious.
- Compare OpenAPI documents between releases to catch unintended breaking changes. An [OpenAPI diff](/tools/openapi-diff) makes this reviewable.

## 12. Write for AI agents too

A growing share of your "readers" are coding assistants and agents. They benefit from the same clarity humans do, delivered in formats they can consume:

- **Publish your OpenAPI document** at a stable URL.
- **Offer plain-text or Markdown versions** of your pages, indexed by an `llms.txt` file. See [llms.txt for API docs](/learn/openapi/llms-txt-for-api-docs).
- **Consider an MCP server** so agents can call your API as tools. See [how to generate an MCP server from OpenAPI](/learn/mcp/generate-mcp-server-from-openapi).
- **Write precise descriptions.** An agent choosing between `listOrders` and `searchOrders` relies on the words you wrote.

## Common mistakes

1. **Treating the reference as the whole documentation.** A list of endpoints is not onboarding.
2. **Placeholder descriptions.** "Gets the user" on `GET /user`. Say what is interesting.
3. **Only documenting the happy path.** No errors, no edge cases, no limits.
4. **Examples that do not match the schema.** Nothing erodes trust faster than a copied example that fails.
5. **Manual publishing.** Every manual step is a future outage of accuracy.
6. **Hiding the OpenAPI document.** Developers want to import it into their tools.
7. **Changing behavior silently.** No changelog, no deprecation period.
8. **Walls of text in the reference.** Long conceptual explanations belong in guides, linked from the operation.

## Frequently asked questions

<scalar-detail title="What makes good API documentation?">
Accuracy first, then speed to a first successful call, then completeness. Good API documentation is generated from a single source of truth, shows realistic examples and every error, explains authentication up front, and pairs a precise reference with task-based guides.
</scalar-detail>

<scalar-detail title="What should API documentation include?">
An overview, a quickstart, authentication instructions, a complete reference for every endpoint, error documentation, guides for common tasks, a changelog, and information about limits and versioning. A downloadable OpenAPI document is also expected by many developers now.
</scalar-detail>

<scalar-detail title="How do you keep API documentation up to date?">
Generate the reference from an OpenAPI document, keep that document in the same repository as the code, validate it in CI, and publish automatically on every merge. Anything maintained by hand will drift.
</scalar-detail>

<scalar-detail title="Is OpenAPI required for good API documentation?">
Not strictly, but it makes most of these practices much easier. With an OpenAPI document you get a consistent reference, code samples, "try it" functionality, SDKs, and mocks from one file, and you can lint it automatically.
</scalar-detail>

<scalar-detail title="How long should API documentation be?">
As long as it needs to be to cover every endpoint and error, and no longer in any single place. Keep reference entries concise and consistent, and move long explanations into separate guides that link to the reference.
</scalar-detail>

<scalar-detail title="What is the best tool for API documentation?">
It depends on your stack and whether you need hosting, guides, SDKs, or just a renderer. Most modern tools read OpenAPI, so you can switch later. Our survey of [API documentation tools](/library/best-api-documentation-tools-2026) compares the main options.
</scalar-detail>

## Related

- **Learn:** [OpenAPI documentation](/learn/openapi/openapi-documentation) · [What is an API reference?](/learn/openapi/what-is-an-api-reference) · [OpenAPI linting](/learn/openapi/spectral-rules)
- **Docs:** [Deploy Scalar Docs automatically from Git](/products/docs/deployment/automatic-deployment)
- **Product:** [Scalar Docs](/products/docs) — hosted API documentation with guides and an interactive reference, published from your OpenAPI document and Git.
