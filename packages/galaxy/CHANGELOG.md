# @scalar/galaxy

## 0.6.10

### Patch Changes

- [#9710](https://github.com/scalar/scalar/pull/9710): Republish so the updated README (with the Scalar platform overview) reaches npm. Also renames the README generator metadata in package.json from `readme` to `scalarReadme`: npm treats a `readme` field as the readme text itself, so affected packages were published with a literal `[object Object]` readme on the registry instead of README.md.

## 0.6.9

### Patch Changes

- [#9651](https://github.com/scalar/scalar/pull/9651): Merge the Galaxy `Paginated` and `PaginatedResource` schemas into a single `PaginatedResource` schema

## 0.6.8

### Patch Changes

- [#9468](https://github.com/scalar/scalar/pull/9468): Express the `/planets` pagination with a generic `Paginated` template that binds its item type through a JSON Schema 2020-12 `$dynamicRef` / `$dynamicAnchor`, demonstrating the `Paginated<T>` pattern

## 0.6.7

### Patch Changes

- [#9455](https://github.com/scalar/scalar/pull/9455): Add a description to the `Create a celestial body` operation

## 0.6.6

### Patch Changes

- [#9434](https://github.com/scalar/scalar/pull/9434): Flesh out the AsyncAPI example document so it covers more of the spec: a document `id`, operation trait tags, channel summaries, richer channel parameters (enum/default/examples/location), summary/messages/reply on every operation, a request/reply example (`getPlanet`) including a runtime-expression reply address, a reusable message trait with headers and a correlation ID, server variables, and a wired-up OAuth 2.0 scheme
- [#9379](https://github.com/scalar/scalar/pull/9379): Add a `lint` script and a local Spectral ruleset (`galaxy.ruleset.yaml`) so the example document can be linted with `@scalar/cli document lint`

## 0.6.5

### Patch Changes

- [#9349](https://github.com/scalar/scalar/pull/9349): Tag channels, operations, and messages in the AsyncAPI 3.0 sample so they group consistently with the OpenAPI document.

## 0.6.4

### Patch Changes

- [#9045](https://github.com/scalar/scalar/pull/9045): fix(galaxy): align operation and webhook security requirements with intended auth behavior

## 0.6.3

### Patch Changes

- [#9012](https://github.com/scalar/scalar/pull/9012): fix(galaxy): align operation and webhook security requirements with intended auth behavior

## 0.6.2

### Patch Changes

- [#8626](https://github.com/scalar/scalar/pull/8626): fix: add a complex API key authentication requirement to the Galaxy OpenAPI description document

## 0.6.1

### Patch Changes

- [#8466](https://github.com/scalar/scalar/pull/8466): chore: new build pipeline

## 0.6.0

### Minor Changes

- [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

## 0.5.16

### Patch Changes

- [#8212](https://github.com/scalar/scalar/pull/8212): chore: version bump

## 0.5.15

### Patch Changes

- [#8207](https://github.com/scalar/scalar/pull/8207): chore: version bump

## 0.5.14

### Patch Changes

- [#8147](https://github.com/scalar/scalar/pull/8147): fix: broken links

## 0.5.13

### Patch Changes

- [#8117](https://github.com/scalar/scalar/pull/8117): feat: post-response scripts

## 0.5.12

### Patch Changes

- [#7332](https://github.com/scalar/scalar/pull/7332) [`93a466e`](https://github.com/scalar/scalar/commit/93a466e79b8a9f0475f36fe7b4254f4bbeaea616) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: use support@scalar.com as the email address

- [#7326](https://github.com/scalar/scalar/pull/7326) [`4455bdc`](https://github.com/scalar/scalar/commit/4455bdc53f645b144bf31912e585bf82c52beb34) Thanks [@hanspagel](https://github.com/hanspagel)! - fix: union discriminator specified in `components.schemas.CelestialBody` is incorrect

- [#7334](https://github.com/scalar/scalar/pull/7334) [`db20273`](https://github.com/scalar/scalar/commit/db20273dbbad0d7dd251506c2301f076329651a0) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: no duplicate descriptions

## 0.5.11

### Patch Changes

- [#7273](https://github.com/scalar/scalar/pull/7273) [`8750cf0`](https://github.com/scalar/scalar/commit/8750cf0e5779df747a73d3fa149beae87eca92ce) Thanks [@hanspagel](https://github.com/hanspagel)! - fix: nullable not supported in OpenAPI 3.1

## 0.5.10

### Patch Changes

- [#7241](https://github.com/scalar/scalar/pull/7241) [`2377b76`](https://github.com/scalar/scalar/commit/2377b76d050f8de70037b17a32d0dd1181d3311d) Thanks [@hanspagel](https://github.com/hanspagel)! - chore: use "current" not "latest" scalar registry url

## 0.5.9

### Patch Changes

- c883287: feat: add AsyncAPI example

## 0.5.8

### Patch Changes

- 0a91180: chore: add another value to the galaxy server variable enum
- 3473e08: fix: performance issues on script load
- 71a5647: feat: circular reference between planet ↔ satellite

## 0.5.7

### Patch Changes

- e24ea3f: feat: add response headers to galaxy spec

## 0.5.6

### Patch Changes

- 525b7d7: feat: publish @scalar/galaxy in the Scalar Registry

## 0.5.5

### Patch Changes

- e0061e8: fix: broken internal link

## 0.5.4

### Patch Changes

- 926de55: fix: broken internal link

## 0.5.3

### Patch Changes

- 80a3560: feat: add additonalProperties
- 80a3560: feat: add exclusiveMinimum and exclusiveMaximum
- 80a3560: feat: add x-enum-varnames and x-enum-descriptions

## 0.5.2

### Patch Changes

- 2d7f995: refactor: use more common straight apostrophe ' instead of the real apostrophe ’

## 0.5.1

### Patch Changes

- b1ea8f0: feat: adds celestial bodies post operation to galaxy

## 0.5.0

### Minor Changes

- edf694b: refactor!: use openapi-parser utils, remove the deprecated pipeline syntax

### Patch Changes

- 442c0a3: feat: added support for callbacks

## 0.4.1

### Patch Changes

- 4440949: chore: bumping packages

## 0.4.0

### Minor Changes

- 483ca93: chore: require Node 20 (or above)

## 0.3.2

### Patch Changes

- 8c7bad8: chore: move build tooling to esbuild

## 0.3.1

### Patch Changes

- 560be28: feat(api-reference): add copy button to examples and redesign them

## 0.3.0

### Minor Changes

- 9eb5c6b: feat: more data for planets

### Patch Changes

- 9eb5c6b: fix: examples for images are invalid
- 9eb5c6b: fix: some responses are missing

## 0.2.24

### Patch Changes

- bab7990: refactor: move HtmlRenderingConfiguration type to types package

## 0.2.23

### Patch Changes

- 202e405: fix: add types package to galaxy docker file
- 989ad08: fix: include all packages in dockerfile

## 0.2.22

### Patch Changes

- fd8d71a: fix: make galaxy playground private so it does not publish

## 0.2.21

### Patch Changes

- 298b6f6: fix: import api reference package in dockerfile

## 0.2.20

### Patch Changes

- 54fdfcb: chore: remove spec wording
- fa6afe8: chore: code formatting
- 1223c1f: chore: code style

## 0.2.19

### Patch Changes

- f500435: chore: stricter TypeScript configuration
- fac2800: feat: error responses
- fac2800: feat: use package version as version
- 31f93d7: feat: add xml support
- fac2800: feat: file upload examples

## 0.2.18

### Patch Changes

- 702c386: feat: mark deletePlanet as experimental

## 0.2.17

### Patch Changes

- 0462003: feat: add readOnly/writeOnly attributes

## 0.2.16

### Patch Changes

- a607115: feat: add openapi 3.0.4 and openapi 3.1.1

## 0.2.15

### Patch Changes

- b28c70f: feat: add an openIdConnect security scheme

## 0.2.14

### Patch Changes

- ca8c8d0: feat(galaxy): load the spec from a URL rather than as content

## 0.2.13

### Patch Changes

- 4cf8c52: feat: add OAuth code flow

## 0.2.12

### Patch Changes

- 4e50d65: feat: added live updating spec

## 0.2.11

### Patch Changes

- dbbe38f: feat: add framework identifier for debugging purposes

## 0.2.10

### Patch Changes

- e911047: Add default exports

## 0.2.9

### Patch Changes

- aee166c: feat: add variables to the second server
- 040ca78: feat: add oauth code authorization

## 0.2.8

### Patch Changes

- e4b326e: feat(galaxy): add multiple examples to request body and schema
- e4b326e: feat: add multiple examples to some schemas

## 0.2.7

### Patch Changes

- 7a6783e: feat(galaxy): migrate galaxy to monorepo

## 0.2.6

### Patch Changes

- 7f21330: fix: improper usage of ref in token response

## 0.2.5

### Patch Changes

- 05c1360: fix(api-reference): allow scrolling to collapsed sections via hash

## 0.2.4

### Patch Changes

- 94e68ab: chore: upgrade typescript to 5.5

## 0.2.3

### Patch Changes

- 18bfa05: feat: add void.scalar.com as an alternative server

## 0.2.2

### Patch Changes

- c185f10: chore: use Node script to format specifications

## 0.2.1

### Patch Changes

- e0fc110: chore: patch bump all package
- f0acc89: chore: upgrade to new @scalar/openapi-parser version

## 0.2.0

### Minor Changes

- 7f8ef74: chore: remove aliasing

### Patch Changes

- b38c7ed: Update build configs to a standardized format
- 6fbb57e: feat: release all the packages

## 0.1.5

### Patch Changes

- c8066f3: chore: remove headings from inside the details tag

## 0.1.4

### Patch Changes

- 30953fa: Add scalar galaxy yaml export and improve React reference reactivity

## 0.1.3

### Patch Changes

- 165b901: feat: dynamic values for generated examples

## 0.1.2

### Patch Changes

- 45dc04b: fix: can’t release packages

## 0.1.1

### Patch Changes

- 05e2e27: chore: add provenance statement

## 0.1.0

### Minor Changes

- 53ba90d: hello world :)
