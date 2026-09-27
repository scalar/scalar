# Spectral rules: how to lint OpenAPI with custom rulesets

*Last updated: September 2026*

Spectral rules are small, declarative checks that the open source Spectral linter runs against JSON or YAML documents such as OpenAPI descriptions. Each rule selects part of the document with a JSONPath expression (`given`), applies a function to it (`then`), and reports a problem at a chosen severity when the check fails. A collection of rules is a ruleset, usually stored in a file called `.spectral.yaml`.

Rulesets are how teams turn an API style guide ("paths are kebab-case", "every operation has an `operationId`", "no API keys in query strings") into something a machine enforces on every pull request. This guide covers the anatomy of a rule, the built-in OpenAPI ruleset, eight custom rules you can copy, and how to run them locally, in CI, and in the Scalar Registry.

Everything here follows [Spectral's own documentation on GitHub](https://github.com/stoplightio/spectral/tree/develop/docs), checked in September 2026. Spectral is maintained by Stoplight and licensed under [Apache-2.0](https://github.com/stoplightio/spectral).

**On this page**

- [The short answer](#the-short-answer)
- [Validation, linting and contract testing](#validation-linting-and-contract-testing)
- [Anatomy of a Spectral rule](#anatomy-of-a-spectral-rule)
- [Ruleset structure: extends, rules, overrides, aliases](#ruleset-structure-extends-rules-overrides-aliases)
- [The built-in spectral:oas ruleset](#the-built-in-spectraloas-ruleset)
- [Core functions](#core-functions)
- [Eight custom rules you can copy](#eight-custom-rules-you-can-copy)
- [Running Spectral locally and in CI](#running-spectral-locally-and-in-ci)
- [Spectral rules in the Scalar Registry](#spectral-rules-in-the-scalar-registry)
- [Common mistakes](#common-mistakes)
- [Frequently asked questions](#frequently-asked-questions)

## The short answer

Here is a complete ruleset. It turns on Spectral's recommended OpenAPI rules and adds one rule of its own:

```yaml
extends: [[spectral:oas, recommended]]
rules:
  paths-kebab-case:
    description: Paths should be kebab-case.
    message: "{{property}} should be kebab-case (lower-case and separated with hyphens)"
    severity: warn
    given: $.paths[*]~
    then:
      function: pattern
      functionOptions:
        match: "^(\/|[a-z0-9-.]+|{[a-zA-Z0-9_]+})+$"
```

Save it as `.spectral.yaml` next to your OpenAPI document and run `spectral lint openapi.yaml`. Spectral finds the ruleset automatically, walks every key under `paths` (the `~` in `$.paths[*]~` selects the keys rather than the values), and flags any path that is not kebab-case.

## Validation, linting and contract testing

Three kinds of checks get lumped together as "OpenAPI validation". They catch different problems.

| Check | Question it answers | Example failure | Typical tool |
| --- | --- | --- | --- |
| Description validation | Is this a valid OpenAPI document? | `paths` is missing, a `$ref` points nowhere, `type: strng` | `scalar document validate`, any OpenAPI parser |
| Linting | Does this valid document follow our rules? | An operation has no description, a path uses camelCase | Spectral with a ruleset |
| Contract testing | Does the running API match the document? | The API returns a field the schema does not declare | Validation proxies, contract test suites |

A document can pass validation and still fail linting badly: an API with no descriptions, inconsistent naming and no error responses is perfectly valid OpenAPI. Linting is where your team's opinions live. If you only need the first row, read [how to do OpenAPI validation](/blog/posts/2025-07-07-how-to-do-openapi-validation-and).

## Anatomy of a Spectral rule

A rule lives under `rules` and has two required properties, `given` and `then`, plus optional ones that control how it reports.

```yaml
rules:
  tag-description:
    description: Tags must have a description.
    message: "Tag is missing a description: {{path}}"
    severity: error
    given: $.tags[*]
    then:
      field: description
      function: truthy
```

**`given`** (required) is a JSONPath expression, or an array of them, that selects the parts of the document the rule applies to. Think of it as a CSS selector for JSON. Spectral uses the [nimma](https://www.npmjs.com/package/nimma) implementation with [jsonpath-plus](https://www.npmjs.com/package/jsonpath-plus) as a fallback, so a few expressions behave slightly differently from other JSONPath libraries.

**`then`** (required) says what to check on each selected node:

- `function` is the check to run, one of the [core functions](#core-functions) or a custom function.
- `field` (optional) narrows the check to one property of the selected object. `@key` checks the object's keys instead.
- `functionOptions` passes options to the function.

`then` can also be an array, which lets one rule check several fields.

**`severity`** is `error`, `warn`, `info`, `hint` or `off`. The default is `warn`.

**`message`** is what users see. It supports placeholders evaluated at runtime: `{{error}}` (the function's own message), `{{description}}`, `{{path}}` (the full path to the problem), `{{property}}` (the last segment of the path) and `{{value}}` (the linted value).

**`description`** is a short explanation of the rule's purpose.

**`formats`** restricts a rule to certain document types, such as `oas2`, `oas3`, `oas3_0`, `oas3_1` or `oas3_2`.

**`recommended`** (default `true`) marks whether the rule runs when someone extends your ruleset without asking for `all` rules. Set new rules to `false` to trial them before rolling them out everywhere.

**`resolved`** (default `true`) controls whether the rule sees the document after `$ref` values have been resolved. Set it to `false` when you need to lint the references themselves, for example to require that parameters are always `$ref`s to shared components.

## Ruleset structure: extends, rules, overrides, aliases

A ruleset file can have these top-level properties:

- **`rules`**: your rules, keyed by name.
- **`extends`**: other rulesets to build on. A single string, or an array of built-in names, local paths, URLs, or npm packages.
- **`formats`**: formats the whole ruleset applies to.
- **`documentationUrl`**: a URL for your style guide. Spectral appends the rule name as an anchor, so a failure of `no-http-basic` links to `...#no-http-basic`.
- **`aliases`**: named JSONPath expressions you can reuse in `given` with a `#` prefix.
- **`overrides`**: changes that apply only to certain files, formats, or parts of files.
- **`parserOptions`**: how strictly to treat duplicate keys and incompatible values.

**Changing an inherited rule.** Redefine a rule with the same name to replace it, or give just a severity to change how loudly it reports:

```yaml
extends: spectral:oas
rules:
  operation-success-response: warn
  info-contact: off
```

**Recommended, all, or nothing.** Extending a ruleset gives you its recommended rules by default. Pass a second value to change that:

```yaml
# Every rule, including the ones not marked recommended
extends: [[spectral:oas, all]]
```

```yaml
# No rules, then opt in to specific ones
extends: [[spectral:oas, off]]
rules:
  operation-operationId-unique: true
```

**Aliases** keep long selectors in one place:

```yaml
aliases:
  Operation:
    - "$.paths[*][get,put,post,delete,patch,options,head,trace]"
rules:
  operation-summary:
    given: "#Operation"
    then:
      field: summary
      function: truthy
```

**Overrides** are how you adopt a strict ruleset without failing on every legacy API at once. Match files with a glob, optionally narrowed to a part of the file with a JSON Pointer after `#`:

```yaml
overrides:
  - files:
      - "legacy/**/*.yaml"
    rules:
      operation-description: "off"
  - files:
      - "public/openapi.yaml#/paths/~1v1~1orders"
    rules:
      paths-kebab-case: "off"
```

JSON Pointers escape `/` as `~1`, which is why `/v1/orders` appears as `~1v1~1orders`. When several overrides match, the last one wins.

## The built-in spectral:oas ruleset

Spectral ships three built-in rulesets: `spectral:oas` for OpenAPI 2.0 and 3.x, `spectral:asyncapi` for AsyncAPI 2.x and 3.x, and `spectral:arazzo` for Arazzo 1.0. The OpenAPI ruleset is a good baseline. A few rules worth knowing by name, from the [OpenAPI rules reference](https://github.com/stoplightio/spectral/blob/develop/docs/reference/openapi-rules.md):

- `operation-operationId-unique` and `operation-operationId-valid-in-url`: operation IDs must be unique and URL-safe. SDK generators and [API clients](/learn/openapi/what-is-an-api-client) rely on them.
- `operation-success-response`: every operation should document at least one success (`2xx` or `3xx`) response.
- `path-params`: path template variables must be declared as parameters, and vice versa.
- `no-$ref-siblings`: flags keys placed next to a `$ref` where the OpenAPI version ignores them.
- `oas3-schema` and `oas2-schema`: the document must match the OpenAPI schema.
- `oas3-valid-media-example` and `oas3-valid-schema-example`: examples must be valid against their schemas. This one catches a surprising number of documentation bugs.
- `oas3-unused-component`: flags components nothing references.
- `info-contact`, `info-description`, `operation-description`, `tag-description`: documentation completeness.
- `contact-properties`: not recommended by default, so it only runs with `all` or when you enable it.

Check the version you run against the version your documents use. Spectral's formats list includes `oas3_2`, but support for newer specification versions arrives in stages, so a brand-new OpenAPI 3.2 feature may be reported as invalid by older Spectral releases. If you see false positives on 3.2 documents, upgrade Spectral first.

## Core functions

Most rules only need a built-in function. These are the ones Spectral documents as core functions:

| Function | Checks that the value... | Key options |
| --- | --- | --- |
| `truthy` / `falsy` | is present and not empty / is absent or empty | none |
| `defined` / `undefined` | is defined / is not defined | none |
| `pattern` | matches (or does not match) a regular expression | `match`, `notMatch` |
| `casing` | follows a naming convention | `type` (`flat`, `camel`, `pascal`, `kebab`, `cobol`, `snake`, `macro`), `disallowDigits`, `separator` |
| `enumeration` | is one of a list | `values` |
| `length` | has a length (string, array, or object keys) within bounds | `min`, `max` |
| `schema` | validates against a JSON Schema | `schema`, `dialect`, `allErrors` |
| `alphabetical` | is sorted | `keyedBy` |
| `xor` / `or` | has exactly one / at least one of several properties | `properties` |
| `unreferencedReusableObject` | is referenced somewhere | `reusableObjectsLocation` |
| `typedEnum` | has enum values that match the declared type | none |

When none of these fit, Spectral supports [custom JavaScript functions](https://github.com/stoplightio/spectral/blob/develop/docs/guides/5-custom-functions.md), but try `schema` first. A small JSON Schema can express most structural checks, and it keeps the ruleset declarative. If JSON Schema itself is new to you, [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi) explains how the two relate.

## Eight custom rules you can copy

Each of these is a complete rule. Put them under `rules:` in a ruleset that extends `spectral:oas`.

**1. `operationId` must be camelCase.** Consistent IDs become consistent method names in generated SDKs.

```yaml
operation-id-camel-case:
  description: operationId must be camelCase.
  severity: error
  given: $.paths[*][get,put,post,delete,patch,options,head,trace]
  then:
    field: operationId
    function: casing
    functionOptions:
      type: camel
```

**2. No HTTP Basic authentication.** This one comes straight from Spectral's documentation.

```yaml
no-http-basic:
  description: Consider a more secure alternative to HTTP Basic.
  message: HTTP Basic is a pretty insecure way to pass credentials around, please consider an alternative.
  severity: error
  given: $.components.securitySchemes[*]
  then:
    field: scheme
    function: pattern
    functionOptions:
      notMatch: basic
```

**3. No API keys in the query string.** Query strings end up in logs, browser history and analytics. See [OpenAPI security schemes](/learn/openapi/openapi-security-schemes) for safer options.

```yaml
no-api-key-in-query:
  description: API keys must be sent in a header or cookie, not the query string.
  severity: error
  given: "$.components.securitySchemes[?(@.type === 'apiKey')]"
  then:
    field: in
    function: enumeration
    functionOptions:
      values: [header, cookie]
```

**4. Servers must use HTTPS.**

```yaml
servers-use-https:
  description: Server URLs must use HTTPS.
  message: "{{value}} does not use https://"
  severity: error
  formats: [oas3]
  given: $.servers[*].url
  then:
    function: pattern
    functionOptions:
      match: "^https://"
```

**5. Every operation documents a client error.** The trick here is a JSON Schema that says "not every response code fails to start with 4", which means at least one `4xx` response exists.

```yaml
operation-4xx-response:
  description: Operations should document at least one 4xx response.
  severity: warn
  given: $.paths[*][get,put,post,delete,patch].responses
  then:
    function: schema
    functionOptions:
      schema:
        type: object
        not:
          propertyNames:
            not:
              pattern: "^4"
```

**6. Schema properties need descriptions.** Descriptions are what turn a schema into documentation.

```yaml
schema-property-description:
  description: Schema properties should have a description.
  severity: warn
  given: $.components.schemas[*].properties[*]
  then:
    field: description
    function: truthy
```

**7. Pagination limits must have a maximum.** Unbounded `limit` parameters are an easy way to take your own API down.

```yaml
limit-has-maximum:
  description: A limit query parameter must declare a maximum.
  severity: error
  given: "$.paths[*][get].parameters[?(@.name === 'limit' && @.in === 'query')].schema"
  then:
    field: maximum
    function: defined
```

**8. Parameters must be references.** This needs the unresolved document, so it sets `resolved: false`. It is adapted from Spectral's documentation, with `given` pointing straight at `parameters` so operations without parameters are skipped, and is useful when you keep shared parameters in `components`.

```yaml
parameters-must-be-refs:
  description: Operation parameters must be $refs to shared components.
  severity: warn
  resolved: false
  given: $.paths[*][get,post,put,delete,patch].parameters
  then:
    function: schema
    functionOptions:
      schema:
        type: array
        items:
          type: object
          required: [$ref]
```

Start new rules at `warn` or with `recommended: false`, see how many violations they produce across your APIs, fix the worst, then raise them to `error`.

## Running Spectral locally and in CI

Install the CLI and lint a document:

```bash
npm install -g @stoplight/spectral-cli
spectral lint openapi.yaml
```

Without `--ruleset`, Spectral looks for `.spectral.yml`, `.spectral.yaml`, `.spectral.json` or `.spectral.js` in the current directory. Point at another ruleset, including one at a URL, with `--ruleset`:

```bash
spectral lint openapi.yaml --ruleset https://example.com/api-style-guide.yaml
```

By default only `error` results make the command exit with a failure code. Use `--fail-severity=warn` to fail on warnings too, and `--format` to produce `junit`, `sarif`, `github-actions` or other outputs your CI understands.

The Scalar CLI runs Spectral rulesets as well, which is convenient if you already use it to validate, bundle or publish documents:

```bash
npx @scalar/cli document lint openapi.yaml --rule ./.spectral.yaml
```

A GitHub Actions job that lints on every pull request touching the document looks like this:

```yaml
name: Lint OpenAPI document
on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - '.spectral.yaml'
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npx @scalar/cli document lint openapi.yaml --rule ./.spectral.yaml
```

## Spectral rules in the Scalar Registry

Rulesets are most useful when every team uses the same one. Copying `.spectral.yaml` between repositories works until the copies diverge. The [Scalar Registry](/products/registry) stores rulesets as versioned resources next to your OpenAPI documents and JSON Schemas, so there is one canonical style guide that repositories, CI jobs and documentation builds all point at.

How it fits together:

- **Create a rule in the dashboard.** A new Registry rule starts as `extends: spectral:oas` with empty `rules`, so you begin from the Spectral baseline and add your own. It uses the same Spectral syntax described above, so existing rulesets move over unchanged. See [Registry rules](/products/registry/rules).
- **Share it publicly or privately.** Public rules are readable by anyone at their Registry URL, which suits open source style guides. Private rules are limited to your organization and specific access groups.
- **Lint from anywhere.** Pass the Registry URL to the CLI: `scalar document lint openapi.yaml --rule https://registry.scalar.com/@your-team/rules/your-rule`.
- **Block bad publishes.** In [Scalar Docs](/products/docs), the `ruleset` setting in `scalar.config.json` lints every OpenAPI page and can stop a publish when problems reach a chosen severity:

```json
{
  "ruleset": {
    "namespace": "acme",
    "slug": "api-guidelines",
    "version": "1.2.0",
    "blockPublishOn": "error"
  }
}
```

`blockPublishOn` accepts `error`, `warning`, `info`, `hint` or `none`, and an individual OpenAPI route can override it. The full reference is in the [scalar.config.json guide](/products/docs/configuration/scalar.config.json). Spectral rules are included on every Scalar plan, including Free; see [pricing](/pricing).

The practical effect is that linting moves from "a check someone added to one repository" to a governance layer across your [API catalog](/learn/openapi/api-catalog): one ruleset, versioned, applied the same way to every document your docs, [SDKs](/products/sdk-generator) and mocks are generated from.

## Common mistakes

**Writing `given` paths that match nothing.** A rule whose `given` selects no nodes never fails, which looks exactly like a rule that passes. Test new rules against a document you know violates them before trusting a green run.

**Forgetting the `~` for keys.** `$.paths[*]` selects path item objects. `$.paths[*]~` selects the path strings. Casing rules on paths need the second.

**Turning on everything at `error` on day one.** A hundred errors on a legacy API get ignored, not fixed. Start with `recommended`, use `overrides` for legacy files, and ratchet severity up.

**Linting the resolved document when you meant the raw one.** Rules about `$ref` usage need `resolved: false`. Rules about the final shape of schemas need the default.

**Duplicating the specification.** Do not write rules that re-check what `oas3-schema` already validates. Spend rules on your team's conventions.

**Copying rulesets between repositories.** Copies drift. Publish one ruleset to a URL or a registry and `extends` it everywhere.

## Frequently asked questions

<scalar-detail title="What is a Spectral ruleset?">
A Spectral ruleset is a YAML, JSON or JavaScript file that lists rules for the Spectral linter, optionally extending other rulesets such as the built-in spectral:oas. It is usually named .spectral.yaml and kept next to the API description or published at a URL.
</scalar-detail>

<scalar-detail title="What is the difference between OpenAPI validation and OpenAPI linting?">
Validation checks that a document is valid according to the OpenAPI Specification. Linting checks that a valid document also follows your own rules, such as naming conventions, required descriptions, or security policies. Spectral does both: the built-in oas3-schema rule validates, and your custom rules lint.
</scalar-detail>

<scalar-detail title="How do I disable a Spectral rule?">
Set its severity to off in your ruleset, for example `operation-tags: off` under `rules`. To disable it only for some files, use `overrides` with a `files` glob and set the rule to "off" there.
</scalar-detail>

<scalar-detail title="Can I use a Spectral ruleset from a URL?">
Yes. Both `extends` and the CLI's `--ruleset` option accept URLs. With the Scalar CLI, `--rule` accepts a local file or a Scalar Registry URL.
</scalar-detail>

<scalar-detail title="Does Spectral support OpenAPI 3.1 and 3.2?">
Spectral supports OpenAPI 2.0, 3.0 and 3.1, and its documentation lists an oas3_2 format with 3.2-specific rules. Support for new 3.2 features depends on your Spectral version, so upgrade if a 3.2 document produces unexpected errors.
</scalar-detail>

<scalar-detail title="Does Scalar use Spectral rules?">
Yes. Scalar Registry rules use Spectral-compatible syntax and extend spectral:oas by default, the Scalar CLI's `document lint` command runs them, and Scalar Docs can lint every OpenAPI page against a ruleset and block publishing on failures.
</scalar-detail>

## Related

- **Learn:** [API catalog](/learn/openapi/api-catalog) · [JSON Schema vs OpenAPI](/learn/openapi/json-schema-vs-openapi) · [API mocking](/learn/openapi/api-mocking)
- **Docs:** [Registry rules](/products/registry/rules)
- **Product:** [Scalar Registry](/products/registry) — store and version your Spectral rulesets next to the OpenAPI documents they govern.
