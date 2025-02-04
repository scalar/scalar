# @scalar/oas-utils

## 0.2.102

### Patch Changes

- a34f834: feat: adds accept header by default
- ef98b9c: fix: setting initial security with no requirements
- a34f834: feat: adds v-2.5.0 accept header migration
- ebdf762: feat: add back complex security requirements
- Updated dependencies [f9bf5f1]
  - @scalar/openapi-types@0.1.7
  - @scalar/types@0.0.30
  - @scalar/themes@0.9.64

## 0.2.101

### Patch Changes

- be34e7d: feat: adds value to server variables schema
- Updated dependencies [be34e7d]
- Updated dependencies [51f3177]
  - @scalar/types@0.0.29
  - @scalar/themes@0.9.63

## 0.2.100

### Patch Changes

- 12e7232: feat: adds parameter examples support
- 901970f: fix: removes application/json content type as default
- f1f39b0: refactor: better handle servers
- Updated dependencies [776a4e2]
- Updated dependencies [2ed681b]
- Updated dependencies [4f12fe4]
- Updated dependencies [702c386]
- Updated dependencies [f1f39b0]
  - @scalar/themes@0.9.62
  - @scalar/types@0.0.28

## 0.2.99

### Patch Changes

- c803e2d: feat: cookies 🍪

## 0.2.98

### Patch Changes

- Updated dependencies [b552db5]
  - @scalar/types@0.0.27
  - @scalar/themes@0.9.61

## 0.2.97

### Patch Changes

- 7df4472: fix: generate types for past migrations, add tests and docs
- Updated dependencies [60cd6f1]
- Updated dependencies [60cd6f1]
- Updated dependencies [e866487]
- Updated dependencies [13333e6]
  - @scalar/types@0.0.26
  - @scalar/themes@0.9.60
  - @scalar/openapi-types@0.1.6

## 0.2.96

### Patch Changes

- cf0e7b1: feat: generate examples for objects with patternProperties
- Updated dependencies [7b4ab2c]
  - @scalar/themes@0.9.59
  - @scalar/types@0.0.25

## 0.2.95

### Patch Changes

- 3156ecd: fix: revert migration change from earlier

## 0.2.94

### Patch Changes

- a36fada: fix: returns non drafts collections without changes in 2.4.0 migration

## 0.2.93

### Patch Changes

- ca2d98b: chore: adds drafts server migration

## 0.2.92

### Patch Changes

- 02b4201: fix(api-client): strict TS config (enable noUncheckedIndexedAccess)

## 0.2.91

### Patch Changes

- Updated dependencies [6407b2b]
  - @scalar/themes@0.9.58

## 0.2.90

### Patch Changes

- 573d113: feat: add isDefined type safe filter helper
- c263aaf: feat: better deal with empty OpenAPI documents
- Updated dependencies [c263aaf]
  - @scalar/types@0.0.25
  - @scalar/themes@0.9.57

## 0.2.89

### Patch Changes

- Updated dependencies [23daedd]
  - @scalar/themes@0.9.56

## 0.2.88

### Patch Changes

- Updated dependencies [fbef0c3]
  - @scalar/types@0.0.24
  - @scalar/themes@0.9.55

## 0.2.87

### Patch Changes

- 8017ff9: feat: updates parse enum to include array

## 0.2.86

### Patch Changes

- 3eb0d11: feat: moved api-client auth into references
- b66a85c: feat: adds v-2.3.0 migration for workspace type

## 0.2.85

### Patch Changes

- 3b4a788: feat: sets form request examples defaulting
- 4c5be96: feat: adds isHttpMethod to helpers
- 4c5be96: fix: sorts method based on path in import spec

## 0.2.84

### Patch Changes

- 9b4f85d: fix: allow to pass relative file names

## 0.2.83

### Patch Changes

- f524411: feat: adds response status color
- 10c9016: fix: updates find variables import
- b11294c: fix: add bit of safety to tag name parsing
- Updated dependencies [c2f5f08]
  - @scalar/types@0.0.23
  - @scalar/themes@0.9.54

## 0.2.82

### Patch Changes

- 6389557: feat: allow to pass a base URL to makeUrlAbsolute
- Updated dependencies [baaad1c]
- Updated dependencies [c984ac8]
  - @scalar/types@0.0.22
  - @scalar/themes@0.9.53

## 0.2.81

### Patch Changes

- Updated dependencies [1fa0d20]
  - @scalar/themes@0.9.52

## 0.2.80

### Patch Changes

- Updated dependencies [9d23f95]
- Updated dependencies [91123e8]
  - @scalar/types@0.0.21
  - @scalar/themes@0.9.51

## 0.2.79

### Patch Changes

- 6dd7eda: fix: catch errors for invalid OpenAPI documents
- Updated dependencies [1b06f64]
  - @scalar/themes@0.9.50

## 0.2.78

### Patch Changes

- daa2663: feat: split out the router based computed values from the store into its own store
- 37abd4f: feat: make security spec compliant + migrations
- Updated dependencies [d379b81]
- Updated dependencies [f67c3bc]
  - @scalar/themes@0.9.49
  - @scalar/types@0.0.20

## 0.2.77

### Patch Changes

- 44a7100: fix: handle no protocol prefix

## 0.2.76

### Patch Changes

- 6894b7d: feat: passes omitEmptyAndOptionalProperties from operation
- c87353e: Add serialization back to OpenAPI spec for custom entities

## 0.2.75

### Patch Changes

- 49ccdee: refactor: updates regexHelpers

## 0.2.74

### Patch Changes

- ac55d0f: chore: add time logging for the workspace store
- Updated dependencies [0c07766]
  - @scalar/themes@0.9.48

## 0.2.73

### Patch Changes

- 82f7c35: fix: rollback proxy
- 3421489: fix: remove examples from request payload before parsing

## 0.2.72

### Patch Changes

- 4bcaa75: feat: support `format: object-id` in getExampleFromSchema
- 9eb6650: feat: add support for the x-defaultClientId extension
- c98a99c: feat: allow to pass a base URL to makeUrlAbsolute

## 0.2.71

### Patch Changes

- a40999d: chore: added type safety rule noUncheckedIndexedAccess
- b89da58: fix: ingest base server URL and use it in the api client
- 3300d5b: fix: make the api-client respect the server overload
- Updated dependencies [a40999d]
  - @scalar/object-utils@1.1.12
  - @scalar/themes@0.9.47
  - @scalar/openapi-types@0.1.5
  - @scalar/types@0.0.19

## 0.2.70

### Patch Changes

- c3e76d9: fix: handle scopes as an array
- Updated dependencies [a607115]
  - @scalar/openapi-types@0.1.5
  - @scalar/types@0.0.19
  - @scalar/themes@0.9.46

## 0.2.69

### Patch Changes

- 8c5d767: feat: add support for PKCE auth code flow
- 359ee2d: fix: updates path regex

## 0.2.68

### Patch Changes

- dab543e: fix: remove url validation from collection info

## 0.2.67

### Patch Changes

- 823c14d: fix: add tests for oauth2 flows, ensure we reject on state mismatch
- 997cd35: fix: relative URLs are created wrong

## 0.2.66

### Patch Changes

- c929284: fix: add default redirectURI and prefix relative redirectURIs with activeServer
- 2275977: feat: import from way more sources, leverage the proxy more
- 3a0c367: fix: improve handling of non-string enums in parameter schema
- 89a2cc7: fix: preselect auth in the modal

## 0.2.65

### Patch Changes

- 3bec045: fix: adds example and examples to parameter schema
- 743474e: feat: favors hexa for environment color
- cfe9b85: fix: added safe parsing for oauth examples
- 4d45f7b: fix: improve parameter instance creation by handling enum values for number types
- 6599473: fix: arrays with allOf items render invalid examples
- 0e19781: feat: fix reactivitiy of references + client
- Updated dependencies [fb798c8]
- Updated dependencies [bb3dc9d]
- Updated dependencies [0e19781]
  - @scalar/types@0.0.18
  - @scalar/themes@0.9.45
  - @scalar/object-utils@1.1.11

## 0.2.64

### Patch Changes

- 931106f: fix: rollback changes to fetchSpecFromUrl

## 0.2.63

### Patch Changes

- ada8545: feat: add the sidebar button
- Updated dependencies [ad12c56]
  - @scalar/themes@0.9.44

## 0.2.62

### Patch Changes

- 097ab40: fix: add mapping of header to headers for api client ingress
- Updated dependencies [197e3ae]
  - @scalar/themes@0.9.43

## 0.2.61

### Patch Changes

- d7a6c55: feat: updates n hotkey event name
- 69bda25: feat: synced up client auth with references
- Updated dependencies [2456afa]
  - @scalar/themes@0.9.42

## 0.2.60

### Patch Changes

- Updated dependencies [2b540b9]
  - @scalar/openapi-types@0.1.4
  - @scalar/types@0.0.17
  - @scalar/themes@0.9.41

## 0.2.59

### Patch Changes

- 4e50d65: feat: added openapi watcher to live update the api client
- Updated dependencies [6bbb815]
  - @scalar/themes@0.9.40

## 0.2.58

### Patch Changes

- Updated dependencies [4722da1]
  - @scalar/themes@0.9.39

## 0.2.57

### Patch Changes

- 4738228: feat: make collection.info.version optional
- Updated dependencies [dbbe38f]
- Updated dependencies [4b8b611]
  - @scalar/types@0.0.16
  - @scalar/themes@0.9.38

## 0.2.56

### Patch Changes

- b8f9a95: feat: lower syntax highlighting response threshold
- Updated dependencies [8759e7f]
  - @scalar/openapi-types@0.1.3
  - @scalar/types@0.0.15
  - @scalar/themes@0.9.37

## 0.2.55

### Patch Changes

- 0ddd4f3: feat: added virtual text component

## 0.2.54

### Patch Changes

- 2ff5905: chore: cache results of getExampleFromSchema
- 9a2d5ca: fix: schema model console log typo
- e911047: Add default exports
- Updated dependencies [e911047]
- Updated dependencies [d02d70c]
- Updated dependencies [3acbf26]
  - @scalar/object-utils@1.1.10
  - @scalar/openapi-types@0.1.2
  - @scalar/types@0.0.14
  - @scalar/themes@0.9.36

## 0.2.53

### Patch Changes

- 46a55ae: feat(api-client): improve client import ux
- Updated dependencies [b26144c]
  - @scalar/themes@0.9.35

## 0.2.52

### Patch Changes

- Updated dependencies [9dc2ab7]
  - @scalar/types@0.0.13
  - @scalar/themes@0.9.34

## 0.2.51

### Patch Changes

- ef49617: chore: improve performance of getExampleFromSchema
- Updated dependencies [8f12149]
- Updated dependencies [1026d81]
- Updated dependencies [07b5439]
  - @scalar/types@0.0.12
  - @scalar/themes@0.9.33

## 0.2.50

### Patch Changes

- 9057781: fix: add missing securityDefinitions check on import

## 0.2.49

### Patch Changes

- cd8ba1c: feat: added setting of initial security schemes in the client

## 0.2.48

### Patch Changes

- dc20180: feat(api-client): custom icons for collections
- Updated dependencies [f961940]
- Updated dependencies [f961940]
  - @scalar/types@0.0.11
  - @scalar/themes@0.9.32

## 0.2.47

### Patch Changes

- 2b8ce6c: feat: adds safe-parsing to the end of the migration
- 9aa4562: fix: lowerCase http auth schemes before validation
- Updated dependencies [2b8ce6c]
- Updated dependencies [7beeef3]
  - @scalar/object-utils@1.1.9
  - @scalar/themes@0.9.31
  - @scalar/types@0.0.10

## 0.2.46

### Patch Changes

- 2b75354: fix: null example bug
- 437d54d: fix: runtime null error prettyprint

## 0.2.45

### Patch Changes

- ddeaada: fix: adds path regex helper
- 71278e1: fix(api-client): add back content header

## 0.2.44

### Patch Changes

- 7e5dfbb: feat: server variables from examples
- 9d88423: feat: added one way auth sync from references to client
- e15b021: feat: render deeply nested schemas, but not circular references
- 73f728e: chore: cherrypicking refactor branch for object utils changes
- 9cd23e3: Generate examples for schemas with `anyOf` defined when `type` is not defined
- Updated dependencies [73f728e]
- Updated dependencies [121bc7e]
  - @scalar/object-utils@1.1.8
  - @scalar/themes@0.9.30
  - @scalar/types@0.0.9

## 0.2.43

### Patch Changes

- Updated dependencies [c577cde]
- Updated dependencies [dc9aff2]
  - @scalar/themes@0.9.29
  - @scalar/types@0.0.8

## 0.2.42

### Patch Changes

- 5483fc3: fix: File is not defined
- Updated dependencies [a07cfc8]
- Updated dependencies [023ca15]
- Updated dependencies [85872b6]
  - @scalar/types@0.0.7

## 0.2.41

### Patch Changes

- f931ac7: fix: displays variable in curly braces when empty

## 0.2.40

### Patch Changes

- 0afb293: feat: request bodies for multipart form data and url encoded form data
- e67f5a8: chore(api-client): removed axios dependency
- b63be39: fix: incorrect example for schemas with anyOf
- 152c016: feat: add environment selector to addressbar
  - @scalar/types@0.0.6

## 0.2.39

### Patch Changes

- Updated dependencies [80a3c46]
  - @scalar/themes@0.9.28
  - @scalar/types@0.0.5

## 0.2.38

### Patch Changes

- Updated dependencies [bb13304]
  - @scalar/themes@0.9.27
  - @scalar/types@0.0.4

## 0.2.37

### Patch Changes

- Updated dependencies [abb8ddd]
  - @scalar/themes@0.9.26
  - @scalar/types@0.0.3

## 0.2.36

### Patch Changes

- af75550: feat: sidebar request search

## 0.2.35

### Patch Changes

- Updated dependencies [910b1c2]
  - @scalar/types@0.0.2

## 0.2.34

### Patch Changes

- 78db8f5: feat: use new @scalar/types package
- 7f11bc6: fix: temporary fix set type to any
- Updated dependencies [78db8f5]
  - @scalar/themes@0.9.25
  - @scalar/types@0.0.1

## 0.2.33

### Patch Changes

- Updated dependencies [298f7c4]
  - @scalar/themes@0.9.24

## 0.2.32

### Patch Changes

- 1c81549: feat: topnav navigation hotkeys

## 0.2.31

### Patch Changes

- c220358: feat: add response schemas
- 7ec175b: fix: remove default tag in request schema

## 0.2.30

### Patch Changes

- Updated dependencies [c450bb3]
  - @scalar/themes@0.9.23

## 0.2.29

### Patch Changes

- 8672a78: feat(api-client): moved command palette to the global key event bus
- 078ca72: feat: add topnav and addressbar hotkeys
- 520caff: fix: hot keys bus modifier
- Updated dependencies [03e9bbb]
  - @scalar/object-utils@1.1.7

## 0.2.28

### Patch Changes

- dba83e4: Support circular refs
- Updated dependencies [60e63d3]
- Updated dependencies [dba83e4]
  - @scalar/themes@0.9.22
  - @scalar/object-utils@1.1.6

## 0.2.27

### Patch Changes

- 17e06de: fix: additionalProperties are not rendered correctly

## 0.2.26

### Patch Changes

- Updated dependencies [faf3ed9]
  - @scalar/themes@0.9.21

## 0.2.25

### Patch Changes

- 9cc6311: fix: add overload to servers as prop for create client app

## 0.2.24

### Patch Changes

- Updated dependencies [425dc83]
  - @scalar/themes@0.9.20

## 0.2.23

### Patch Changes

- 8eec1b7: fix(oas-utils): I'm a teapot

## 0.2.22

### Patch Changes

- Updated dependencies [3a6effa]
  - @scalar/themes@0.9.19

## 0.2.21

### Patch Changes

- e18029f: Fallback request summary to path on spec import
- Updated dependencies [c1ada84]
  - @scalar/themes@0.9.18

## 0.2.20

### Patch Changes

- Updated dependencies [de25d01]
  - @scalar/themes@0.9.17

## 0.2.19

### Patch Changes

- bf2895e: feat(api-client): add multiple auth to api client

## 0.2.18

### Patch Changes

- 9815191: fix: actually add workspace cookies to request
- 869d255: fix: superfluous yaml or json parse before spec parsing

## 0.2.17

### Patch Changes

- Updated dependencies [a5f3a84]
  - @scalar/themes@0.9.16

## 0.2.16

### Patch Changes

- 7761630: fix: use window location origin if no servers

## 0.2.15

### Patch Changes

- 1dab515: feat: revamp address bar
- Updated dependencies [5e060b1]
  - @scalar/themes@0.9.15

## 0.2.14

### Patch Changes

- Updated dependencies [96e7106]
  - @scalar/themes@0.9.14

## 0.2.13

### Patch Changes

- 1a675be: feat: add empty state + drafts collection

## 0.2.12

### Patch Changes

- 618285e: feat: add localStorage syncing to client app
- Updated dependencies [618285e]
  - @scalar/themes@0.9.13

## 0.2.11

### Patch Changes

- ad7fd7e: feat: add min max to request example parameters schema

## 0.2.10

### Patch Changes

- d58841b: feat: type, format and default to request example parameters schema

## 0.2.9

### Patch Changes

- d6a2a4d: feat: oas-utils request example parameters enum
- 632d6f7: fix: add cookie handler and schema

## 0.2.8

### Patch Changes

- a01df62: fix: ensure path and operation params are merged on import

## 0.2.7

### Patch Changes

- 7f4d22e: refactor: new redirectToProxy helper

## 0.2.6

### Patch Changes

- cefe804: feat: findVariables, replaceVariables, concatenateUrlAndPath
- fec6f8e: feat: add a value to the server variables
- d0aec62: fix: remove hardcoded proxy url for new client

## 0.2.5

### Patch Changes

- a298195: feat: add timestamp in request event type
- 326bd3d: fix: URL is not encoded when sent to the proxy
- 94e68ab: chore: upgrade typescript to 5.5

## 0.2.4

### Patch Changes

- c20c7d0: feat: security schemes and requirements

## 0.2.3

### Patch Changes

- 362d47a: chore: less @ts-ignore comments

## 0.2.2

### Patch Changes

- a2cb3c3: Migrate away from unintended peer dependencies

## 0.2.1

### Patch Changes

- e0fc110: chore: patch bump all package
- f0acc89: chore: upgrade to new @scalar/openapi-parser version

## 0.2.0

### Minor Changes

- 7f8ef74: chore: remove aliasing

### Patch Changes

- 96347a1: feat: use example values for path variables
- 8494349: Migrate to highlightjs based syntax highlighting
- 6fbb57e: feat: release all the packages

## 0.1.17

### Patch Changes

- c951512: feat: omit empty and not required properties from the generated request body

## 0.1.16

### Patch Changes

- cc5402c: feat: OpenAuth 2.0 password grant

## 0.1.15

### Patch Changes

- f472998: feat: generated example values based on the given format

## 0.1.14

### Patch Changes

- 7205137: fix: response body does not show a preview when the content-type is undefined
- d369ac4: feat: union types in getExampleFromSchema

## 0.1.13

### Patch Changes

- 5aa656f: feat: [BREAKING CHANGE] use new HTTP proxy (https://github.com/scalar/scalar/pull/1703)

## 0.1.12

### Patch Changes

- 61b8ddc: fix: doesn’t render preview for mimetype variations like application/foobar+json
- 165b901: feat: dynamic values for generated examples

## 0.1.11

### Patch Changes

- 624604e: chore: move http status codes to oas-utils

## 0.1.10

### Patch Changes

- 45dc04b: fix: can’t release packages

## 0.1.9

### Patch Changes

- 05e2e27: chore: add provenance statement

## 0.1.8

### Patch Changes

- 085a0c2: fix: mimetypes with charsets and variants are ignored
- fa10d45: fix: failed to execute structuredClone

## 0.1.7

### Patch Changes

- 07211ad: chore: added new lint rule for type importing for better perf

## 0.1.6

### Patch Changes

- 22f2858: chore: ran syncpack to update packages

## 0.1.5

### Patch Changes

- 3ba9774: feat: add path routing option to references

## 0.1.4

### Patch Changes

- 24b3c2a: Add peer dependency for axios

## 0.1.3

### Patch Changes

- c14568f: feat: add custom security option

## 0.1.2

### Patch Changes

- 8b0691b: feat: added future support for SSR server state hydration

## 0.1.1

### Patch Changes

- 31aae5e: chore: moved shared types and methods into oas-utils

## 0.1.0

### Minor Changes

- 7fb8273: Migrate to @scalar/openapi-parser

## 0.0.4

### Patch Changes

- cecf074: Migrate to oas utils for basic spec operations

## 0.0.3

### Patch Changes

- 313997c: chore: align node versions to basis 18

## 0.0.2

### Patch Changes

- c254604: Add OAS utils package
- 5cf4afa: style: replace resize observer with css container queries
