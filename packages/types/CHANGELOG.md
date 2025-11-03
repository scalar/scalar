# @scalar/types

## 0.4.0

### Minor Changes

- [#7129](https://github.com/scalar/scalar/pull/7129) [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Simplify ApiReferences state management and migrate to new shared sidebar component. Eliminates the useSidebar and useNav hooks in favour of event bubbling and centralized state management in ApiReference.vue

### Patch Changes

- [#7086](https://github.com/scalar/scalar/pull/7086) [`eb022f2`](https://github.com/scalar/scalar/commit/eb022f2c8f93c84a04c0093fefe8a1e05d6ec80d) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: new `content.end` slot for the plugin API

- [#7094](https://github.com/scalar/scalar/pull/7094) [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Migrate to workspace store as primary source of truth.

- Updated dependencies [[`2239843`](https://github.com/scalar/scalar/commit/2239843150ed16d1ca35b0b1f8e90cd3e35be7ce)]:
  - @scalar/openapi-types@0.5.1

## 0.3.2

### Patch Changes

- f3e17d8: fix(types): allow async callbacks for event handlers
- Updated dependencies [f69e7cc]
  - @scalar/openapi-types@0.5.0

## 0.3.1

### Patch Changes

- 1e01464: Adds a new ApiReferenceConfigWithSource type and make the base ApiReferenceConfig type agnostic of any document sources.
- Updated dependencies [15c4240]
  - @scalar/openapi-types@0.4.1

## 0.3.0

### Minor Changes

- 008a0f3: feat: migrate to Zod 4

### Patch Changes

- Updated dependencies [008a0f3]
  - @scalar/openapi-types@0.4.0

## 0.2.16

### Patch Changes

- 005fba9: feat: documentDownloadType: 'direct'

## 0.2.15

### Patch Changes

- abe3842: Add analytic events to api-client + add telemetry option

## 0.2.14

### Patch Changes

- 792c937: Configurable option for sidebar to show method path instead of method summary.

## 0.2.13

### Patch Changes

- 50032be: feat: added config options for sorting schema properties

## 0.2.12

### Patch Changes

- 6a88108: feat: add option to expandAllResponses and expandAllModelSections
  - @scalar/openapi-types@0.3.7

## 0.2.11

### Patch Changes

- ccf875a: feat: support x-scalar-credentials-location extension
- 94d6d0c: fix: remove old ssr state and update nuxt for workspace store
- Updated dependencies [ccf875a]
  - @scalar/openapi-types@0.3.7

## 0.2.10

### Patch Changes

- fb62e1b: feat: add externalDocs

## 0.2.9

### Patch Changes

- 591562f: feat: add support for x-scalar-security-body extension
- Updated dependencies [591562f]
  - @scalar/openapi-types@0.3.6

## 0.2.8

### Patch Changes

- c10e191: feat(oauth2): add support for x-tokenName extension

## 0.2.7

### Patch Changes

- ad2e3e6: feat: new onBeforeRequest hook to modify the request

## 0.2.6

### Patch Changes

- 2d7f995: refactor: use more common straight apostrophe ' instead of the real apostrophe ’
- Updated dependencies [2d7f995]
  - @scalar/openapi-types@0.3.5

## 0.2.5

### Patch Changes

- Updated dependencies [533469b]
  - @scalar/openapi-types@0.3.4

## 0.2.4

### Patch Changes

- 1468280: feat: allow fine gained download button file type control

## 0.2.3

### Patch Changes

- 221e35f: feat: added webhooks
- Updated dependencies [221e35f]
  - @scalar/openapi-types@0.3.3

## 0.2.2

### Patch Changes

- Updated dependencies [05c22c7]
  - @scalar/openapi-types@0.3.2

## 0.2.1

### Patch Changes

- 4440949: chore: bumping packages
- Updated dependencies [4440949]
  - @scalar/openapi-types@0.3.1

## 0.2.0

### Minor Changes

- 483ca93: chore: require Node 20 (or above)

### Patch Changes

- Updated dependencies [483ca93]
  - @scalar/openapi-types@0.3.0

## 0.1.16

### Patch Changes

- be8a6ec: chore: remove unused HarRequestWithPath

## 0.1.15

### Patch Changes

- f711ab5: feat: add auth persistance to references
- 0222ad4: feat: render specification extensions with React
- cb9428c: Support additional query parameters for the OAuth authorization request (prompt, audience, anything), and handle OAuth authorization denials
- 67aa0f4: fix: render correct queries with form data
- Updated dependencies [cb9428c]
  - @scalar/openapi-types@0.2.3

## 0.1.14

### Patch Changes

- 8c7bad8: chore: move build tooling to esbuild
- Updated dependencies [8c7bad8]
  - @scalar/openapi-types@0.2.2

## 0.1.13

### Patch Changes

- e8457cb: Unify themes across scalar. Cleanup interface and remove CJS build.

## 0.1.12

### Patch Changes

- 62c4ce3: feat: SvelteKit API Reference integration
  - @scalar/openapi-types@0.2.1

## 0.1.11

### Patch Changes

- eb4854d: fix: types of authentication config

## 0.1.10

### Patch Changes

- Updated dependencies [fa8ed84]
  - @scalar/openapi-types@0.2.1

## 0.1.9

### Patch Changes

- 17e7d02: chore: export more types from the base types package for commonjs apps

## 0.1.8

### Patch Changes

- feaa314: feat(themes): add laserwave theme

## 0.1.7

### Patch Changes

- 9def02e: feat: added new callback for execution request
- 3745d77: feat: new plugin system

## 0.1.6

### Patch Changes

- 3783345: feat: add some callbacks to sidebar items

## 0.1.5

### Patch Changes

- e09dab3: feat: multiple configurations with multiple sources
- 04e27a1: feat: support x-default-scopes
- Updated dependencies [e62e677]
- Updated dependencies [82f16a5]
  - @scalar/openapi-types@0.2.0

## 0.1.4

### Patch Changes

- 8efedf3: fix: allow async functions in onDocumentSelect
- 82a4ba8: chore: move security schemes into types package for future reference
- 57feba6: feat: added new auth config (v2)

## 0.1.3

### Patch Changes

- 543a16c: feat: allow to explicitly set the default source
- 57e96a0: feat: add onDocumentSelect callback when switching multi configs

## 0.1.2

### Patch Changes

- 7a8965c: chore: remove spec prefix
- 49dffff: feat: expose the isLoading prop to control loading of references

## 0.1.1

### Patch Changes

- 39c0f47: chore: export multi doc types

## 0.1.0

### Minor Changes

- 5f9a8a2: feat!: remove the spec prefix, make content and url top-level attributes

## 0.0.41

### Patch Changes

- fc6a45e: refactor: use import aliases

## 0.0.40

### Patch Changes

- 4d03e0f: feat: multiple documents

## 0.0.39

### Patch Changes

- bab7990: refactor: move HtmlRenderingConfiguration type to types package
- 2c621d4: refactor: move snippetz types to @scalar/types

## 0.0.38

### Patch Changes

- 7f1a40e: fix: hiddenClients can be a boolean

## 0.0.37

### Patch Changes

- 89d8b75: feat: new ApiReferenceConfiguration type
- 8a04b8d: fix: adds vendor specific mime type support
  - @scalar/openapi-types@0.1.9

## 0.0.36

### Patch Changes

- 4db5161: feat: allow multiple tokens for bearer auth

## 0.0.35

### Patch Changes

- 946a5df: feat: add front-end redirect
- cf14cbb: fix: show _/_ mimetype in example response
- Updated dependencies [c10bbf5]
  - @scalar/openapi-types@0.1.9

## 0.0.34

### Patch Changes

- Updated dependencies [e350f23]
  - @scalar/openapi-types@0.1.8

## 0.0.33

### Patch Changes

- 54fdfcb: chore: remove spec wording
- fa6afe8: chore: code formatting
  - @scalar/openapi-types@0.1.7

## 0.0.32

### Patch Changes

- f500435: chore: stricter TypeScript configuration
- b5727ef: feat: allow pre-selecting multiple and complex auth
- 34e6f52: feat: upgrade to stricter tsconfig
- f2b082a: feat: add onLoaded event

## 0.0.31

### Patch Changes

- a30e7cc: fix: package doesn’t work with `moduleResolution: NodeNext`

## 0.0.30

### Patch Changes

- Updated dependencies [f9bf5f1]
  - @scalar/openapi-types@0.1.7

## 0.0.29

### Patch Changes

- be34e7d: feat: adds value to server variables schema

## 0.0.28

### Patch Changes

- 702c386: feat: add support for stability
- f1f39b0: feat: rewmove custom Server type

## 0.0.27

### Patch Changes

- b552db5: feat: add url customization functions for references

## 0.0.26

### Patch Changes

- 60cd6f1: feat: render the operation description from the new store
- 60cd6f1: chore: deprecated the TransformedOperation type
- Updated dependencies [13333e6]
  - @scalar/openapi-types@0.1.6

## 0.0.25

### Patch Changes

- c263aaf: chore: improve the comment for UnknownObject

## 0.0.24

### Patch Changes

- fbef0c3: chore: remove httpsnippet-lite

## 0.0.23

### Patch Changes

- c2f5f08: feat: adds hideClientButton option configuration

## 0.0.22

### Patch Changes

- baaad1c: refactor: deprecated the `proxy` configuration attribute, and use `proxyUrl` everywhere
- c984ac8: feat: adds servers to information reference config

## 0.0.21

### Patch Changes

- 9d23f95: chore: deprecate Parameters, use Parameter instead

## 0.0.20

### Patch Changes

- f67c3bc: feat: add framework themes

## 0.0.19

### Patch Changes

- Updated dependencies [a607115]
  - @scalar/openapi-types@0.1.5

## 0.0.18

### Patch Changes

- fb798c8: chore: make OpenAPI document URLs the default, deprecated `content`

## 0.0.17

### Patch Changes

- Updated dependencies [2b540b9]
  - @scalar/openapi-types@0.1.4

## 0.0.16

### Patch Changes

- dbbe38f: feat: add framework identifier for debugging purposes

## 0.0.15

### Patch Changes

- Updated dependencies [8759e7f]
  - @scalar/openapi-types@0.1.3

## 0.0.14

### Patch Changes

- e911047: Add default exports
- Updated dependencies [e911047]
  - @scalar/openapi-types@0.1.2

## 0.0.13

### Patch Changes

- 9dc2ab7: feat: new `operationsSorter` option

## 0.0.12

### Patch Changes

- 8f12149: chore: add point to declaration file

## 0.0.11

### Patch Changes

- f961940: feat: remove @scalar/themes from the dependencies of @scalar/types

## 0.0.10

### Patch Changes

- Updated dependencies [7beeef3]
  - @scalar/themes@0.9.31

## 0.0.9

### Patch Changes

- Updated dependencies [121bc7e]
  - @scalar/themes@0.9.30

## 0.0.8

### Patch Changes

- dc9aff2: chore: replace proprietary ScalarResponse with OpenAPI ResponseObject
- Updated dependencies [c577cde]
- Updated dependencies [dc9aff2]
  - @scalar/themes@0.9.29
  - @scalar/openapi-types@0.1.1

## 0.0.7

### Patch Changes

- a07cfc8: feat: allow to hide the Test Request button
- 023ca15: feat: adds favicon configuration
- 85872b6: feat: allow to hide search sidebar

## 0.0.6

### Patch Changes

- Updated dependencies [b4f9f97]
  - @scalar/openapi-types@0.1.0

## 0.0.5

### Patch Changes

- Updated dependencies [80a3c46]
  - @scalar/themes@0.9.28

## 0.0.4

### Patch Changes

- Updated dependencies [bb13304]
  - @scalar/themes@0.9.27

## 0.0.3

### Patch Changes

- Updated dependencies [abb8ddd]
  - @scalar/themes@0.9.26

## 0.0.2

### Patch Changes

- 910b1c2: Add build step for path resolution

## 0.0.1

### Patch Changes

- 78db8f5: feat: use new @scalar/types package
- Updated dependencies [78db8f5]
  - @scalar/themes@0.9.25
